"""add not completed application status

Revision ID: 0013_application_not_completed
Revises: 0012_clarify_logo_task_counts
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op


revision = "0013_application_not_completed"
down_revision = "0012_clarify_logo_task_counts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'not_completed'")

    op.drop_constraint(
        "task_application_decided_at_required",
        "task_application",
        type_="check",
    )
    op.create_check_constraint(
        "task_application_decided_at_required",
        "task_application",
        "status NOT IN ('clarify', 'accepted', 'rejected', 'not_completed', 'completion_confirmed', 'hours_awarded') OR decided_at IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "task_application_decided_at_required",
        "task_application",
        type_="check",
    )
    op.create_check_constraint(
        "task_application_decided_at_required",
        "task_application",
        "status NOT IN ('clarify', 'accepted', 'rejected', 'completion_confirmed', 'hours_awarded') OR decided_at IS NOT NULL",
    )
