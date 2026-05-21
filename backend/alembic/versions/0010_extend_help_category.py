"""extend help_category enum

Revision ID: 0010_extend_help_category
Revises: 0009_fix_demo_password_hashes
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op


revision = "0010_extend_help_category"
down_revision = "0009_fix_demo_password_hashes"
branch_labels = None
depends_on = None


NEW_VALUES = (
    "events",
    "logistics",
    "it",
    "design",
    "legal",
    "communications",
    "content",
    "education",
    "sport",
    "targeted_help",
    "pro_bono",
)


def upgrade() -> None:
    for value in NEW_VALUES:
        op.execute(f"ALTER TYPE help_category ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # PostgreSQL cannot safely remove enum values in-place.
    pass