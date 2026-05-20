import csv
from datetime import datetime
from decimal import Decimal
from io import BytesIO, StringIO
from typing import Iterable
from uuid import UUID

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Fund, TaskApplication, User, VolunteerHourLedger, VolunteerTask
from app.models.enums import ApplicationStatus, FundStatus, TaskStatus, UserRole
from app.schemas.reports import ParticipantReportRow, PlatformAnalyticsReport

from collections import Counter, defaultdict
from pathlib import Path

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.fonts import addMapping
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


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

PARTICIPANT_XLSX_HEADERS = [
    "ID волонтера",
    "ФИО",
    "Email",
    "Город",
    "Подразделение",
    "Должность",
    "Дата регистрации",
    "Откликов",
    "Выполнено задач",
    "Начислено часов",
]

ANALYTICS_LABELS = {
    "volunteers_total": "Всего волонтеров",
    "funds_total": "Всего фондов",
    "funds_pending_review": "Фондов на модерации",
    "funds_approved": "Одобренных фондов",
    "tasks_total": "Всего заданий",
    "tasks_pending_review": "Заданий на модерации",
    "tasks_published": "Опубликованных заданий",
    "tasks_closed": "Закрытых заданий",
    "applications_total": "Всего откликов",
    "accepted_applications": "Принятых откликов",
    "completions_waiting_hours": "Выполнений без начисленных часов",
    "awarded_hours_total": "Начислено часов всего",
}

ANALYTICS_XLSX_HEADERS = ["Показатель", "Значение"]

PARTICIPANT_COLUMN_WIDTHS = [38, 28, 32, 22, 24, 24, 22, 14, 18, 18]
ANALYTICS_COLUMN_WIDTHS = [42, 18, 18, 18]

THIN_BLACK_BORDER = Border(
    left=Side(style="thin", color="000000"),
    right=Side(style="thin", color="000000"),
    top=Side(style="thin", color="000000"),
    bottom=Side(style="thin", color="000000"),
)
TITLE_FILL = PatternFill("solid", fgColor="F8F5FF")
HEADER_FILL = PatternFill("solid", fgColor="EDE7F6")


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
    worksheet.title = "Участники"
    _apply_report_title(
        worksheet,
        title="Отчет по участникам корпоративного волонтерства",
        title_columns=len(PARTICIPANT_XLSX_HEADERS),
    )
    worksheet.append(PARTICIPANT_XLSX_HEADERS)
    for row in rows:
        worksheet.append(_participant_row_values(row))
    _style_table_sheet(
        worksheet,
        header_row=3,
        data_start_row=4,
        data_columns=len(PARTICIPANT_XLSX_HEADERS),
        column_widths=PARTICIPANT_COLUMN_WIDTHS,
    )
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
    worksheet.title = "Аналитика"
    _apply_report_title(
        worksheet,
        title="Сводная аналитика платформы",
        title_columns=len(ANALYTICS_COLUMN_WIDTHS),
    )
    worksheet.append(ANALYTICS_XLSX_HEADERS)
    for metric, value in report.model_dump().items():
        worksheet.append([ANALYTICS_LABELS.get(metric, metric), _export_value(value)])
    _style_table_sheet(
        worksheet,
        header_row=3,
        data_start_row=4,
        data_columns=len(ANALYTICS_XLSX_HEADERS),
        column_widths=ANALYTICS_COLUMN_WIDTHS,
    )
    return _workbook_to_bytes(workbook)


def build_full_report_xlsx_bytes(
    participants: Iterable[ParticipantReportRow],
    analytics: PlatformAnalyticsReport,
) -> bytes:
    workbook = Workbook()
    participants_sheet = workbook.active
    participants_sheet.title = "Участники"
    _apply_report_title(
        participants_sheet,
        title="Отчет по участникам корпоративного волонтерства",
        title_columns=len(PARTICIPANT_XLSX_HEADERS),
    )
    participants_sheet.append(PARTICIPANT_XLSX_HEADERS)
    for row in participants:
        participants_sheet.append(_participant_row_values(row))
    _style_table_sheet(
        participants_sheet,
        header_row=3,
        data_start_row=4,
        data_columns=len(PARTICIPANT_XLSX_HEADERS),
        column_widths=PARTICIPANT_COLUMN_WIDTHS,
    )

    analytics_sheet = workbook.create_sheet("Аналитика")
    _apply_report_title(
        analytics_sheet,
        title="Сводная аналитика платформы",
        title_columns=len(ANALYTICS_COLUMN_WIDTHS),
    )
    analytics_sheet.append(ANALYTICS_XLSX_HEADERS)
    for metric, value in analytics.model_dump().items():
        analytics_sheet.append([ANALYTICS_LABELS.get(metric, metric), _export_value(value)])
    _style_table_sheet(
        analytics_sheet,
        header_row=3,
        data_start_row=4,
        data_columns=len(ANALYTICS_XLSX_HEADERS),
        column_widths=ANALYTICS_COLUMN_WIDTHS,
    )

    return _workbook_to_bytes(workbook)


def _workbook_to_bytes(workbook: Workbook) -> bytes:
    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _apply_report_title(worksheet, *, title: str, title_columns: int) -> None:
    generated_at = datetime.now().strftime("%d.%m.%Y %H:%M")

    worksheet.merge_cells(start_row=1, start_column=1, end_row=1, end_column=title_columns)
    worksheet.merge_cells(start_row=2, start_column=1, end_row=2, end_column=title_columns)
    worksheet.sheet_view.showGridLines = False
    worksheet.freeze_panes = "A4"

    service_cell = worksheet.cell(row=1, column=1)
    service_cell.value = (
        "Сформировано платформой «Помогать просто»\n"
        f"Дата формирования: {generated_at}"
    )
    service_cell.font = Font(name="Times New Roman", size=12, bold=True)
    service_cell.alignment = Alignment(horizontal="right", vertical="center", wrap_text=True)
    service_cell.fill = TITLE_FILL

    title_cell = worksheet.cell(row=2, column=1)
    title_cell.value = title
    title_cell.font = Font(name="Times New Roman", size=14, bold=True)
    title_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    title_cell.fill = TITLE_FILL

    worksheet.row_dimensions[1].height = 54
    worksheet.row_dimensions[2].height = 48
    worksheet.row_dimensions[3].height = 42


def _style_table_sheet(
    worksheet,
    *,
    header_row: int,
    data_start_row: int,
    data_columns: int,
    column_widths: list[int],
) -> None:
    for index, width in enumerate(column_widths, start=1):
        worksheet.column_dimensions[get_column_letter(index)].width = width

    for row in worksheet.iter_rows(
        min_row=header_row,
        max_row=max(worksheet.max_row, header_row),
        min_col=1,
        max_col=data_columns,
    ):
        for cell in row:
            cell.border = THIN_BLACK_BORDER
            cell.font = Font(name="Times New Roman", size=12, bold=cell.row == header_row)
            cell.alignment = Alignment(
                horizontal="center" if cell.row == header_row else "left",
                vertical="center",
                wrap_text=True,
            )
            if cell.row == header_row:
                cell.fill = HEADER_FILL

    for row_number in range(data_start_row, worksheet.max_row + 1):
        worksheet.row_dimensions[row_number].height = 30


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


BRAND_YELLOW = colors.HexColor("#FFE300")
BRAND_BLACK = colors.HexColor("#000000")

FONT_DIR = Path("app/static/fonts")
MONTSERRAT_REGULAR_PATH = FONT_DIR / "Montserrat-Regular.ttf"
MONTSERRAT_BOLD_PATH = FONT_DIR / "Montserrat-Bold.ttf"


def register_montserrat_fonts() -> None:
    if not MONTSERRAT_REGULAR_PATH.exists() or not MONTSERRAT_BOLD_PATH.exists():
        raise RuntimeError(
            "Montserrat fonts are required. Put Montserrat-Regular.ttf and "
            "Montserrat-Bold.ttf into app/static/fonts/"
        )

    registerFont(TTFont("Montserrat", str(MONTSERRAT_REGULAR_PATH)))
    registerFont(TTFont("Montserrat-Bold", str(MONTSERRAT_BOLD_PATH)))
    addMapping("Montserrat", 0, 0, "Montserrat")
    addMapping("Montserrat", 1, 0, "Montserrat-Bold")


async def build_volunteer_year_statistics_pdf(
    session: AsyncSession,
    *,
    volunteer: User,
    year: int,
) -> bytes:
    register_montserrat_fonts()

    result = await session.execute(
        select(
            VolunteerTask.title,
            Fund.name.label("fund_name"),
            VolunteerTask.category,
            VolunteerTask.participation_format,
            VolunteerTask.task_type,
            VolunteerHourLedger.hours,
            VolunteerHourLedger.awarded_at,
        )
        .join(TaskApplication, TaskApplication.id == VolunteerHourLedger.application_id)
        .join(VolunteerTask, VolunteerTask.id == VolunteerHourLedger.task_id)
        .join(Fund, Fund.id == VolunteerTask.fund_id)
        .where(VolunteerHourLedger.volunteer_id == volunteer.id)
        .where(func.extract("year", VolunteerHourLedger.awarded_at) == year)
        .order_by(VolunteerHourLedger.awarded_at.asc())
    )

    rows = result.all()

    total_hours = sum(Decimal(row.hours) for row in rows)
    completed_tasks_count = len(rows)

    months_hours: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    category_counter: Counter[str] = Counter()

    for row in rows:
        months_hours[row.awarded_at.month] += Decimal(row.hours)
        category_counter[str(row.category.value)] += 1

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"volunteer_statistics_{year}",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="MontserratTitle",
            fontName="Montserrat-Bold",
            fontSize=20,
            leading=24,
            textColor=BRAND_BLACK,
            alignment=TA_CENTER,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MontserratHeading",
            fontName="Montserrat-Bold",
            fontSize=13,
            leading=16,
            textColor=BRAND_BLACK,
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MontserratText",
            fontName="Montserrat",
            fontSize=10,
            leading=13,
            textColor=BRAND_BLACK,
        )
    )

    story = []

    story.append(Paragraph("Личная статистика волонтёра", styles["MontserratTitle"]))
    story.append(Paragraph(f"Отчётный год: {year}", styles["MontserratText"]))
    story.append(Spacer(1, 8))

    summary_table = Table(
        [
            ["Волонтёр", volunteer.full_name or volunteer.email],
            ["Email", volunteer.email],
            ["Город", volunteer.city or "Не указан"],
            ["Подразделение", volunteer.department or "Не указано"],
            ["Выполнено заданий", str(completed_tasks_count)],
            ["Начислено часов", str(total_hours)],
        ],
        colWidths=[55 * mm, 105 * mm],
    )
    summary_table.setStyle(_pdf_table_style())
    story.append(summary_table)

    if rows:
        story.append(Paragraph("Часы по месяцам", styles["MontserratHeading"]))
        story.append(_build_month_hours_chart(months_hours))

        story.append(Paragraph("Категории помощи", styles["MontserratHeading"]))
        category_data = [["Категория", "Количество выполненных заданий"]]
        for category, count in category_counter.most_common():
            category_data.append([category, str(count)])

        category_table = Table(category_data, colWidths=[90 * mm, 70 * mm])
        category_table.setStyle(_pdf_table_style())
        story.append(category_table)

        story.append(Paragraph("Выполненные задания", styles["MontserratHeading"]))

        task_table_data = [["Дата", "Задание", "Фонд", "Часы"]]
        for row in rows:
            task_table_data.append(
                [
                    row.awarded_at.strftime("%d.%m.%Y"),
                    row.title,
                    row.fund_name,
                    str(row.hours),
                ]
            )

        task_table = Table(
            task_table_data,
            colWidths=[25 * mm, 65 * mm, 50 * mm, 20 * mm],
            repeatRows=1,
        )
        task_table.setStyle(_pdf_table_style())
        story.append(task_table)
    else:
        story.append(Spacer(1, 10))
        story.append(
            Paragraph(
                "За выбранный год подтверждённых выполнений и начисленных часов пока нет.",
                styles["MontserratText"],
            )
        )

    doc.build(story)
    return buffer.getvalue()


def _pdf_table_style() -> TableStyle:
    return TableStyle(
        [
            ("FONTNAME", (0, 0), (-1, -1), "Montserrat"),
            ("FONTNAME", (0, 0), (-1, 0), "Montserrat-Bold"),
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_YELLOW),
            ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_BLACK),
            ("GRID", (0, 0), (-1, -1), 0.6, BRAND_BLACK),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]
    )


def _build_month_hours_chart(months_hours: dict[int, Decimal]) -> Drawing:
    month_labels = [
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
    ]

    values = [float(months_hours.get(month, Decimal("0"))) for month in range(1, 13)]

    drawing = Drawing(460, 220)

    chart = VerticalBarChart()
    chart.x = 35
    chart.y = 35
    chart.height = 150
    chart.width = 390
    chart.data = [values]
    chart.categoryAxis.categoryNames = month_labels
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(values) + 1 if max(values) > 0 else 1
    chart.valueAxis.valueStep = max(1, int(chart.valueAxis.valueMax / 5))
    chart.bars[0].fillColor = BRAND_YELLOW
    chart.bars[0].strokeColor = BRAND_BLACK
    chart.categoryAxis.labels.fontName = "Montserrat"
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = "Montserrat"
    chart.valueAxis.labels.fontSize = 7

    drawing.add(chart)
    drawing.add(
        String(
            35,
            200,
            "Начисленные волонтёрские часы по месяцам",
            fontName="Montserrat-Bold",
            fontSize=10,
            fillColor=BRAND_BLACK,
        )
    )

    return drawing