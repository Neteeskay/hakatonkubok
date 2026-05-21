"""fix demo account password hashes"""

from alembic import op

revision = "0009_fix_demo_password_hashes"
down_revision = "0007_harden_domain_models"
branch_labels = None
depends_on = None

ADMIN_HASH = (
    "pbkdf2_sha256$260000$R+Vnjna4DQrYvOoK09E4+w==$"
    "SQnQfAs/leAtgjn2CH6JAL/JFqmtFWVhODG8iDMjqoQ="
)
USER_HASH = (
    "pbkdf2_sha256$260000$X7ySAxrI6QLHhBa7CIaQEg==$"
    "C3FcPjT1P/SfJGEC4dIe+MJ8qZZfYbvxmdDqFfY8uzo="
)


def upgrade() -> None:
    op.execute(
        f"""
        UPDATE app_user
        SET password_hash = '{ADMIN_HASH}'
        WHERE username = 'admin' OR email = 'admin@stoloto.local';
        """
    )
    op.execute(
        f"""
        UPDATE app_user
        SET password_hash = '{USER_HASH}'
        WHERE email IN ('volunteer@stoloto.local', 'fund@example.org');
        """
    )


def downgrade() -> None:
    pass
