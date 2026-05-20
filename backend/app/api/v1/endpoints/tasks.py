from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import (
    DurationType,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
    UserRole,
)
from app.schemas.tasks import (
    TaskCreateRequest,
    TaskFeedSort,
    TaskResponse,
    TaskUpdateRequest,
)
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
    get_published_task_for_volunteer,
    list_fund_tasks,
    list_published_tasks,
    submit_task_for_review,
    update_task,
)

router = APIRouter()

PageLimit = Annotated[int, Query(ge=1, le=100)]
PageOffset = Annotated[int, Query(ge=0)]


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "tasks"}


@router.get("/feed", response_model=list[TaskResponse])
async def list_task_feed(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.VOLUNTEER)),
    city: str | None = Query(default=None, min_length=1, max_length=120),
    category: HelpCategory | None = Query(default=None, alias="category"),
    participation_format: ParticipationFormat | None = Query(default=None, alias="format"),
    duration_type: DurationType | None = Query(default=None, alias="duration"),
    task_type: TaskType | None = Query(default=None, alias="type"),
    fund_id: UUID | None = None,
    search: str | None = Query(default=None, min_length=2, max_length=200),
    required_skill: str | None = Query(default=None, min_length=1, max_length=80),
    available_only: bool = Query(default=True),
    sort: TaskFeedSort = TaskFeedSort.PUBLISHED_AT_DESC,
    limit: PageLimit = 50,
    offset: PageOffset = 0,
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


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_card(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_roles(UserRole.VOLUNTEER)),
) -> TaskResponse:
    try:
        task = await get_published_task_for_volunteer(session, task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="task not found",
        ) from exc
    return TaskResponse.model_validate(task)
