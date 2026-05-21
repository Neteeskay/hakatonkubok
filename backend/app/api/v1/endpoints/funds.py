from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.funds import (
    FundDashboardSummary,
    FundDocumentResponse,
    FundProfileResponse,
    FundUpdateRequest,
)
from app.services.fund_service import (
    EmptyFundDocumentError,
    FundNotFoundError,
    add_fund_document,
    get_fund_dashboard_summary,
    get_fund_by_id,
    get_fund_by_representative,
    update_fund_profile,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "funds"}


@router.get("/me", response_model=FundProfileResponse)
async def my_fund_profile(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_representative(session, current_user)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.patch("/me", response_model=FundProfileResponse)
async def update_my_fund_profile(
    payload: FundUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await update_fund_profile(session, current_user=current_user, payload=payload)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.post(
    "/me/documents",
    response_model=FundDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_my_fund_document(
    document_type: str = Form(..., min_length=1, max_length=120),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundDocumentResponse:
    try:
        document = await add_fund_document(
            session,
            current_user=current_user,
            document_type=document_type,
            file=file,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except EmptyFundDocumentError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="empty file") from exc
    return FundDocumentResponse.model_validate(document)


@router.get("/me/dashboard", response_model=FundDashboardSummary)
async def get_my_fund_dashboard(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundDashboardSummary:
    try:
        return await get_fund_dashboard_summary(session, current_user)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc


@router.get("/{fund_id}", response_model=FundProfileResponse)
async def get_fund_profile(
    fund_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.VOLUNTEER, UserRole.FUND, UserRole.ADMIN)),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)
