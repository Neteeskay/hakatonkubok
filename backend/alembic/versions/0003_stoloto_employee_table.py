"""stoloto employee table"""

from alembic import op

revision = "0003_stoloto_employee_table"
down_revision = "0002_user_username"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('public.stoloto_employee') IS NULL
               AND to_regclass('public.mock_employee') IS NOT NULL THEN
                ALTER TABLE mock_employee RENAME TO stoloto_employee;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('public.mock_employee') IS NULL
               AND to_regclass('public.stoloto_employee') IS NOT NULL THEN
                ALTER TABLE stoloto_employee RENAME TO mock_employee;
            END IF;
        END $$;
        """
    )
