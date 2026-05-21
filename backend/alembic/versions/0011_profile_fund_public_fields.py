"""add profile and public fund fields

Revision ID: 0011_profile_fund_public_fields
Revises: 0010_extend_help_category
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0011_profile_fund_public_fields"
down_revision = "0010_extend_help_category"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("app_user", sa.Column("avatar_url", sa.String(length=700), nullable=True))
    op.add_column("app_user", sa.Column("about", sa.Text(), nullable=True))
    op.add_column(
        "app_user",
        sa.Column("pro_bono_skills", postgresql.ARRAY(sa.String()), nullable=True),
    )

    op.add_column("fund", sa.Column("cover_url", sa.String(length=700), nullable=True))
    op.add_column("fund", sa.Column("socials", postgresql.JSONB(), nullable=True))
    op.add_column("fund", sa.Column("vk_url", sa.String(length=500), nullable=True))
    op.add_column("fund", sa.Column("max_url", sa.String(length=500), nullable=True))

    op.add_column(
        "fund_document",
        sa.Column(
            "is_public",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("fund_document", "is_public")

    op.drop_column("fund", "max_url")
    op.drop_column("fund", "vk_url")
    op.drop_column("fund", "socials")
    op.drop_column("fund", "cover_url")

    op.drop_column("app_user", "pro_bono_skills")
    op.drop_column("app_user", "about")
    op.drop_column("app_user", "avatar_url")