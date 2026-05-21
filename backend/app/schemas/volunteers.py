from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import (
    AchievementCode,
    ApplicationStatus,
    HelpCategory,
    ParticipationFormat,
    TaskType,
)


class VolunteerAchievementCriterionResponse(BaseModel):
    key: str
    title: str
    current: Decimal
    target: Decimal
    unit: str
    unit_label: str
    progress_percent: Decimal
    remaining: Decimal
    is_completed: bool
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class VolunteerAchievementResponse(BaseModel):
    code: AchievementCode
    title: str
    description: str
    category: str | None = None
    category_label: str | None = None
    unit: str | None = None
    unit_label: str | None = None
    sort_order: int | None = None
    is_awarded: bool
    awarded_at: datetime | None = None
    progress_current: Decimal
    progress_target: Decimal
    progress_percent: Decimal | None = None
    remaining: Decimal | None = None
    is_completed: bool | None = None
    criteria: list[VolunteerAchievementCriterionResponse] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class VolunteerAchievementStatsResponse(BaseModel):
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

    model_config = {"from_attributes": True}


class VolunteerAchievementsOverviewResponse(BaseModel):
    stats: VolunteerAchievementStatsResponse
    achievements: list[VolunteerAchievementResponse]
    next_achievement: VolunteerAchievementResponse | None = None
    total_count: int
    awarded_count: int
    in_progress_count: int
    overall_progress_percent: Decimal

    model_config = {"from_attributes": True}


class VolunteerHistoryTaskResponse(BaseModel):
    id: UUID
    title: str
    category: HelpCategory
    participation_format: ParticipationFormat
    task_type: TaskType
    fund_name: str | None = None

    model_config = {"from_attributes": True}


class VolunteerHistoryItemResponse(BaseModel):
    event_type: str
    occurred_at: datetime
    title: str
    description: str | None = None
    application_id: UUID | None = None
    task: VolunteerHistoryTaskResponse | None = None
    achievement_code: AchievementCode | None = None
    status: ApplicationStatus | None = None
    hours: Decimal | None = None

    model_config = {"from_attributes": True}


class VolunteerProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    city: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    interests: list[str] | None = None
    skills: list[str] | None = None

    @field_validator("full_name", "city", "phone")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("interests", "skills")
    @classmethod
    def normalize_list(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        normalized: list[str] = []
        seen: set[str] = set()
        for item in value:
            stripped = item.strip()
            key = stripped.casefold()
            if stripped and key not in seen:
                normalized.append(stripped[:80])
                seen.add(key)
        return normalized

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "VolunteerProfileUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self
