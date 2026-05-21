from enum import StrEnum
from typing import TypeVar

from app.models.enums import ApplicationStatus, FundStatus, TaskStatus

StatusT = TypeVar("StatusT", bound=StrEnum)


FUND_TRANSITIONS: dict[FundStatus, set[FundStatus]] = {
    FundStatus.DRAFT: {FundStatus.PENDING_REVIEW},
    FundStatus.PENDING_REVIEW: {FundStatus.APPROVED, FundStatus.NEEDS_CHANGES, FundStatus.REJECTED},
    FundStatus.NEEDS_CHANGES: {FundStatus.PENDING_REVIEW},
    FundStatus.APPROVED: set(),
    FundStatus.REJECTED: set(),
}

TASK_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.DRAFT: {TaskStatus.PENDING_REVIEW},
    TaskStatus.PENDING_REVIEW: {TaskStatus.PUBLISHED, TaskStatus.NEEDS_CHANGES, TaskStatus.REJECTED},
    TaskStatus.NEEDS_CHANGES: {TaskStatus.PENDING_REVIEW},
    TaskStatus.PUBLISHED: {TaskStatus.CLOSED},
    TaskStatus.REJECTED: set(),
    TaskStatus.CLOSED: set(),
}

APPLICATION_TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.APPLIED: {
        ApplicationStatus.CLARIFY,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.CANCELED,
    },
    ApplicationStatus.CLARIFY: {
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.CANCELED,
    },
    ApplicationStatus.ACCEPTED: {ApplicationStatus.COMPLETION_CONFIRMED},
    ApplicationStatus.COMPLETION_CONFIRMED: {ApplicationStatus.HOURS_AWARDED},
    ApplicationStatus.REJECTED: set(),
    ApplicationStatus.CANCELED: set(),
    ApplicationStatus.HOURS_AWARDED: set(),
}


def can_transition(current: StatusT, target: StatusT, graph: dict[StatusT, set[StatusT]]) -> bool:
    return target in graph[current]
