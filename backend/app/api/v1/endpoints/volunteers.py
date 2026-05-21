from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.auth import UserResponse
from app.schemas.notifications import NotificationReadCount, NotificationResponse
from app.schemas.volunteers import (
    VolunteerAchievementResponse,
    VolunteerAchievementsOverviewResponse,
    VolunteerHistoryItemResponse,
    VolunteerProfileUpdateRequest,
    VolunteerHoursByCategoryItemResponse,
    VolunteerHoursDynamicsItemResponse,
    VolunteerHoursLedgerItemResponse,
    VolunteerHoursSummaryResponse,
    AvatarUploadResponse,
    PublicVolunteerProfileResponse,
    VolunteerProfileResponse,
)
from app.services.achievement_service import (
    get_volunteer_achievement_overview,
    list_volunteer_achievement_statuses,
    sync_volunteer_achievements,
)
from app.services.notification_service import (
    NotificationNotFoundError,
    list_user_notifications,
    mark_all_user_notifications_read,
    mark_notification_read,
)
from app.services.report_service import build_volunteer_year_statistics_pdf
from app.services.volunteer_history_service import list_volunteer_history

from app.services.volunteer_hours_service import (
    get_volunteer_hours_summary,
    list_volunteer_hours_by_category,
    list_volunteer_hours_dynamics,
    list_volunteer_hours_ledger,
)

from app.services.volunteer_profile_service import (
    EmptyAvatarError,
    InvalidAvatarTypeError,
    VolunteerNotFoundError,
    get_my_volunteer_profile,
    get_public_volunteer_profile,
    upload_volunteer_avatar,
)


router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "volunteers"}


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    payload: VolunteerProfileUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> User:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user, field, value)

    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.get("/me/profile", response_model=VolunteerProfileResponse)
async def get_my_profile(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> VolunteerProfileResponse:
    profile = await get_my_volunteer_profile(session, current_user)
    return VolunteerProfileResponse.model_validate(profile)


@router.post("/me/avatar", response_model=AvatarUploadResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> AvatarUploadResponse:
    try:
        avatar_url = await upload_volunteer_avatar(
            session,
            user=current_user,
            file=file,
        )
    except EmptyAvatarError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="empty avatar file",
        ) from exc
    except InvalidAvatarTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="avatar must be png, jpeg or webp",
        ) from exc

    return AvatarUploadResponse(avatar_url=avatar_url)


@router.get("/{volunteer_id}/public", response_model=PublicVolunteerProfileResponse)
async def get_public_volunteer(
    volunteer_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> PublicVolunteerProfileResponse:
    try:
        profile = await get_public_volunteer_profile(session, volunteer_id)
    except VolunteerNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="volunteer not found",
        ) from exc

    return PublicVolunteerProfileResponse.model_validate(profile)


@router.get("/me/history", response_model=list[VolunteerHistoryItemResponse])
async def get_my_history(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[VolunteerHistoryItemResponse]:
    await sync_volunteer_achievements(session, current_user.id)
    history = await list_volunteer_history(
        session,
        current_user.id,
        limit=limit,
        offset=offset,
    )
    return [VolunteerHistoryItemResponse.model_validate(item) for item in history]


@router.get("/me/achievements", response_model=list[VolunteerAchievementResponse])
async def get_my_achievements(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[VolunteerAchievementResponse]:
    await sync_volunteer_achievements(session, current_user.id)
    achievements = await list_volunteer_achievement_statuses(session, current_user.id)
    return [VolunteerAchievementResponse.model_validate(item) for item in achievements]


@router.get("/me/achievements/overview", response_model=VolunteerAchievementsOverviewResponse)
async def get_my_achievement_overview(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> VolunteerAchievementsOverviewResponse:
    await sync_volunteer_achievements(session, current_user.id)
    overview = await get_volunteer_achievement_overview(session, current_user.id)
    return VolunteerAchievementsOverviewResponse.model_validate(overview)


@router.get("/me/notifications", response_model=list[NotificationResponse])
async def get_my_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[NotificationResponse]:
    notifications = await list_user_notifications(
        session,
        current_user,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    return [NotificationResponse.model_validate(notification) for notification in notifications]


@router.patch("/me/notifications/read-all", response_model=NotificationReadCount)
async def read_all_my_notifications(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> NotificationReadCount:
    updated_count = await mark_all_user_notifications_read(session, current_user)
    return NotificationReadCount(updated_count=updated_count)


@router.patch(
    "/me/notifications/{notification_id}/read",
    response_model=NotificationResponse,
)
async def read_my_notification(
    notification_id: UUID,
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> NotificationResponse:
    try:
        notification = await mark_notification_read(session, current_user, notification_id)
    except NotificationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="notification not found"
        ) from exc
    return NotificationResponse.model_validate(notification)


@router.get("/me/hours/summary", response_model=VolunteerHoursSummaryResponse)
async def get_my_hours_summary(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> VolunteerHoursSummaryResponse:
    summary = await get_volunteer_hours_summary(session, current_user.id)
    return VolunteerHoursSummaryResponse.model_validate(summary)


@router.get("/me/hours/ledger", response_model=list[VolunteerHoursLedgerItemResponse])
async def get_my_hours_ledger(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[VolunteerHoursLedgerItemResponse]:
    ledger = await list_volunteer_hours_ledger(
        session,
        current_user.id,
        limit=limit,
        offset=offset,
    )
    return [VolunteerHoursLedgerItemResponse.model_validate(item) for item in ledger]


@router.get("/me/hours/dynamics", response_model=list[VolunteerHoursDynamicsItemResponse])
async def get_my_hours_dynamics(
    months: int = Query(default=12, ge=1, le=36),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[VolunteerHoursDynamicsItemResponse]:
    dynamics = await list_volunteer_hours_dynamics(
        session,
        current_user.id,
        months=months,
    )
    return [VolunteerHoursDynamicsItemResponse.model_validate(item) for item in dynamics]


@router.get("/me/hours/by-category", response_model=list[VolunteerHoursByCategoryItemResponse])
async def get_my_hours_by_category(
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[VolunteerHoursByCategoryItemResponse]:
    categories = await list_volunteer_hours_by_category(session, current_user.id)
    return [VolunteerHoursByCategoryItemResponse.model_validate(item) for item in categories]


@router.get("/me/statistics.pdf")
async def download_my_year_statistics_pdf(
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2000, le=2100),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> Response:
    pdf_content = await build_volunteer_year_statistics_pdf(
        session,
        volunteer=current_user,
        year=year,
    )

    filename = f"volunteer_statistics_{year}.pdf"

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
