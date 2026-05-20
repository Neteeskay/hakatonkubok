import re
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.domain import Fund, FundDocument, Notification, User
from app.services.email_sender import send_email
from app.models.enums import FundStatus
from app.schemas.funds import FundUpdateRequest
from app.services.status_transitions import FUND_TRANSITIONS, can_transition


class FundError(Exception):
    pass


class FundNotFoundError(FundError):
    pass


class EmptyFundDocumentError(FundError):
    pass


class InvalidFundStatusTransitionError(FundError):
    pass


class FundModerationCommentRequiredError(FundError):
    pass


def safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", filename).strip("._")
    return cleaned or "document"


def fund_load_options() -> tuple[object, object]:
    return (
        selectinload(Fund.representative),
        selectinload(Fund.documents),
    )


async def get_fund_by_representative(session: AsyncSession, user: User) -> Fund:
    result = await session.execute(
        select(Fund)
        .options(*fund_load_options())
        .where(Fund.representative_user_id == user.id)
    )
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def get_fund_by_id(session: AsyncSession, fund_id: UUID) -> Fund:
    result = await session.execute(
        select(Fund)
        .options(*fund_load_options())
        .where(Fund.id == fund_id)
    )
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def list_funds(session: AsyncSession, status: FundStatus | None = None) -> list[Fund]:
    statement = select(Fund).options(*fund_load_options()).order_by(Fund.created_at.desc())
    if status is not None:
        statement = statement.where(Fund.status == status)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def update_fund_profile(
    session: AsyncSession,
    *,
    current_user: User,
    payload: FundUpdateRequest,
) -> Fund:
    fund = await get_fund_by_representative(session, current_user)
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(fund, field, value)

    if fund.status in {FundStatus.DRAFT, FundStatus.NEEDS_CHANGES}:
        fund.status = FundStatus.PENDING_REVIEW
        fund.moderation_comment = None
        fund.approved_at = None

    await session.commit()
    return await get_fund_by_id(session, fund.id)


async def moderate_fund(
    session: AsyncSession,
    *,
    fund_id: UUID,
    target_status: FundStatus,
    moderation_comment: str | None,
) -> Fund:
    fund = await get_fund_by_id(session, fund_id)
    if target_status in {FundStatus.NEEDS_CHANGES, FundStatus.REJECTED}:
        if not moderation_comment or not moderation_comment.strip():
            raise FundModerationCommentRequiredError

    if not can_transition(fund.status, target_status, FUND_TRANSITIONS):
        raise InvalidFundStatusTransitionError

    fund.status = target_status
    fund.moderation_comment = moderation_comment.strip() if moderation_comment else None
    fund.approved_at = datetime.now(UTC) if target_status == FundStatus.APPROVED else None

    if target_status in {FundStatus.NEEDS_CHANGES, FundStatus.REJECTED}:
        notification = Notification(
            user_id=fund.representative_user_id,
            title="Заявка фонда требует внимания",
            body=(
                "Здравствуйте!\n\n"
                f"Ваша заявка фонда «{fund.name}» была проверена администратором.\n\n"
                f"Комментарий администратора:\n"
                f"{fund.moderation_comment or 'Комментарий не указан'}\n\n"
                "Пожалуйста, внесите изменения и отправьте заявку повторно."
            ),
        )
        session.add(notification)

        if fund.contact_email:
            send_email(
                to_email=fund.contact_email,
                subject=notification.title,
                text=notification.body,
            )

    await session.commit()
    return await get_fund_by_id(session, fund.id)


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
