from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.services.report_service import build_volunteer_year_statistics_pdf

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "volunteers"}


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