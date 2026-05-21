from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import Fund, User, VolunteerTask
from app.models.enums import (
    DurationType,
    FundStatus,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
)
from app.schemas.tasks import (
    TaskCreateRequest,
    TaskFeedSort,
    TaskUpdateRequest,
    validate_task_dates,
    validate_task_location,
)
from app.services.fund_service import get_fund_by_representative
from app.services.notification_service import add_admin_notifications, add_user_notification
from app.services.status_transitions import TASK_TRANSITIONS, can_transition


class TaskError(Exception):
    pass


class TaskNotFoundError(TaskError):
    pass


class FundNotApprovedError(TaskError):
    pass


class InvalidTaskStatusTransitionError(TaskError):
    pass


class TaskModerationCommentRequiredError(TaskError):
    pass


class TaskEditNotAllowedError(TaskError):
    pass


class InvalidTaskDataError(TaskError):
    pass


def task_load_options() -> tuple[object, object]:
    return (
        selectinload(VolunteerTask.fund),
        selectinload(VolunteerTask.applications),
    )


def ensure_fund_approved(fund: Fund) -> None:
    if fund.status != FundStatus.APPROVED:
        raise FundNotApprovedError


def validate_task_state(task: VolunteerTask) -> None:
    try:
        validate_task_location(task.participation_format, task.city)
        validate_task_dates(task.starts_at, task.ends_at, task.deadline_at)
    except ValueError as exc:
        raise InvalidTaskDataError(str(exc)) from exc


def _published_tasks_base_query():
    return (
        select(VolunteerTask)
        .join(Fund, Fund.id == VolunteerTask.fund_id)
        .where(
            VolunteerTask.status == TaskStatus.PUBLISHED,
            Fund.status == FundStatus.APPROVED,
        )
        .options(*task_load_options())
    )


def _apply_feed_sort(statement, sort: TaskFeedSort):
    if sort == TaskFeedSort.DEADLINE_AT_ASC:
        return statement.order_by(
            VolunteerTask.deadline_at.asc().nulls_last(),
            VolunteerTask.published_at.desc().nulls_last(),
        )
    if sort == TaskFeedSort.EXPECTED_HOURS_DESC:
        return statement.order_by(
            VolunteerTask.expected_hours.desc(),
            VolunteerTask.published_at.desc().nulls_last(),
        )
    if sort == TaskFeedSort.EXPECTED_HOURS_ASC:
        return statement.order_by(
            VolunteerTask.expected_hours.asc(),
            VolunteerTask.published_at.desc().nulls_last(),
        )
    return statement.order_by(
        VolunteerTask.published_at.desc().nulls_last(),
        VolunteerTask.created_at.desc(),
    )


async def list_published_tasks(
    session: AsyncSession,
    *,
    city: str | None = None,
    category: HelpCategory | None = None,
    participation_format: ParticipationFormat | None = None,
    duration_type: DurationType | None = None,
    task_type: TaskType | None = None,
    fund_id: UUID | None = None,
    search: str | None = None,
    required_skill: str | None = None,
    available_only: bool = True,
    sort: TaskFeedSort = TaskFeedSort.PUBLISHED_AT_DESC,
    limit: int = 50,
    offset: int = 0,
) -> list[VolunteerTask]:
    statement = _published_tasks_base_query()

    if available_only:
        now = datetime.now(UTC)
        statement = statement.where(
            or_(VolunteerTask.deadline_at.is_(None), VolunteerTask.deadline_at >= now)
        )

    if city is not None:
        statement = statement.where(VolunteerTask.city.ilike(f"%{city.strip()}%"))

    if category is not None:
        statement = statement.where(VolunteerTask.category == category)

    if participation_format is not None:
        statement = statement.where(VolunteerTask.participation_format == participation_format)

    if duration_type is not None:
        statement = statement.where(VolunteerTask.duration_type == duration_type)

    if task_type is not None:
        statement = statement.where(VolunteerTask.task_type == task_type)

    if fund_id is not None:
        statement = statement.where(VolunteerTask.fund_id == fund_id)

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                VolunteerTask.title.ilike(pattern),
                VolunteerTask.description.ilike(pattern),
            )
        )

    if required_skill:
        skill = required_skill.strip().lower()
        if skill:
            statement = statement.where(VolunteerTask.required_skills.contains([skill]))

    statement = _apply_feed_sort(statement, sort).limit(limit).offset(offset)

    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_published_task_for_volunteer(
    session: AsyncSession,
    task_id: UUID,
) -> VolunteerTask:
    task = await session.scalar(
        _published_tasks_base_query().where(VolunteerTask.id == task_id)
    )
    if task is None:
        raise TaskNotFoundError
    return task


async def get_task_by_id(session: AsyncSession, task_id: UUID) -> VolunteerTask:
    result = await session.execute(
        select(VolunteerTask)
        .options(*task_load_options())
        .where(VolunteerTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise TaskNotFoundError
    return task


async def get_fund_task(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
) -> VolunteerTask:
    fund = await get_fund_by_representative(session, current_user)
    result = await session.execute(
        select(VolunteerTask)
        .options(*task_load_options())
        .where(VolunteerTask.id == task_id, VolunteerTask.fund_id == fund.id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise TaskNotFoundError
    return task


async def list_fund_tasks(
    session: AsyncSession,
    *,
    current_user: User,
    status: TaskStatus | None = None,
) -> list[VolunteerTask]:
    fund = await get_fund_by_representative(session, current_user)
    statement = (
        select(VolunteerTask)
        .options(*task_load_options())
        .where(VolunteerTask.fund_id == fund.id)
        .order_by(VolunteerTask.created_at.desc())
    )
    if status is not None:
        statement = statement.where(VolunteerTask.status == status)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def create_task(
    session: AsyncSession,
    *,
    current_user: User,
    payload: TaskCreateRequest,
) -> VolunteerTask:
    fund = await get_fund_by_representative(session, current_user)
    ensure_fund_approved(fund)

    task = VolunteerTask(
        fund_id=fund.id,
        status=TaskStatus.DRAFT,
        **payload.model_dump(),
    )
    validate_task_state(task)

    session.add(task)
    await session.commit()
    return await get_task_by_id(session, task.id)


async def update_task(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
    payload: TaskUpdateRequest,
) -> VolunteerTask:
    task = await get_fund_task(session, current_user=current_user, task_id=task_id)
    if task.status not in {TaskStatus.DRAFT, TaskStatus.NEEDS_CHANGES}:
        raise TaskEditNotAllowedError

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    validate_task_state(task)

    await session.commit()
    return await get_task_by_id(session, task.id)


async def submit_task_for_review(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
) -> VolunteerTask:
    fund = await get_fund_by_representative(session, current_user)
    ensure_fund_approved(fund)
    task = await get_fund_task(session, current_user=current_user, task_id=task_id)
    validate_task_state(task)

    if not can_transition(task.status, TaskStatus.PENDING_REVIEW, TASK_TRANSITIONS):
        raise InvalidTaskStatusTransitionError

    task.status = TaskStatus.PENDING_REVIEW
    task.moderation_comment = None
    task.published_at = None
    task.closed_at = None
    await add_admin_notifications(
        session,
        title="Новое задание на проверке",
        body=f"Фонд «{fund.name}» отправил задание «{task.title}» на модерацию.",
    )

    await session.commit()
    return await get_task_by_id(session, task.id)


async def close_task(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
) -> VolunteerTask:
    task = await get_fund_task(session, current_user=current_user, task_id=task_id)
    if not can_transition(task.status, TaskStatus.CLOSED, TASK_TRANSITIONS):
        raise InvalidTaskStatusTransitionError

    task.status = TaskStatus.CLOSED
    task.closed_at = datetime.now(UTC)

    await session.commit()
    return await get_task_by_id(session, task.id)


async def list_tasks_for_admin(
    session: AsyncSession,
    *,
    status: TaskStatus | None = None,
) -> list[VolunteerTask]:
    statement = select(VolunteerTask).options(*task_load_options()).order_by(
        VolunteerTask.created_at.desc()
    )
    if status is not None:
        statement = statement.where(VolunteerTask.status == status)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def moderate_task(
    session: AsyncSession,
    *,
    task_id: UUID,
    target_status: TaskStatus,
    moderation_comment: str | None,
) -> VolunteerTask:
    task = await get_task_by_id(session, task_id)
    if target_status == TaskStatus.PUBLISHED and task.fund.status != FundStatus.APPROVED:
        raise FundNotApprovedError

    if target_status in {TaskStatus.NEEDS_CHANGES, TaskStatus.REJECTED}:
        if not moderation_comment or not moderation_comment.strip():
            raise TaskModerationCommentRequiredError

    if not can_transition(task.status, target_status, TASK_TRANSITIONS):
        raise InvalidTaskStatusTransitionError

    now = datetime.now(UTC)

    task.status = target_status
    task.moderation_comment = moderation_comment.strip() if moderation_comment else None

    if target_status == TaskStatus.PUBLISHED:
        task.approved_at = now
        task.published_at = now
    else:
        task.approved_at = None
        task.published_at = None

    task.closed_at = None

    if target_status == TaskStatus.PUBLISHED:
        await add_user_notification(
            session,
            user_id=task.fund.representative_user_id,
            title="Задание опубликовано",
            body=f"Ваше задание «{task.title}» прошло модерацию и опубликовано.",
        )
    if target_status == TaskStatus.NEEDS_CHANGES:
        await add_user_notification(
            session,
            user_id=task.fund.representative_user_id,
            title="Задание возвращено на доработку",
            body=(
                f"Задание «{task.title}» возвращено администратором на доработку.\n\n"
                f"Комментарий: {task.moderation_comment or 'Комментарий не указан'}"
            ),
        )
        await add_admin_notifications(
            session,
            title="Задание возвращено на доработку",
            body=f"Задание «{task.title}» фонда «{task.fund.name}» возвращено на доработку.",
        )
    elif target_status == TaskStatus.REJECTED:
        await add_user_notification(
            session,
            user_id=task.fund.representative_user_id,
            title="Задание отклонено",
            body=(
                f"Задание «{task.title}» отклонено администратором.\n\n"
                f"Комментарий: {task.moderation_comment or 'Комментарий не указан'}"
            ),
        )

    await session.commit()
    return await get_task_by_id(session, task.id)
