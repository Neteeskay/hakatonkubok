from app.core.demo_accounts import (
    DEMO_ADMIN_PASSWORD,
    DEMO_ADMIN_PASSWORD_HASH,
    DEMO_USER_PASSWORD,
    DEMO_USER_PASSWORD_HASH,
    assert_demo_password_hashes,
    is_demo_admin_credentials,
    is_login_password_valid,
)
from app.core.security import verify_password


def test_demo_password_hashes_match_plaintext() -> None:
    assert_demo_password_hashes()


def test_demo_admin_credentials_accepted() -> None:
    assert is_demo_admin_credentials("admin", "admin")
    assert is_demo_admin_credentials("admin@stoloto.local", "admin")


def test_demo_admin_password_bypasses_min_length_rule() -> None:
    assert is_login_password_valid("admin", "admin")
    assert not is_login_password_valid("user@stoloto.ru", "admin")


def test_seed_hashes_verify() -> None:
    assert verify_password(DEMO_ADMIN_PASSWORD, DEMO_ADMIN_PASSWORD_HASH)
    assert verify_password(DEMO_USER_PASSWORD, DEMO_USER_PASSWORD_HASH)
