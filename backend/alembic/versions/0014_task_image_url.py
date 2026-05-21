"""add task image url

Revision ID: 0014_task_image_url
Revises: 0013_application_not_completed
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0014_task_image_url"
down_revision = "0013_application_not_completed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("volunteer_task", sa.Column("image_url", sa.String(length=700), nullable=True))


def downgrade() -> None:
    op.drop_column("volunteer_task", "image_url")
