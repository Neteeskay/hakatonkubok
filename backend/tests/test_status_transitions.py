from app.models.enums import ApplicationStatus, TaskStatus
from app.services.status_transitions import APPLICATION_TRANSITIONS, TASK_TRANSITIONS


def test_task_moderation_flow() -> None:
    assert TaskStatus.PENDING_REVIEW in TASK_TRANSITIONS[TaskStatus.DRAFT]
    assert TaskStatus.PUBLISHED in TASK_TRANSITIONS[TaskStatus.PENDING_REVIEW]
    assert TaskStatus.CLOSED in TASK_TRANSITIONS[TaskStatus.PUBLISHED]


def test_hours_awarded_only_after_completion_confirmation() -> None:
    assert ApplicationStatus.HOURS_AWARDED not in APPLICATION_TRANSITIONS[ApplicationStatus.ACCEPTED]
    assert (
        ApplicationStatus.HOURS_AWARDED
        in APPLICATION_TRANSITIONS[ApplicationStatus.COMPLETION_CONFIRMED]
    )

