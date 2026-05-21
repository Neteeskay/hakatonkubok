try:
    from rust_volunteer_core import score_task_fit as _score_task_fit
except ImportError:
    _score_task_fit = None

try:
    from rust_volunteer_core import (
        parse_stoloto_employee_emails_csv as _parse_stoloto_employee_emails_csv,
    )
except ImportError:
    _parse_stoloto_employee_emails_csv = None


def has_rust_email_csv_parser() -> bool:
    return _parse_stoloto_employee_emails_csv is not None


def parse_stoloto_employee_emails_csv(file_path: str) -> list[str] | None:
    if _parse_stoloto_employee_emails_csv is None:
        return None

    return list(_parse_stoloto_employee_emails_csv(file_path))


def score_task_fit(
    *,
    volunteer_city: str | None,
    volunteer_skills: list[str],
    task_city: str | None,
    task_required_skills: list[str],
    is_online: bool,
) -> int:
    if _score_task_fit is not None:
        return int(
            _score_task_fit(
                volunteer_city or "",
                volunteer_skills,
                task_city or "",
                task_required_skills,
                is_online,
            )
        )

    score = 0
    if is_online or (volunteer_city and task_city and volunteer_city.lower() == task_city.lower()):
        score += 40
    matched_skills = set(map(str.lower, volunteer_skills)) & set(
        map(str.lower, task_required_skills)
    )
    score += min(60, len(matched_skills) * 20)
    return score
