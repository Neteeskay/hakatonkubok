from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.auth import (
    FundRegisterRequest,
    FundRegisterResponse,
    LoginRequest,
    TokenResponse,
    VolunteerRegisterRequest,
    VolunteerRegisterResponse,
)
from app.services.auth_service import (
    DuplicateEmployeeIdError,
    DuplicateEmailError,
    InvalidCredentialsError,
    authenticate_user,
    issue_user_token,
    register_fund,
    register_volunteer,
)

router = APIRouter()


@router.get("/ping")
async def ping() -> dict[str, str]:
    return {"module": "auth"}


@router.post(
    "/register/volunteer",
    response_model=VolunteerRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_volunteer(
    payload: VolunteerRegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> VolunteerRegisterResponse:
    try:
        user = await register_volunteer(session, payload)
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already exists") from exc
    except DuplicateEmployeeIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="employee_id already exists",
        ) from exc
    return VolunteerRegisterResponse(user=user)


@router.post(
    "/register/fund",
    response_model=FundRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_fund(
    payload: FundRegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> FundRegisterResponse:
    try:
        user, fund = await register_fund(session, payload)
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already exists") from exc
    return FundRegisterResponse(user=user, fund=fund)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        user = await authenticate_user(session, payload.email, payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid email or password",
        ) from exc
    return TokenResponse(access_token=issue_user_token(user), user=user)
