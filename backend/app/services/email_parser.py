import csv
import io
import re
import tempfile
from pathlib import Path

from app.native.volunteer_core import (
    has_rust_email_csv_parser,
    parse_stoloto_employee_emails_csv,
)

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")


def normalize_email(raw_email: str) -> str | None:
    value = raw_email.strip().lower()

    if not value or EMAIL_REGEX.fullmatch(value) is None:
        return None

    return value


def is_allowed_employee_email(email: str) -> bool:
    return normalize_email(email) is not None


def extract_emails_from_txt(content: str) -> list[str]:
    found = EMAIL_REGEX.findall(content)
    return list(dict.fromkeys(found))


def extract_emails_from_csv(content: str) -> list[str]:
    emails: list[str] = []

    reader = csv.reader(io.StringIO(content))

    for row in reader:
        for cell in row:
            found = EMAIL_REGEX.findall(cell)
            emails.extend(found)

    return list(dict.fromkeys(emails))


def extract_emails_from_csv_bytes(content: bytes) -> list[str]:
    rust_emails = extract_emails_from_csv_bytes_with_rust(content)
    if rust_emails is not None:
        return rust_emails

    text = content.decode("utf-8-sig", errors="ignore")
    return extract_emails_from_csv(text)


def extract_emails_from_csv_bytes_with_rust(content: bytes) -> list[str] | None:
    if not has_rust_email_csv_parser():
        return None

    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        return parse_stoloto_employee_emails_csv(str(temp_path))
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def extract_emails_from_file(filename: str, content: bytes) -> list[str]:
    text = content.decode("utf-8-sig", errors="ignore")

    filename_lower = filename.lower()

    if filename_lower.endswith(".txt"):
        return extract_emails_from_txt(text)

    if filename_lower.endswith(".csv"):
        return extract_emails_from_csv_bytes(content)

    raise ValueError("Only .txt and .csv files are supported")
