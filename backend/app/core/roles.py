from enum import StrEnum


class Role(StrEnum):
    VOLUNTEER = "volunteer"
    FUND = "fund"
    ADMIN = "admin"


ROLE_SCOPES: dict[Role, set[str]] = {
    Role.VOLUNTEER: {"tasks:read", "applications:self"},
    Role.FUND: {"fund:self", "tasks:manage-own", "applications:review-own"},
    Role.ADMIN: {"admin:moderate", "reports:read", "hours:award"},
}

