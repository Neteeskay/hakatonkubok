"""drop legacy mock employee table"""

from alembic import op

revision = "0004_drop_legacy_mock_employee"
down_revision = "0003_stoloto_employee_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS mock_employee CASCADE")


def downgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS mock_employee (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id VARCHAR(80) NOT NULL UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            full_name VARCHAR(255) NOT NULL,
            city VARCHAR(120),
            department VARCHAR(160),
            position VARCHAR(160),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
