from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import TaskStatus, UserRole
from app.schemas.tasks import TaskCreateRequest, TaskResponse, TaskUpdateRequest
from app.services.fund_service import FundNotFoundError
from app.services.task_service import (
    FundNotApprovedError,
    InvalidTaskDataError,
    InvalidTaskStatusTransitionError,
    TaskEditNotAllowedError,
    TaskNotFoundError,
    close_task,
    create_task,
    get_fund_task,
    list_fund_tasks,
    submit_task_for_review,
    update_task,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "tasks"}


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_my_task(
    payload: TaskCreateRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await create_task(session, current_user=current_user, payload=payload)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except FundNotApprovedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="fund is not approved",
        ) from exc
    except InvalidTaskDataError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return TaskResponse.model_validate(task)


@router.get("/my", response_model=list[TaskResponse])
async def list_my_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[TaskResponse]:
    try:
        tasks = await list_fund_tasks(session, current_user=current_user, status=status_filter)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/my/{task_id}", response_model=TaskResponse)
async def get_my_task(
    task_id: UUID,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await get_fund_task(session, current_user=current_user, task_id=task_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    return TaskResponse.model_validate(task)


@router.patch("/my/{task_id}", response_model=TaskResponse)
async def update_my_task(
    task_id: UUID,
    payload: TaskUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await update_task(
            session,
            current_user=current_user,
            task_id=task_id,
            payload=payload,
        )
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    except TaskEditNotAllowedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task cannot be edited in current status",
        ) from exc
    except InvalidTaskDataError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return TaskResponse.model_validate(task)


@router.post("/my/{task_id}/submit", response_model=TaskResponse)
async def submit_my_task(
    task_id: UUID,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await submit_task_for_review(session, current_user=current_user, task_id=task_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except FundNotApprovedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="fund is not approved",
        ) from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    except InvalidTaskDataError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except InvalidTaskStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid task status transition",
        ) from exc
    return TaskResponse.model_validate(task)


@router.post("/my/{task_id}/close", response_model=TaskResponse)
async def close_my_task(
    task_id: UUID,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await close_task(session, current_user=current_user, task_id=task_id)
    except FundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="fund not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found") from exc
    except InvalidTaskStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid task status transition",
        ) from exc
    return TaskResponse.model_validate(task)
