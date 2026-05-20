"""add user achievements"""

from alembic import op


revision = "0006_user_achievements"
down_revision = "0005_task_approved_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_achievement (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
            achievement_code VARCHAR(80) NOT NULL,
            progress_current NUMERIC(10, 2) NOT NULL DEFAULT 0,
            progress_target NUMERIC(10, 2) NOT NULL DEFAULT 1,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT user_achievement_user_code_key UNIQUE (user_id, achievement_code)
        );

        CREATE INDEX IF NOT EXISTS user_achievement_user_idx
            ON user_achievement (user_id);
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_achievement CASCADE")
