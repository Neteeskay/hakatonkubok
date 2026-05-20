try:
    from rust_volunteer_core import score_task_fit as _score_task_fit
except ImportError:
    _score_task_fit = None

try:
    from rust_volunteer_core import (
        write_analytics_summary_pdf as _write_analytics_summary_pdf,
        write_analytics_table_pdf as _write_analytics_table_pdf,
    )
except ImportError:
    _write_analytics_summary_pdf = None
    _write_analytics_table_pdf = None


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
    matched_skills = set(map(str.lower, volunteer_skills)) & set(map(str.lower, task_required_skills))
    score += min(60, len(matched_skills) * 20)
    return score


def write_analytics_summary_pdf(
    output_path: str,
    title: str,
    items: list[tuple[str, str]],
) -> str:
    if _write_analytics_summary_pdf is None:
        raise RuntimeError("rust_volunteer_core is not installed; build native extension first")

    return _write_analytics_summary_pdf(output_path, title, items)


def write_analytics_table_pdf(
    output_path: str,
    title: str,
    headers: list[str],
    rows: list[list[str]],
) -> str:
    if _write_analytics_table_pdf is None:
        raise RuntimeError("rust_volunteer_core is not installed; build native extension first")

    return _write_analytics_table_pdf(output_path, title, headers, rows)
