"""Demo credentials for local development and presentations."""

from app.core.security import verify_password

DEMO_ADMIN_USERNAME = "admin"
DEMO_ADMIN_PASSWORD = "admin"
DEMO_ADMIN_EMAIL = "admin@stoloto.local"

DEMO_VOLUNTEER_EMAIL = "volunteer@stoloto.local"
DEMO_FUND_EMAIL = "fund@example.org"
DEMO_USER_PASSWORD = "password123"

# Generated via hash_password(...) — keep in sync with database/seed_demo.sql
DEMO_ADMIN_PASSWORD_HASH = (
    "pbkdf2_sha256$260000$R+Vnjna4DQrYvOoK09E4+w==$"
    "SQnQfAs/leAtgjn2CH6JAL/JFqmtFWVhODG8iDMjqoQ="
)
DEMO_USER_PASSWORD_HASH = (
    "pbkdf2_sha256$260000$X7ySAxrI6QLHhBa7CIaQEg==$"
    "C3FcPjT1P/SfJGEC4dIe+MJ8qZZfYbvxmdDqFfY8uzo="
)


def is_demo_admin_credentials(login: str, password: str) -> bool:
    login_value = login.strip().lower()
    return login_value in {DEMO_ADMIN_USERNAME, DEMO_ADMIN_EMAIL} and password == DEMO_ADMIN_PASSWORD


def is_login_password_valid(login: str, password: str) -> bool:
    if not password:
        return False
    if is_demo_admin_credentials(login, password):
        return True
    return len(password) >= 6


def is_login_identifier_valid(login: str) -> bool:
    value = login.strip()
    if not value:
        return False
    if value.lower() in {DEMO_ADMIN_USERNAME, DEMO_ADMIN_EMAIL}:
        return True
    return "@" in value


def assert_demo_password_hashes() -> None:
    if not verify_password(DEMO_ADMIN_PASSWORD, DEMO_ADMIN_PASSWORD_HASH):
        raise RuntimeError("DEMO_ADMIN_PASSWORD_HASH does not match DEMO_ADMIN_PASSWORD")
    if not verify_password(DEMO_USER_PASSWORD, DEMO_USER_PASSWORD_HASH):
        raise RuntimeError("DEMO_USER_PASSWORD_HASH does not match DEMO_USER_PASSWORD")
