from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import volunteers as volunteers_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import UserRole
from app.services.notification_service import NotificationNotFoundError


def make_user() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.VOLUNTEER,
        username=None,
        email="volunteer@example.com",
        full_name="Volunteer",
        city="Nizhny Novgorod",
        phone=None,
        employee_id="EMP-1",
        department="IT",
        position="Developer",
        created_at=datetime.now(UTC),
        is_active=True,
    )


def make_notification(is_read: bool = False) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        title="Task approved",
        body="Your participation is confirmed.",
        is_read=is_read,
        created_at=datetime.now(UTC),
    )


@pytest_asyncio.fixture
async def volunteer_client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = make_user
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_volunteer_lists_notifications(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_list_user_notifications(
        session: object,
        user: object,
        *,
        unread_only: bool,
        limit: int,
        offset: int,
    ) -> list[SimpleNamespace]:
        assert user.role == UserRole.VOLUNTEER
        assert unread_only is True
        assert limit == 10
        assert offset == 0
        return [make_notification()]

    monkeypatch.setattr(
        volunteers_endpoint,
        "list_user_notifications",
        fake_list_user_notifications,
    )

    response = await volunteer_client.get(
        "/api/v1/volunteers/me/notifications?unread_only=true&limit=10"
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Task approved"
    assert body[0]["is_read"] is False


@pytest.mark.asyncio
async def test_volunteer_marks_notification_read(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    notification_id = uuid4()

    async def fake_mark_notification_read(
        session: object,
        user: object,
        passed_notification_id: UUID,
    ) -> SimpleNamespace:
        assert user.role == UserRole.VOLUNTEER
        assert passed_notification_id == notification_id
        notification = make_notification(is_read=True)
        notification.id = notification_id
        return notification

    monkeypatch.setattr(
        volunteers_endpoint,
        "mark_notification_read",
        fake_mark_notification_read,
    )

    response = await volunteer_client.patch(
        f"/api/v1/volunteers/me/notifications/{notification_id}/read"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(notification_id)
    assert body["is_read"] is True


@pytest.mark.asyncio
async def test_volunteer_mark_notification_read_returns_404(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_mark_notification_read(
        session: object,
        user: object,
        notification_id: UUID,
    ) -> SimpleNamespace:
        raise NotificationNotFoundError

    monkeypatch.setattr(
        volunteers_endpoint,
        "mark_notification_read",
        fake_mark_notification_read,
    )

    response = await volunteer_client.patch(f"/api/v1/volunteers/me/notifications/{uuid4()}/read")

    assert response.status_code == 404
    assert response.json()["detail"] == "notification not found"
