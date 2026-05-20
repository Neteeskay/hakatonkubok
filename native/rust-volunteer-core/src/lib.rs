use pyo3::prelude::*;
use std::collections::HashSet;

#[pyfunction]
fn score_task_fit(
    volunteer_city: &str,
    volunteer_skills: Vec<String>,
    task_city: &str,
    task_required_skills: Vec<String>,
    is_online: bool,
) -> PyResult<u32> {
    let mut score = 0;

    if is_online || (!volunteer_city.is_empty() && volunteer_city.eq_ignore_ascii_case(task_city)) {
        score += 40;
    }

    let volunteer_skill_set: HashSet<String> = volunteer_skills
        .into_iter()
        .map(|skill| skill.to_lowercase())
        .collect();

    let matched = task_required_skills
        .into_iter()
        .filter(|skill| volunteer_skill_set.contains(&skill.to_lowercase()))
        .count() as u32;

    score += (matched * 20).min(60);
    Ok(score)
}

#[pymodule]
fn rust_volunteer_core(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_function(wrap_pyfunction!(score_task_fit, module)?)?;
    Ok(())
}

