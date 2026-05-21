from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import applications as applications_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import ApplicationStatus, UserRole


def make_user(role: UserRole) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=role,
        username=None,
        email="volunteer@stoloto.local" if role == UserRole.VOLUNTEER else "fund@example.org",
        full_name="Test User",
        city="Nizhny Novgorod",
        avatar_url="uploads/volunteers/avatar.png" if role == UserRole.VOLUNTEER else None,
        phone="+7 900 000-00-00" if role == UserRole.VOLUNTEER else None,
        employee_id="EMP-1" if role == UserRole.VOLUNTEER else None,
        department="IT" if role == UserRole.VOLUNTEER else None,
        position="Developer" if role == UserRole.VOLUNTEER else None,
        interests=["children"] if role == UserRole.VOLUNTEER else None,
        skills=["python"] if role == UserRole.VOLUNTEER else None,
        pro_bono_skills=["analytics"] if role == UserRole.VOLUNTEER else None,
        created_at=datetime.now(UTC),
        is_active=True,
    )


def make_application(status: ApplicationStatus, task_id: UUID | None = None) -> SimpleNamespace:
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=uuid4(),
        task_id=task_id or uuid4(),
        volunteer_id=uuid4(),
        status=status,
        volunteer_comment="Ready to help",
        fund_comment="Approved" if status == ApplicationStatus.ACCEPTED else None,
        completion_comment=None,
        decided_at=now if status == ApplicationStatus.ACCEPTED else None,
        canceled_at=None,
        completion_confirmed_at=None,
        created_at=now,
        updated_at=now,
        task=None,
        volunteer=None,
    )


@pytest_asyncio.fixture
async def volunteer_client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = lambda: make_user(UserRole.VOLUNTEER)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def fund_client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = lambda: make_user(UserRole.FUND)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_volunteer_applies_to_task(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid4()

    async def fake_create_application(
        session: object,
        *,
        current_user: object,
        task_id: UUID,
        volunteer_comment: str | None,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.VOLUNTEER
        assert volunteer_comment == "Ready to help"
        return make_application(ApplicationStatus.APPLIED, task_id)

    monkeypatch.setattr(applications_endpoint, "create_application", fake_create_application)

    response = await volunteer_client.post(
        f"/api/v1/applications/tasks/{task_id}",
        json={"volunteer_comment": "Ready to help"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["task_id"] == str(task_id)
    assert body["status"] == "applied"


@pytest.mark.asyncio
async def test_fund_accepts_application(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    application_id = uuid4()

    async def fake_accept_application(
        session: object,
        *,
        current_user: object,
        application_id: UUID,
        fund_comment: str | None,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        assert fund_comment == "Approved"
        application = make_application(ApplicationStatus.ACCEPTED)
        application.id = application_id
        return application

    monkeypatch.setattr(applications_endpoint, "accept_application", fake_accept_application)

    response = await fund_client.post(
        f"/api/v1/applications/fund/{application_id}/accept",
        json={"fund_comment": "Approved"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(application_id)
    assert body["status"] == "accepted"


@pytest.mark.asyncio
async def test_fund_application_includes_volunteer_avatar(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    application = make_application(ApplicationStatus.APPLIED)
    application.volunteer = make_user(UserRole.VOLUNTEER)

    async def fake_list_fund_applications(
        session: object,
        *,
        current_user: object,
        task_id: UUID | None = None,
        status: ApplicationStatus | None = None,
    ) -> list[SimpleNamespace]:
        assert current_user.role == UserRole.FUND
        assert task_id is None
        assert status is None
        return [application]

    monkeypatch.setattr(applications_endpoint, "list_fund_applications", fake_list_fund_applications)

    response = await fund_client.get("/api/v1/applications/fund")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["volunteer"]["avatar_url"] == "uploads/volunteers/avatar.png"
