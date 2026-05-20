from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import FundStatus, UserRole
from app.schemas.auth import VolunteerRegisterRequest
from app.services import auth_service
from app.services.auth_service import (
    DuplicateEmailError,
    DuplicateEmployeeIdError,
    StolotoEmployeeNotFoundError,
)


def make_user(role: UserRole = UserRole.VOLUNTEER) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=role,
        username="admin" if role == UserRole.ADMIN else None,
        email="user@example.com",
        full_name="Test User",
        city="Nizhny Novgorod",
        employee_id="EMP-1" if role == UserRole.VOLUNTEER else None,
        department="IT" if role == UserRole.VOLUNTEER else None,
        position="Developer" if role == UserRole.VOLUNTEER else None,
        created_at=datetime.now(UTC),
    )


def make_fund() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        name="Test Fund",
        status=FundStatus.PENDING_REVIEW,
        moderation_comment=None,
        created_at=datetime.now(UTC),
    )


class FakeSession:
    def __init__(self) -> None:
        self.added: object | None = None

    def add(self, instance: object) -> None:
        self.added = instance

    async def commit(self) -> None:
        pass

    async def refresh(self, instance: object) -> None:
        pass


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_volunteer(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_register_volunteer(session: object, payload: object) -> SimpleNamespace:
        assert payload.email == "volunteer@example.com"
        assert payload.employee_id == "EMP-42"
        user = make_user(UserRole.VOLUNTEER)
        user.email = payload.email
        user.employee_id = payload.employee_id
        return user

    monkeypatch.setattr(auth_endpoint, "register_volunteer", fake_register_volunteer)

    response = await client.post(
        "/api/v1/auth/register/volunteer",
        json={
            "email": "Volunteer@Example.com",
            "password": "password123",
            "full_name": "Ivan Petrov",
            "city": "Nizhny Novgorod",
            "employee_id": "EMP-42",
            "department": "IT",
            "position": "Developer",
            "interests": ["ecology"],
            "skills": ["python"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "volunteer"
    assert body["user"]["email"] == "volunteer@example.com"
    assert body["user"]["employee_id"] == "EMP-42"


@pytest.mark.asyncio
async def test_register_volunteer_uses_stoloto_employee_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def no_existing_user(session: object, email: str) -> None:
        return None

    async def no_existing_employee_id(session: object, employee_id: str) -> None:
        return None

    async def find_stoloto_employee(session: object, email: str) -> SimpleNamespace:
        assert email == "volunteer@stoloto.local"
        return SimpleNamespace(
            employee_id="EMP-1001",
            email=email,
            full_name="Ivan Petrov",
            city="Nizhny Novgorod",
            department="IT",
            position="Backend developer",
            is_active=True,
        )

    monkeypatch.setattr(auth_service, "get_user_by_email", no_existing_user)
    monkeypatch.setattr(auth_service, "get_user_by_employee_id", no_existing_employee_id)
    monkeypatch.setattr(auth_service, "get_stoloto_employee_by_email", find_stoloto_employee)
    monkeypatch.setattr(auth_service, "hash_password", lambda password: "hash")

    session = FakeSession()
    user = await auth_service.register_volunteer(
        session,
        VolunteerRegisterRequest(
            email="volunteer@stoloto.local",
            password="password123",
            skills=["python"],
        ),
    )

    assert session.added is user
    assert user.email == "volunteer@stoloto.local"
    assert user.employee_id == "EMP-1001"
    assert user.full_name == "Ivan Petrov"


@pytest.mark.asyncio
async def test_register_volunteer_rejects_employee_id_mismatch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def no_existing_user(session: object, email: str) -> None:
        return None

    async def find_stoloto_employee(session: object, email: str) -> SimpleNamespace:
        return SimpleNamespace(
            employee_id="EMP-1001",
            email=email,
            full_name="Ivan Petrov",
            city="Nizhny Novgorod",
            department="IT",
            position="Backend developer",
            is_active=True,
        )

    monkeypatch.setattr(auth_service, "get_user_by_email", no_existing_user)
    monkeypatch.setattr(auth_service, "get_stoloto_employee_by_email", find_stoloto_employee)

    with pytest.raises(StolotoEmployeeNotFoundError):
        await auth_service.register_volunteer(
            FakeSession(),
            VolunteerRegisterRequest(
                email="volunteer@stoloto.local",
                password="password123",
                employee_id="EMP-404",
            ),
        )


@pytest.mark.asyncio
async def test_register_fund_creates_pending_review_fund(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_register_fund(session: object, payload: object) -> tuple[SimpleNamespace, SimpleNamespace]:
        assert payload.email == "fund@example.org"
        assert payload.name == "Test Fund"
        user = make_user(UserRole.FUND)
        user.email = payload.email
        return user, make_fund()

    monkeypatch.setattr(auth_endpoint, "register_fund", fake_register_fund)

    response = await client.post(
        "/api/v1/auth/register/fund",
        json={
            "email": "Fund@Example.org",
            "password": "password123",
            "representative_full_name": "Maria Ivanova",
            "name": "Test Fund",
            "description": "Volunteer programs",
            "help_categories": ["children"],
            "inn": "5250000000",
            "region": "Nizhny Novgorod",
            "planned_help": "Events and pro-bono help",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "fund"
    assert body["fund"]["status"] == "pending_review"


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_authenticate_user(session: object, login: str, password: str) -> SimpleNamespace:
        assert login == "volunteer@example.com"
        assert password == "password123"
        user = make_user(UserRole.VOLUNTEER)
        user.email = login
        return user

    monkeypatch.setattr(auth_endpoint, "authenticate_user", fake_authenticate_user)
    monkeypatch.setattr(auth_endpoint, "issue_user_token", lambda user: "test-token")

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "Volunteer@Example.com", "password": "password123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "test-token"
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "volunteer@example.com"


@pytest.mark.asyncio
async def test_login_accepts_default_admin_username(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_authenticate_user(session: object, login: str, password: str) -> SimpleNamespace:
        assert login == "admin"
        assert password == "admin"
        user = make_user(UserRole.ADMIN)
        user.email = "admin@stoloto.local"
        return user

    monkeypatch.setattr(auth_endpoint, "authenticate_user", fake_authenticate_user)
    monkeypatch.setattr(auth_endpoint, "issue_user_token", lambda user: "admin-token")

    response = await client.post(
        "/api/v1/auth/login",
        json={"login": "admin", "password": "admin"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "admin-token"
    assert body["user"]["role"] == "admin"
    assert body["user"]["username"] == "admin"


@pytest.mark.asyncio
async def test_me_returns_current_user(client: AsyncClient) -> None:
    user = make_user(UserRole.ADMIN)
    user.email = "admin@example.com"
    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "admin"
    assert body["email"] == "admin@example.com"


@pytest.mark.asyncio
async def test_register_volunteer_rejects_duplicate_email(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_register_volunteer(session: object, payload: object) -> SimpleNamespace:
        raise DuplicateEmailError

    monkeypatch.setattr(auth_endpoint, "register_volunteer", fake_register_volunteer)

    response = await client.post(
        "/api/v1/auth/register/volunteer",
        json={
            "email": "volunteer@example.com",
            "password": "password123",
            "full_name": "Ivan Petrov",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "email already exists"


@pytest.mark.asyncio
async def test_register_volunteer_rejects_duplicate_employee_id(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_register_volunteer(session: object, payload: object) -> SimpleNamespace:
        raise DuplicateEmployeeIdError

    monkeypatch.setattr(auth_endpoint, "register_volunteer", fake_register_volunteer)

    response = await client.post(
        "/api/v1/auth/register/volunteer",
        json={
            "email": "volunteer@example.com",
            "password": "password123",
            "full_name": "Ivan Petrov",
            "employee_id": "EMP-42",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "employee_id already exists"


@pytest.mark.asyncio
async def test_register_volunteer_rejects_unknown_employee(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_register_volunteer(session: object, payload: object) -> SimpleNamespace:
        raise StolotoEmployeeNotFoundError

    monkeypatch.setattr(auth_endpoint, "register_volunteer", fake_register_volunteer)

    response = await client.post(
        "/api/v1/auth/register/volunteer",
        json={
            "email": "outsider@example.com",
            "password": "password123",
            "employee_id": "EMP-404",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "юзака нету в базе столото"
