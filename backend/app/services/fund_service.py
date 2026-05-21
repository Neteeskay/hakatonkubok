import re
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.domain import (
    Fund,
    FundDocument,
    Notification,
    TaskApplication,
    User,
    VolunteerHourLedger,
    VolunteerTask,
)
from app.models.enums import ApplicationStatus, FundStatus, TaskStatus
from app.schemas.funds import FundDashboardSummary, FundUpdateRequest
from app.services.email_sender import send_email
from app.services.status_transitions import FUND_TRANSITIONS, can_transition


class FundError(Exception):
    pass


class FundNotFoundError(FundError):
    pass


class EmptyFundDocumentError(FundError):
    pass


class FundDocumentNotFoundError(FundError):
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
        select(Fund).options(*fund_load_options()).where(Fund.representative_user_id == user.id)
    )
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def get_fund_by_id(session: AsyncSession, fund_id: UUID) -> Fund:
    result = await session.execute(
        select(Fund).options(*fund_load_options()).where(Fund.id == fund_id)
    )
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def get_fund_dashboard_summary(
    session: AsyncSession,
    current_user: User,
) -> FundDashboardSummary:
    fund = await get_fund_by_representative(session, current_user)

    task_counts = await _count_by_status(
        session,
        select(VolunteerTask.status, func.count(VolunteerTask.id))
        .where(VolunteerTask.fund_id == fund.id)
        .group_by(VolunteerTask.status),
    )

    application_counts = await _count_by_status(
        session,
        select(TaskApplication.status, func.count(TaskApplication.id))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .group_by(TaskApplication.status),
    )

    completions_waiting_hours = await session.scalar(
        select(func.count(TaskApplication.id))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .where(TaskApplication.status == ApplicationStatus.COMPLETION_CONFIRMED)
        .where(
            ~select(VolunteerHourLedger.id)
            .where(VolunteerHourLedger.application_id == TaskApplication.id)
            .exists()
        )
    )

    awarded_hours_total = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0))
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerTask.fund_id == fund.id)
    )

    return FundDashboardSummary(
        fund_id=fund.id,
        fund_name=fund.name,
        fund_status=fund.status,
        tasks_total=sum(task_counts.values()),
        tasks_draft=task_counts.get(TaskStatus.DRAFT, 0),
        tasks_pending_review=task_counts.get(TaskStatus.PENDING_REVIEW, 0),
        tasks_published=task_counts.get(TaskStatus.PUBLISHED, 0),
        tasks_needs_changes=task_counts.get(TaskStatus.NEEDS_CHANGES, 0),
        tasks_rejected=task_counts.get(TaskStatus.REJECTED, 0),
        tasks_closed=task_counts.get(TaskStatus.CLOSED, 0),
        applications_total=sum(application_counts.values()),
        applications_applied=application_counts.get(ApplicationStatus.APPLIED, 0),
        applications_accepted=application_counts.get(ApplicationStatus.ACCEPTED, 0),
        applications_rejected=application_counts.get(ApplicationStatus.REJECTED, 0),
        applications_completion_confirmed=application_counts.get(
            ApplicationStatus.COMPLETION_CONFIRMED, 0
        ),
        applications_hours_awarded=application_counts.get(ApplicationStatus.HOURS_AWARDED, 0),
        completions_waiting_hours=int(completions_waiting_hours or 0),
        awarded_hours_total=Decimal(awarded_hours_total or 0),
    )


async def list_funds(session: AsyncSession, status: FundStatus | None = None) -> list[Fund]:
    statement = select(Fund).options(*fund_load_options()).order_by(Fund.created_at.desc())
    if status is not None:
        statement = statement.where(Fund.status == status)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def _count_by_status(
    session: AsyncSession,
    statement: object,
) -> dict[object, int]:
    result = await session.execute(statement)
    return {status: int(count or 0) for status, count in result.all()}


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


async def upload_fund_cover(
    session: AsyncSession,
    *,
    current_user: User,
    file: UploadFile,
) -> str:
    fund = await get_fund_by_representative(session, current_user)

    content = await file.read()
    if not content:
        raise EmptyFundDocumentError

    filename = f"{uuid4()}_{safe_filename(file.filename or 'cover')}"
    relative_path = Path("uploads") / "funds" / str(fund.id) / "cover" / filename
    storage_path = Path(settings.uploads_dir) / "funds" / str(fund.id) / "cover" / filename

    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(content)

    fund.cover_url = relative_path.as_posix()

    await session.commit()
    await session.refresh(fund)

    return fund.cover_url


async def upload_fund_logo(
    session: AsyncSession,
    *,
    current_user: User,
    file: UploadFile,
) -> str:
    fund = await get_fund_by_representative(session, current_user)

    content = await file.read()
    if not content:
        raise EmptyFundDocumentError

    filename = f"{uuid4()}_{safe_filename(file.filename or 'logo')}"
    relative_path = Path("uploads") / "funds" / str(fund.id) / "logo" / filename
    storage_path = Path(settings.uploads_dir) / "funds" / str(fund.id) / "logo" / filename

    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(content)

    fund.logo_url = relative_path.as_posix()

    await session.commit()
    await session.refresh(fund)

    return fund.logo_url


async def update_fund_document_visibility(
    session: AsyncSession,
    *,
    current_user: User,
    document_id: UUID,
    is_public: bool,
) -> FundDocument:
    fund = await get_fund_by_representative(session, current_user)

    document = await session.scalar(
        select(FundDocument).where(
            FundDocument.id == document_id,
            FundDocument.fund_id == fund.id,
        )
    )

    if document is None:
        raise FundDocumentNotFoundError

    document.is_public = is_public

    await session.commit()
    await session.refresh(document)

    return document


async def list_public_funds(
    session: AsyncSession,
    *,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Fund]:
    statement = (
        select(Fund)
        .options(*fund_load_options())
        .where(Fund.status == FundStatus.APPROVED)
        .order_by(Fund.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(Fund.name.ilike(pattern))

    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_public_fund_by_id(
    session: AsyncSession,
    fund_id: UUID,
) -> Fund:
    result = await session.execute(
        select(Fund)
        .options(*fund_load_options())
        .where(Fund.id == fund_id, Fund.status == FundStatus.APPROVED)
    )
    fund = result.scalar_one_or_none()
    if fund is None:
        raise FundNotFoundError
    return fund


async def get_public_fund_stats(
    session: AsyncSession,
    fund_id: UUID,
) -> tuple[int, Decimal, int]:
    active_tasks = await session.scalar(
        select(func.count(VolunteerTask.id))
        .where(VolunteerTask.fund_id == fund_id)
        .where(VolunteerTask.status == TaskStatus.PUBLISHED)
    )

    awarded_hours_total = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0))
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerTask.fund_id == fund_id)
    )

    volunteers_total = await session.scalar(
        select(func.count(func.distinct(TaskApplication.volunteer_id)))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund_id)
        .where(
            TaskApplication.status.in_(
                [
                    ApplicationStatus.ACCEPTED,
                    ApplicationStatus.COMPLETION_CONFIRMED,
                    ApplicationStatus.HOURS_AWARDED,
                ]
            )
        )
    )

    return (
        int(active_tasks or 0),
        Decimal(awarded_hours_total or 0),
        int(volunteers_total or 0),
    )
