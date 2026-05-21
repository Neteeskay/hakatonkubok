from pathlib import Path

from app.schemas.allowed_emails import AllowedEmailCreate, AllowedEmailsBulkCreate
from app.services import email_parser
from app.services.email_parser import extract_emails_from_file, normalize_email


def test_allowed_employee_email_payload_accepts_stoloto_demo_domain() -> None:
    payload = AllowedEmailCreate(email="Volunteer@Stoloto.Local")
    bulk_payload = AllowedEmailsBulkCreate(emails=["Volunteer@Stoloto.Local"])

    assert normalize_email(payload.email) == "volunteer@stoloto.local"
    assert normalize_email(bulk_payload.emails[0]) == "volunteer@stoloto.local"


def test_csv_import_uses_rust_parser_when_available(monkeypatch) -> None:
    def fake_parse_stoloto_employee_emails_csv(file_path: str) -> list[str]:
        assert "Ivan@Stoloto.Local" in Path(file_path).read_text(encoding="utf-8-sig")
        return ["ivan@stoloto.local", "anna@stoloto.local"]

    monkeypatch.setattr(email_parser, "has_rust_email_csv_parser", lambda: True)
    monkeypatch.setattr(
        email_parser,
        "parse_stoloto_employee_emails_csv",
        fake_parse_stoloto_employee_emails_csv,
    )

    emails = extract_emails_from_file(
        "employees.csv",
        "email\nIvan@Stoloto.Local\nAnna@Stoloto.Local".encode(),
    )

    assert emails == ["ivan@stoloto.local", "anna@stoloto.local"]


def test_csv_import_falls_back_to_python_parser(monkeypatch) -> None:
    monkeypatch.setattr(email_parser, "has_rust_email_csv_parser", lambda: False)

    emails = extract_emails_from_file(
        "employees.csv",
        b"email\nIvan@Stoloto.Local\nIvan@Stoloto.Local\nAnna@Stoloto.Local",
    )

    assert emails == ["Ivan@Stoloto.Local", "Anna@Stoloto.Local"]
