from datetime import UTC, datetime
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import volunteers as volunteers_endpoint
from app.core.deps import get_current_user
from app.db.session import get_session
from app.main import app
from app.models.enums import (
    AchievementCode,
    ApplicationStatus,
    HelpCategory,
    ParticipationFormat,
    TaskType,
    UserRole,
)
from app.services.achievement_service import AchievementStats, build_achievement_states


def make_volunteer() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.VOLUNTEER,
        username=None,
        email="volunteer@stoloto.local",
        full_name="Test Volunteer",
        is_active=True,
    )


@pytest_asyncio.fixture
async def volunteer_client() -> AsyncClient:
    app.dependency_overrides[get_session] = lambda: object()
    app.dependency_overrides[get_current_user] = make_volunteer
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


def test_build_achievement_states_marks_completed_medals() -> None:
    states = build_achievement_states(
        AchievementStats(
            applications_count=1,
            fast_response_count=1,
            active_applications_count=0,
            completed_tasks_count=1,
            total_hours=Decimal("10.00"),
            online_completed_count=0,
            offline_completed_count=0,
            pro_bono_completed_count=1,
            ecology_completed_count=1,
            children_completed_count=0,
            support_completed_count=0,
            team_completed_count=0,
            weekly_streak_weeks=1,
            daily_activity_streak_days=1,
            reliable_success_ratio_percent=Decimal("0"),
            long_term_progress_percent=Decimal("1.00"),
        )
    )

    completed_codes = {state.code for state in states if state.is_completed}

    assert AchievementCode.FIRST_STEPS in completed_codes
    assert AchievementCode.HOURS_5 in completed_codes
    assert AchievementCode.HOURS_10 in completed_codes
    assert AchievementCode.FIRST_RESPONSE in completed_codes
    assert AchievementCode.FAST_RESPONSE in completed_codes
    assert AchievementCode.PRO_BONO_EXPERT in completed_codes
    assert AchievementCode.ECO_HERO in completed_codes
    assert AchievementCode.GOOD_MARATHON not in completed_codes


@pytest.mark.asyncio
async def test_get_my_achievements_returns_medals(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_sync(session: object, volunteer_id: object) -> list[object]:
        return []

    async def fake_list(session: object, volunteer_id: object) -> list[SimpleNamespace]:
        return [
            SimpleNamespace(
                code=AchievementCode.FIRST_RESPONSE,
                title="Первый отклик",
                description="За первый отклик на задание.",
                is_awarded=True,
                awarded_at=datetime(2026, 5, 20, tzinfo=UTC),
                progress_current=Decimal("1.00"),
                progress_target=Decimal("1.00"),
            )
        ]

    monkeypatch.setattr(volunteers_endpoint, "sync_volunteer_achievements", fake_sync)
    monkeypatch.setattr(volunteers_endpoint, "list_volunteer_achievement_statuses", fake_list)

    response = await volunteer_client.get("/api/v1/volunteers/me/achievements")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["code"] == "first_response"
    assert body[0]["is_awarded"] is True


@pytest.mark.asyncio
async def test_get_my_history_returns_lk_events(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = datetime(2026, 5, 20, 12, 0, tzinfo=UTC)
    task_id = uuid4()

    async def fake_sync(session: object, volunteer_id: object) -> list[object]:
        return []

    async def fake_history(
        session: object,
        volunteer_id: object,
        *,
        limit: int,
        offset: int,
    ) -> list[SimpleNamespace]:
        assert limit == 50
        assert offset == 0
        return [
            SimpleNamespace(
                event_type="hours_awarded",
                occurred_at=now,
                title="Начислены волонтёрские часы",
                description="Спасибо за участие",
                application_id=uuid4(),
                task=SimpleNamespace(
                    id=task_id,
                    title="Помочь с аналитикой",
                    category=HelpCategory.ECOLOGY,
                    participation_format=ParticipationFormat.ONLINE,
                    task_type=TaskType.PRO_BONO,
                    fund_name="Test Fund",
                ),
                achievement_code=None,
                status=ApplicationStatus.HOURS_AWARDED,
                hours=Decimal("5.00"),
            )
        ]

    monkeypatch.setattr(volunteers_endpoint, "sync_volunteer_achievements", fake_sync)
    monkeypatch.setattr(volunteers_endpoint, "list_volunteer_history", fake_history)

    response = await volunteer_client.get("/api/v1/volunteers/me/history")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["event_type"] == "hours_awarded"
    assert body[0]["task"]["id"] == str(task_id)
    assert body[0]["hours"] == "5.00"
