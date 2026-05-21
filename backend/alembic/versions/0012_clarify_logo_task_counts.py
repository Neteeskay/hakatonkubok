"""add clarify status and fund logo

Revision ID: 0012_clarify_logo_task_counts
Revises: 0011_profile_fund_public_fields
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0012_clarify_logo_task_counts"
down_revision = "0011_profile_fund_public_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'clarify'")

    op.add_column(
        "fund",
        sa.Column("logo_url", sa.String(length=700), nullable=True),
    )

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


def downgrade() -> None:
    op.drop_constraint(
        "task_application_decided_at_required",
        "task_application",
        type_="check",
    )
    op.create_check_constraint(
        "task_application_decided_at_required",
        "task_application",
        "status NOT IN ('accepted', 'rejected', 'completion_confirmed', 'hours_awarded') OR decided_at IS NOT NULL",
    )

    op.drop_column("fund", "logo_url")