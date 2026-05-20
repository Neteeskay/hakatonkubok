from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import FundStatus, UserRole


def normalize_email(value: str) -> str:
    value = value.strip().lower()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise ValueError("invalid email")
    return value


class VolunteerRegisterRequest(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    city: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    employee_id: str | None = Field(default=None, max_length=80)
    department: str | None = Field(default=None, max_length=160)
    position: str | None = Field(default=None, max_length=160)
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class FundRegisterRequest(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=128)
    representative_full_name: str = Field(min_length=2, max_length=255)
    representative_phone: str | None = Field(default=None, max_length=40)

    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    help_categories: list[str] = Field(default_factory=list)
    inn: str | None = Field(default=None, max_length=12)
    ogrn: str | None = Field(default=None, max_length=15)
    region: str | None = Field(default=None, max_length=160)
    website_url: str | None = Field(default=None, max_length=500)
    contact_person: str | None = Field(default=None, max_length=255)
    contact_position: str | None = Field(default=None, max_length=160)
    contact_email: str | None = Field(default=None, max_length=320)
    contact_phone: str | None = Field(default=None, max_length=40)
    planned_help: str | None = None

    @field_validator("email", "contact_email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_email(value)


class LoginRequest(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    id: UUID
    role: UserRole
    email: str
    full_name: str | None
    city: str | None
    employee_id: str | None
    department: str | None
    position: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FundResponse(BaseModel):
    id: UUID
    name: str
    status: FundStatus
    moderation_comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VolunteerRegisterResponse(BaseModel):
    user: UserResponse


class FundRegisterResponse(BaseModel):
    user: UserResponse
    fund: FundResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

