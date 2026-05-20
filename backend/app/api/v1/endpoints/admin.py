from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, File, UploadFile
from sqlalchemy import Select, case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.domain import Notification
from app.services.email_sender import send_email

from app.api.deps import require_admin
from app.db.session import get_session
from app.models.domain import Fund, TaskApplication, User, VolunteerHourLedger, VolunteerTask, AllowedEmployeeEmail
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
    ParticipantReportRow,
    TaskModerationRequest,
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
from app.services.status_transitions import FUND_TRANSITIONS, TASK_TRANSITIONS, can_transition


router = APIRouter()

PageLimit = Annotated[int, Query(ge=1, le=100)]
PageOffset = Annotated[int, Query(ge=0)]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _paginate(stmt: Select, limit: int, offset: int) -> Select:
    return stmt.limit(limit).offset(offset)


def _csv_cell(value: object) -> str:
    text = "" if value is None else str(value)
    text = text.replace('"', '""')
    return f'"{text}"'


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "admin"}


@router.get("/funds", response_model=list[AdminFundListItem])
async def list_funds_for_admin(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
    status_filter: FundStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[Fund]:
    stmt = select(Fund).order_by(Fund.created_at.desc())

    if status_filter is not None:
        stmt = stmt.where(Fund.status == status_filter)

    if search:
        stmt = stmt.where(Fund.name.ilike(f"%{search}%"))

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.get("/funds/pending", response_model=list[AdminFundListItem])
async def list_pending_funds(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[Fund]:
    stmt = (
        select(Fund)
        .where(Fund.status == FundStatus.PENDING_REVIEW)
        .order_by(Fund.created_at.asc())
    )

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.get("/funds/{fund_id}", response_model=AdminFundDetail)
async def get_fund_for_admin(
    fund_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> Fund:
    fund = await session.scalar(
        select(Fund)
        .where(Fund.id == fund_id)
        .options(
            selectinload(Fund.representative),
            selectinload(Fund.documents),
        )
    )

    if fund is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found",
        )

    return fund


@router.patch("/funds/{fund_id}/moderation", response_model=AdminFundDetail)
async def moderate_fund(
    fund_id: UUID,
    payload: FundModerationRequest,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
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

    fund = await session.scalar(
        select(Fund)
        .where(Fund.id == fund_id)
        .options(
            selectinload(Fund.representative),
            selectinload(Fund.documents),
        )
    )

    if fund is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found",
        )

    if not can_transition(fund.status, payload.target_status, FUND_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Invalid fund status transition: {fund.status} -> {payload.target_status}",
        )

    fund.status = payload.target_status
    fund.moderation_comment = payload.comment

    if payload.target_status in {FundStatus.NEEDS_CHANGES, FundStatus.REJECTED}:
        title = "Заявка фонда требует внимания"

        body = (
            "Здравствуйте!\n\n"
            f"Ваша заявка фонда «{fund.name}» была проверена администратором.\n\n"
            f"Комментарий администратора:\n{payload.comment or 'Комментарий не указан'}\n\n"
            "Пожалуйста, внесите изменения и отправьте заявку повторно."
        )

        notification = Notification(
            user_id=fund.representative_user_id,
            title=title,
            body=body,
        )

        session.add(notification)

        if fund.contact_email:
            send_email(
                to_email=fund.contact_email,
                subject=title,
                text=body,
            )

    fund.approved_at = _now() if payload.target_status == FundStatus.APPROVED else None

    await session.commit()
    await session.refresh(fund)

    return fund


@router.get("/tasks", response_model=list[AdminTaskListItem])
async def list_tasks_for_admin(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    fund_id: UUID | None = None,
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[VolunteerTask]:
    stmt = select(VolunteerTask).order_by(VolunteerTask.created_at.desc())

    if status_filter is not None:
        stmt = stmt.where(VolunteerTask.status == status_filter)

    if fund_id is not None:
        stmt = stmt.where(VolunteerTask.fund_id == fund_id)

    if search:
        stmt = stmt.where(VolunteerTask.title.ilike(f"%{search}%"))

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.get("/tasks/pending", response_model=list[AdminTaskListItem])
async def list_pending_tasks(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
    limit: PageLimit = 50,
    offset: PageOffset = 0,
) -> list[VolunteerTask]:
    stmt = (
        select(VolunteerTask)
        .where(VolunteerTask.status == TaskStatus.PENDING_REVIEW)
        .order_by(VolunteerTask.created_at.asc())
    )

    result = await session.scalars(_paginate(stmt, limit, offset))
    return list(result)


@router.get("/tasks/{task_id}", response_model=AdminTaskDetail)
async def get_task_for_admin(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> VolunteerTask:
    task = await session.scalar(
        select(VolunteerTask)
        .where(VolunteerTask.id == task_id)
        .options(selectinload(VolunteerTask.fund))
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.patch("/tasks/{task_id}/moderation", response_model=AdminTaskDetail)
async def moderate_task(
    task_id: UUID,
    payload: TaskModerationRequest,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
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

    task = await session.scalar(
        select(VolunteerTask)
        .where(VolunteerTask.id == task_id)
        .options(selectinload(VolunteerTask.fund))
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.fund.status != FundStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only tasks of approved funds can be published",
        )

    if not can_transition(task.status, payload.target_status, TASK_TRANSITIONS):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Invalid task status transition: {task.status} -> {payload.target_status}",
        )

    task.status = payload.target_status
    task.moderation_comment = payload.comment
    task.published_at = _now() if payload.target_status == TaskStatus.PUBLISHED else None

    await session.commit()
    await session.refresh(task)

    return task


@router.get("/applications", response_model=list[AdminApplicationListItem])
async def list_applications_for_admin(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
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
    _: User = Depends(require_admin),
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
    admin: User = Depends(require_admin),
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

    return ledger


@router.get("/dashboard", response_model=AdminDashboardSummary)
async def get_admin_dashboard(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
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
    _: User = Depends(require_admin),
    limit: PageLimit = 100,
    offset: PageOffset = 0,
) -> list[ParticipantReportRow]:
    stmt = (
        select(
            User.id.label("volunteer_id"),
            User.full_name.label("full_name"),
            User.email.label("email"),
            User.created_at.label("registration_date"),
            User.city.label("city"),
            User.department.label("department"),
            User.position.label("position"),
            func.count(distinct(TaskApplication.id)).label("applications_count"),
            func.count(distinct(VolunteerHourLedger.task_id)).label("completed_tasks_count"),
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0).label("awarded_hours"),
            func.array_remove(
                func.array_agg(distinct(VolunteerTask.category)),
                None,
            ).label("help_categories"),
        )
        .select_from(User)
        .outerjoin(TaskApplication, TaskApplication.volunteer_id == User.id)
        .outerjoin(VolunteerHourLedger, VolunteerHourLedger.volunteer_id == User.id)
        .outerjoin(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(User.role == UserRole.VOLUNTEER)
        .group_by(
            User.id,
            User.full_name,
            User.email,
            User.created_at,
            User.city,
            User.department,
            User.position,
        )
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(stmt)

    return [
        ParticipantReportRow(
            volunteer_id=row.volunteer_id,
            full_name=row.full_name,
            email=row.email,
            registration_date=row.registration_date,
            applications_count=row.applications_count,
            completed_tasks_count=row.completed_tasks_count,
            awarded_hours=row.awarded_hours,
            city=row.city,
            department=row.department,
            position=row.position,
            help_categories=row.help_categories or [],
        )
        for row in result
    ]


@router.get("/reports/participants.csv")
async def export_participants_report_csv(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> Response:
    rows = await get_participants_report(
        session=session,
        _=_,
        limit=100,
        offset=0,
    )

    header = [
        "volunteer_id",
        "full_name",
        "email",
        "registration_date",
        "applications_count",
        "completed_tasks_count",
        "awarded_hours",
        "city",
        "department",
        "position",
        "help_categories",
    ]

    csv_lines = [";".join(header)]

    for row in rows:
        csv_lines.append(
            ";".join(
                [
                    _csv_cell(row.volunteer_id),
                    _csv_cell(row.full_name),
                    _csv_cell(row.email),
                    _csv_cell(row.registration_date),
                    _csv_cell(row.applications_count),
                    _csv_cell(row.completed_tasks_count),
                    _csv_cell(row.awarded_hours),
                    _csv_cell(row.city),
                    _csv_cell(row.department),
                    _csv_cell(row.position),
                    _csv_cell(", ".join(row.help_categories)),
                ]
            )
        )

    csv_content = "\n".join(csv_lines)

    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="participants_report.csv"'
        },
    )

@router.get("/allowed-emails", response_model=list[AllowedEmailRead])
async def list_allowed_employee_emails(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
    search: str | None = Query(default=None, min_length=2),
    limit: PageLimit = 100,
    offset: PageOffset = 0,
) -> list[AllowedEmployeeEmail]:
    stmt = select(AllowedEmployeeEmail).order_by(
        AllowedEmployeeEmail.created_at.desc()
    )

    if search:
        stmt = stmt.where(AllowedEmployeeEmail.email.ilike(f"%{search.lower()}%"))

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
    admin: User = Depends(require_admin),
) -> AllowedEmployeeEmail:
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
        select(AllowedEmployeeEmail).where(
            AllowedEmployeeEmail.email == normalized_email
        )
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    allowed_email = AllowedEmployeeEmail(
        email=normalized_email,
        added_by=admin.id,
        source="manual",
    )

    session.add(allowed_email)
    await session.commit()
    await session.refresh(allowed_email)

    return allowed_email


@router.post(
    "/allowed-emails/bulk",
    response_model=AllowedEmailsImportResult,
)
async def add_allowed_employee_emails_bulk(
    payload: AllowedEmailsBulkCreate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
) -> AllowedEmailsImportResult:
    return await _save_allowed_emails(
        raw_emails=[str(email) for email in payload.emails],
        source="manual_bulk",
        session=session,
        admin=admin,
    )


@router.post(
    "/allowed-emails/import",
    response_model=AllowedEmailsImportResult,
)
async def import_allowed_employee_emails_from_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
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
        source="file_import",
        session=session,
        admin=admin,
    )


@router.delete("/allowed-emails/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allowed_employee_email(
    email_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> None:
    allowed_email = await session.scalar(
        select(AllowedEmployeeEmail).where(AllowedEmployeeEmail.id == email_id)
    )

    if allowed_email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allowed email not found",
        )

    await session.delete(allowed_email)
    await session.commit()

    async def _save_allowed_emails(
        raw_emails: list[str],
        source: str,
        session: AsyncSession,
        admin: User,
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
            select(AllowedEmployeeEmail.email).where(
                AllowedEmployeeEmail.email.in_(normalized_unique_emails)
            )
        )

        existing_emails = set(existing_emails_result.all())

        emails_to_add = [
            email for email in normalized_unique_emails if email not in existing_emails
        ]

        allowed_email_models = [
            AllowedEmployeeEmail(
                email=email,
                added_by=admin.id,
                source=source,
            )
            for email in emails_to_add
        ]

        session.add_all(allowed_email_models)
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