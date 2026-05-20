from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ParticipantReportRow(BaseModel):
    volunteer_id: UUID
    full_name: str | None = None
    email: str
    city: str | None = None
    department: str | None = None
    position: str | None = None
    registered_at: datetime
    applications_count: int
    completed_tasks_count: int
    awarded_hours: Decimal


class PlatformAnalyticsReport(BaseModel):
    volunteers_total: int
    funds_total: int
    funds_pending_review: int
    funds_approved: int
    tasks_total: int
    tasks_pending_review: int
    tasks_published: int
    tasks_closed: int
    applications_total: int
    accepted_applications: int
    completions_waiting_hours: int
    awarded_hours_total: Decimal
