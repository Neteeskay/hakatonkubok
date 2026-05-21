import csv
from dataclasses import dataclass
from decimal import Decimal
from io import BytesIO, StringIO
from uuid import UUID

from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Fund, TaskApplication, User, VolunteerHourLedger, VolunteerTask
from app.models.enums import ApplicationStatus, TaskStatus
from app.services.fund_service import FundNotFoundError, get_fund_by_representative


@dataclass(frozen=True)
class FundReportSummary:
    fund_id: UUID
    fund_name: str
    tasks_total: int
    tasks_published: int
    tasks_closed: int
    applications_total: int
    accepted_applications: int
    completed_applications: int
    participants_total: int
    awarded_hours_total: Decimal


@dataclass(frozen=True)
class FundReportParticipant:
    volunteer_id: UUID
    full_name: str | None
    email: str
    city: str | None
    applications_count: int
    completed_tasks_count: int
    awarded_hours: Decimal


@dataclass(frozen=True)
class FundReportHoursByMonth:
    period: object
    hours: Decimal
    entries_count: int


async def get_my_fund_or_raise(
    session: AsyncSession,
    current_user: User,
) -> Fund:
    try:
        return await get_fund_by_representative(session, current_user)
    except FundNotFoundError:
        raise


async def get_fund_report_summary(
    session: AsyncSession,
    current_user: User,
) -> FundReportSummary:
    fund = await get_my_fund_or_raise(session, current_user)

    tasks_total = await session.scalar(
        select(func.count(VolunteerTask.id)).where(VolunteerTask.fund_id == fund.id)
    )

    tasks_published = await session.scalar(
        select(func.count(VolunteerTask.id))
        .where(VolunteerTask.fund_id == fund.id)
        .where(VolunteerTask.status == TaskStatus.PUBLISHED)
    )

    tasks_closed = await session.scalar(
        select(func.count(VolunteerTask.id))
        .where(VolunteerTask.fund_id == fund.id)
        .where(VolunteerTask.status == TaskStatus.CLOSED)
    )

    applications_total = await session.scalar(
        select(func.count(TaskApplication.id))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
    )

    accepted_applications = await session.scalar(
        select(func.count(TaskApplication.id))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .where(TaskApplication.status == ApplicationStatus.ACCEPTED)
    )

    completed_applications = await session.scalar(
        select(func.count(TaskApplication.id))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .where(
            TaskApplication.status.in_(
                [
                    ApplicationStatus.COMPLETION_CONFIRMED,
                    ApplicationStatus.HOURS_AWARDED,
                ]
            )
        )
    )

    participants_total = await session.scalar(
        select(func.count(func.distinct(TaskApplication.volunteer_id)))
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
    )

    awarded_hours_total = await session.scalar(
        select(func.coalesce(func.sum(VolunteerHourLedger.hours), 0))
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerTask.fund_id == fund.id)
    )

    return FundReportSummary(
        fund_id=fund.id,
        fund_name=fund.name,
        tasks_total=int(tasks_total or 0),
        tasks_published=int(tasks_published or 0),
        tasks_closed=int(tasks_closed or 0),
        applications_total=int(applications_total or 0),
        accepted_applications=int(accepted_applications or 0),
        completed_applications=int(completed_applications or 0),
        participants_total=int(participants_total or 0),
        awarded_hours_total=Decimal(awarded_hours_total or 0),
    )


async def get_fund_report_participants(
    session: AsyncSession,
    current_user: User,
    *,
    limit: int = 100,
    offset: int = 0,
) -> list[FundReportParticipant]:
    fund = await get_my_fund_or_raise(session, current_user)

    application_counts = (
        select(
            TaskApplication.volunteer_id.label("volunteer_id"),
            func.count(TaskApplication.id).label("applications_count"),
        )
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .group_by(TaskApplication.volunteer_id)
        .subquery()
    )

    completed_counts = (
        select(
            VolunteerHourLedger.volunteer_id.label("volunteer_id"),
            func.count(VolunteerHourLedger.id).label("completed_tasks_count"),
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0).label("awarded_hours"),
        )
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .group_by(VolunteerHourLedger.volunteer_id)
        .subquery()
    )

    statement = (
        select(
            User.id.label("volunteer_id"),
            User.full_name,
            User.email,
            User.city,
            func.coalesce(application_counts.c.applications_count, 0).label(
                "applications_count"
            ),
            func.coalesce(completed_counts.c.completed_tasks_count, 0).label(
                "completed_tasks_count"
            ),
            func.coalesce(completed_counts.c.awarded_hours, 0).label("awarded_hours"),
        )
        .join(application_counts, application_counts.c.volunteer_id == User.id)
        .outerjoin(completed_counts, completed_counts.c.volunteer_id == User.id)
        .order_by(func.coalesce(completed_counts.c.awarded_hours, 0).desc())
        .limit(limit)
        .offset(offset)
    )

    rows = await session.execute(statement)

    return [
        FundReportParticipant(
            volunteer_id=row.volunteer_id,
            full_name=row.full_name,
            email=row.email,
            city=row.city,
            applications_count=int(row.applications_count or 0),
            completed_tasks_count=int(row.completed_tasks_count or 0),
            awarded_hours=Decimal(row.awarded_hours or 0),
        )
        for row in rows.all()
    ]


async def get_fund_report_hours_by_month(
    session: AsyncSession,
    current_user: User,
    *,
    months: int = 12,
) -> list[FundReportHoursByMonth]:
    fund = await get_my_fund_or_raise(session, current_user)

    period = func.date_trunc("month", VolunteerHourLedger.awarded_at).label("period")

    rows = await session.execute(
        select(
            period,
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0).label("hours"),
            func.count(VolunteerHourLedger.id).label("entries_count"),
        )
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerTask.fund_id == fund.id)
        .group_by(period)
        .order_by(period.desc())
        .limit(months)
    )

    items = [
        FundReportHoursByMonth(
            period=row.period,
            hours=Decimal(row.hours or 0),
            entries_count=int(row.entries_count or 0),
        )
        for row in rows.all()
    ]

    return list(reversed(items))


def build_fund_participants_csv(rows: list[FundReportParticipant]) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "volunteer_id",
            "full_name",
            "email",
            "city",
            "applications_count",
            "completed_tasks_count",
            "awarded_hours",
        ]
    )

    for row in rows:
        writer.writerow(
            [
                row.volunteer_id,
                row.full_name,
                row.email,
                row.city,
                row.applications_count,
                row.completed_tasks_count,
                row.awarded_hours,
            ]
        )

    return output.getvalue()


def build_fund_participants_xlsx(rows: list[FundReportParticipant]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Участники"

    worksheet.append(
        [
            "ID волонтёра",
            "ФИО",
            "Email",
            "Город",
            "Откликов",
            "Выполнено заданий",
            "Начислено часов",
        ]
    )

    for row in rows:
        worksheet.append(
            [
                str(row.volunteer_id),
                row.full_name,
                row.email,
                row.city,
                row.applications_count,
                row.completed_tasks_count,
                float(row.awarded_hours),
            ]
        )

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def build_fund_hours_csv(rows: list[FundReportHoursByMonth]) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["period", "hours", "entries_count"])

    for row in rows:
        writer.writerow([row.period, row.hours, row.entries_count])

    return output.getvalue()


def build_fund_hours_xlsx(rows: list[FundReportHoursByMonth]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Часы по месяцам"

    worksheet.append(["Месяц", "Часы", "Начислений"])

    for row in rows:
        worksheet.append([row.period, float(row.hours), row.entries_count])

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()