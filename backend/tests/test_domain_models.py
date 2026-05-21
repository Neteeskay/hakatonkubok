from app.models.domain import (
    Fund,
    FundDocument,
    Notification,
    ReportExport,
    TaskApplication,
    User,
    UserAchievement,
    VolunteerHourLedger,
    VolunteerTask,
)


def test_task_approved_at_is_nullable_until_publication() -> None:
    assert VolunteerTask.__table__.c.approved_at.nullable is True


def test_child_entities_use_delete_cascade_where_parent_owns_them() -> None:
    assert _foreign_key_ondelete(Fund, "representative_user_id", "app_user") == "CASCADE"
    assert _foreign_key_ondelete(FundDocument, "fund_id") == "CASCADE"
    assert _foreign_key_ondelete(VolunteerTask, "fund_id", "fund") == "CASCADE"
    assert _foreign_key_ondelete(TaskApplication, "task_id") == "CASCADE"
    assert _foreign_key_ondelete(TaskApplication, "volunteer_id", "app_user") == "CASCADE"
    assert _foreign_key_ondelete(
        VolunteerHourLedger,
        "application_id",
        "task_application",
    ) == "CASCADE"
    assert _foreign_key_ondelete(
        VolunteerHourLedger,
        "volunteer_id",
        "app_user",
    ) == "CASCADE"
    assert _foreign_key_ondelete(
        VolunteerHourLedger,
        "task_id",
        "volunteer_task",
    ) == "CASCADE"
    assert _foreign_key_ondelete(UserAchievement, "user_id") == "CASCADE"
    assert _foreign_key_ondelete(Notification, "user_id") == "CASCADE"
    assert _foreign_key_ondelete(ReportExport, "requested_by") == "CASCADE"


def test_domain_check_constraints_are_declared_in_models() -> None:
    user_constraints = _constraint_names(User)
    fund_constraints = _constraint_names(Fund)
    task_constraints = _constraint_names(VolunteerTask)
    application_constraints = _constraint_names(TaskApplication)
    hour_constraints = _constraint_names(VolunteerHourLedger)
    achievement_constraints = _constraint_names(UserAchievement)

    assert "app_user_volunteer_employee_required" in user_constraints
    assert "fund_approved_at_required" in fund_constraints
    assert "fund_moderation_comment_required" in fund_constraints
    assert "task_expected_hours_positive" in task_constraints
    assert "task_dates_order_valid" in task_constraints
    assert "task_deadline_before_start_valid" in task_constraints
    assert "task_published_dates_required" in task_constraints
    assert "task_closed_at_required" in task_constraints
    assert "task_moderation_comment_required" in task_constraints
    assert "task_application_canceled_at_required" in application_constraints
    assert "task_application_decided_at_required" in application_constraints
    assert "task_application_completion_at_required" in application_constraints
    assert "task_application_identity_user_task_key" in application_constraints
    assert "hour_ledger_hours_positive" in hour_constraints
    assert "volunteer_hour_ledger_application_consistency_fkey" in hour_constraints
    assert "user_achievement_code_valid" in achievement_constraints
    assert "user_achievement_progress_valid" in achievement_constraints


def test_history_and_report_indexes_are_declared_in_models() -> None:
    assert "volunteer_task_fund_status_idx" in _index_names(VolunteerTask)
    assert "task_application_volunteer_created_idx" in _index_names(TaskApplication)
    assert "hour_ledger_volunteer_awarded_idx" in _index_names(VolunteerHourLedger)
    assert "notification_user_created_idx" in _index_names(Notification)
    assert "report_export_requester_created_idx" in _index_names(ReportExport)


def test_owned_relationships_have_delete_orphan_cascade() -> None:
    assert _relationship_has_delete_orphan(User, "fund") is True
    assert _relationship_has_delete_orphan(User, "applications") is True
    assert _relationship_has_delete_orphan(User, "achievements") is True
    assert _relationship_has_delete_orphan(User, "notifications") is True
    assert _relationship_has_delete_orphan(Fund, "tasks") is True
    assert _relationship_has_delete_orphan(VolunteerTask, "applications") is True
    assert _relationship_has_delete_orphan(TaskApplication, "hour_ledger") is True


def _foreign_key_ondelete(
    model: type,
    column_name: str,
    referred_table: str | None = None,
) -> str | None:
    foreign_keys = list(model.__table__.c[column_name].foreign_keys)
    if referred_table is not None:
        foreign_keys = [
            foreign_key
            for foreign_key in foreign_keys
            if foreign_key.column.table.name == referred_table
        ]
    assert len(foreign_keys) == 1
    return foreign_keys[0].ondelete


def _constraint_names(model: type) -> set[str]:
    return {constraint.name for constraint in model.__table__.constraints if constraint.name}


def _index_names(model: type) -> set[str]:
    return {index.name for index in model.__table__.indexes if index.name}


def _relationship_has_delete_orphan(model: type, relationship_name: str) -> bool:
    relationship = getattr(model, relationship_name).property
    return "delete-orphan" in relationship.cascade
