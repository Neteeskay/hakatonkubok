from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.core.deps import get_current_user
from app.db.session import get_session
from app.models.domain import User
from app.schemas.auth import (
    FundRegisterRequest,
    FundRegisterResponse,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
    VolunteerRegisterRequest,
    VolunteerRegisterResponse,
)
from app.services.auth_service import (
    DuplicateEmployeeIdError,
    DuplicateEmailError,
    InvalidCredentialsError,
    StolotoEmployeeNotFoundError,
    authenticate_user,
    issue_user_refresh_token,
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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="email already exists"
        ) from exc
    except DuplicateEmployeeIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="employee_id already exists",
        ) from exc
    except StolotoEmployeeNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="user is not exists in database",
        ) from exc
    return VolunteerRegisterResponse(
        access_token=issue_user_token(user),
        refresh_token=issue_user_refresh_token(user),
        user=user,
    )


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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="email already exists"
        ) from exc
    return FundRegisterResponse(
        access_token=issue_user_token(user),
        refresh_token=issue_user_refresh_token(user),
        user=user,
        fund=fund,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        user = await authenticate_user(session, payload.login, payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid email or password",
        ) from exc
    return TokenResponse(
        access_token=issue_user_token(user),
        refresh_token=issue_user_refresh_token(user),
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        token_payload = decode_access_token(payload.refresh_token)
        if token_payload.get("typ") != "refresh":
            raise ValueError("not a refresh token")
        user_id = UUID(str(token_payload.get("sub")))
    except (JWTError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = await session.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=issue_user_token(user),
        refresh_token=issue_user_refresh_token(user),
        user=user,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    _: LogoutRequest,
    current_user: User = Depends(get_current_user),
) -> None:
    return None


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
