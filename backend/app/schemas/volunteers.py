from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import (
    AchievementCode,
    ApplicationStatus,
    HelpCategory,
    ParticipationFormat,
    TaskType,
)


class VolunteerAchievementResponse(BaseModel):
    code: AchievementCode
    title: str
    description: str
    is_awarded: bool
    awarded_at: datetime | None = None
    progress_current: Decimal
    progress_target: Decimal

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
