from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AllowedEmailCreate(BaseModel):
    email: EmailStr


class AllowedEmailsBulkCreate(BaseModel):
    emails: list[EmailStr] = Field(min_length=1, max_length=1000)


class AllowedEmailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    source: str
    added_by: UUID | None
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