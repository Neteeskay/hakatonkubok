from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.domain import Fund, VolunteerHourLedger, VolunteerTask
from app.models.enums import HelpCategory


@dataclass(frozen=True)
class VolunteerHoursSummary:
    total_hours: Decimal
    entries_count: int
    tasks_count: int
    first_awarded_at: datetime | None
    last_awarded_at: datetime | None


@dataclass(frozen=True)
class VolunteerHoursLedgerItem:
    id: UUID
    application_id: UUID
    task_id: UUID
    task_title: str
    fund_id: UUID | None
    fund_name: str | None
    category: HelpCategory
    hours: Decimal
    awarded_at: datetime
    admin_comment: str | None


@dataclass(frozen=True)
class VolunteerHoursDynamicsItem:
    period: date
    hours: Decimal
    entries_count: int


@dataclass(frozen=True)
class VolunteerHoursByCategoryItem:
    category: HelpCategory
    hours: Decimal
    tasks_count: int


async def get_volunteer_hours_summary(
    session: AsyncSession,
    volunteer_id: UUID,
) -> VolunteerHoursSummary:
    row = (
        await session.execute(
            select(
                func.coalesce(func.sum(VolunteerHourLedger.hours), 0),
                func.count(VolunteerHourLedger.id),
                func.count(func.distinct(VolunteerHourLedger.task_id)),
                func.min(VolunteerHourLedger.awarded_at),
                func.max(VolunteerHourLedger.awarded_at),
            ).where(VolunteerHourLedger.volunteer_id == volunteer_id)
        )
    ).one()

    return VolunteerHoursSummary(
        total_hours=Decimal(row[0] or 0),
        entries_count=int(row[1] or 0),
        tasks_count=int(row[2] or 0),
        first_awarded_at=row[3],
        last_awarded_at=row[4],
    )


async def list_volunteer_hours_ledger(
    session: AsyncSession,
    volunteer_id: UUID,
    *,
    limit: int,
    offset: int,
) -> list[VolunteerHoursLedgerItem]:
    ledgers = await session.scalars(
        select(VolunteerHourLedger)
        .options(
            selectinload(VolunteerHourLedger.task).selectinload(VolunteerTask.fund),
        )
        .where(VolunteerHourLedger.volunteer_id == volunteer_id)
        .order_by(VolunteerHourLedger.awarded_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result: list[VolunteerHoursLedgerItem] = []
    for ledger in ledgers:
        task = ledger.task
        fund = task.fund if task is not None else None

        result.append(
            VolunteerHoursLedgerItem(
                id=ledger.id,
                application_id=ledger.application_id,
                task_id=ledger.task_id,
                task_title=task.title if task is not None else "Задание удалено",
                fund_id=fund.id if fund is not None else None,
                fund_name=fund.name if fund is not None else None,
                category=task.category,
                hours=ledger.hours,
                awarded_at=ledger.awarded_at,
                admin_comment=ledger.admin_comment,
            )
        )

    return result


async def list_volunteer_hours_dynamics(
    session: AsyncSession,
    volunteer_id: UUID,
    *,
    months: int = 12,
) -> list[VolunteerHoursDynamicsItem]:
    period = func.date_trunc("month", VolunteerHourLedger.awarded_at).label("period")

    rows = await session.execute(
        select(
            period,
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0),
            func.count(VolunteerHourLedger.id),
        )
        .where(VolunteerHourLedger.volunteer_id == volunteer_id)
        .group_by(period)
        .order_by(period.desc())
        .limit(months)
    )

    items = [
        VolunteerHoursDynamicsItem(
            period=row[0].date(),
            hours=Decimal(row[1] or 0),
            entries_count=int(row[2] or 0),
        )
        for row in rows.all()
    ]

    return list(reversed(items))


async def list_volunteer_hours_by_category(
    session: AsyncSession,
    volunteer_id: UUID,
) -> list[VolunteerHoursByCategoryItem]:
    rows = await session.execute(
        select(
            VolunteerTask.category,
            func.coalesce(func.sum(VolunteerHourLedger.hours), 0),
            func.count(func.distinct(VolunteerHourLedger.task_id)),
        )
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .where(VolunteerHourLedger.volunteer_id == volunteer_id)
        .group_by(VolunteerTask.category)
        .order_by(func.sum(VolunteerHourLedger.hours).desc())
    )

    return [
        VolunteerHoursByCategoryItem(
            category=row[0],
            hours=Decimal(row[1] or 0),
            tasks_count=int(row[2] or 0),
        )
        for row in rows.all()
    ]