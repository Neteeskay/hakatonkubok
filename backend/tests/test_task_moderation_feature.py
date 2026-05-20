from datetime import UTC, datetime
from decimal import Decimal
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import admin as admin_endpoint
from app.api.v1.endpoints import tasks as tasks_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import (
    DurationType,
    FundStatus,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
    UserRole,
)
from app.services.task_service import FundNotApprovedError, InvalidTaskStatusTransitionError


def make_user(role: UserRole) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=role,
        username="admin" if role == UserRole.ADMIN else None,
        email="admin@stoloto.local" if role == UserRole.ADMIN else "fund@example.org",
        full_name="Admin" if role == UserRole.ADMIN else "Fund Representative",
        city=None,
        phone="+7 900 000-00-00",
        employee_id=None,
        department=None,
        position=None,
        created_at=datetime.now(UTC),
        is_active=True,
    )


def make_fund(status: FundStatus = FundStatus.APPROVED) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        name="Test Fund",
        status=status,
    )


def make_task(status: TaskStatus = TaskStatus.DRAFT) -> SimpleNamespace:
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=uuid4(),
        fund_id=uuid4(),
        title="Help at event",
        description="Need volunteers for event registration",
        category=HelpCategory.CHILDREN,
        participation_format=ParticipationFormat.OFFLINE,
        duration_type=DurationType.ONE_TIME,
        task_type=TaskType.REGULAR,
        city="Nizhny Novgorod",
        location="Main street, 1",
        online_url=None,
        starts_at=None,
        ends_at=None,
        deadline_at=None,
        participant_limit=8,
        requirements="Be on time",
        required_skills=["communication"],
        expected_hours=Decimal("4.00"),
        materials_url=None,
        status=status,
        moderation_comment="Add location" if status == TaskStatus.NEEDS_CHANGES else None,
        published_at=now if status == TaskStatus.PUBLISHED else None,
        closed_at=now if status == TaskStatus.CLOSED else None,
        created_at=now,
        updated_at=now,
        fund=make_fund(),
    )


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


@pytest_asyncio.fixture
async def admin_client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = lambda: make_user(UserRole.ADMIN)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_fund_creates_task_draft(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_create_task(session: object, *, current_user: object, payload: object) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        assert payload.title == "Help at event"
        assert payload.participation_format == ParticipationFormat.OFFLINE
        return make_task(TaskStatus.DRAFT)

    monkeypatch.setattr(tasks_endpoint, "create_task", fake_create_task)

    response = await fund_client.post(
        "/api/v1/tasks",
        json={
            "title": "Help at event",
            "description": "Need volunteers for event registration",
            "category": "children",
            "participation_format": "offline",
            "duration_type": "one_time",
            "city": "Nizhny Novgorod",
            "expected_hours": "4.00",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Help at event"
    assert body["status"] == "draft"


@pytest.mark.asyncio
async def test_fund_cannot_create_task_until_approved(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_create_task(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FundNotApprovedError

    monkeypatch.setattr(tasks_endpoint, "create_task", fake_create_task)

    response = await fund_client.post(
        "/api/v1/tasks",
        json={
            "title": "Help at event",
            "description": "Need volunteers for event registration",
            "category": "children",
            "participation_format": "offline",
            "duration_type": "one_time",
            "city": "Nizhny Novgorod",
            "expected_hours": "4.00",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "fund is not approved"


@pytest.mark.asyncio
async def test_fund_lists_own_tasks_by_status(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_list_fund_tasks(
        session: object,
        *,
        current_user: object,
        status: TaskStatus | None = None,
    ) -> list[SimpleNamespace]:
        assert current_user.role == UserRole.FUND
        assert status == TaskStatus.DRAFT
        return [make_task(TaskStatus.DRAFT)]

    monkeypatch.setattr(tasks_endpoint, "list_fund_tasks", fake_list_fund_tasks)

    response = await fund_client.get("/api/v1/tasks/my?status=draft")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "draft"


@pytest.mark.asyncio
async def test_fund_updates_needs_changes_task(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_update_task(
        session: object,
        *,
        current_user: object,
        task_id: UUID,
        payload: object,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        assert payload.location == "Updated location"
        task = make_task(TaskStatus.NEEDS_CHANGES)
        task.location = payload.location
        return task

    monkeypatch.setattr(tasks_endpoint, "update_task", fake_update_task)

    response = await fund_client.patch(
        f"/api/v1/tasks/my/{uuid4()}",
        json={"location": "Updated location"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["location"] == "Updated location"
    assert body["status"] == "needs_changes"


@pytest.mark.asyncio
async def test_fund_submits_task_for_review(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_submit_task_for_review(
        session: object,
        *,
        current_user: object,
        task_id: UUID,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        return make_task(TaskStatus.PENDING_REVIEW)

    monkeypatch.setattr(tasks_endpoint, "submit_task_for_review", fake_submit_task_for_review)

    response = await fund_client.post(f"/api/v1/tasks/my/{uuid4()}/submit")

    assert response.status_code == 200
    assert response.json()["status"] == "pending_review"


@pytest.mark.asyncio
async def test_fund_closes_published_task(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_close_task(
        session: object,
        *,
        current_user: object,
        task_id: UUID,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        return make_task(TaskStatus.CLOSED)

    monkeypatch.setattr(tasks_endpoint, "close_task", fake_close_task)

    response = await fund_client.post(f"/api/v1/tasks/my/{uuid4()}/close")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "closed"
    assert body["closed_at"] is not None


@pytest.mark.asyncio
async def test_admin_lists_tasks_by_status(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_list_tasks_for_admin(
        session: object,
        *,
        status: TaskStatus | None = None,
    ) -> list[SimpleNamespace]:
        assert status == TaskStatus.PENDING_REVIEW
        return [make_task(TaskStatus.PENDING_REVIEW)]

    monkeypatch.setattr(admin_endpoint, "list_tasks_for_admin", fake_list_tasks_for_admin)

    response = await admin_client.get("/api/v1/admin/tasks?status=pending_review")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "pending_review"


@pytest.mark.asyncio
async def test_admin_gets_task_details(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = make_task(TaskStatus.PENDING_REVIEW)

    async def fake_get_task_by_id(session: object, task_id: UUID) -> SimpleNamespace:
        assert task_id == task.id
        return task

    monkeypatch.setattr(admin_endpoint, "get_task_by_id", fake_get_task_by_id)

    response = await admin_client.get(f"/api/v1/admin/tasks/{task.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(task.id)
    assert body["fund"]["name"] == "Test Fund"


@pytest.mark.asyncio
async def test_admin_publishes_task(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_moderate_task(
        session: object,
        *,
        task_id: UUID,
        target_status: TaskStatus,
        moderation_comment: str | None,
    ) -> SimpleNamespace:
        assert target_status == TaskStatus.PUBLISHED
        assert moderation_comment is None
        return make_task(TaskStatus.PUBLISHED)

    monkeypatch.setattr(admin_endpoint, "moderate_task", fake_moderate_task)

    response = await admin_client.patch(
        f"/api/v1/admin/tasks/{uuid4()}/moderation",
        json={"status": "published"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None


@pytest.mark.asyncio
async def test_admin_returns_task_for_changes(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_moderate_task(
        session: object,
        *,
        task_id: UUID,
        target_status: TaskStatus,
        moderation_comment: str | None,
    ) -> SimpleNamespace:
        assert target_status == TaskStatus.NEEDS_CHANGES
        assert moderation_comment == "Add location"
        return make_task(TaskStatus.NEEDS_CHANGES)

    monkeypatch.setattr(admin_endpoint, "moderate_task", fake_moderate_task)

    response = await admin_client.patch(
        f"/api/v1/admin/tasks/{uuid4()}/moderation",
        json={"status": "needs_changes", "moderation_comment": "Add location"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "needs_changes"
    assert body["moderation_comment"] == "Add location"


@pytest.mark.asyncio
async def test_admin_task_moderation_requires_comment_for_rejection(
    admin_client: AsyncClient,
) -> None:
    response = await admin_client.patch(
        f"/api/v1/admin/tasks/{uuid4()}/moderation",
        json={"status": "rejected"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_admin_returns_conflict_for_invalid_task_transition(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_moderate_task(*args: object, **kwargs: object) -> SimpleNamespace:
        raise InvalidTaskStatusTransitionError

    monkeypatch.setattr(admin_endpoint, "moderate_task", fake_moderate_task)

    response = await admin_client.patch(
        f"/api/v1/admin/tasks/{uuid4()}/moderation",
        json={"status": "published"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "invalid task status transition"
