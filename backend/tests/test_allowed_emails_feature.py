from app.schemas.allowed_emails import AllowedEmailCreate, AllowedEmailsBulkCreate
from app.services.email_parser import normalize_email


def test_allowed_employee_email_payload_accepts_stoloto_demo_domain() -> None:
    payload = AllowedEmailCreate(email="Volunteer@Stoloto.Local")
    bulk_payload = AllowedEmailsBulkCreate(emails=["Volunteer@Stoloto.Local"])

    assert normalize_email(payload.email) == "volunteer@stoloto.local"
    assert normalize_email(bulk_payload.emails[0]) == "volunteer@stoloto.local"
