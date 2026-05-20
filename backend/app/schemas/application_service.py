from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import Fund, TaskApplication, User, VolunteerTask
from app.models.enums import ApplicationStatus, TaskStatus
from app.services.fund_service import FundNotFoundError, get_fund_by_representative
from app.services.status_transitions import APPLICATION_TRANSITIONS, can_transition


class ApplicationError(Exception):
    pass


class ApplicationNotFoundError(ApplicationError):
    pass


class TaskNotFoundError(ApplicationError):
    pass


class TaskNotPublishedError(ApplicationError):
    pass


class AlreadyAppliedError(ApplicationError):
    pass


class ParticipantLimitReachedError(ApplicationError):
    pass


class InvalidApplicationStatusTransitionError(ApplicationError):
    pass


class ApplicationAccessDeniedError(ApplicationError):
    pass


def application_load_options() -> tuple[object, ...]:
    return (
        selectinload(TaskApplication.task).selectinload(VolunteerTask.fund),
        selectinload(TaskApplication.volunteer),
    )


async def get_application_by_id(
    session: AsyncSession,
    application_id: UUID,
) -> TaskApplication:
    application = await session.scalar(
        select(TaskApplication)
        .where(TaskApplication.id == application_id)
        .options(*application_load_options())
    )

    if application is None:
        raise ApplicationNotFoundError

    return application


async def get_published_task_by_id(
    session: AsyncSession,
    task_id: UUID,
) -> VolunteerTask:
    task = await session.scalar(
        select(VolunteerTask)
        .where(VolunteerTask.id == task_id)
        .options(selectinload(VolunteerTask.fund))
    )

    if task is None:
        raise TaskNotFoundError

    if task.status != TaskStatus.PUBLISHED:
        raise TaskNotPublishedError

    return task


async def count_accepted_applications(
    session: AsyncSession,
    task_id: UUID,
) -> int:
    count = await session.scalar(
        select(func.count(TaskApplication.id)).where(
            TaskApplication.task_id == task_id,
            TaskApplication.status.in_(
                [
                    ApplicationStatus.ACCEPTED,
                    ApplicationStatus.COMPLETION_CONFIRMED,
                    ApplicationStatus.HOURS_AWARDED,
                ]
            ),
        )
    )

    return count or 0


async def ensure_participant_limit_not_reached(
    session: AsyncSession,
    task: VolunteerTask,
) -> None:
    if task.participant_limit is None:
        return

    accepted_count = await count_accepted_applications(session, task.id)

    if accepted_count >= task.participant_limit:
        raise ParticipantLimitReachedError


async def create_application(
    session: AsyncSession,
    *,
    current_user: User,
    task_id: UUID,
    volunteer_comment: str | None = None,
) -> TaskApplication:
    task = await get_published_task_by_id(session, task_id)

    await ensure_participant_limit_not_reached(session, task)

    existing_application = await session.scalar(
        select(TaskApplication).where(
            TaskApplication.task_id == task.id,
            TaskApplication.volunteer_id == current_user.id,
            TaskApplication.status != ApplicationStatus.CANCELED,
        )
    )

    if existing_application is not None:
        raise AlreadyAppliedError

    application = TaskApplication(
        task_id=task.id,
        volunteer_id=current_user.id,
        status=ApplicationStatus.APPLIED,
        volunteer_comment=volunteer_comment.strip() if volunteer_comment else None,
    )

    session.add(application)
    await session.commit()

    return await get_application_by_id(session, application.id)


async def list_my_applications(
    session: AsyncSession,
    *,
    current_user: User,
    status: ApplicationStatus | None = None,
) -> list[TaskApplication]:
    statement = (
        select(TaskApplication)
        .where(TaskApplication.volunteer_id == current_user.id)
        .options(*application_load_options())
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
    application = await get_application_by_id(session, application_id)

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

    return await get_application_by_id(session, application.id)


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
        .where(VolunteerTask.fund_id == fund.id)
        .options(*application_load_options())
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
    application = await get_application_by_id(session, application_id)

    if application.task.fund_id != fund.id:
        raise ApplicationAccessDeniedError

    return application


async def accept_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    fund_comment: str | None = None,
) -> TaskApplication:
    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )

    if not can_transition(
        application.status,
        ApplicationStatus.ACCEPTED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    await ensure_participant_limit_not_reached(session, application.task)

    application.status = ApplicationStatus.ACCEPTED
    application.fund_comment = fund_comment.strip() if fund_comment else None
    application.decided_at = datetime.now(UTC)

    await session.commit()

    return await get_application_by_id(session, application.id)


async def reject_application(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    fund_comment: str | None = None,
) -> TaskApplication:
    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )

    if not can_transition(
        application.status,
        ApplicationStatus.REJECTED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.REJECTED
    application.fund_comment = fund_comment.strip() if fund_comment else None
    application.decided_at = datetime.now(UTC)

    await session.commit()

    return await get_application_by_id(session, application.id)


async def confirm_application_completion(
    session: AsyncSession,
    *,
    current_user: User,
    application_id: UUID,
    completion_comment: str | None = None,
) -> TaskApplication:
    application = await get_fund_application(
        session,
        current_user=current_user,
        application_id=application_id,
    )

    if not can_transition(
        application.status,
        ApplicationStatus.COMPLETION_CONFIRMED,
        APPLICATION_TRANSITIONS,
    ):
        raise InvalidApplicationStatusTransitionError

    application.status = ApplicationStatus.COMPLETION_CONFIRMED
    application.completion_comment = (
        completion_comment.strip() if completion_comment else None
    )
    application.completion_confirmed_at = datetime.now(UTC)

    await session.commit()

    return await get_application_by_id(session, application.id)