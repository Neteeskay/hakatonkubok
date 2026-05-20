use pyo3::exceptions::{PyOSError, PyValueError};
use pyo3::prelude::*;
use std::collections::HashSet;
use std::fs;

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

#[pyfunction]
fn parse_stoloto_employee_emails_csv(file_path: &str) -> PyResult<Vec<String>> {
    let content = fs::read_to_string(file_path).map_err(|err| {
        PyOSError::new_err(format!("failed to read csv file '{file_path}': {err}"))
    })?;

    parse_email_csv_content(&content).map_err(PyValueError::new_err)
}

fn parse_email_csv_content(content: &str) -> Result<Vec<String>, String> {
    let fields = parse_csv_fields(content)?;
    let mut seen = HashSet::new();
    let mut emails = Vec::new();

    for field in fields {
        if let Some(email) = normalize_email(&field) {
            if seen.insert(email.clone()) {
                emails.push(email);
            }
        }
    }

    Ok(emails)
}

fn parse_csv_fields(content: &str) -> Result<Vec<String>, String> {
    let mut fields = Vec::new();
    let mut field = String::new();
    let mut in_quotes = false;
    let mut chars = content.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '"' if in_quotes && chars.peek() == Some(&'"') => {
                field.push('"');
                chars.next();
            }
            '"' => in_quotes = !in_quotes,
            ',' | ';' | '\n' | '\r' if !in_quotes => {
                if ch == '\r' && chars.peek() == Some(&'\n') {
                    chars.next();
                }
                fields.push(std::mem::take(&mut field));
            }
            _ => field.push(ch),
        }
    }

    if in_quotes {
        return Err("csv contains unclosed quote".to_string());
    }

    fields.push(field);
    Ok(fields)
}

fn normalize_email(raw: &str) -> Option<String> {
    let value = raw.trim().trim_start_matches('\u{feff}').trim();
    if value.is_empty() {
        return None;
    }

    let email = value.to_ascii_lowercase();
    if is_valid_email(&email) {
        Some(email)
    } else {
        None
    }
}

fn is_valid_email(email: &str) -> bool {
    if email.len() > 320 || email.chars().any(char::is_whitespace) {
        return false;
    }

    let mut parts = email.split('@');
    let Some(local) = parts.next() else {
        return false;
    };
    let Some(domain) = parts.next() else {
        return false;
    };
    if parts.next().is_some() || local.is_empty() || domain.is_empty() {
        return false;
    }
    if local.starts_with('.') || local.ends_with('.') || local.contains("..") {
        return false;
    }

    let local_allowed = |ch: char| {
        ch.is_ascii_alphanumeric()
            || matches!(
                ch,
                '.' | '_'
                    | '%'
                    | '+'
                    | '-'
                    | '!'
                    | '#'
                    | '$'
                    | '&'
                    | '\''
                    | '*'
                    | '/'
                    | '='
                    | '?'
                    | '^'
                    | '`'
                    | '{'
                    | '|'
                    | '}'
                    | '~'
            )
    };
    if !local.chars().all(local_allowed) {
        return false;
    }

    if !domain.contains('.') || domain.starts_with('.') || domain.ends_with('.') {
        return false;
    }
    domain.split('.').all(|label| {
        !label.is_empty()
            && !label.starts_with('-')
            && !label.ends_with('-')
            && label
                .chars()
                .all(|ch| ch.is_ascii_alphanumeric() || ch == '-')
    })
}

#[pymodule]
fn rust_volunteer_core(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_function(wrap_pyfunction!(score_task_fit, module)?)?;
    module.add_function(wrap_pyfunction!(parse_stoloto_employee_emails_csv, module)?)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;

    #[test]
    fn parses_one_email_per_line_and_deduplicates() {
        let content = "\u{feff}email\nIvan@Stoloto.Local\n\nivan@stoloto.local\nanna@stoloto.local";

        let emails = parse_email_csv_content(content).unwrap();

        assert_eq!(emails, vec!["ivan@stoloto.local", "anna@stoloto.local"]);
    }

    #[test]
    fn scans_columns_and_quoted_fields() {
        let content =
            "name,email\n\"Ivan, Petrov\",ivan.petrov@stoloto.local\nAnna;anna@stoloto.local";

        let emails = parse_email_csv_content(content).unwrap();

        assert_eq!(
            emails,
            vec!["ivan.petrov@stoloto.local", "anna@stoloto.local"]
        );
    }

    #[test]
    fn ignores_invalid_email_cells() {
        let content = "not-email\n@stoloto.local\nuser@\nvalid+tag@stoloto.local";

        let emails = parse_email_csv_content(content).unwrap();

        assert_eq!(emails, vec!["valid+tag@stoloto.local"]);
    }

    #[test]
    fn reports_unclosed_quote() {
        let error = parse_email_csv_content("\"ivan@stoloto.local").unwrap_err();

        assert_eq!(error, "csv contains unclosed quote");
    }

    #[test]
    fn parses_emails_from_file() {
        let file_path = env::temp_dir().join(format!("stoloto-emails-{}.csv", std::process::id()));
        fs::write(&file_path, "email\nfile.user@stoloto.local").unwrap();

        let emails = parse_stoloto_employee_emails_csv(file_path.to_str().unwrap()).unwrap();

        fs::remove_file(file_path).unwrap();
        assert_eq!(emails, vec!["file.user@stoloto.local"]);
    }
}
