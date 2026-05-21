from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import (
    ApplicationStatus,
    DurationType,
    FundStatus,
    HelpCategory,
    ParticipationFormat,
    TaskStatus,
    TaskType,
    UserRole,
)


class AdminOrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AdminUserShort(AdminOrmModel):
    id: UUID
    role: UserRole
    email: str
    avatar_url: str | None = None
    full_name: str | None = None
    city: str | None = None
    department: str | None = None
    position: str | None = None


class AdminFundListItem(AdminOrmModel):
    id: UUID
    name: str
    status: FundStatus
    logo_url: str | None = None
    cover_url: str | None = None
    inn: str | None = None
    ogrn: str | None = None
    region: str | None = None
    contact_person: str | None = None
    contact_email: str | None = None
    moderation_comment: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    approved_at: datetime | None = None


class AdminFundDocument(AdminOrmModel):
    id: UUID
    document_type: str
    file_url: str
    created_at: datetime


class AdminFundDetail(AdminFundListItem):
    description: str | None = None
    help_categories: list[str] | None = None
    website_url: str | None = None
    contact_position: str | None = None
    contact_phone: str | None = None
    planned_help: str | None = None
    representative: AdminUserShort
    documents: list[AdminFundDocument] = []


class FundModerationRequest(BaseModel):
    target_status: FundStatus
    comment: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="before")
    @classmethod
    def support_legacy_status_field(cls, data: object) -> object:
        if isinstance(data, dict) and "target_status" not in data and "status" in data:
            data = {**data, "target_status": data["status"]}
        return data

    @model_validator(mode="after")
    def require_comment_for_revision(self) -> "FundModerationRequest":
        if self.target_status in {FundStatus.NEEDS_CHANGES, FundStatus.REJECTED}:
            if not self.comment or not self.comment.strip():
                raise ValueError("comment is required for rejected or needs_changes")
        if self.comment is not None:
            self.comment = self.comment.strip()
        return self


class AdminTaskListItem(AdminOrmModel):
    id: UUID
    fund_id: UUID
    title: str
    category: HelpCategory
    participation_format: ParticipationFormat
    duration_type: DurationType
    task_type: TaskType
    city: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    deadline_at: datetime | None = None
    participant_limit: int | None = None
    expected_hours: Decimal
    image_url: str | None = None
    status: TaskStatus
    moderation_comment: str | None = None
    published_at: datetime | None = None
    closed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminTaskDetail(AdminTaskListItem):
    description: str
    location: str | None = None
    online_url: str | None = None
    requirements: str | None = None
    required_skills: list[str] | None = None
    materials_url: str | None = None
    fund: AdminFundListItem


class TaskModerationRequest(BaseModel):
    target_status: TaskStatus
    comment: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="before")
    @classmethod
    def support_legacy_fields(cls, data: object) -> object:
        if isinstance(data, dict):
            if "target_status" not in data and "status" in data:
                data = {**data, "target_status": data["status"]}
            if "comment" not in data and "moderation_comment" in data:
                data = {**data, "comment": data["moderation_comment"]}
        return data

    @model_validator(mode="after")
    def require_comment_for_revision(self) -> "TaskModerationRequest":
        if self.target_status in {TaskStatus.NEEDS_CHANGES, TaskStatus.REJECTED}:
            if not self.comment or not self.comment.strip():
                raise ValueError("comment is required for rejected or needs_changes")
        if self.comment is not None:
            self.comment = self.comment.strip()
        return self


class AdminApplicationListItem(AdminOrmModel):
    id: UUID
    task_id: UUID
    volunteer_id: UUID
    status: ApplicationStatus
    volunteer_comment: str | None = None
    fund_comment: str | None = None
    completion_comment: str | None = None
    decided_at: datetime | None = None
    completion_confirmed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminCompletionItem(AdminApplicationListItem):
    task: AdminTaskListItem
    volunteer: AdminUserShort


class AwardHoursRequest(BaseModel):
    hours: Decimal = Field(gt=0, le=999, decimal_places=2)
    admin_comment: str | None = Field(default=None, max_length=2000)


class AdminHourLedgerRead(AdminOrmModel):
    id: UUID
    application_id: UUID
    volunteer_id: UUID
    task_id: UUID
    hours: Decimal
    awarded_by: UUID
    awarded_at: datetime
    admin_comment: str | None = None


class AdminDashboardSummary(BaseModel):
    funds_total: int
    funds_pending_review: int
    tasks_total: int
    tasks_pending_review: int
    tasks_published: int
    applications_total: int
    completions_waiting_hours: int
    awarded_hours_total: Decimal


class AdminNotificationReadCount(BaseModel):
    updated_count: int


class AdminFundDirectoryItem(AdminOrmModel):
    id: UUID
    name: str
    status: FundStatus
    description: str | None = None
    categories: list[str] = []
    logo: str | None = None
    region: str | None = None
    contact_person: str | None = None
    contact_email: str | None = None
    active_tasks: int = 0
    volunteers: int = 0
    hours: Decimal = Decimal("0")
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AdminTaskDirectoryItem(AdminOrmModel):
    id: UUID
    fund_id: UUID
    fund_name: str
    title: str
    description: str
    category: HelpCategory
    participation_format: ParticipationFormat
    duration_type: DurationType
    task_type: TaskType
    city: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    deadline_at: datetime | None = None
    participant_limit: int | None = None
    filled_spots: int = 0
    available_spots: int | None = None
    applications_total: int = 0
    applications_applied: int = 0
    applications_accepted: int = 0
    applications_rejected: int = 0
    applications_canceled: int = 0
    applications_completion_confirmed: int = 0
    applications_hours_awarded: int = 0
    expected_hours: Decimal
    image_url: str | None = None
    status: TaskStatus
    created_at: datetime
    updated_at: datetime


class AdminVolunteerDirectoryItem(AdminOrmModel):
    id: UUID
    email: str
    full_name: str | None = None
    city: str | None = None
    avatar_url: str | None = None
    department: str | None = None
    position: str | None = None
    interests: list[str] | None = None
    skills: list[str] | None = None
    applications_total: int = 0
    completed_tasks: int = 0
    active_tasks: int = 0
    hours: Decimal = Decimal("0")
    created_at: datetime | None = None
