"""user username"""

from alembic import op

revision = "0002_user_username"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE app_user ADD COLUMN IF NOT EXISTS username VARCHAR(80) UNIQUE")
    op.execute("CREATE INDEX IF NOT EXISTS ix_app_user_username ON app_user (username)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_app_user_username")
    op.execute("ALTER TABLE app_user DROP COLUMN IF EXISTS username")
