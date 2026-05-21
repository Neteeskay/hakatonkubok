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
    EVENTS = "events"
    LOGISTICS = "logistics"
    IT = "it"
    DESIGN = "design"
    LEGAL = "legal"
    COMMUNICATIONS = "communications"
    CONTENT = "content"
    EDUCATION = "education"
    SPORT = "sport"
    TARGETED_HELP = "targeted_help"
    PRO_BONO = "pro_bono"


class AchievementCode(StrEnum):
    FIRST_STEPS = "first_steps"
    HOURS_5 = "hours_5"
    HOURS_10 = "hours_10"
    HOURS_25 = "hours_25"
    HOURS_50 = "hours_50"
    HOURS_100 = "hours_100"
    FIRST_RESPONSE = "first_response"
    FAST_RESPONSE = "fast_response"
    ACTIVE_PARTICIPANT = "active_participant"
    REGULAR_HELPER = "regular_helper"
    GOOD_MARATHON = "good_marathon"
    ONLINE_VOLUNTEER = "online_volunteer"
    OFFLINE_HERO = "offline_hero"
    PRO_BONO_EXPERT = "pro_bono_expert"
    ECO_HERO = "eco_hero"
    CHILDREN_KINDNESS = "children_kindness"
    SUPPORT_NEARBY = "support_nearby"
    RELIABLE_VOLUNTEER = "reliable_volunteer"
    TEAM_PLAYER = "team_player"
    PROSTO_LEGEND = "prosto_legend"

