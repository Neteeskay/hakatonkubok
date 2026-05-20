from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import FundStatus, TaskStatus, UserRole
from app.schemas.funds import FundModerationRequest, FundProfileResponse
from app.schemas.tasks import TaskModerationRequest, TaskResponse
from app.services.fund_service import (
    FundModerationCommentRequiredError,
    FundNotFoundError,
    InvalidFundStatusTransitionError,
    get_fund_by_id,
    list_funds,
    moderate_fund,
)
from app.services.task_service import (
    InvalidTaskStatusTransitionError,
    TaskModerationCommentRequiredError,
    TaskNotFoundError,
    get_task_by_id,
    list_tasks_for_admin,
    moderate_task,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "admin"}


@router.get("/funds", response_model=list[FundProfileResponse])
async def admin_list_funds(
    status_filter: FundStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> list[FundProfileResponse]:
    funds = await list_funds(session, status=status_filter)
    return [FundProfileResponse.model_validate(fund) for fund in funds]


@router.get("/funds/{fund_id}", response_model=FundProfileResponse)
async def admin_get_fund(
    fund_id: UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await get_fund_by_id(session, fund_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return FundProfileResponse.model_validate(fund)


@router.patch("/funds/{fund_id}/moderation", response_model=FundProfileResponse)
async def admin_moderate_fund(
    fund_id: UUID,
    payload: FundModerationRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> FundProfileResponse:
    try:
        fund = await moderate_fund(
            session,
            fund_id=fund_id,
            target_status=payload.status,
            moderation_comment=payload.moderation_comment,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except FundModerationCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="moderation_comment is required",
        ) from exc
    except InvalidFundStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid fund status transition",
        ) from exc
    return FundProfileResponse.model_validate(fund)


@router.get("/tasks", response_model=list[TaskResponse])
async def admin_list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> list[TaskResponse]:
    tasks = await list_tasks_for_admin(session, status=status_filter)
    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def admin_get_task(
    task_id: UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await get_task_by_id(session, task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}/moderation", response_model=TaskResponse)
async def admin_moderate_task(
    task_id: UUID,
    payload: TaskModerationRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await moderate_task(
            session,
            task_id=task_id,
            target_status=payload.status,
            moderation_comment=payload.moderation_comment,
        )
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    except TaskModerationCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="moderation_comment is required",
        ) from exc
    except InvalidTaskStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid task status transition",
        ) from exc
    return TaskResponse.model_validate(task)
