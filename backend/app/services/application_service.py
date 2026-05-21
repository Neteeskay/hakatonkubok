from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import TaskApplication, User, VolunteerTask
from app.models.enums import ApplicationStatus, TaskStatus
from app.services.achievement_service import sync_volunteer_achievements
from app.services.fund_service import get_fund_by_representative
from app.services.notification_service import add_admin_notifications
from app.services.status_transitions import APPLICATION_TRANSITIONS, can_transition


class ApplicationError(Exception):
    pass


class ApplicationNotFoundError(ApplicationError):
    pass


class ApplicationAccessDeniedError(ApplicationError):
    pass


class AlreadyAppliedError(ApplicationError):
    pass


class ParticipantLimitReachedError(ApplicationError):
    pass


class TaskNotFoundError(ApplicationError):
    pass


class TaskNotPublishedError(ApplicationError):
    pass


class TaskNotOpenForApplicationsError(ApplicationError):
    pass


class InvalidApplicationStatusTransitionError(ApplicationError):
    pass


class FundCommentRequiredError(ApplicationError):
    pass


class TaskNotClosedError(ApplicationError):
    pass


def application_load_options() -> tuple[object, object, object]:
    return (
        selectinload(TaskApplication.task).selectinload(VolunteerTask.fund),
        selectinload(TaskApplication.volunteer),
        selectinload(TaskApplication.hour_ledger),
    )


async def create_application(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
    volunteer_comment: str | None,
) -> TaskApplication:
    task = await session.scalar(
        select(VolunteerTask)
        .options(selectinload(VolunteerTask.fund))
        .where(VolunteerTask.id == task_id)
    )
    if task is None:
        raise TaskNotFoundError

    if task.status != TaskStatus.PUBLISHED:
        raise TaskNotPublishedError
    _ensure_task_deadline_is_open(task)

    existing = await session.scalar(
        select(TaskApplication).where(
            TaskApplication.task_id == task_id,
            TaskApplication.volunteer_id == current_user.id,
            TaskApplication.status != ApplicationStatus.CANCELED,
        )
    )
    if existing is not None:
        raise AlreadyAppliedError

    await _ensure_participant_limit_not_reached(session, task)

    application = TaskApplication(
        task_id=task.id,
        volunteer_id=current_user.id,
        status=ApplicationStatus.APPLIED,
        volunteer_comment=volunteer_comment,
    )
    session.add(application)
    await session.commit()
    await sync_volunteer_achievements(session, current_user.id)
    return await _get_application_by_id(session, application.id)


async def list_my_applications(
    session: AsyncSession,
    *,
    current_user: User,
    status: ApplicationStatus | None = None,
) -> list[TaskApplication]:
    statement = (
        select(TaskApplication)
        .options(*application_load_options())
        .where(TaskApplication.volunteer_id == current_user.id)
        .order_by(TaskApplication.created_at.desc())
    )
    if status is not None:
        statement = statement.where(TaskApplication.status == status)

    result = await session.execute(statement)
    return list(result.scalars().all())


async def cancel_my_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
) -> TaskApplication:
    application = await _get_application_by_id(session, application_id)
    if application.volunteer_id != current_user.id:
        raise ApplicationAccessDeniedError
    if not can_transition(
        application.status,
        ApplicationStatus.CANCELED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.CANCELED
    application.canceled_at = datetime.now(UTC)
    await session.commit()
    return await _get_application_by_id(session, application.id)


async def list_fund_applications(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID | None = None,
    status: ApplicationStatus | None = None,
) -> list[TaskApplication]:
    fund = await get_fund_by_representative(session, current_user)
    statement = (
        select(TaskApplication)
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .options(*application_load_options())
        .where(VolunteerTask.fund_id == fund.id)
        .order_by(TaskApplication.created_at.desc())
    )
    if task_id is not None:
        statement = statement.where(TaskApplication.task_id == task_id)
    if status is not None:
        statement = statement.where(TaskApplication.status == status)

    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_fund_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
) -> TaskApplication:
    fund = await get_fund_by_representative(session, current_user)
    application = await _get_application_by_id(session, application_id)
    if application.task.fund_id != fund.id:
        raise ApplicationAccessDeniedError
    return application


async def accept_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    fund_comment: str | None,
) -> TaskApplication:
    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )
    _ensure_task_accepting_applications(application.task)
    if not can_transition(
        application.status,
        ApplicationStatus.ACCEPTED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    await _ensure_participant_limit_not_reached(session, application.task)

    application.status = ApplicationStatus.ACCEPTED
    application.fund_comment = fund_comment
    application.decided_at = datetime.now(UTC)
    await session.commit()
    await sync_volunteer_achievements(session, application.volunteer_id)
    return await _get_application_by_id(session, application.id)


async def reject_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    fund_comment: str,
) -> TaskApplication:
    if not fund_comment or not fund_comment.strip():
        raise FundCommentRequiredError

    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )
    _ensure_task_accepting_applications(application.task)
    if not can_transition(
        application.status,
        ApplicationStatus.REJECTED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.REJECTED
    application.fund_comment = fund_comment.strip()
    application.decided_at = datetime.now(UTC)
    await session.commit()
    return await _get_application_by_id(session, application.id)


async def clarify_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    fund_comment: str,
) -> TaskApplication:
    if not fund_comment or not fund_comment.strip():
        raise FundCommentRequiredError

    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )

    _ensure_task_accepting_applications(application.task)

    if not can_transition(
        application.status,
        ApplicationStatus.CLARIFY,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.CLARIFY
    application.fund_comment = fund_comment.strip()
    application.decided_at = datetime.now(UTC)

    await session.commit()
    return await _get_application_by_id(session, application.id)


async def confirm_all_accepted_completions_for_task(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
    completion_comment: str | None,
) -> list[TaskApplication]:
    task = await _get_fund_task(session, current_user=current_user, task_id=task_id)
    if task.status != TaskStatus.CLOSED:
        raise TaskNotClosedError

    result = await session.execute(
        select(TaskApplication)
        .options(*application_load_options())
        .where(
            TaskApplication.task_id == task.id,
            TaskApplication.status == ApplicationStatus.ACCEPTED,
        )
        .order_by(TaskApplication.created_at.asc())
    )
    applications = list(result.scalars().all())

    confirmed_at = datetime.now(UTC)
    for application in applications:
        application.status = ApplicationStatus.COMPLETION_CONFIRMED
        application.completion_confirmed_at = confirmed_at
        application.completion_comment = completion_comment

    if applications:
        await add_admin_notifications(
            session,
            title="Фонд подтвердил выполнение",
            body=(
                f"Фонд «{task.fund.name}» подтвердил выполнение задания «{task.title}» "
                f"для {len(applications)} участника(ов). Требуется начисление часов."
            ),
        )

    await session.commit()
    for volunteer_id in {application.volunteer_id for application in applications}:
        await sync_volunteer_achievements(session, volunteer_id)
    return [
        await _get_application_by_id(session, application.id)
        for application in applications
    ]


async def confirm_application_completion(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    completion_comment: str | None,
) -> TaskApplication:
    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )
    if application.task.status != TaskStatus.CLOSED:
        raise TaskNotClosedError
    if not can_transition(
        application.status,
        ApplicationStatus.COMPLETION_CONFIRMED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.COMPLETION_CONFIRMED
    application.completion_confirmed_at = datetime.now(UTC)
    application.completion_comment = completion_comment
    await add_admin_notifications(
        session,
        title="Фонд подтвердил выполнение",
        body=(
            f"Фонд «{application.task.fund.name}» подтвердил выполнение задания "
            f"«{application.task.title}». Требуется начисление часов."
        ),
    )
    await session.commit()
    await sync_volunteer_achievements(session, application.volunteer_id)
    return await _get_application_by_id(session, application.id)


async def _get_application_by_id(
    session: AsyncSession,
    application_id: UUID,
) -> TaskApplication:
    result = await session.execute(
        select(TaskApplication)
        .options(*application_load_options())
        .where(TaskApplication.id == application_id)
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise ApplicationNotFoundError
    return application


async def _get_fund_task(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
) -> VolunteerTask:
    fund = await get_fund_by_representative(session, current_user)
    task = await session.scalar(
        select(VolunteerTask)
        .options(selectinload(VolunteerTask.fund))
        .where(VolunteerTask.id == task_id, VolunteerTask.fund_id == fund.id)
    )
    if task is None:
        raise TaskNotFoundError
    return task


def _ensure_task_deadline_is_open(task: VolunteerTask) -> None:
    if task.deadline_at is None:
        return

    now = datetime.now(UTC)
    if task.deadline_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    if task.deadline_at < now:
        raise TaskNotOpenForApplicationsError


def _ensure_task_accepting_applications(task: VolunteerTask) -> None:
    if task.status != TaskStatus.PUBLISHED:
        raise TaskNotOpenForApplicationsError
    _ensure_task_deadline_is_open(task)


async def _ensure_participant_limit_not_reached(
    session: AsyncSession,
    task: VolunteerTask,
) -> None:
    if task.participant_limit is None:
        return

    accepted_count = await session.scalar(
        select(func.count(TaskApplication.id)).where(
            TaskApplication.task_id == task.id,
            TaskApplication.status.in_(
                [
                    ApplicationStatus.ACCEPTED,
                    ApplicationStatus.COMPLETION_CONFIRMED,
                    ApplicationStatus.HOURS_AWARDED,
                ]
            ),
        )
    )
    if int(accepted_count or 0) >= task.participant_limit:
        raise ParticipantLimitReachedError
