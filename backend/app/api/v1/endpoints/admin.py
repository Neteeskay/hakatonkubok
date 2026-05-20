from datetime import datetime, timezone
from decimal import Decimal
import hashlib
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, File, UploadFile
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import Fund, StolotoEmployee, TaskApplication, User, VolunteerHourLedger, VolunteerTask
from app.models.enums import ApplicationStatus, FundStatus, TaskStatus, UserRole
from app.schemas.admin import (
    AdminApplicationListItem,
    AdminCompletionItem,
    AdminDashboardSummary,
    AdminFundDetail,
    AdminFundListItem,
    AdminHourLedgerRead,
    AdminTaskDetail,
    AdminTaskListItem,
    AwardHoursRequest,
    FundModerationRequest,
    TaskModerationRequest,
)
from app.schemas.reports import ParticipantReportRow
from app.services.report_service import (
    build_participants_csv,
    build_participants_xlsx_bytes,
    fetch_participant_report_rows,
)
from app.schemas.allowed_emails import (
    AllowedEmailCreate,
    AllowedEmailRead,
    AllowedEmailsBulkCreate,
    AllowedEmailsImportResult,
)
from app.services.email_parser import (
    extract_emails_from_file,
    is_allowed_employee_email,
    normalize_email,
)
from app.services.achievement_service import sync_volunteer_achievements
from app.services.fund_service import (
    FundModerationCommentRequiredError,
    FundNotFoundError,
    InvalidFundStatusTransitionError,
    get_fund_by_id,
    list_funds,
    moderate_fund,
)
from app.services.task_service import (
    FundNotApprovedError,
    InvalidTaskStatusTransitionError,
    TaskModerationCommentRequiredError,
    TaskNotFoundError,
    get_task_by_id,
    list_tasks_for_admin,
    moderate_task,
)


router = APIRouter()

PageLimit = Annotated[int, Query(ge=1, le=100)]
PageOffset = Annotated[int, Query(ge=0)]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _paginate(stmt: Select, limit: int, offset: int) -> Select:
    return stmt.limit(limit).offset(offset)


async def _save_allowed_emails(
    raw_emails: list[str],
    session: AsyncSession,
) -> AllowedEmailsImportResult:
    normalized_unique_emails: list[str] = []
    invalid_values: list[str] = []
    forbidden_domain_emails: list[str] = []

    for raw_email in raw_emails:
        normalized_email = normalize_email(raw_email)

        if normalized_email is None:
            invalid_values.append(raw_email)
            continue

        if not is_allowed_employee_email(normalized_email):
            forbidden_domain_emails.append(normalized_email)
            continue

        if normalized_email not in normalized_unique_emails:
            normalized_unique_emails.append(normalized_email)

    if not normalized_unique_emails:
        return AllowedEmailsImportResult(
            added_count=0,
            skipped_duplicates_count=0,
            invalid_count=len(invalid_values),
            forbidden_domain_count=len(forbidden_domain_emails),
            added_emails=[],
            skipped_duplicates=[],
            invalid_values=invalid_values,
            forbidden_domain_emails=forbidden_domain_emails,
        )

    existing_emails_result = await session.scalars(
        select(StolotoEmployee.email).where(
            StolotoEmployee.email.in_(normalized_unique_emails)
        )
    )

    existing_emails = set(existing_emails_result.all())

    emails_to_add = [
        email for email in normalized_unique_emails if email not in existing_emails
    ]

    employee_models = [
        StolotoEmployee(
            email=email,
            employee_id=_employee_id_for_email(email),
            full_name=email,
        )
        for email in emails_to_add
    ]

    session.add_all(employee_models)
    await session.commit()

    return AllowedEmailsImportResult(
        added_count=len(emails_to_add),
        skipped_duplicates_count=len(existing_emails),
        invalid_count=len(invalid_values),
        forbidden_domain_count=len(forbidden_domain_emails),
        added_emails=emails_to_add,
        skipped_duplicates=sorted(existing_emails),
        invalid_values=invalid_values,
        forbidden_domain_emails=forbidden_domain_emails,
    )


def _employee_id_for_email(email: str) -> str:
    email_hash = hashlib.sha256(email.encode("utf-8")).hexdigest()[:16].upper()
    return f"EMAIL-{email_hash}"


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "admin"}


@router.get("/funds", response_model=list[AdminFundListItem])
async def list_funds_for_admin(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    status_filter: FundStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[Fund]:
    funds = await list_funds(session, status=status_filter)

    if search:
        search_value = search.strip().lower()
        funds = [fund for fund in funds if search_value in fund.name.lower()]

    return funds[offset : offset + limit]


@router.get("/funds/pending", response_model=list[AdminFundListItem])
async def list_pending_funds(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[Fund]:
    funds = await list_funds(session, status=FundStatus.PENDING_REVIEW)
    return funds[offset : offset + limit]


@router.get("/funds/{fund_id}", response_model=AdminFundDetail)
async def get_fund_for_admin(
    fund_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Fund:
    try:
        return await get_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found",
        ) from exc


@router.patch("/funds/{fund_id}/moderation", response_model=AdminFundDetail)
async def moderate_fund_for_admin(
    fund_id: UUID,
    payload: FundModerationRequest,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Fund:
    allowed_targets = {
        FundStatus.APPROVED,
        FundStatus.REJECTED,
        FundStatus.NEEDS_CHANGES,
    }

    if payload.target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin can set fund only to approved, rejected or needs_changes",
        )

    try:
        return await moderate_fund(
            session,
            fund_id=fund_id,
            target_status=payload.target_status,
            moderation_comment=payload.comment,
        )
    except FundNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found",
        ) from exc
    except FundModerationCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="comment is required for rejected or needs_changes",
        ) from exc
    except InvalidFundStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid fund status transition",
        ) from exc


@router.get("/tasks", response_model=list[AdminTaskListItem])
async def list_tasks_for_admin_endpoint(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    fund_id: UUID | None = None,
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[VolunteerTask]:
    tasks = await list_tasks_for_admin(session, status=status_filter)
    if fund_id is not None:
        tasks = [task for task in tasks if task.fund_id == fund_id]
    if search:
        search_value = search.strip().lower()
        tasks = [task for task in tasks if search_value in task.title.lower()]
    return tasks[offset : offset + limit]


@router.get("/tasks/pending", response_model=list[AdminTaskListItem])
async def list_pending_tasks(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[VolunteerTask]:
    tasks = await list_tasks_for_admin(session, status=TaskStatus.PENDING_REVIEW)
    return tasks[offset : offset + limit]


@router.get("/tasks/{task_id}", response_model=AdminTaskDetail)
async def get_task_for_admin(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> VolunteerTask:
    try:
        return await get_task_by_id(session, task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        ) from exc


@router.patch("/tasks/{task_id}/moderation", response_model=AdminTaskDetail)
async def moderate_task_for_admin(
    task_id: UUID,
    payload: TaskModerationRequest,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> VolunteerTask:
    allowed_targets = {
        TaskStatus.PUBLISHED,
        TaskStatus.REJECTED,
        TaskStatus.NEEDS_CHANGES,
    }

    if payload.target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin can set task only to published, rejected or needs_changes",
        )

    try:
        return await moderate_task(
            session,
            task_id=task_id,
            target_status=payload.target_status,
            moderation_comment=payload.comment,
        )
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        ) from exc
    except FundNotApprovedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only tasks of approved funds can be published",
        ) from exc
    except TaskModerationCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="comment is required for rejected or needs_changes",
        ) from exc
    except InvalidTaskStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid task status transition",
        ) from exc


@router.get("/applications", response_model=list[AdminApplicationListItem])
async def list_applications_for_admin(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    task_id: UUID | None = None,
    volunteer_id: UUID | None = None,
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[TaskApplication]:
    stmt = select(TaskApplication).order_by(TaskApplication.created_at.desc())

    if status_filter is not None:
        stmt = stmt.where(TaskApplication.status == status_filter)

    if task_id is not None:
        stmt = stmt.where(TaskApplication.task_id == task_id)

    if volunteer_id is not None:
        stmt = stmt.where(TaskApplication.volunteer_id == volunteer_id)

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.get("/completions/waiting-hours", response_model=list[AdminCompletionItem])
async def list_completions_waiting_hours(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[TaskApplication]:
    stmt = (
        select(TaskApplication)
        .where(TaskApplication.status == ApplicationStatus.COMPLETION_CONFIRMED)
        .where(
            ~select(VolunteerHourLedger.id)
            .where(VolunteerHourLedger.application_id == TaskApplication.id)
            .exists()
        )
        .options(
            selectinload(TaskApplication.task),
            selectinload(TaskApplication.volunteer),
        )
        .order_by(TaskApplication.completion_confirmed_at.asc())
    )

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.post(
    "/applications/{application_id}/award-hours",
    response_model=AdminHourLedgerRead,
    status_code=status.HTTP_201_CREATED,
)
async def award_volunteer_hours(
    application_id: UUID,
    payload: AwardHoursRequest,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
) -> VolunteerHourLedger:
    application = await session.scalar(
        select(TaskApplication)
        .where(TaskApplication.id == application_id)
        .options(selectinload(TaskApplication.task))
    )

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.status != ApplicationStatus.COMPLETION_CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hours can be awarded only after fund confirms completion",
        )

    existing_ledger = await session.scalar(
        select(VolunteerHourLedger).where(
            VolunteerHourLedger.application_id == application.id
        )
    )

    if existing_ledger is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hours already awarded for this application",
        )

    ledger = VolunteerHourLedger(
        application_id=application.id,
        volunteer_id=application.volunteer_id,
        task_id=application.task_id,
        hours=payload.hours,
        awarded_by=admin.id,
        admin_comment=payload.admin_comment,
    )

    application.status = ApplicationStatus.HOURS_AWARDED

    session.add(ledger)

    await session.commit()
    await session.refresh(ledger)
    await sync_volunteer_achievements(session, application.volunteer_id)

    return ledger


@router.get("/dashboard", response_model=AdminDashboardSummary)
async def get_admin_dashboard(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AdminDashboardSummary:
    funds_total = await session.scalar(select(func.count(Fund.id)))

    funds_pending_review = await session.scalar(
        select(func.count(Fund.id)).where(Fund.status == FundStatus.PENDING_REVIEW)
    )

    tasks_total = await session.scalar(select(func.count(VolunteerTask.id)))

    tasks_pending_review = await session.scalar(
        select(func.count(VolunteerTask.id)).where(
            VolunteerTask.status == TaskStatus.PENDING_REVIEW
        )
    )

    tasks_published = await session.scalar(
        select(func.count(VolunteerTask.id)).where(
            VolunteerTask.status == TaskStatus.PUBLISHED
        )
    )

    applications_total = await session.scalar(select(func.count(TaskApplication.id)))

    completions_waiting_hours = await session.scalar(
        select(func.count(TaskApplication.id))
        .where(TaskApplication.status == ApplicationStatus.COMPLETION_CONFIRMED)
        .where(
            ~select(VolunteerHourLedger.id)
            .where(VolunteerHourLedger.application_id == TaskApplication.id)
            .exists()
        )
    )

    awarded_hours_total = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0))
    )

    return AdminDashboardSummary(
        funds_total=funds_total or 0,
        funds_pending_review=funds_pending_review or 0,
        tasks_total=tasks_total or 0,
        tasks_pending_review=tasks_pending_review or 0,
        tasks_published=tasks_published or 0,
        applications_total=applications_total or 0,
        completions_waiting_hours=completions_waiting_hours or 0,
        awarded_hours_total=awarded_hours_total or Decimal("0"),
    )


@router.get("/reports/participants", response_model=list[ParticipantReportRow])
async def get_participants_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    limit: PageLimit = 100,
    offset: PageOffset = 0,
) -> list[ParticipantReportRow]:
    return await fetch_participant_report_rows(session, limit=limit, offset=offset)


@router.get("/reports/participants.csv")
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
            "Content-Disposition": 'attachment; filename="participants_report.csv"'
        },
    )


@router.get("/reports/participants.xlsx")
async def export_participants_report_xlsx(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    rows = await fetch_participant_report_rows(session, limit=None, offset=0)

    return Response(
        content=build_participants_xlsx_bytes(rows),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="participants_report.xlsx"'
        },
    )


@router.get("/allowed-emails", response_model=list[AllowedEmailRead])
async def list_allowed_employee_emails(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 100,
    offset: PageOffset = 0,
) -> list[StolotoEmployee]:
    stmt = select(StolotoEmployee).order_by(
        StolotoEmployee.created_at.desc()
    )

    if search:
        stmt = stmt.where(StolotoEmployee.email.ilike(f"%{search.lower()}%"))

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.post(
    "/allowed-emails",
    response_model=AllowedEmailRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_allowed_employee_email(
    payload: AllowedEmailCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> StolotoEmployee:
    normalized_email = normalize_email(payload.email)

    if normalized_email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email",
        )

    if not is_allowed_employee_email(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Stoloto employee emails are allowed",
        )

    existing_email = await session.scalar(
        select(StolotoEmployee).where(StolotoEmployee.email == normalized_email)
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    employee = StolotoEmployee(
        email=normalized_email,
        employee_id=_employee_id_for_email(normalized_email),
        full_name=normalized_email,
    )

    session.add(employee)
    await session.commit()
    await session.refresh(employee)

    return employee


@router.post(
    "/allowed-emails/bulk",
    response_model=AllowedEmailsImportResult,
)
async def add_allowed_employee_emails_bulk(
    payload: AllowedEmailsBulkCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AllowedEmailsImportResult:
    return await _save_allowed_emails(
        raw_emails=[str(email) for email in payload.emails],
        session=session,
    )


@router.post(
    "/allowed-emails/import",
    response_model=AllowedEmailsImportResult,
)
async def import_allowed_employee_emails_from_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AllowedEmailsImportResult:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    if not file.filename.lower().endswith((".txt", ".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .txt and .csv files are supported",
        )

    content = await file.read()

    raw_emails = extract_emails_from_file(
        filename=file.filename,
        content=content,
    )

    return await _save_allowed_emails(
        raw_emails=raw_emails,
        session=session,
    )


@router.delete("/allowed-emails/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allowed_employee_email(
    email_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    allowed_email = await session.scalar(
        select(StolotoEmployee).where(StolotoEmployee.id == email_id)
    )

    if allowed_email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allowed email not found",
        )

    await session.delete(allowed_email)
    await session.commit()
