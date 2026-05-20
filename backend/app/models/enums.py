from enum import StrEnum


class UserRole(StrEnum):
    VOLUNTEER = "volunteer"
    FUND = "fund"
    ADMIN = "admin"


class FundStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    NEEDS_CHANGES = "needs_changes"
    REJECTED = "rejected"


class TaskStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    NEEDS_CHANGES = "needs_changes"
    REJECTED = "rejected"
    CLOSED = "closed"


class ApplicationStatus(StrEnum):
    APPLIED = "applied"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELED = "canceled"
    COMPLETION_CONFIRMED = "completion_confirmed"
    HOURS_AWARDED = "hours_awarded"


class ParticipationFormat(StrEnum):
    ONLINE = "online"
    OFFLINE = "offline"


class DurationType(StrEnum):
    ONE_TIME = "one_time"
    REGULAR = "regular"
    LONG_TERM = "long_term"


class TaskType(StrEnum):
    REGULAR = "regular"
    PRO_BONO = "pro_bono"


class HelpCategory(StrEnum):
    CHILDREN = "children"
    ELDERLY = "elderly"
    DISABILITY = "disability"
    ECOLOGY = "ecology"

