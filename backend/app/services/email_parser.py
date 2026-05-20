import csv
import io
import re
from email_validator import EmailNotValidError, validate_email

ALLOWED_EMAIL_DOMAINS = {
    "mail.ru", "gmail.com"
}


EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
)


def normalize_email(raw_email: str) -> str | None:
    value = raw_email.strip().lower()

    if not value:
        return None

    try:
        result = validate_email(value, check_deliverability=False)
    except EmailNotValidError:
        return None

    return result.normalized.lower()


def is_allowed_employee_email(email: str) -> bool:
    domain = email.split("@")[-1].lower()
    return domain in ALLOWED_EMAIL_DOMAINS


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


def extract_emails_from_file(filename: str, content: bytes) -> list[str]:
    text = content.decode("utf-8-sig", errors="ignore")

    filename_lower = filename.lower()

    if filename_lower.endswith(".txt"):
        return extract_emails_from_txt(text)

    if filename_lower.endswith(".csv"):
        return extract_emails_from_csv(text)

    raise ValueError("Only .txt and .csv files are supported")