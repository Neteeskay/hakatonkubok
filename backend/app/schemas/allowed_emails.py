from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AllowedEmailCreate(BaseModel):
    email: str = Field(max_length=320)


class AllowedEmailsBulkCreate(BaseModel):
    emails: list[str] = Field(min_length=1, max_length=1000)


class AllowedEmailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    employee_id: str
    full_name: str
    city: str | None = None
    department: str | None = None
    position: str | None = None
    is_active: bool
    created_at: datetime


class AllowedEmailsImportResult(BaseModel):
    added_count: int
    skipped_duplicates_count: int
    invalid_count: int
    forbidden_domain_count: int
    added_emails: list[str]
    skipped_duplicates: list[str]
    invalid_values: list[str]
    forbidden_domain_emails: list[str]
