from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import TaskApplication, UserAchievement, VolunteerHourLedger, VolunteerTask
from app.models.enums import (
    AchievementCode,
    ApplicationStatus,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
)

COMPLETED_APPLICATION_STATUSES = {
    ApplicationStatus.COMPLETION_CONFIRMED,
    ApplicationStatus.HOURS_AWARDED,
}
ACTIVE_APPLICATION_STATUSES = {ApplicationStatus.ACCEPTED}
ACTIVE_TASK_STATUSES = {TaskStatus.PUBLISHED}
PROGRESS_QUANT = Decimal("0.01")


@dataclass(frozen=True)
class AchievementDefinition:
    code: AchievementCode
    title: str
    description: str


@dataclass(frozen=True)
class AchievementPresentation:
    category: str
    category_label: str
    unit: str
    unit_label: str
    metric_key: str


@dataclass(frozen=True)
class AchievementCriterion:
    key: str
    title: str
    current: Decimal
    target: Decimal
    unit: str
    unit_label: str
    progress_percent: Decimal
    remaining: Decimal
    is_completed: bool
    metadata: dict[str, Any]


@dataclass(frozen=True)
class AchievementStats:
    applications_count: int
    fast_response_count: int
    active_applications_count: int
    completed_tasks_count: int
    total_hours: Decimal
    online_completed_count: int
    offline_completed_count: int
    pro_bono_completed_count: int
    ecology_completed_count: int
    children_completed_count: int
    support_completed_count: int
    team_completed_count: int
    weekly_streak_weeks: int
    daily_activity_streak_days: int
    reliable_success_ratio_percent: Decimal
    long_term_progress_percent: Decimal
    canceled_applications_count: int = 0
    controlled_participations_count: int = 0
    activity_span_days: int = 0


@dataclass(frozen=True)
class AchievementState:
    code: AchievementCode
    title: str
    description: str
    category: str
    category_label: str
    unit: str
    unit_label: str
    sort_order: int
    progress_current: Decimal
    progress_target: Decimal
    progress_percent: Decimal
    remaining: Decimal
    is_completed: bool
    criteria: list[AchievementCriterion]
    metadata: dict[str, Any]


@dataclass(frozen=True)
class AchievementStatus:
    code: AchievementCode
    title: str
    description: str
    category: str
    category_label: str
    unit: str
    unit_label: str
    sort_order: int
    is_awarded: bool
    awarded_at: datetime | None
    progress_current: Decimal
    progress_target: Decimal
    progress_percent: Decimal
    remaining: Decimal
    is_completed: bool
    criteria: list[AchievementCriterion]
    metadata: dict[str, Any]


@dataclass(frozen=True)
class AchievementOverview:
    stats: AchievementStats
    achievements: list[AchievementStatus]
    next_achievement: AchievementStatus | None
    total_count: int
    awarded_count: int
    in_progress_count: int
    overall_progress_percent: Decimal


ACHIEVEMENT_DEFINITIONS: dict[AchievementCode, AchievementDefinition] = {
    AchievementCode.FIRST_STEPS: AchievementDefinition(
        AchievementCode.FIRST_STEPS,
        "Первые шаги",
        "За первое подтверждённое участие.",
    ),
    AchievementCode.HOURS_5: AchievementDefinition(
        AchievementCode.HOURS_5,
        "5 часов добра",
        "За накопление 5 волонтёрских часов.",
    ),
    AchievementCode.HOURS_10: AchievementDefinition(
        AchievementCode.HOURS_10,
        "10 часов помощи",
        "За достижение 10 подтверждённых часов.",
    ),
    AchievementCode.HOURS_25: AchievementDefinition(
        AchievementCode.HOURS_25,
        "25 часов добра",
        "За регулярное участие и 25 часов помощи.",
    ),
    AchievementCode.HOURS_50: AchievementDefinition(
        AchievementCode.HOURS_50,
        "50 часов помощи",
        "За высокий уровень вовлечённости.",
    ),
    AchievementCode.HOURS_100: AchievementDefinition(
        AchievementCode.HOURS_100,
        "100 часов добра",
        "За крупный вклад в волонтёрскую программу.",
    ),
    AchievementCode.FIRST_RESPONSE: AchievementDefinition(
        AchievementCode.FIRST_RESPONSE,
        "Первый отклик",
        "За первый отклик на задание.",
    ),
    AchievementCode.FAST_RESPONSE: AchievementDefinition(
        AchievementCode.FAST_RESPONSE,
        "Быстрый отклик",
        "Отклик в течение 1 часа.",
    ),
    AchievementCode.ACTIVE_PARTICIPANT: AchievementDefinition(
        AchievementCode.ACTIVE_PARTICIPANT,
        "Активный участник",
        "За участие в 5 заданиях одновременно.",
    ),
    AchievementCode.REGULAR_HELPER: AchievementDefinition(
        AchievementCode.REGULAR_HELPER,
        "Постоянный помощник",
        "За участие минимум раз в неделю в течение месяца.",
    ),
    AchievementCode.GOOD_MARATHON: AchievementDefinition(
        AchievementCode.GOOD_MARATHON,
        "Марафон добра",
        "За активность 30 дней подряд.",
    ),
    AchievementCode.ONLINE_VOLUNTEER: AchievementDefinition(
        AchievementCode.ONLINE_VOLUNTEER,
        "Онлайн-волонтёр",
        "За выполнение 10 онлайн-заданий.",
    ),
    AchievementCode.OFFLINE_HERO: AchievementDefinition(
        AchievementCode.OFFLINE_HERO,
        "Офлайн-герой",
        "За участие в 10 офлайн-мероприятиях.",
    ),
    AchievementCode.PRO_BONO_EXPERT: AchievementDefinition(
        AchievementCode.PRO_BONO_EXPERT,
        "PRO Bono Expert",
        "За выполнение профессиональных заданий.",
    ),
    AchievementCode.ECO_HERO: AchievementDefinition(
        AchievementCode.ECO_HERO,
        "Эко-герой",
        "За участие в экологических активностях.",
    ),
    AchievementCode.CHILDREN_KINDNESS: AchievementDefinition(
        AchievementCode.CHILDREN_KINDNESS,
        "Добро детям",
        "За участие в заданиях категории «дети».",
    ),
    AchievementCode.SUPPORT_NEARBY: AchievementDefinition(
        AchievementCode.SUPPORT_NEARBY,
        "Поддержка рядом",
        "За участие в помощи пожилым людям или людям с ОВЗ.",
    ),
    AchievementCode.RELIABLE_VOLUNTEER: AchievementDefinition(
        AchievementCode.RELIABLE_VOLUNTEER,
        "Надёжный волонтёр",
        "За высокий процент подтверждённых участий без отмен.",
    ),
    AchievementCode.TEAM_PLAYER: AchievementDefinition(
        AchievementCode.TEAM_PLAYER,
        "Командный игрок",
        "За участие в коллективных мероприятиях с несколькими волонтёрами.",
    ),
    AchievementCode.PROSTO_LEGEND: AchievementDefinition(
        AchievementCode.PROSTO_LEGEND,
        "Легенда проСТО",
        "За долгосрочную активность и системный вклад в платформу.",
    ),
}

ACHIEVEMENT_CODES_ORDER = tuple(ACHIEVEMENT_DEFINITIONS.keys())
ACHIEVEMENT_SORT_ORDER = {
    code: index for index, code in enumerate(ACHIEVEMENT_CODES_ORDER, start=1)
}

DEFAULT_PRESENTATION = AchievementPresentation(
    category="participation",
    category_label="Участие",
    unit="count",
    unit_label="шт.",
    metric_key="progress",
)

ACHIEVEMENT_PRESENTATION: dict[AchievementCode, AchievementPresentation] = {
    AchievementCode.FIRST_STEPS: AchievementPresentation(
        "participation", "Участие", "participations", "участий", "completed_tasks_count"
    ),
    AchievementCode.HOURS_5: AchievementPresentation(
        "hours", "Часы", "hours", "часов", "total_hours"
    ),
    AchievementCode.HOURS_10: AchievementPresentation(
        "hours", "Часы", "hours", "часов", "total_hours"
    ),
    AchievementCode.HOURS_25: AchievementPresentation(
        "hours", "Часы", "hours", "часов", "total_hours"
    ),
    AchievementCode.HOURS_50: AchievementPresentation(
        "hours", "Часы", "hours", "часов", "total_hours"
    ),
    AchievementCode.HOURS_100: AchievementPresentation(
        "hours", "Часы", "hours", "часов", "total_hours"
    ),
    AchievementCode.FIRST_RESPONSE: AchievementPresentation(
        "responses", "Отклики", "responses", "откликов", "applications_count"
    ),
    AchievementCode.FAST_RESPONSE: AchievementPresentation(
        "responses", "Отклики", "responses", "откликов", "fast_response_count"
    ),
    AchievementCode.ACTIVE_PARTICIPANT: AchievementPresentation(
        "participation", "Участие", "active_tasks", "заданий", "active_applications_count"
    ),
    AchievementCode.REGULAR_HELPER: AchievementPresentation(
        "streak", "Регулярность", "weeks", "недель", "weekly_streak_weeks"
    ),
    AchievementCode.GOOD_MARATHON: AchievementPresentation(
        "streak", "Регулярность", "days", "дней", "daily_activity_streak_days"
    ),
    AchievementCode.ONLINE_VOLUNTEER: AchievementPresentation(
        "format", "Формат", "tasks", "заданий", "online_completed_count"
    ),
    AchievementCode.OFFLINE_HERO: AchievementPresentation(
        "format", "Формат", "tasks", "заданий", "offline_completed_count"
    ),
    AchievementCode.PRO_BONO_EXPERT: AchievementPresentation(
        "expertise", "Экспертиза", "tasks", "заданий", "pro_bono_completed_count"
    ),
    AchievementCode.ECO_HERO: AchievementPresentation(
        "category", "Направления", "tasks", "заданий", "ecology_completed_count"
    ),
    AchievementCode.CHILDREN_KINDNESS: AchievementPresentation(
        "category", "Направления", "tasks", "заданий", "children_completed_count"
    ),
    AchievementCode.SUPPORT_NEARBY: AchievementPresentation(
        "category", "Направления", "tasks", "заданий", "support_completed_count"
    ),
    AchievementCode.RELIABLE_VOLUNTEER: AchievementPresentation(
        "quality", "Надежность", "percent", "%", "reliable_success_ratio_percent"
    ),
    AchievementCode.TEAM_PLAYER: AchievementPresentation(
        "team", "Команда", "tasks", "заданий", "team_completed_count"
    ),
    AchievementCode.PROSTO_LEGEND: AchievementPresentation(
        "legend", "Легенда", "percent", "%", "long_term_progress_percent"
    ),
}


async def sync_volunteer_achievements(
    session: AsyncSession,
    volunteer_id: UUID,
) -> list[UserAchievement]:
    states = await evaluate_volunteer_achievement_states(session, volunteer_id)
    existing = await _get_awarded_by_code(session, volunteer_id)
    new_awards: list[UserAchievement] = []

    for state in states:
        if not state.is_completed or state.code in existing:
            continue
        new_awards.append(
            UserAchievement(
                user_id=volunteer_id,
                achievement_code=state.code.value,
                progress_current=state.progress_current,
                progress_target=state.progress_target,
                achievement_metadata=state.metadata,
            )
        )

    if not new_awards:
        return []

    session.add_all(new_awards)
    await session.commit()
    for award in new_awards:
        await session.refresh(award)
    return new_awards


async def list_volunteer_achievement_statuses(
    session: AsyncSession,
    volunteer_id: UUID,
) -> list[AchievementStatus]:
    states = await evaluate_volunteer_achievement_states(session, volunteer_id)
    awarded_by_code = await _get_awarded_by_code(session, volunteer_id)

    return _build_achievement_statuses(states, awarded_by_code)


async def get_volunteer_achievement_overview(
    session: AsyncSession,
    volunteer_id: UUID,
) -> AchievementOverview:
    stats = await collect_volunteer_achievement_stats(session, volunteer_id)
    states = build_achievement_states(stats)
    awarded_by_code = await _get_awarded_by_code(session, volunteer_id)
    achievements = _build_achievement_statuses(states, awarded_by_code)
    total_count = len(achievements)
    awarded_count = sum(1 for item in achievements if item.is_awarded)
    in_progress_count = total_count - awarded_count
    next_achievement = _select_next_achievement(achievements)
    overall_progress_percent = (
        _percent(awarded_count, total_count) if total_count > 0 else Decimal("0.00")
    )

    return AchievementOverview(
        stats=stats,
        achievements=achievements,
        next_achievement=next_achievement,
        total_count=total_count,
        awarded_count=awarded_count,
        in_progress_count=in_progress_count,
        overall_progress_percent=overall_progress_percent,
    )


async def evaluate_volunteer_achievement_states(
    session: AsyncSession,
    volunteer_id: UUID,
) -> list[AchievementState]:
    stats = await collect_volunteer_achievement_stats(session, volunteer_id)
    return build_achievement_states(stats)


def build_achievement_states(stats: AchievementStats) -> list[AchievementState]:
    return [
        _state(AchievementCode.FIRST_STEPS, stats.completed_tasks_count, 1),
        _state(AchievementCode.HOURS_5, stats.total_hours, 5),
        _state(AchievementCode.HOURS_10, stats.total_hours, 10),
        _state(AchievementCode.HOURS_25, stats.total_hours, 25),
        _state(AchievementCode.HOURS_50, stats.total_hours, 50),
        _state(AchievementCode.HOURS_100, stats.total_hours, 100),
        _state(AchievementCode.FIRST_RESPONSE, stats.applications_count, 1),
        _state(AchievementCode.FAST_RESPONSE, stats.fast_response_count, 1),
        _state(AchievementCode.ACTIVE_PARTICIPANT, stats.active_applications_count, 5),
        _state(AchievementCode.REGULAR_HELPER, stats.weekly_streak_weeks, 4),
        _state(AchievementCode.GOOD_MARATHON, stats.daily_activity_streak_days, 30),
        _state(AchievementCode.ONLINE_VOLUNTEER, stats.online_completed_count, 10),
        _state(AchievementCode.OFFLINE_HERO, stats.offline_completed_count, 10),
        _state(AchievementCode.PRO_BONO_EXPERT, stats.pro_bono_completed_count, 1),
        _state(AchievementCode.ECO_HERO, stats.ecology_completed_count, 1),
        _state(AchievementCode.CHILDREN_KINDNESS, stats.children_completed_count, 1),
        _state(AchievementCode.SUPPORT_NEARBY, stats.support_completed_count, 1),
        _state(
            AchievementCode.RELIABLE_VOLUNTEER,
            stats.reliable_success_ratio_percent,
            90,
            {"minimum_confirmed_participations": 5},
            criteria=[
                _criterion(
                    "completed_tasks_count",
                    "Подтвержденные участия",
                    stats.completed_tasks_count,
                    5,
                    "participations",
                    "участий",
                ),
                _criterion(
                    "reliable_success_ratio_percent",
                    "Процент участий без отмен",
                    stats.reliable_success_ratio_percent,
                    90,
                    "percent",
                    "%",
                ),
            ],
        ),
        _state(AchievementCode.TEAM_PLAYER, stats.team_completed_count, 1),
        _state(
            AchievementCode.PROSTO_LEGEND,
            stats.long_term_progress_percent,
            100,
            {
                "hours_target": 100,
                "completed_tasks_target": 10,
                "activity_days_target": 90,
                "reliable_percent_target": 90,
                "weekly_streak_target": 4,
            },
            criteria=[
                _criterion(
                    "total_hours", "Волонтерские часы", stats.total_hours, 100, "hours", "часов"
                ),
                _criterion(
                    "completed_tasks_count",
                    "Подтвержденные участия",
                    stats.completed_tasks_count,
                    10,
                    "tasks",
                    "заданий",
                ),
                _criterion(
                    "activity_span_days",
                    "Долгосрочная активность",
                    stats.activity_span_days,
                    90,
                    "days",
                    "дней",
                ),
                _criterion(
                    "reliable_success_ratio_percent",
                    "Надежность",
                    stats.reliable_success_ratio_percent,
                    90,
                    "percent",
                    "%",
                ),
                _criterion(
                    "weekly_streak_weeks",
                    "Регулярность",
                    stats.weekly_streak_weeks,
                    4,
                    "weeks",
                    "недель",
                ),
            ],
        ),
    ]


async def collect_volunteer_achievement_stats(
    session: AsyncSession,
    volunteer_id: UUID,
) -> AchievementStats:
    result = await session.execute(
        select(TaskApplication, VolunteerTask, VolunteerHourLedger)
        .join(VolunteerTask, VolunteerTask.id == TaskApplication.task_id)
        .outerjoin(VolunteerHourLedger, VolunteerHourLedger.application_id == TaskApplication.id)
        .where(TaskApplication.volunteer_id == volunteer_id)
    )
    rows = list(result.all())

    total_hours = Decimal("0")
    fast_response_count = 0
    active_applications_count = 0
    category_counter: Counter[str] = Counter()
    completed_dates: list[date] = []
    awarded_dates: list[date] = []
    activity_dates: list[date] = []
    completed_task_ids: set[UUID] = set()
    online_completed_count = 0
    offline_completed_count = 0
    pro_bono_completed_count = 0
    canceled_count = 0
    completed_tasks_count = 0

    for application, task, ledger in rows:
        _append_date(activity_dates, application.created_at)
        _append_date(activity_dates, application.decided_at)
        _append_date(activity_dates, application.canceled_at)
        _append_date(activity_dates, application.completion_confirmed_at)

        if _is_fast_response(application, task):
            fast_response_count += 1

        if _is_active_application(application, task):
            active_applications_count += 1

        if application.status == ApplicationStatus.CANCELED:
            canceled_count += 1

        if application.status in COMPLETED_APPLICATION_STATUSES:
            completed_tasks_count += 1
            completed_task_ids.add(application.task_id)
            category_counter[_enum_value(task.category)] += 1
            _append_date(completed_dates, application.completion_confirmed_at)

            if task.participation_format == ParticipationFormat.ONLINE:
                online_completed_count += 1
            if task.participation_format == ParticipationFormat.OFFLINE:
                offline_completed_count += 1
            if task.task_type == TaskType.PRO_BONO:
                pro_bono_completed_count += 1

        if ledger is not None:
            total_hours += Decimal(ledger.hours)
            _append_date(awarded_dates, ledger.awarded_at)
            _append_date(activity_dates, ledger.awarded_at)
            if application.completion_confirmed_at is None:
                _append_date(completed_dates, ledger.awarded_at)

    team_completed_count = await _count_team_completed_tasks(session, completed_task_ids)
    reliable_ratio = _calculate_reliable_ratio(completed_tasks_count, canceled_count)
    weekly_streak_weeks = _longest_weekly_streak(awarded_dates)
    activity_span_days = _activity_span_days(completed_dates)
    long_term_progress = _calculate_long_term_progress(
        total_hours=total_hours,
        completed_tasks_count=completed_tasks_count,
        completed_dates=completed_dates,
        reliable_success_ratio_percent=(
            reliable_ratio if completed_tasks_count >= 5 else Decimal("0")
        ),
        weekly_streak_weeks=weekly_streak_weeks,
    )

    return AchievementStats(
        applications_count=len(rows),
        fast_response_count=fast_response_count,
        active_applications_count=active_applications_count,
        completed_tasks_count=completed_tasks_count,
        total_hours=total_hours,
        online_completed_count=online_completed_count,
        offline_completed_count=offline_completed_count,
        pro_bono_completed_count=pro_bono_completed_count,
        ecology_completed_count=category_counter[HelpCategory.ECOLOGY.value],
        children_completed_count=category_counter[HelpCategory.CHILDREN.value],
        support_completed_count=(
            category_counter[HelpCategory.ELDERLY.value]
            + category_counter[HelpCategory.DISABILITY.value]
        ),
        team_completed_count=team_completed_count,
        weekly_streak_weeks=weekly_streak_weeks,
        daily_activity_streak_days=_longest_daily_streak(activity_dates),
        reliable_success_ratio_percent=reliable_ratio
        if completed_tasks_count >= 5
        else Decimal("0"),
        long_term_progress_percent=long_term_progress,
        canceled_applications_count=canceled_count,
        controlled_participations_count=completed_tasks_count + canceled_count,
        activity_span_days=activity_span_days,
    )


async def _get_awarded_by_code(
    session: AsyncSession,
    volunteer_id: UUID,
) -> dict[AchievementCode, UserAchievement]:
    awards = await session.scalars(
        select(UserAchievement).where(UserAchievement.user_id == volunteer_id)
    )
    result: dict[AchievementCode, UserAchievement] = {}
    for award in awards:
        code = _parse_achievement_code(award.achievement_code)
        if code is not None:
            result[code] = award
    return result


async def _count_team_completed_tasks(
    session: AsyncSession,
    completed_task_ids: set[UUID],
) -> int:
    if not completed_task_ids:
        return 0

    result = await session.execute(
        select(TaskApplication.task_id, func.count(TaskApplication.id))
        .where(TaskApplication.task_id.in_(completed_task_ids))
        .where(TaskApplication.status.in_(COMPLETED_APPLICATION_STATUSES))
        .group_by(TaskApplication.task_id)
    )
    return sum(1 for _task_id, applications_count in result.all() if applications_count >= 2)


def _build_achievement_statuses(
    states: list[AchievementState],
    awarded_by_code: dict[AchievementCode, UserAchievement],
) -> list[AchievementStatus]:
    return [
        AchievementStatus(
            code=state.code,
            title=state.title,
            description=state.description,
            category=state.category,
            category_label=state.category_label,
            unit=state.unit,
            unit_label=state.unit_label,
            sort_order=state.sort_order,
            is_awarded=state.code in awarded_by_code,
            awarded_at=awarded_by_code[state.code].awarded_at
            if state.code in awarded_by_code
            else None,
            progress_current=state.progress_current,
            progress_target=state.progress_target,
            progress_percent=state.progress_percent,
            remaining=state.remaining,
            is_completed=state.is_completed,
            criteria=state.criteria,
            metadata=state.metadata,
        )
        for state in states
    ]


def _select_next_achievement(
    achievements: list[AchievementStatus],
) -> AchievementStatus | None:
    candidates = [item for item in achievements if not item.is_awarded]
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda item: (
            item.progress_percent,
            -item.remaining,
            -item.sort_order,
        ),
    )


def _state(
    code: AchievementCode,
    current: Decimal | int,
    target: Decimal | int,
    metadata: dict[str, Any] | None = None,
    criteria: list[AchievementCriterion] | None = None,
) -> AchievementState:
    definition = ACHIEVEMENT_DEFINITIONS[code]
    presentation = ACHIEVEMENT_PRESENTATION.get(code, DEFAULT_PRESENTATION)
    current_decimal = _progress(current)
    target_decimal = _progress(target)
    progress_percent = _percent(current_decimal, target_decimal)
    if criteria is None:
        criteria = [
            _criterion(
                presentation.metric_key,
                "Прогресс",
                current_decimal,
                target_decimal,
                presentation.unit,
                presentation.unit_label,
            )
        ]
    return AchievementState(
        code=code,
        title=definition.title,
        description=definition.description,
        category=presentation.category,
        category_label=presentation.category_label,
        unit=presentation.unit,
        unit_label=presentation.unit_label,
        sort_order=ACHIEVEMENT_SORT_ORDER[code],
        progress_current=current_decimal,
        progress_target=target_decimal,
        progress_percent=progress_percent,
        remaining=_remaining(current_decimal, target_decimal),
        is_completed=current_decimal >= target_decimal,
        criteria=criteria,
        metadata=metadata or {},
    )


def _criterion(
    key: str,
    title: str,
    current: Decimal | int,
    target: Decimal | int,
    unit: str,
    unit_label: str,
    metadata: dict[str, Any] | None = None,
) -> AchievementCriterion:
    current_decimal = _progress(current)
    target_decimal = _progress(target)
    return AchievementCriterion(
        key=key,
        title=title,
        current=current_decimal,
        target=target_decimal,
        unit=unit,
        unit_label=unit_label,
        progress_percent=_percent(current_decimal, target_decimal),
        remaining=_remaining(current_decimal, target_decimal),
        is_completed=current_decimal >= target_decimal,
        metadata=metadata or {},
    )


def _progress(value: Decimal | int) -> Decimal:
    return Decimal(value).quantize(PROGRESS_QUANT)


def _percent(current: Decimal | int, target: Decimal | int) -> Decimal:
    target_decimal = Decimal(target)
    if target_decimal <= 0:
        return Decimal("0.00")
    return min(Decimal(current) / target_decimal * Decimal("100"), Decimal("100")).quantize(
        PROGRESS_QUANT
    )


def _remaining(current: Decimal | int, target: Decimal | int) -> Decimal:
    return max(Decimal(target) - Decimal(current), Decimal("0")).quantize(PROGRESS_QUANT)


def _is_fast_response(application: TaskApplication, task: VolunteerTask) -> bool:
    if application.created_at is None or task.published_at is None:
        return False
    try:
        response_delay = application.created_at - task.published_at
    except TypeError:
        return False
    return timedelta(0) <= response_delay <= timedelta(hours=1)


def _is_active_application(application: TaskApplication, task: VolunteerTask) -> bool:
    return application.status in ACTIVE_APPLICATION_STATUSES and task.status in ACTIVE_TASK_STATUSES


def _append_date(target: list[date], value: object | None) -> None:
    if value is not None and hasattr(value, "date"):
        target.append(value.date())


def _longest_daily_streak(dates: list[date]) -> int:
    unique_dates = sorted(set(dates))
    if not unique_dates:
        return 0

    longest = 1
    current = 1
    previous = unique_dates[0]
    for current_date in unique_dates[1:]:
        if current_date == previous + timedelta(days=1):
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        previous = current_date
    return longest


def _longest_weekly_streak(dates: list[date]) -> int:
    week_starts = sorted({item - timedelta(days=item.weekday()) for item in dates})
    if not week_starts:
        return 0

    longest = 1
    current = 1
    previous = week_starts[0]
    for week_start in week_starts[1:]:
        if week_start == previous + timedelta(days=7):
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        previous = week_start
    return longest


def _activity_span_days(dates: list[date]) -> int:
    if not dates:
        return 0
    return (max(dates) - min(dates)).days + 1


def _calculate_reliable_ratio(completed_tasks_count: int, canceled_count: int) -> Decimal:
    total_controlled = completed_tasks_count + canceled_count
    if total_controlled == 0:
        return Decimal("0")
    return (Decimal(completed_tasks_count) / Decimal(total_controlled) * Decimal("100")).quantize(
        PROGRESS_QUANT
    )


def _calculate_long_term_progress(
    *,
    total_hours: Decimal,
    completed_tasks_count: int,
    completed_dates: list[date],
    reliable_success_ratio_percent: Decimal,
    weekly_streak_weeks: int,
) -> Decimal:
    activity_days = 0
    if completed_dates:
        activity_days = _activity_span_days(completed_dates)

    progress_parts = [
        min(total_hours / Decimal("100"), Decimal("1")),
        min(Decimal(completed_tasks_count) / Decimal("10"), Decimal("1")),
        min(Decimal(activity_days) / Decimal("90"), Decimal("1")),
        min(reliable_success_ratio_percent / Decimal("90"), Decimal("1")),
        min(Decimal(weekly_streak_weeks) / Decimal("4"), Decimal("1")),
    ]
    return (min(progress_parts) * Decimal("100")).quantize(PROGRESS_QUANT)


def _enum_value(value: object) -> str:
    return value.value if hasattr(value, "value") else str(value)


def _parse_achievement_code(value: str) -> AchievementCode | None:
    try:
        return AchievementCode(value)
    except ValueError:
        return None
