from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ApplicationStatus
from app.schemas.tasks import TaskResponse


class ApplicationVolunteerShort(BaseModel):
    id: UUID
    email: str
    full_name: str | None = None
    city: str | None = None
    department: str | None = None
    position: str | None = None

    model_config = {"from_attributes": True}


class ApplicationCreateRequest(BaseModel):
    volunteer_comment: str | None = Field(default=None, max_length=2000)


class ApplicationDecisionRequest(BaseModel):
    fund_comment: str | None = Field(default=None, max_length=2000)


class ApplicationCompletionConfirmRequest(BaseModel):
    completion_comment: str | None = Field(default=None, max_length=2000)


class ApplicationResponse(BaseModel):
    id: UUID
    task_id: UUID
    volunteer_id: UUID
    status: ApplicationStatus
    volunteer_comment: str | None = None
    fund_comment: str | None = None
    completion_comment: str | None = None
    decided_at: datetime | None = None
    canceled_at: datetime | None = None
    completion_confirmed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    task: TaskResponse | None = None
    volunteer: ApplicationVolunteerShort | None = None

    model_config = {"from_attributes": True}