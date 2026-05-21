from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import FundStatus


def normalize_optional_email(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip().lower()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise ValueError("invalid email")
    return value


class FundRepresentativeResponse(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    phone: str | None

    model_config = {"from_attributes": True}


class FundDocumentResponse(BaseModel):
    id: UUID
    fund_id: UUID
    document_type: str
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FundProfileResponse(BaseModel):
    id: UUID
    representative_user_id: UUID
    name: str
    description: str | None
    help_categories: list[str] | None
    inn: str | None
    ogrn: str | None
    region: str | None
    website_url: str | None
    contact_person: str | None
    contact_position: str | None
    contact_email: str | None
    contact_phone: str | None
    planned_help: str | None
    status: FundStatus
    moderation_comment: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime
    representative: FundRepresentativeResponse | None = None
    documents: list[FundDocumentResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class FundDashboardSummary(BaseModel):
    fund_id: UUID
    fund_name: str
    fund_status: FundStatus
    tasks_total: int
    tasks_draft: int
    tasks_pending_review: int
    tasks_published: int
    tasks_needs_changes: int
    tasks_rejected: int
    tasks_closed: int
    applications_total: int
    applications_applied: int
    applications_accepted: int
    applications_rejected: int
    applications_completion_confirmed: int
    applications_hours_awarded: int
    completions_waiting_hours: int
    awarded_hours_total: Decimal


class FundUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    help_categories: list[str] | None = None
    inn: str | None = Field(default=None, max_length=12)
    ogrn: str | None = Field(default=None, max_length=15)
    region: str | None = Field(default=None, max_length=160)
    website_url: str | None = Field(default=None, max_length=500)
    contact_person: str | None = Field(default=None, max_length=255)
    contact_position: str | None = Field(default=None, max_length=160)
    contact_email: str | None = Field(default=None, max_length=320)
    contact_phone: str | None = Field(default=None, max_length=40)
    planned_help: str | None = None

    @field_validator("contact_email")
    @classmethod
    def validate_contact_email(cls, value: str | None) -> str | None:
        return normalize_optional_email(value)

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "FundUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class FundModerationRequest(BaseModel):
    status: FundStatus
    moderation_comment: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_moderation_target(self) -> "FundModerationRequest":
        allowed_statuses = {
            FundStatus.APPROVED,
            FundStatus.NEEDS_CHANGES,
            FundStatus.REJECTED,
        }
        if self.status not in allowed_statuses:
            raise ValueError("invalid moderation status")
        if self.status in {FundStatus.NEEDS_CHANGES, FundStatus.REJECTED}:
            if not self.moderation_comment or not self.moderation_comment.strip():
                raise ValueError("moderation_comment is required")
        if self.moderation_comment is not None:
            self.moderation_comment = self.moderation_comment.strip()
        return self
