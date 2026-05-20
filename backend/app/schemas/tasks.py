from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import (
    DurationType,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
)


class TaskFundResponse(BaseModel):
    id: UUID
    name: str
    status: str

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: UUID
    fund_id: UUID
    title: str
    description: str
    category: HelpCategory
    participation_format: ParticipationFormat
    duration_type: DurationType
    task_type: TaskType
    city: str | None
    location: str | None
    online_url: str | None
    starts_at: datetime | None
    ends_at: datetime | None
    deadline_at: datetime | None
    participant_limit: int | None
    requirements: str | None
    required_skills: list[str] | None
    expected_hours: Decimal
    materials_url: str | None
    status: TaskStatus
    moderation_comment: str | None
    published_at: datetime | None
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    fund: TaskFundResponse | None = None

    model_config = {"from_attributes": True}


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    description: str = Field(min_length=10)
    category: HelpCategory
    participation_format: ParticipationFormat
    duration_type: DurationType
    task_type: TaskType = TaskType.REGULAR
    city: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=500)
    online_url: str | None = Field(default=None, max_length=700)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    deadline_at: datetime | None = None
    participant_limit: int | None = Field(default=None, gt=0)
    requirements: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    expected_hours: Decimal = Field(gt=0, max_digits=5, decimal_places=2)
    materials_url: str | None = Field(default=None, max_length=700)

    @model_validator(mode="after")
    def validate_task_details(self) -> "TaskCreateRequest":
        validate_task_location(self.participation_format, self.city)
        validate_task_dates(self.starts_at, self.ends_at, self.deadline_at)
        return self


class TaskUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=220)
    description: str | None = Field(default=None, min_length=10)
    category: HelpCategory | None = None
    participation_format: ParticipationFormat | None = None
    duration_type: DurationType | None = None
    task_type: TaskType | None = None
    city: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=500)
    online_url: str | None = Field(default=None, max_length=700)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    deadline_at: datetime | None = None
    participant_limit: int | None = Field(default=None, gt=0)
    requirements: str | None = None
    required_skills: list[str] | None = None
    expected_hours: Decimal | None = Field(default=None, gt=0, max_digits=5, decimal_places=2)
    materials_url: str | None = Field(default=None, max_length=700)

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "TaskUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class TaskModerationRequest(BaseModel):
    status: TaskStatus
    moderation_comment: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_moderation_target(self) -> "TaskModerationRequest":
        allowed_statuses = {
            TaskStatus.PUBLISHED,
            TaskStatus.NEEDS_CHANGES,
            TaskStatus.REJECTED,
        }
        if self.status not in allowed_statuses:
            raise ValueError("invalid moderation status")
        if self.status in {TaskStatus.NEEDS_CHANGES, TaskStatus.REJECTED}:
            if not self.moderation_comment or not self.moderation_comment.strip():
                raise ValueError("moderation_comment is required")
        if self.moderation_comment is not None:
            self.moderation_comment = self.moderation_comment.strip()
        return self


def validate_task_location(
    participation_format: ParticipationFormat,
    city: str | None,
) -> None:
    if participation_format == ParticipationFormat.OFFLINE and not city:
        raise ValueError("city is required for offline task")


def validate_task_dates(
    starts_at: datetime | None,
    ends_at: datetime | None,
    deadline_at: datetime | None,
) -> None:
    if starts_at and ends_at and ends_at <= starts_at:
        raise ValueError("ends_at must be later than starts_at")
    if starts_at and deadline_at and deadline_at > starts_at:
        raise ValueError("deadline_at must not be later than starts_at")
