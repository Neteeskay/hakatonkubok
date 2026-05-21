import re
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.domain import TaskApplication, User, UserAchievement, VolunteerHourLedger
from app.models.enums import ApplicationStatus, UserRole
from app.services.achievement_service import (
    get_volunteer_achievement_overview,
    list_volunteer_achievement_statuses,
    sync_volunteer_achievements,
)


class VolunteerProfileError(Exception):
    pass


class VolunteerNotFoundError(VolunteerProfileError):
    pass


class EmptyAvatarError(VolunteerProfileError):
    pass


class InvalidAvatarTypeError(VolunteerProfileError):
    pass


@dataclass(frozen=True)
class VolunteerProfileStats:
    total_hours: Decimal
    completed_tasks: int
    applications_total: int
    active_applications: int
    achievements_total: int
    achievements_awarded: int
    profile_level: int
    profile_level_title: str
    next_level_hours: Decimal | None


@dataclass(frozen=True)
class VolunteerProfile:
    id: UUID
    email: str
    full_name: str | None
    city: str | None
    phone: str | None
    avatar_url: str | None
    about: str | None
    department: str | None
    position: str | None
    interests: list[str] | None
    skills: list[str] | None
    pro_bono_skills: list[str] | None
    created_at: object
    updated_at: object
    stats: VolunteerProfileStats
    achievements: list[object]


@dataclass(frozen=True)
class PublicVolunteerProfile:
    id: UUID
    full_name: str | None
    city: str | None
    avatar_url: str | None
    about: str | None
    department: str | None
    position: str | None
    interests: list[str] | None
    skills: list[str] | None
    pro_bono_skills: list[str] | None
    created_at: object
    stats: VolunteerProfileStats
    achievements: list[object]


def safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", filename).strip("._")
    return cleaned or "avatar"


def get_profile_level(total_hours: Decimal) -> tuple[int, str, Decimal | None]:
    levels = [
        (1, "Новичок", Decimal("5")),
        (2, "Помощник", Decimal("10")),
        (3, "Активный волонтёр", Decimal("25")),
        (4, "Опытный волонтёр", Decimal("50")),
        (5, "Лидер помощи", Decimal("100")),
        (6, "Легенда проСТО", None),
    ]

    if total_hours < 5:
        return levels[0]
    if total_hours < 10:
        return levels[1]
    if total_hours < 25:
        return levels[2]
    if total_hours < 50:
        return levels[3]
    if total_hours < 100:
        return levels[4]
    return levels[5]


async def get_volunteer_profile_stats(
    session: AsyncSession,
    volunteer_id: UUID,
) -> VolunteerProfileStats:
    total_hours = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0)).where(
            VolunteerHourLedger.volunteer_id == volunteer_id
        )
    )

    completed_tasks = await session.scalar(
        select(func.count(VolunteerHourLedger.id)).where(
            VolunteerHourLedger.volunteer_id == volunteer_id
        )
    )

    applications_total = await session.scalar(
        select(func.count(TaskApplication.id)).where(
            TaskApplication.volunteer_id == volunteer_id
        )
    )

    active_applications = await session.scalar(
        select(func.count(TaskApplication.id))
        .where(TaskApplication.volunteer_id == volunteer_id)
        .where(
            TaskApplication.status.in_(
                [
                    ApplicationStatus.APPLIED,
                    ApplicationStatus.ACCEPTED,
                    ApplicationStatus.COMPLETION_CONFIRMED,
                ]
            )
        )
    )

    achievements_total = await session.scalar(
        select(func.count(UserAchievement.id)).where(UserAchievement.user_id == volunteer_id)
    )

    achievements_awarded = await session.scalar(
        select(func.count(UserAchievement.id)).where(UserAchievement.user_id == volunteer_id)
    )

    total_hours_decimal = Decimal(total_hours or 0)
    level, level_title, next_level_hours = get_profile_level(total_hours_decimal)

    return VolunteerProfileStats(
        total_hours=total_hours_decimal,
        completed_tasks=int(completed_tasks or 0),
        applications_total=int(applications_total or 0),
        active_applications=int(active_applications or 0),
        achievements_total=int(achievements_total or 0),
        achievements_awarded=int(achievements_awarded or 0),
        profile_level=level,
        profile_level_title=level_title,
        next_level_hours=next_level_hours,
    )


async def get_my_volunteer_profile(
    session: AsyncSession,
    user: User,
) -> VolunteerProfile:
    await sync_volunteer_achievements(session, user.id)
    stats = await get_volunteer_profile_stats(session, user.id)
    achievements = await list_volunteer_achievement_statuses(session, user.id)

    return VolunteerProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        city=user.city,
        phone=user.phone,
        avatar_url=user.avatar_url,
        about=user.about,
        department=user.department,
        position=user.position,
        interests=user.interests,
        skills=user.skills,
        pro_bono_skills=user.pro_bono_skills,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=stats,
        achievements=achievements,
    )


async def get_public_volunteer_profile(
    session: AsyncSession,
    volunteer_id: UUID,
) -> PublicVolunteerProfile:
    user = await session.scalar(
        select(User).where(User.id == volunteer_id, User.role == UserRole.VOLUNTEER)
    )
    if user is None:
        raise VolunteerNotFoundError

    await sync_volunteer_achievements(session, user.id)
    stats = await get_volunteer_profile_stats(session, user.id)
    achievements_overview = await get_volunteer_achievement_overview(session, user.id)

    awarded_achievements = [
        achievement
        for achievement in achievements_overview.achievements
        if achievement.is_awarded
    ]

    return PublicVolunteerProfile(
        id=user.id,
        full_name=user.full_name,
        city=user.city,
        avatar_url=user.avatar_url,
        about=user.about,
        department=user.department,
        position=user.position,
        interests=user.interests,
        skills=user.skills,
        pro_bono_skills=user.pro_bono_skills,
        created_at=user.created_at,
        stats=stats,
        achievements=awarded_achievements,
    )


async def upload_volunteer_avatar(
    session: AsyncSession,
    *,
    user: User,
    file: UploadFile,
) -> str:
    content = await file.read()
    if not content:
        raise EmptyAvatarError

    allowed_types = {"image/png", "image/jpeg", "image/webp"}
    if file.content_type not in allowed_types:
        raise InvalidAvatarTypeError

    filename = f"{uuid4()}_{safe_filename(file.filename or 'avatar')}"
    relative_path = Path("uploads") / "volunteers" / str(user.id) / "avatar" / filename
    storage_path = Path(settings.uploads_dir) / "volunteers" / str(user.id) / "avatar" / filename

    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(content)

    user.avatar_url = relative_path.as_posix()

    await session.commit()
    await session.refresh(user)

    return user.avatar_url