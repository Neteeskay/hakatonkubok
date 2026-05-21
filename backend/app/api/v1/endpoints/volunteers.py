from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.auth import UserResponse
from app.schemas.volunteers import (
    VolunteerAchievementResponse,
    VolunteerAchievementsOverviewResponse,
    VolunteerHistoryItemResponse,
    VolunteerProfileUpdateRequest,
)
from app.services.achievement_service import (
    get_volunteer_achievement_overview,
    list_volunteer_achievement_statuses,
    sync_volunteer_achievements,
)
from app.services.report_service import build_volunteer_year_statistics_pdf
from app.services.volunteer_history_service import list_volunteer_history

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
