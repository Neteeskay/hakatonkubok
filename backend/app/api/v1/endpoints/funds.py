from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import UserRole
from app.schemas.funds import FundDocumentResponse
from app.services.fund_service import (
    EmptyFundDocumentError,
    FundNotFoundError,
    add_fund_document,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "funds"}


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
