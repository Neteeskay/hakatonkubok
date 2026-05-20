from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import FundStatus, UserRole
from app.schemas.funds import FundModerationRequest, FundProfileResponse
from app.services.fund_service import (
    FundModerationCommentRequiredError,
    FundNotFoundError,
    InvalidFundStatusTransitionError,
    get_fund_by_id,
    list_funds,
    moderate_fund,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "admin"}


@router.get("/funds", response_model=list[FundProfileResponse])
async def admin_list_funds(
    status_filter: FundStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> list[FundProfileResponse]:
    funds = await list_funds(session, status=status_filter)
    return [FundProfileResponse.model_validate(fund) for fund in funds]


@router.get("/funds/{fund_id}", response_model=FundProfileResponse)
async def admin_get_fund(
    fund_id: UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.patch("/funds/{fund_id}/moderation", response_model=FundProfileResponse)
async def admin_moderate_fund(
    fund_id: UUID,
    payload: FundModerationRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await moderate_fund(
            session,
            fund_id=fund_id,
            target_status=payload.status,
            moderation_comment=payload.moderation_comment,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except FundModerationCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="moderation_comment is required",
        ) from exc
    except InvalidFundStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid fund status transition",
        ) from exc
    return FundProfileResponse.model_validate(fund)
