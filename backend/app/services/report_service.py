import csv
from datetime import datetime
from decimal import Decimal
from io import BytesIO, StringIO
from typing import Iterable
from uuid import UUID

from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Fund, TaskApplication, User, VolunteerHourLedger, VolunteerTask
from app.models.enums import ApplicationStatus, FundStatus, TaskStatus, UserRole
from app.schemas.reports import ParticipantReportRow, PlatformAnalyticsReport


PARTICIPANT_HEADERS = [
    "volunteer_id",
    "full_name",
    "email",
    "city",
    "department",
    "position",
    "registered_at",
    "applications_count",
    "completed_tasks_count",
    "awarded_hours",
]

ANALYTICS_HEADERS = ["metric", "value"]


async def fetch_participant_report_rows(
    session: AsyncSession,
    *,
    limit: int | None,
    offset: int = 0,
) -> list[ParticipantReportRow]:
    application_counts = (
        select(
            TaskApplication.volunteer_id.label("volunteer_id"),
            func.count(TaskApplication.id).label("applications_count"),
        )
        .group_by(TaskApplication.volunteer_id)
        .subquery()
    )
    hour_totals = (
        select(
            VolunteerHourLedger.volunteer_id.label("volunteer_id"),
            func.count(VolunteerHourLedger.id).label("completed_tasks_count"),
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0).label("awarded_hours"),
        )
        .group_by(VolunteerHourLedger.volunteer_id)
        .subquery()
    )

    statement = (
        select(
            User.id.label("volunteer_id"),
            User.full_name,
            User.email,
            User.city,
            User.department,
            User.position,
            User.created_at.label("registered_at"),
            func.coalesce(application_counts.c.applications_count, 0).label(
                "applications_count"
            ),
            func.coalesce(hour_totals.c.completed_tasks_count, 0).label(
                "completed_tasks_count"
            ),
            func.coalesce(hour_totals.c.awarded_hours, 0).label("awarded_hours"),
        )
        .outerjoin(application_counts, application_counts.c.volunteer_id == User.id)
        .outerjoin(hour_totals, hour_totals.c.volunteer_id == User.id)
        .where(User.role == UserRole.VOLUNTEER)
        .order_by(User.created_at.desc())
        .offset(offset)
    )
    if limit is not None:
        statement = statement.limit(limit)

    result = await session.execute(statement)
    return [ParticipantReportRow(**row._mapping) for row in result.all()]


async def fetch_platform_analytics(session: AsyncSession) -> PlatformAnalyticsReport:
    volunteers_total = await _count(session, select(func.count(User.id)).where(User.role == UserRole.VOLUNTEER))
    funds_total = await _count(session, select(func.count(Fund.id)))
    funds_pending_review = await _count(
        session,
        select(func.count(Fund.id)).where(Fund.status == FundStatus.PENDING_REVIEW),
    )
    funds_approved = await _count(
        session,
        select(func.count(Fund.id)).where(Fund.status == FundStatus.APPROVED),
    )
    tasks_total = await _count(session, select(func.count(VolunteerTask.id)))
    tasks_pending_review = await _count(
        session,
        select(func.count(VolunteerTask.id)).where(VolunteerTask.status == TaskStatus.PENDING_REVIEW),
    )
    tasks_published = await _count(
        session,
        select(func.count(VolunteerTask.id)).where(VolunteerTask.status == TaskStatus.PUBLISHED),
    )
    tasks_closed = await _count(
        session,
        select(func.count(VolunteerTask.id)).where(VolunteerTask.status == TaskStatus.CLOSED),
    )
    applications_total = await _count(session, select(func.count(TaskApplication.id)))
    accepted_applications = await _count(
        session,
        select(func.count(TaskApplication.id)).where(TaskApplication.status == ApplicationStatus.ACCEPTED),
    )
    completions_waiting_hours = await _count(
        session,
        select(func.count(TaskApplication.id))
        .where(TaskApplication.status == ApplicationStatus.COMPLETION_CONFIRMED)
        .where(
            ~select(VolunteerHourLedger.id)
            .where(VolunteerHourLedger.application_id == TaskApplication.id)
            .exists()
        ),
    )
    awarded_hours_total = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0))
    )

    return PlatformAnalyticsReport(
        volunteers_total=volunteers_total,
        funds_total=funds_total,
        funds_pending_review=funds_pending_review,
        funds_approved=funds_approved,
        tasks_total=tasks_total,
        tasks_pending_review=tasks_pending_review,
        tasks_published=tasks_published,
        tasks_closed=tasks_closed,
        applications_total=applications_total,
        accepted_applications=accepted_applications,
        completions_waiting_hours=completions_waiting_hours,
        awarded_hours_total=awarded_hours_total or 0,
    )


async def _count(session: AsyncSession, statement) -> int:
    return int(await session.scalar(statement) or 0)


def build_participants_csv(rows: Iterable[ParticipantReportRow]) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(PARTICIPANT_HEADERS)
    for row in rows:
        writer.writerow(_participant_row_values(row))
    return output.getvalue()


def build_participants_xlsx_bytes(rows: Iterable[ParticipantReportRow]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Participants"
    worksheet.append(PARTICIPANT_HEADERS)
    for row in rows:
        worksheet.append(_participant_row_values(row))
    return _workbook_to_bytes(workbook)


def build_analytics_csv(report: PlatformAnalyticsReport) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(ANALYTICS_HEADERS)
    for metric, value in report.model_dump().items():
        writer.writerow([metric, _export_value(value)])
    return output.getvalue()


def build_analytics_xlsx_bytes(report: PlatformAnalyticsReport) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Analytics"
    worksheet.append(ANALYTICS_HEADERS)
    for metric, value in report.model_dump().items():
        worksheet.append([metric, _export_value(value)])
    return _workbook_to_bytes(workbook)


def build_full_report_xlsx_bytes(
    participants: Iterable[ParticipantReportRow],
    analytics: PlatformAnalyticsReport,
) -> bytes:
    workbook = Workbook()
    participants_sheet = workbook.active
    participants_sheet.title = "Participants"
    participants_sheet.append(PARTICIPANT_HEADERS)
    for row in participants:
        participants_sheet.append(_participant_row_values(row))

    analytics_sheet = workbook.create_sheet("Analytics")
    analytics_sheet.append(ANALYTICS_HEADERS)
    for metric, value in analytics.model_dump().items():
        analytics_sheet.append([metric, _export_value(value)])

    return _workbook_to_bytes(workbook)


def _workbook_to_bytes(workbook: Workbook) -> bytes:
    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _participant_row_values(row: ParticipantReportRow) -> list[object]:
    return [_export_value(getattr(row, field)) for field in PARTICIPANT_HEADERS]


def _export_value(value: object) -> object:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value
