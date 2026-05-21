from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_session
from app.models.domain import User
from app.models.enums import ApplicationStatus, UserRole
from app.schemas.applications import (
    ApplicationCompletionConfirmRequest,
    ApplicationCreateRequest,
    ApplicationDecisionRequest,
    ApplicationRejectRequest,
    ApplicationResponse,
    TaskCompletionsConfirmRequest,
)
from app.services.application_service import (
    AlreadyAppliedError,
    ApplicationAccessDeniedError,
    ApplicationNotFoundError,
    FundCommentRequiredError,
    InvalidApplicationStatusTransitionError,
    ParticipantLimitReachedError,
    TaskNotClosedError,
    TaskNotFoundError,
    clarify_application,
    TaskNotOpenForApplicationsError,
    TaskNotPublishedError,
    accept_application,
    cancel_my_application,
    confirm_all_accepted_completions_for_task,
    confirm_application_completion,
    create_application,
    get_fund_application,
    list_fund_applications,
    list_my_applications,
    reject_application,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "applications"}


@router.post(
    "/tasks/{task_id}",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_task(
    task_id: UUID,
    payload: ApplicationCreateRequest,
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await create_application(
            session,
            current_user=current_user,
            task_id=task_id,
            volunteer_comment=payload.volunteer_comment,
        )
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="task not found",
        ) from exc
    except TaskNotPublishedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task is not published",
        ) from exc
    except TaskNotOpenForApplicationsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task is not open for applications",
        ) from exc
    except AlreadyAppliedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="volunteer already applied to this task",
        ) from exc
    except ParticipantLimitReachedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="participant limit reached",
        ) from exc

    return ApplicationResponse.model_validate(application)


@router.get("/my", response_model=list[ApplicationResponse])
async def get_my_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> list[ApplicationResponse]:
    applications = await list_my_applications(
        session,
        current_user=current_user,
        status=status_filter,
    )

    return [ApplicationResponse.model_validate(application) for application in applications]


@router.post("/my/{application_id}/cancel", response_model=ApplicationResponse)
async def cancel_application(
    application_id: UUID,
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await cancel_my_application(
            session,
            current_user=current_user,
            application_id=application_id,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="application not found",
        ) from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="application does not belong to current volunteer",
        ) from exc
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="application cannot be canceled in current status",
        ) from exc

    return ApplicationResponse.model_validate(application)


@router.get("/fund", response_model=list[ApplicationResponse])
async def get_fund_applications(
    task_id: UUID | None = Query(default=None),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[ApplicationResponse]:
    applications = await list_fund_applications(
        session,
        current_user=current_user,
        task_id=task_id,
        status=status_filter,
    )

    return [ApplicationResponse.model_validate(application) for application in applications]


@router.get("/fund/{application_id}", response_model=ApplicationResponse)
async def get_fund_application_detail(
    application_id: UUID,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await get_fund_application(
            session,
            current_user=current_user,
            application_id=application_id,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="application not found",
        ) from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="application does not belong to current fund",
        ) from exc

    return ApplicationResponse.model_validate(application)


@router.post("/fund/{application_id}/accept", response_model=ApplicationResponse)
async def accept_fund_application(
    application_id: UUID,
    payload: ApplicationDecisionRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await accept_application(
            session,
            current_user=current_user,
            application_id=application_id,
            fund_comment=payload.fund_comment,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="application not found",
        ) from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="application does not belong to current fund",
        ) from exc
    except ParticipantLimitReachedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="participant limit reached",
        ) from exc
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="application cannot be accepted in current status",
        ) from exc
    except TaskNotOpenForApplicationsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task is not open for accepting applications",
        ) from exc

    return ApplicationResponse.model_validate(application)


@router.post("/fund/{application_id}/reject", response_model=ApplicationResponse)
async def reject_fund_application(
    application_id: UUID,
    payload: ApplicationRejectRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await reject_application(
            session,
            current_user=current_user,
            application_id=application_id,
            fund_comment=payload.fund_comment,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="application not found",
        ) from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="application does not belong to current fund",
        ) from exc
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="application cannot be rejected in current status",
        ) from exc
    except FundCommentRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="fund_comment is required when rejecting an application",
        ) from exc
    except TaskNotOpenForApplicationsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task is not open for reviewing applications",
        ) from exc

    return ApplicationResponse.model_validate(application)

@router.post("/{application_id}/clarify", response_model=ApplicationResponse)
async def clarify_task_application(
    application_id: UUID,
    payload: ApplicationRejectRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await clarify_application(
            session,
            current_user=current_user,
            application_id=application_id,
            fund_comment=payload.fund_comment,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="application not found") from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="access denied") from exc
    except FundCommentRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="fund_comment is required") from exc
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="invalid application status transition") from exc
    except TaskNotOpenForApplicationsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="task is not open for applications") from exc

    return ApplicationResponse.model_validate(application)


@router.post(
    "/fund/tasks/{task_id}/confirm-completions",
    response_model=list[ApplicationResponse],
)
async def confirm_all_fund_task_completions(
    task_id: UUID,
    payload: TaskCompletionsConfirmRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> list[ApplicationResponse]:
    try:
        applications = await confirm_all_accepted_completions_for_task(
            session,
            current_user=current_user,
            task_id=task_id,
            completion_comment=payload.completion_comment,
        )
    except TaskNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="task not found",
        ) from exc
    except TaskNotClosedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task must be closed before confirming volunteer completions",
        ) from exc

    return [ApplicationResponse.model_validate(application) for application in applications]


@router.post(
    "/fund/{application_id}/confirm-completion",
    response_model=ApplicationResponse,
)
async def confirm_fund_application_completion(
    application_id: UUID,
    payload: ApplicationCompletionConfirmRequest,
    current_user: User = Depends(require_roles(UserRole.FUND)),
    session: AsyncSession = Depends(get_session),
) -> ApplicationResponse:
    try:
        application = await confirm_application_completion(
            session,
            current_user=current_user,
            application_id=application_id,
            completion_comment=payload.completion_comment,
        )
    except ApplicationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="application not found",
        ) from exc
    except ApplicationAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="application does not belong to current fund",
        ) from exc
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="completion can be confirmed only for accepted application",
        ) from exc
    except TaskNotClosedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="task must be closed before confirming volunteer completion",
        ) from exc

    return ApplicationResponse.model_validate(application)
