from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.reports import ParticipantReportRow, PlatformAnalyticsReport
from app.services.report_service import (
    build_analytics_csv,
    build_analytics_xlsx_bytes,
    build_full_report_xlsx_bytes,
    build_participants_csv,
    build_participants_xlsx_bytes,
    fetch_participant_report_rows,
    fetch_platform_analytics,
)

router = APIRouter()

PageLimit = Annotated[int, Query(ge=1, le=10_000)]
PageOffset = Annotated[int, Query(ge=0)]

XLSX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "reports"}


@router.get("/participants", response_model=list[ParticipantReportRow])
async def get_participants_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    limit: PageLimit = 1000,
    offset: PageOffset = 0,
) -> list[ParticipantReportRow]:
    return await fetch_participant_report_rows(session, limit=limit, offset=offset)


@router.get("/participants.csv")
async def export_participants_report_csv(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    rows = await fetch_participant_report_rows(session, limit=None, offset=0)

    return Response(
        content=build_participants_csv(rows),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="participants_report.csv"',
        },
    )


@router.get("/participants.xlsx")
async def export_participants_report_xlsx(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    rows = await fetch_participant_report_rows(session, limit=None, offset=0)

    return Response(
        content=build_participants_xlsx_bytes(rows),
        media_type=XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": 'attachment; filename="participants_report.xlsx"',
        },
    )


@router.get("/analytics", response_model=PlatformAnalyticsReport)
async def get_platform_analytics_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> PlatformAnalyticsReport:
    return await fetch_platform_analytics(session)


@router.get("/analytics.csv")
async def export_platform_analytics_csv(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    report = await fetch_platform_analytics(session)

    return Response(
        content=build_analytics_csv(report),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="platform_analytics.csv"',
        },
    )


@router.get("/analytics.xlsx")
async def export_platform_analytics_xlsx(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    report = await fetch_platform_analytics(session)

    return Response(
        content=build_analytics_xlsx_bytes(report),
        media_type=XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": 'attachment; filename="platform_analytics.xlsx"',
        },
    )


@router.get("/export.xlsx")
async def export_full_platform_report_xlsx(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    participants = await fetch_participant_report_rows(session, limit=None, offset=0)
    analytics = await fetch_platform_analytics(session)

    return Response(
        content=build_full_report_xlsx_bytes(participants, analytics),
        media_type=XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": 'attachment; filename="platform_report.xlsx"',
        },
    )
