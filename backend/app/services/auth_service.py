from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.domain import Fund, User
from app.models.enums import FundStatus, UserRole
from app.schemas.auth import FundRegisterRequest, VolunteerRegisterRequest


class AuthError(Exception):
    pass


class DuplicateEmailError(AuthError):
    pass


class DuplicateEmployeeIdError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_employee_id(session: AsyncSession, employee_id: str) -> User | None:
    result = await session.execute(select(User).where(User.employee_id == employee_id))
    return result.scalar_one_or_none()


async def register_volunteer(session: AsyncSession, payload: VolunteerRegisterRequest) -> User:
    if await get_user_by_email(session, payload.email):
        raise DuplicateEmailError
    if payload.employee_id and await get_user_by_employee_id(session, payload.employee_id):
        raise DuplicateEmployeeIdError

    user = User(
        role=UserRole.VOLUNTEER,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        city=payload.city,
        phone=payload.phone,
        employee_id=payload.employee_id,
        department=payload.department,
        position=payload.position,
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


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    return user


def issue_user_token(user: User) -> str:
    return create_access_token(str(user.id), {"role": user.role.value})
