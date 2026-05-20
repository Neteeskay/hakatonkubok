from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.domain import Fund, MockEmployee, User
from app.models.enums import FundStatus, UserRole
from app.schemas.auth import AdminRegisterRequest, FundRegisterRequest, VolunteerRegisterRequest


class AuthError(Exception):
    pass


class DuplicateEmailError(AuthError):
    pass


class DuplicateEmployeeIdError(AuthError):
    pass


class EmployeeVerificationError(AuthError):
    pass


class InvalidInviteCodeError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_employee_id(session: AsyncSession, employee_id: str) -> User | None:
    result = await session.execute(select(User).where(User.employee_id == employee_id))
    return result.scalar_one_or_none()


async def get_mock_employee(
    session: AsyncSession,
    *,
    email: str,
    employee_id: str | None,
) -> MockEmployee | None:
    if employee_id:
        result = await session.execute(
            select(MockEmployee).where(MockEmployee.employee_id == employee_id)
        )
        employee = result.scalar_one_or_none()
        if employee and employee.email != email:
            raise EmployeeVerificationError
        return employee

    result = await session.execute(select(MockEmployee).where(MockEmployee.email == email))
    return result.scalar_one_or_none()


async def register_volunteer(session: AsyncSession, payload: VolunteerRegisterRequest) -> User:
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError

    employee = await get_mock_employee(
        session,
        email=payload.email,
        employee_id=payload.employee_id,
    )
    if not employee or not employee.is_active:
        raise EmployeeVerificationError

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


async def register_admin(session: AsyncSession, payload: AdminRegisterRequest) -> User:
    if payload.invite_code != settings.admin_registration_code:
        raise InvalidInviteCodeError
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError

    user = User(
        role=UserRole.ADMIN,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    return user


def issue_user_token(user: User) -> str:
    return create_access_token(str(user.id), {"role": user.role.value})
