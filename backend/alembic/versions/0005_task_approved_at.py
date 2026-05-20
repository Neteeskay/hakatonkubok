"""add task approved_at"""

from alembic import op


revision = "0005_task_approved_at"
down_revision = "0004_drop_legacy_mock_employee"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE volunteer_task
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

        UPDATE volunteer_task
        SET approved_at = published_at
        WHERE approved_at IS NULL
          AND published_at IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE volunteer_task
        DROP COLUMN IF EXISTS approved_at;
        """
    )