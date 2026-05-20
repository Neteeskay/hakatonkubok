from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.reports import ParticipantReportRow, PlatformAnalyticsReport
from app.services.report_service import (
    build_participants_csv,
    create_report_file_path,
    export_analytics_summary_pdf,
    export_participants_pdf,
    fetch_participant_report_rows,
    fetch_platform_analytics,
)

router = APIRouter()

PageLimit = Annotated[int, Query(ge=1, le=10_000)]
PageOffset = Annotated[int, Query(ge=0)]


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
    csv_content = build_participants_csv(rows)

    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="participants_report.csv"',
        },
    )


@router.get("/participants.pdf")
async def export_participants_report_pdf(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> FileResponse:
    rows = await fetch_participant_report_rows(session, limit=None, offset=0)

    try:
        output_path = create_report_file_path("participants_report", "pdf")
        export_participants_pdf(rows, output_path)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=output_path.name,
    )


@router.get("/analytics", response_model=PlatformAnalyticsReport)
async def get_platform_analytics_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> PlatformAnalyticsReport:
    return await fetch_platform_analytics(session)


@router.get("/analytics.pdf")
async def export_platform_analytics_pdf(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> FileResponse:
    report = await fetch_platform_analytics(session)

    try:
        output_path = create_report_file_path("platform_analytics", "pdf")
        export_analytics_summary_pdf(report, output_path)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=output_path.name,
    )
