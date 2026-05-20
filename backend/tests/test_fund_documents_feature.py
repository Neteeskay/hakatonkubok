from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import funds as funds_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import UserRole
from app.services.fund_service import EmptyFundDocumentError


def make_fund_user() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.FUND,
        username=None,
        email="fund@example.org",
        full_name="Fund Representative",
        city=None,
        employee_id=None,
        department=None,
        position=None,
        created_at=datetime.now(UTC),
        is_active=True,
    )


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = make_fund_user
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_fund_uploads_verification_document(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_add_fund_document(
        session: object,
        *,
        current_user: object,
        document_type: str,
        file: object,
    ) -> SimpleNamespace:
        assert document_type == "registration_certificate"
        assert current_user.role == UserRole.FUND
        assert file.filename == "certificate.pdf"
        return SimpleNamespace(
            id=uuid4(),
            fund_id=uuid4(),
            document_type=document_type,
            file_url="uploads/funds/fund-id/certificate.pdf",
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr(funds_endpoint, "add_fund_document", fake_add_fund_document)

    response = await client.post(
        "/api/v1/funds/me/documents",
        data={"document_type": "registration_certificate"},
        files={"file": ("certificate.pdf", b"pdf-content", "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["document_type"] == "registration_certificate"
    assert body["file_url"] == "uploads/funds/fund-id/certificate.pdf"


@pytest.mark.asyncio
async def test_fund_upload_rejects_empty_document(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_add_fund_document(*args: object, **kwargs: object) -> SimpleNamespace:
        raise EmptyFundDocumentError

    monkeypatch.setattr(funds_endpoint, "add_fund_document", fake_add_fund_document)

    response = await client.post(
        "/api/v1/funds/me/documents",
        data={"document_type": "registration_certificate"},
        files={"file": ("certificate.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "empty file"

