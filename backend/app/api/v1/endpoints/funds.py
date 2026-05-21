from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import DurationType, HelpCategory, ParticipationFormat, TaskType, UserRole
from app.schemas.funds import (
    FundDashboardSummary,
    FundDocumentVisibilityRequest,
    FundDocumentResponse,
    FundMediaUploadResponse,
    FundReportHoursByMonthResponse,
    FundReportParticipantRow,
    FundReportSummaryResponse,
    PublicFundListItemResponse,
    PublicFundProfileResponse,
    FundProfileResponse,
    FundUpdateRequest,
)
from app.services.fund_service import (
    EmptyFundDocumentError,
    FundNotFoundError,
    add_fund_document,
    get_fund_dashboard_summary,
    get_fund_by_id,
    FundDocumentNotFoundError,
    update_fund_document_visibility,
    upload_fund_logo,
    get_fund_by_representative,
    get_public_fund_by_id,
    get_public_fund_stats,
    list_public_funds,
    update_fund_profile,
    upload_fund_cover,
)
from app.services.fund_report_service import (
    build_fund_hours_csv,
    build_fund_hours_xlsx,
    build_fund_participants_csv,
    build_fund_participants_xlsx,
    get_fund_report_hours_by_month,
    get_fund_report_participants,
    get_fund_report_summary,
)
from app.schemas.tasks import TaskFeedSort, TaskResponse
from app.services.task_service import list_published_tasks
from app.schemas.notifications import NotificationReadCount, NotificationResponse
from app.services.notification_service import (
    NotificationNotFoundError,
    list_user_notifications,
    mark_all_user_notifications_read,
    mark_notification_read,
)


router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "funds"}

@router.get("", response_model=list[PublicFundListItemResponse])
async def list_approved_funds(
    search: str | None = Query(default=None, min_length=2),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[PublicFundListItemResponse]:
    funds = await list_public_funds(
        session,
        search=search,
        limit=limit,
        offset=offset,
    )

    result: list[PublicFundListItemResponse] = []

    for fund in funds:
        active_tasks, awarded_hours_total, _ = await get_public_fund_stats(session, fund.id)

        result.append(
            PublicFundListItemResponse(
                id=fund.id,
                name=fund.name,
                logo_url=fund.logo_url,
                description=fund.description,
                help_categories=fund.help_categories,
                region=fund.region,
                website_url=fund.website_url,
                cover_url=fund.cover_url,
                socials=fund.socials,
                vk_url=fund.vk_url,
                max_url=fund.max_url,
                active_tasks=active_tasks,
                awarded_hours_total=awarded_hours_total,
            )
        )

    return result


@router.get("/me", response_model=FundProfileResponse)
async def my_fund_profile(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_representative(session, current_user)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.patch("/me", response_model=FundProfileResponse)
async def update_my_fund_profile(
    payload: FundUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await update_fund_profile(session, current_user=current_user, payload=payload)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.get("/me/notifications", response_model=list[NotificationResponse])
async def get_my_fund_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[NotificationResponse]:
    notifications = await list_user_notifications(
        session,
        current_user,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    return [NotificationResponse.model_validate(notification) for notification in notifications]


@router.patch("/me/notifications/read-all", response_model=NotificationReadCount)
async def mark_all_my_fund_notifications_read(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> NotificationReadCount:
    updated_count = await mark_all_user_notifications_read(session, current_user)
    return NotificationReadCount(updated_count=updated_count)


@router.patch("/me/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_my_fund_notification_read(
    notification_id: UUID,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> NotificationResponse:
    try:
        notification = await mark_notification_read(session, current_user, notification_id)
    except NotificationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="notification not found") from exc
    return NotificationResponse.model_validate(notification)


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


@router.patch("/me/documents/{document_id}/visibility", response_model=FundDocumentResponse)
async def update_my_fund_document_visibility(
    document_id: UUID,
    payload: FundDocumentVisibilityRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundDocumentResponse:
    try:
        document = await update_fund_document_visibility(
            session,
            current_user=current_user,
            document_id=document_id,
            is_public=payload.is_public,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except FundDocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document not found") from exc

    return FundDocumentResponse.model_validate(document)


@router.post("/me/cover", response_model=FundMediaUploadResponse)
async def upload_my_fund_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundMediaUploadResponse:
    try:
        file_url = await upload_fund_cover(
            session,
            current_user=current_user,
            file=file,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except EmptyFundDocumentError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="empty file") from exc

    return FundMediaUploadResponse(file_url=file_url)


@router.post("/me/logo", response_model=FundMediaUploadResponse)
async def upload_my_fund_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundMediaUploadResponse:
    try:
        file_url = await upload_fund_logo(
            session,
            current_user=current_user,
            file=file,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except EmptyFundDocumentError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="empty file") from exc

    return FundMediaUploadResponse(file_url=file_url)


@router.get("/me/dashboard", response_model=FundDashboardSummary)
async def get_my_fund_dashboard(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundDashboardSummary:
    try:
        return await get_fund_dashboard_summary(session, current_user)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    

@router.get("/me/reports/summary", response_model=FundReportSummaryResponse)
async def get_my_fund_report_summary(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> FundReportSummaryResponse:
    try:
        report = await get_fund_report_summary(session, current_user)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    return FundReportSummaryResponse.model_validate(report)


@router.get("/me/reports/participants", response_model=list[FundReportParticipantRow])
async def get_my_fund_report_participants(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[FundReportParticipantRow]:
    try:
        rows = await get_fund_report_participants(
            session,
            current_user,
            limit=limit,
            offset=offset,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    return [FundReportParticipantRow.model_validate(row) for row in rows]


@router.get("/me/reports/hours", response_model=list[FundReportHoursByMonthResponse])
async def get_my_fund_report_hours(
    months: int = Query(default=12, ge=1, le=36),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[FundReportHoursByMonthResponse]:
    try:
        rows = await get_fund_report_hours_by_month(
            session,
            current_user,
            months=months,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    return [FundReportHoursByMonthResponse.model_validate(row) for row in rows]


@router.get("/me/reports/participants.csv")
async def export_my_fund_participants_csv(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        rows = await get_fund_report_participants(
            session,
            current_user,
            limit=10000,
            offset=0,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    content = build_fund_participants_csv(rows)

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="fund_participants.csv"'},
    )


@router.get("/me/reports/participants.xlsx")
async def export_my_fund_participants_xlsx(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        rows = await get_fund_report_participants(
            session,
            current_user,
            limit=10000,
            offset=0,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    content = build_fund_participants_xlsx(rows)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="fund_participants.xlsx"'},
    )


@router.get("/me/reports/hours.csv")
async def export_my_fund_hours_csv(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        rows = await get_fund_report_hours_by_month(
            session,
            current_user,
            months=120,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    content = build_fund_hours_csv(rows)

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="fund_hours.csv"'},
    )


@router.get("/me/reports/hours.xlsx")
async def export_my_fund_hours_xlsx(
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        rows = await get_fund_report_hours_by_month(
            session,
            current_user,
            months=120,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    content = build_fund_hours_xlsx(rows)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="fund_hours.xlsx"'},
    )


@router.get("/{fund_id}/public", response_model=PublicFundProfileResponse)
async def get_public_fund_profile(
    fund_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> PublicFundProfileResponse:
    try:
        fund = await get_public_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc

    active_tasks, awarded_hours_total, volunteers_total = await get_public_fund_stats(
        session,
        fund.id,
    )

    return PublicFundProfileResponse(
        id=fund.id,
        name=fund.name,
        description=fund.description,
        logo_url=fund.logo_url,
        help_categories=fund.help_categories,
        region=fund.region,
        website_url=fund.website_url,
        cover_url=fund.cover_url,
        socials=fund.socials,
        vk_url=fund.vk_url,
        max_url=fund.max_url,
        planned_help=fund.planned_help,
        contact_person=fund.contact_person,
        contact_email=fund.contact_email,
        documents=[
            FundDocumentResponse.model_validate(document)
            for document in fund.documents
        ],
        active_tasks=active_tasks,
        awarded_hours_total=awarded_hours_total,
        volunteers_total=volunteers_total,
        created_at=fund.created_at,
    )


@router.get("/{fund_id}/tasks", response_model=list[TaskResponse])
async def list_public_fund_tasks(
    fund_id: UUID,
    city: str | None = Query(default=None),
    category: HelpCategory | None = None,
    participation_format: ParticipationFormat | None = None,
    duration_type: DurationType | None = None,
    task_type: TaskType | None = None,
    search: str | None = Query(default=None, min_length=2),
    required_skill: str | None = Query(default=None),
    available_only: bool = True,
    sort: TaskFeedSort = TaskFeedSort.PUBLISHED_AT_DESC,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[TaskResponse]:
    tasks = await list_published_tasks(
        session,
        city=city,
        category=category,
        participation_format=participation_format,
        duration_type=duration_type,
        task_type=task_type,
        fund_id=fund_id,
        search=search,
        required_skill=required_skill,
        available_only=available_only,
        sort=sort,
        limit=limit,
        offset=offset,
    )

    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/{fund_id}", response_model=FundProfileResponse)
async def get_fund_profile(
    fund_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.VOLUNTEER, UserRole.FUND, UserRole.ADMIN)),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)
