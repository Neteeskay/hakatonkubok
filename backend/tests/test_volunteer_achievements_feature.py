from datetime import UTC, date, datetime
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
    TaskStatus,
    TaskType,
    UserRole,
)
from app.services.achievement_service import (
    AchievementStats,
    _calculate_long_term_progress,
    _is_active_application,
    _longest_weekly_streak,
    build_achievement_states,
)


def make_volunteer() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.VOLUNTEER,
        username=None,
        email="volunteer@stoloto.local",
        full_name="Test Volunteer",
        city="Nizhny Novgorod",
        phone="+70000000000",
        employee_id="EMP-1",
        department="IT",
        position="Developer",
        interests=["ecology"],
        skills=["python"],
        created_at=datetime.now(UTC),
        is_active=True,
    )


class FakeProfileSession:
    def __init__(self) -> None:
        self.committed = False
        self.refreshed: object | None = None

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, instance: object) -> None:
        self.refreshed = instance


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


def test_build_achievement_states_exposes_progress_payload() -> None:
    states = build_achievement_states(
        AchievementStats(
            applications_count=3,
            fast_response_count=0,
            active_applications_count=2,
            completed_tasks_count=4,
            total_hours=Decimal("7.50"),
            online_completed_count=2,
            offline_completed_count=1,
            pro_bono_completed_count=0,
            ecology_completed_count=1,
            children_completed_count=1,
            support_completed_count=0,
            team_completed_count=1,
            weekly_streak_weeks=2,
            daily_activity_streak_days=6,
            reliable_success_ratio_percent=Decimal("80.00"),
            long_term_progress_percent=Decimal("25.00"),
            canceled_applications_count=1,
            controlled_participations_count=5,
            activity_span_days=30,
        )
    )

    hours_10 = next(state for state in states if state.code == AchievementCode.HOURS_10)
    reliable = next(state for state in states if state.code == AchievementCode.RELIABLE_VOLUNTEER)
    legend = next(state for state in states if state.code == AchievementCode.PROSTO_LEGEND)

    assert hours_10.unit == "hours"
    assert hours_10.progress_percent == Decimal("75.00")
    assert hours_10.remaining == Decimal("2.50")
    assert hours_10.criteria[0].key == "total_hours"
    assert reliable.criteria[0].key == "completed_tasks_count"
    assert reliable.criteria[1].key == "reliable_success_ratio_percent"
    assert legend.progress_percent == Decimal("25.00")
    assert {criterion.key for criterion in legend.criteria} == {
        "total_hours",
        "completed_tasks_count",
        "activity_span_days",
        "reliable_success_ratio_percent",
        "weekly_streak_weeks",
    }


def test_active_participant_counts_only_active_accepted_tasks() -> None:
    accepted_application = SimpleNamespace(status=ApplicationStatus.ACCEPTED)
    completed_application = SimpleNamespace(status=ApplicationStatus.HOURS_AWARDED)
    published_task = SimpleNamespace(status=TaskStatus.PUBLISHED)
    closed_task = SimpleNamespace(status=TaskStatus.CLOSED)

    assert _is_active_application(accepted_application, published_task) is True
    assert _is_active_application(accepted_application, closed_task) is False
    assert _is_active_application(completed_application, published_task) is False


def test_regular_helper_uses_four_week_award_streak() -> None:
    streak = _longest_weekly_streak(
        [
            date(2026, 1, 5),
            date(2026, 1, 12),
            date(2026, 1, 19),
            date(2026, 1, 26),
        ]
    )

    assert streak == 4


def test_prosto_legend_requires_reliability_and_regular_streak() -> None:
    full_progress = _calculate_long_term_progress(
        total_hours=Decimal("100"),
        completed_tasks_count=10,
        completed_dates=[date(2026, 1, 1), date(2026, 3, 31)],
        reliable_success_ratio_percent=Decimal("90"),
        weekly_streak_weeks=4,
    )
    unreliable_progress = _calculate_long_term_progress(
        total_hours=Decimal("100"),
        completed_tasks_count=10,
        completed_dates=[date(2026, 1, 1), date(2026, 3, 31)],
        reliable_success_ratio_percent=Decimal("80"),
        weekly_streak_weeks=4,
    )

    assert full_progress == Decimal("100.00")
    assert unreliable_progress < Decimal("100.00")


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
async def test_get_my_achievement_overview_returns_stats_and_progress(
    volunteer_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_sync(session: object, volunteer_id: object) -> list[object]:
        return []

    async def fake_overview(session: object, volunteer_id: object) -> SimpleNamespace:
        achievement = SimpleNamespace(
            code=AchievementCode.HOURS_10,
            title="10 hours",
            description="Reach 10 confirmed hours",
            category="hours",
            category_label="Hours",
            unit="hours",
            unit_label="hours",
            sort_order=3,
            is_awarded=False,
            awarded_at=None,
            progress_current=Decimal("7.50"),
            progress_target=Decimal("10.00"),
            progress_percent=Decimal("75.00"),
            remaining=Decimal("2.50"),
            is_completed=False,
            criteria=[
                SimpleNamespace(
                    key="total_hours",
                    title="Progress",
                    current=Decimal("7.50"),
                    target=Decimal("10.00"),
                    unit="hours",
                    unit_label="hours",
                    progress_percent=Decimal("75.00"),
                    remaining=Decimal("2.50"),
                    is_completed=False,
                    metadata={},
                )
            ],
            metadata={},
        )
        stats = SimpleNamespace(
            applications_count=3,
            fast_response_count=1,
            active_applications_count=1,
            completed_tasks_count=2,
            total_hours=Decimal("7.50"),
            online_completed_count=1,
            offline_completed_count=1,
            pro_bono_completed_count=0,
            ecology_completed_count=0,
            children_completed_count=1,
            support_completed_count=0,
            team_completed_count=0,
            weekly_streak_weeks=1,
            daily_activity_streak_days=2,
            reliable_success_ratio_percent=Decimal("0.00"),
            long_term_progress_percent=Decimal("0.00"),
            canceled_applications_count=0,
            controlled_participations_count=2,
            activity_span_days=10,
        )
        return SimpleNamespace(
            stats=stats,
            achievements=[achievement],
            next_achievement=achievement,
            total_count=1,
            awarded_count=0,
            in_progress_count=1,
            overall_progress_percent=Decimal("0.00"),
        )

    monkeypatch.setattr(volunteers_endpoint, "sync_volunteer_achievements", fake_sync)
    monkeypatch.setattr(volunteers_endpoint, "get_volunteer_achievement_overview", fake_overview)

    response = await volunteer_client.get("/api/v1/volunteers/me/achievements/overview")

    assert response.status_code == 200
    body = response.json()
    assert body["stats"]["total_hours"] == "7.50"
    assert body["next_achievement"]["code"] == "hours_10"
    assert body["next_achievement"]["progress_percent"] == "75.00"
    assert body["next_achievement"]["criteria"][0]["remaining"] == "2.50"


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


@pytest.mark.asyncio
async def test_update_my_profile_persists_volunteer_fields() -> None:
    user = make_volunteer()
    session = FakeProfileSession()
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.patch(
            "/api/v1/volunteers/me",
            json={
                "full_name": "Updated Volunteer",
                "city": "Kazan",
                "phone": "+79990000000",
                "interests": ["ecology", "ecology", "children"],
                "skills": ["python", "analytics"],
            },
        )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert session.committed is True
    assert session.refreshed is user
    assert body["full_name"] == "Updated Volunteer"
    assert body["city"] == "Kazan"
    assert body["phone"] == "+79990000000"
    assert body["interests"] == ["ecology", "children"]
    assert body["skills"] == ["python", "analytics"]
