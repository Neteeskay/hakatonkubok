from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.domain import Fund, StolotoEmployee, User
from app.models.enums import FundStatus, UserRole
from app.schemas.auth import FundRegisterRequest, VolunteerRegisterRequest, LoginRequest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class DuplicateEmailError(Exception):
    pass


class DuplicateEmployeeIdError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class StolotoEmployeeNotFoundError(Exception):
    pass


class AuthError(Exception):
    pass


class DuplicateEmailError(AuthError):
    pass


class DuplicateEmployeeIdError(AuthError):
    pass


class StolotoEmployeeNotFoundError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_login(session: AsyncSession, login: str) -> User | None:
    result = await session.execute(
        select(User).where(or_(User.email == login, User.username == login))
    )
    return result.scalar_one_or_none()


async def get_user_by_employee_id(session: AsyncSession, employee_id: str) -> User | None:
    result = await session.execute(select(User).where(User.employee_id == employee_id))
    return result.scalar_one_or_none()


async def get_stoloto_employee_by_email(
    session: AsyncSession,
    *,
    email: str,
) -> StolotoEmployee | None:
    result = await session.execute(select(StolotoEmployee).where(StolotoEmployee.email == email))
    return result.scalar_one_or_none()


async def register_volunteer(session: AsyncSession, payload: VolunteerRegisterRequest) -> User:
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError

    employee = await get_stoloto_employee_by_email(
        session,
        email=payload.email,
    )
    if not employee or not employee.is_active:
        raise StolotoEmployeeNotFoundError
    if payload.employee_id and payload.employee_id != employee.employee_id:
        raise StolotoEmployeeNotFoundError

    employee_id = payload.employee_id or employee.employee_id
    if await get_user_by_employee_id(session, employee_id):
        raise DuplicateEmployeeIdError

    user = User(
        role=UserRole.VOLUNTEER,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name or employee.full_name,
        city=payload.city or employee.city,
        phone=payload.phone,
        employee_id=employee_id,
        department=payload.department or employee.department,
        position=payload.position or employee.position,
        interests=payload.interests,
        skills=payload.skills,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def register_fund(session: AsyncSession, payload: FundRegisterRequest) -> tuple[User, Fund]:
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError

    user = User(
        role=UserRole.FUND,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.representative_full_name,
        phone=payload.representative_phone,
    )
    session.add(user)
    await session.flush()

    fund = Fund(
        representative_user_id=user.id,
        name=payload.name,
        description=payload.description,
        help_categories=payload.help_categories,
        inn=payload.inn,
        ogrn=payload.ogrn,
        region=payload.region,
        website_url=payload.website_url,
        contact_person=payload.contact_person or payload.representative_full_name,
        contact_position=payload.contact_position,
        contact_email=payload.contact_email or payload.email,
        contact_phone=payload.contact_phone or payload.representative_phone,
        planned_help=payload.planned_help,
        status=FundStatus.PENDING_REVIEW,
    )
    session.add(fund)
    await session.commit()
    await session.refresh(user)
    await session.refresh(fund)
    return user, fund


async def authenticate_user(session: AsyncSession, login: str, password: str) -> User:
    user = await get_user_by_login(session, login)
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    return user


def issue_user_token(user: User) -> str:
    return create_access_token(str(user.id), {"role": user.role.value})


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return password_context.verify(plain_password, password_hash)


async def register_volunteer(
    session: AsyncSession,
    payload: VolunteerRegisterRequest,
) -> User:
    normalized_email = normalize_email(payload.email)

    existing_user_by_email = await session.scalar(
        select(User).where(User.email == normalized_email)
    )

    if existing_user_by_email is not None:
        raise DuplicateEmailError()

    employee = await session.scalar(
        select(StolotoEmployee).where(
            StolotoEmployee.email == normalized_email,
            StolotoEmployee.is_active.is_(True),
        )
    )

    if employee is None:
        raise StolotoEmployeeNotFoundError()

    if payload.employee_id:
        existing_user_by_employee_id = await session.scalar(
            select(User).where(User.employee_id == payload.employee_id)
        )

        if existing_user_by_employee_id is not None:
            raise DuplicateEmployeeIdError()

    user = User(
        role=UserRole.VOLUNTEER,
        username=getattr(payload, "username", None),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name or employee.full_name,
        city=payload.city or employee.city,
        phone=getattr(payload, "phone", None),
        employee_id=payload.employee_id or employee.employee_id,
        department=payload.department or employee.department,
        position=payload.position or employee.position,
        interests=getattr(payload, "interests", None),
        skills=getattr(payload, "skills", None),
        is_active=True,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


async def register_fund(
    session: AsyncSession,
    payload: FundRegisterRequest,
) -> tuple[User, Fund]:
    normalized_email = normalize_email(payload.email)

    existing_user = await session.scalar(
        select(User).where(User.email == normalized_email)
    )

    if existing_user is not None:
        raise DuplicateEmailError()

    user = User(
        role=UserRole.FUND,
        username=getattr(payload, "username", None),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=payload.contact_person,
        phone=payload.contact_phone,
        is_active=True,
    )

    session.add(user)
    await session.flush()

    fund = Fund(
        representative_user_id=user.id,
        name=payload.name,
        description=payload.description,
        help_categories=payload.help_categories,
        inn=payload.inn,
        ogrn=payload.ogrn,
        region=payload.region,
        website_url=payload.website_url,
        contact_person=payload.contact_person,
        contact_position=payload.contact_position,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        planned_help=payload.planned_help,
        status=FundStatus.PENDING_REVIEW,
    )

    session.add(fund)
    await session.commit()
    await session.refresh(user)
    await session.refresh(fund)

    return user, fund


async def authenticate_user(
    session: AsyncSession,
    login: str,
    password: str,
) -> User:
    normalized_login = login.strip().lower()

    user = await session.scalar(
        select(User).where(
            or_(
                User.email == normalized_login,
                User.username == login,
            )
        )
    )

    if user is None:
        raise InvalidCredentialsError()

    if not user.is_active:
        raise InvalidCredentialsError()

    if not verify_password(password, user.password_hash):
        raise InvalidCredentialsError()

    return user


def issue_user_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=60 * 24)

    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256",
    )