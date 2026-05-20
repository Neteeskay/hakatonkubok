from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import TaskApplication, UserAchievement, VolunteerTask
from app.models.enums import AchievementCode, ApplicationStatus, HelpCategory, ParticipationFormat, TaskType
from app.services.achievement_service import ACHIEVEMENT_DEFINITIONS


@dataclass(frozen=True)
class VolunteerHistoryTask:
    id: UUID
    title: str
    category: HelpCategory
    participation_format: ParticipationFormat
    task_type: TaskType
    fund_name: str | None


@dataclass(frozen=True)
class VolunteerHistoryItem:
    event_type: str
    occurred_at: datetime
    title: str
    description: str | None
    application_id: UUID | None
    task: VolunteerHistoryTask | None
    achievement_code: AchievementCode | None
    status: ApplicationStatus | None
    hours: Decimal | None


async def list_volunteer_history(
    session: AsyncSession,
    volunteer_id: UUID,
    *,
    limit: int,
    offset: int,
) -> list[VolunteerHistoryItem]:
    events: list[VolunteerHistoryItem] = []

    applications = await session.scalars(
        select(TaskApplication)
        .options(
            selectinload(TaskApplication.task).selectinload(VolunteerTask.fund),
            selectinload(TaskApplication.hour_ledger),
        )
        .where(TaskApplication.volunteer_id == volunteer_id)
    )

    for application in applications:
        events.extend(_build_application_events(application))

    achievements = await session.scalars(
        select(UserAchievement).where(UserAchievement.user_id == volunteer_id)
    )
    for achievement in achievements:
        event = _build_achievement_event(achievement)
        if event is not None:
            events.append(event)

    events.sort(key=lambda item: item.occurred_at, reverse=True)
    return events[offset : offset + limit]


def _build_application_events(application: TaskApplication) -> list[VolunteerHistoryItem]:
    task = _task_payload(application)
    events = [
        VolunteerHistoryItem(
            event_type="application_created",
            occurred_at=application.created_at,
            title="Отклик отправлен",
            description="Волонтёр откликнулся на задание.",
            application_id=application.id,
            task=task,
            achievement_code=None,
            status=ApplicationStatus.APPLIED,
            hours=None,
        )
    ]

    if application.decided_at is not None and application.status in {
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.COMPLETION_CONFIRMED,
        ApplicationStatus.HOURS_AWARDED,
    }:
        events.append(
            VolunteerHistoryItem(
                event_type="application_accepted",
                occurred_at=application.decided_at,
                title="Отклик принят",
                description=application.fund_comment,
                application_id=application.id,
                task=task,
                achievement_code=None,
                status=ApplicationStatus.ACCEPTED,
                hours=None,
            )
        )

    if application.decided_at is not None and application.status == ApplicationStatus.REJECTED:
        events.append(
            VolunteerHistoryItem(
                event_type="application_rejected",
                occurred_at=application.decided_at,
                title="Отклик отклонён",
                description=application.fund_comment,
                application_id=application.id,
                task=task,
                achievement_code=None,
                status=ApplicationStatus.REJECTED,
                hours=None,
            )
        )

    if application.canceled_at is not None:
        events.append(
            VolunteerHistoryItem(
                event_type="application_canceled",
                occurred_at=application.canceled_at,
                title="Отклик отменён",
                description=None,
                application_id=application.id,
                task=task,
                achievement_code=None,
                status=ApplicationStatus.CANCELED,
                hours=None,
            )
        )

    if application.completion_confirmed_at is not None:
        events.append(
            VolunteerHistoryItem(
                event_type="completion_confirmed",
                occurred_at=application.completion_confirmed_at,
                title="Участие подтверждено",
                description=application.completion_comment,
                application_id=application.id,
                task=task,
                achievement_code=None,
                status=ApplicationStatus.COMPLETION_CONFIRMED,
                hours=None,
            )
        )

    if application.hour_ledger is not None:
        events.append(
            VolunteerHistoryItem(
                event_type="hours_awarded",
                occurred_at=application.hour_ledger.awarded_at,
                title="Начислены волонтёрские часы",
                description=application.hour_ledger.admin_comment,
                application_id=application.id,
                task=task,
                achievement_code=None,
                status=ApplicationStatus.HOURS_AWARDED,
                hours=application.hour_ledger.hours,
            )
        )

    return events


def _build_achievement_event(achievement: UserAchievement) -> VolunteerHistoryItem | None:
    code = _parse_achievement_code(achievement.achievement_code)
    if code is None:
        return None

    definition = ACHIEVEMENT_DEFINITIONS[code]
    return VolunteerHistoryItem(
        event_type="achievement_awarded",
        occurred_at=achievement.awarded_at,
        title=f"Получена медаль: {definition.title}",
        description=definition.description,
        application_id=None,
        task=None,
        achievement_code=code,
        status=None,
        hours=None,
    )


def _task_payload(application: TaskApplication) -> VolunteerHistoryTask:
    fund_name = application.task.fund.name if application.task.fund is not None else None
    return VolunteerHistoryTask(
        id=application.task.id,
        title=application.task.title,
        category=application.task.category,
        participation_format=application.task.participation_format,
        task_type=application.task.task_type,
        fund_name=fund_name,
    )


def _parse_achievement_code(value: str) -> AchievementCode | None:
    try:
        return AchievementCode(value)
    except ValueError:
        return None
