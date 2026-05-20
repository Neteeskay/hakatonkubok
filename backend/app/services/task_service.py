from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import Fund, User, VolunteerTask
from app.models.enums import FundStatus, TaskStatus
from app.schemas.tasks import (
    TaskCreateRequest,
    TaskUpdateRequest,
    validate_task_dates,
    validate_task_location,
)
from app.services.fund_service import get_fund_by_representative
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


def task_load_options() -> tuple[object]:
    return (selectinload(VolunteerTask.fund),)


def ensure_fund_approved(fund: Fund) -> None:
    if fund.status != FundStatus.APPROVED:
        raise FundNotApprovedError


def validate_task_state(task: VolunteerTask) -> None:
    try:
        validate_task_location(task.participation_format, task.city)
        validate_task_dates(task.starts_at, task.ends_at, task.deadline_at)
    except ValueError as exc:
        raise InvalidTaskDataError(str(exc)) from exc


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
    if target_status in {TaskStatus.NEEDS_CHANGES, TaskStatus.REJECTED}:
        if not moderation_comment or not moderation_comment.strip():
            raise TaskModerationCommentRequiredError

    if not can_transition(task.status, target_status, TASK_TRANSITIONS):
        raise InvalidTaskStatusTransitionError

    task.status = target_status
    task.moderation_comment = moderation_comment.strip() if moderation_comment else None
    task.published_at = datetime.now(UTC) if target_status == TaskStatus.PUBLISHED else None
    task.closed_at = None

    await session.commit()
    return await get_task_by_id(session, task.id)
