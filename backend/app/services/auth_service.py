from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.domain import Fund, StolotoEmployee, User
from app.models.enums import FundStatus, UserRole
from app.schemas.auth import FundRegisterRequest, VolunteerRegisterRequest


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
    normalized_email = email.strip().lower()
    return await session.scalar(select(User).where(User.email == normalized_email))


async def get_user_by_login(session: AsyncSession, login: str) -> User | None:
    login_value = login.strip()
    if not login_value:
        return None

    email_candidate = login_value.lower()
    return await session.scalar(
        select(User).where(
            or_(User.email == email_candidate, User.username == login_value),
        )
    )


async def get_user_by_employee_id(session: AsyncSession, employee_id: str) -> User | None:
    return await session.scalar(select(User).where(User.employee_id == employee_id))


async def get_stoloto_employee_by_email(
    session: AsyncSession,
    *,
    email: str,
) -> StolotoEmployee | None:
    normalized_email = email.strip().lower()
    return await session.scalar(
        select(StolotoEmployee).where(StolotoEmployee.email == normalized_email),
    )


async def register_volunteer(session: AsyncSession, payload: VolunteerRegisterRequest) -> User:
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError

    employee = await get_stoloto_employee_by_email(session, email=payload.email)
    if employee is None or not employee.is_active:
        raise StolotoEmployeeNotFoundError

    employee_id = payload.employee_id or employee.employee_id
    if payload.employee_id and payload.employee_id != employee.employee_id:
        raise StolotoEmployeeNotFoundError

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
        is_active=True,
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
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    return user


def issue_user_token(user: User) -> str:
    return create_access_token(str(user.id), {"role": user.role.value})


def issue_user_refresh_token(user: User) -> str:
    return create_refresh_token(str(user.id), {"role": user.role.value})
