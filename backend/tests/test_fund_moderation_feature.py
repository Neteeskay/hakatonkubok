from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import admin as admin_endpoint
from app.api.v1.endpoints import funds as funds_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import FundStatus, UserRole
from app.services.fund_service import InvalidFundStatusTransitionError


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


def make_document() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        fund_id=uuid4(),
        document_type="registration_certificate",
        file_url="uploads/funds/fund-id/certificate.pdf",
        created_at=datetime.now(UTC),
    )


def make_fund(status: FundStatus = FundStatus.PENDING_REVIEW) -> SimpleNamespace:
    fund_id = uuid4()
    representative = make_user(UserRole.FUND)
    return SimpleNamespace(
        id=fund_id,
        representative_user_id=representative.id,
        name="Test Fund",
        description="Volunteer programs",
        help_categories=["children"],
        inn="5250000000",
        ogrn="1025200000000",
        region="Nizhny Novgorod",
        website_url="https://example.org",
        contact_person="Maria Ivanova",
        contact_position="Coordinator",
        contact_email="fund@example.org",
        contact_phone="+7 900 000-00-00",
        planned_help="Events and pro-bono help",
        status=status,
        moderation_comment="Fix contacts" if status == FundStatus.NEEDS_CHANGES else None,
        approved_at=datetime.now(UTC) if status == FundStatus.APPROVED else None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        representative=representative,
        documents=[make_document()],
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
async def test_fund_gets_own_profile(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get_fund_by_representative(session: object, user: object) -> SimpleNamespace:
        assert user.role == UserRole.FUND
        return make_fund(FundStatus.NEEDS_CHANGES)

    monkeypatch.setattr(
        funds_endpoint,
        "get_fund_by_representative",
        fake_get_fund_by_representative,
    )

    response = await fund_client.get("/api/v1/funds/me")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Test Fund"
    assert body["status"] == "needs_changes"
    assert body["documents"][0]["document_type"] == "registration_certificate"


@pytest.mark.asyncio
async def test_fund_updates_profile_and_resubmits_after_changes(
    fund_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_update_fund_profile(
        session: object,
        *,
        current_user: object,
        payload: object,
    ) -> SimpleNamespace:
        assert current_user.role == UserRole.FUND
        assert payload.name == "Updated Fund"
        assert payload.contact_email == "new@example.org"
        fund = make_fund(FundStatus.PENDING_REVIEW)
        fund.name = payload.name
        fund.contact_email = payload.contact_email
        return fund

    monkeypatch.setattr(funds_endpoint, "update_fund_profile", fake_update_fund_profile)

    response = await fund_client.patch(
        "/api/v1/funds/me",
        json={
            "name": "Updated Fund",
            "contact_email": "New@Example.org",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Updated Fund"
    assert body["contact_email"] == "new@example.org"
    assert body["status"] == "pending_review"


@pytest.mark.asyncio
async def test_admin_lists_funds_by_status(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_list_funds(session: object, status: FundStatus | None = None) -> list[SimpleNamespace]:
        assert status == FundStatus.PENDING_REVIEW
        return [make_fund(FundStatus.PENDING_REVIEW)]

    monkeypatch.setattr(admin_endpoint, "list_funds", fake_list_funds)

    response = await admin_client.get("/api/v1/admin/funds?status=pending_review")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "pending_review"


@pytest.mark.asyncio
async def test_admin_gets_fund_details(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fund = make_fund(FundStatus.PENDING_REVIEW)

    async def fake_get_fund_by_id(session: object, fund_id: UUID) -> SimpleNamespace:
        assert fund_id == fund.id
        return fund

    monkeypatch.setattr(admin_endpoint, "get_fund_by_id", fake_get_fund_by_id)

    response = await admin_client.get(f"/api/v1/admin/funds/{fund.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(fund.id)
    assert body["representative"]["email"] == "fund@example.org"


@pytest.mark.asyncio
async def test_admin_approves_fund(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fund_id = uuid4()

    async def fake_moderate_fund(
        session: object,
        *,
        fund_id: UUID,
        target_status: FundStatus,
        moderation_comment: str | None,
    ) -> SimpleNamespace:
        assert target_status == FundStatus.APPROVED
        assert moderation_comment is None
        return make_fund(FundStatus.APPROVED)

    monkeypatch.setattr(admin_endpoint, "moderate_fund", fake_moderate_fund)

    response = await admin_client.patch(
        f"/api/v1/admin/funds/{fund_id}/moderation",
        json={"target_status": "approved"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "approved"
    assert body["approved_at"] is not None


@pytest.mark.asyncio
async def test_admin_returns_conflict_for_invalid_fund_transition(
    admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_moderate_fund(*args: object, **kwargs: object) -> SimpleNamespace:
        raise InvalidFundStatusTransitionError

    monkeypatch.setattr(admin_endpoint, "moderate_fund", fake_moderate_fund)

    response = await admin_client.patch(
        f"/api/v1/admin/funds/{uuid4()}/moderation",
        json={"target_status": "approved"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "invalid fund status transition"


@pytest.mark.asyncio
async def test_admin_moderation_requires_comment_for_rejection(
    admin_client: AsyncClient,
) -> None:
    response = await admin_client.patch(
        f"/api/v1/admin/funds/{uuid4()}/moderation",
        json={"target_status": "rejected"},
    )

    assert response.status_code == 422
