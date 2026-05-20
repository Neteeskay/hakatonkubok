import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.domain import Fund, FundDocument, User


class FundError(Exception):
    pass


class FundNotFoundError(FundError):
    pass


class EmptyFundDocumentError(FundError):
    pass


def safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", filename).strip("._")
    return cleaned or "document"


async def get_fund_by_representative(session: AsyncSession, user: User) -> Fund:
    result = await session.execute(select(Fund).where(Fund.representative_user_id == user.id))
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def add_fund_document(
    session: AsyncSession,
    *,
    current_user: User,
    document_type: str,
    file: UploadFile,
) -> FundDocument:
    fund = await get_fund_by_representative(session, current_user)

    content = await file.read()
    if not content:
        raise EmptyFundDocumentError

    filename = f"{uuid4()}_{safe_filename(file.filename or 'document')}"
    relative_path = Path("uploads") / "funds" / str(fund.id) / filename
    storage_path = Path(settings.uploads_dir) / "funds" / str(fund.id) / filename
    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(content)

    document = FundDocument(
        fund_id=fund.id,
        document_type=document_type,
        file_url=relative_path.as_posix(),
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document

