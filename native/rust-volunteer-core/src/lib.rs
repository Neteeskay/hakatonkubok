use printpdf::{
    BuiltinFont, IndirectFontRef, Mm, PdfDocument, PdfDocumentReference, PdfLayerReference,
};
use pyo3::exceptions::{PyOSError, PyValueError};
use pyo3::prelude::*;
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const PAGE_WIDTH_MM: f32 = 210.0;
const PAGE_HEIGHT_MM: f32 = 297.0;
const PAGE_LEFT_MM: f32 = 18.0;
const PAGE_TOP_MM: f32 = 276.0;
const PAGE_BOTTOM_MM: f32 = 18.0;
const BODY_FONT_SIZE: f32 = 10.0;
const LINE_HEIGHT_MM: f32 = 6.0;

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

#[pyfunction]
fn write_analytics_summary_pdf(
    output_path: &str,
    title: &str,
    items: Vec<(String, String)>,
) -> PyResult<String> {
    let mut report = PdfReport::new(title)?;
    report.add_heading(title);
    report.add_text(&format!(
        "Generated at unix timestamp: {}",
        unix_timestamp()
    ));
    report.add_gap(6.0);

    if items.is_empty() {
        report.add_text("No analytics rows were provided.");
    } else {
        for (label, value) in items {
            report.add_key_value(&label, &value);
        }
    }

    report.save(output_path)
}

#[pyfunction]
fn write_analytics_table_pdf(
    output_path: &str,
    title: &str,
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
) -> PyResult<String> {
    if headers.is_empty() {
        return Err(PyValueError::new_err("headers must not be empty"));
    }

    let mut report = PdfReport::new(title)?;
    report.add_heading(title);
    report.add_text(&format!(
        "Generated at unix timestamp: {}",
        unix_timestamp()
    ));
    report.add_gap(6.0);
    report.add_table(headers, rows);
    report.save(output_path)
}

struct PdfReport {
    doc: PdfDocumentReference,
    font: IndirectFontRef,
    layer: PdfLayerReference,
    y_mm: f32,
}

impl PdfReport {
    fn new(title: &str) -> PyResult<Self> {
        let (doc, page, layer) =
            PdfDocument::new(title, Mm(PAGE_WIDTH_MM), Mm(PAGE_HEIGHT_MM), "Layer 1");
        let font = load_report_font(&doc)?;
        let layer = doc.get_page(page).get_layer(layer);

        Ok(Self {
            doc,
            font,
            layer,
            y_mm: PAGE_TOP_MM,
        })
    }

    fn save(self, output_path: &str) -> PyResult<String> {
        let path = Path::new(output_path);
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|err| {
                    PyOSError::new_err(format!("failed to create pdf directory: {err}"))
                })?;
            }
        }

        let file = File::create(path)
            .map_err(|err| PyOSError::new_err(format!("failed to create pdf file: {err}")))?;
        self.doc
            .save(&mut BufWriter::new(file))
            .map_err(|err| PyOSError::new_err(format!("failed to write pdf file: {err}")))?;

        Ok(output_path.to_string())
    }

    fn add_heading(&mut self, text: &str) {
        self.ensure_space(18.0);
        self.layer.use_text(
            sanitize_pdf_text(text),
            18.0,
            Mm(PAGE_LEFT_MM),
            Mm(self.y_mm),
            &self.font,
        );
        self.y_mm -= 12.0;
    }

    fn add_key_value(&mut self, label: &str, value: &str) {
        let text = format!("{label}: {value}");
        self.add_wrapped_text(&text, BODY_FONT_SIZE, 80);
    }

    fn add_text(&mut self, text: &str) {
        self.add_wrapped_text(text, BODY_FONT_SIZE, 90);
    }

    fn add_gap(&mut self, mm: f32) {
        self.y_mm -= mm;
    }

    fn add_table(&mut self, headers: Vec<String>, rows: Vec<Vec<String>>) {
        self.add_wrapped_text(&headers.join(" | "), 11.0, 78);
        self.add_wrapped_text(&"-".repeat(78), BODY_FONT_SIZE, 78);

        if rows.is_empty() {
            self.add_text("No analytics rows were provided.");
            return;
        }

        for row in rows {
            let normalized = normalize_table_row(&headers, row);
            self.add_wrapped_text(&normalized.join(" | "), BODY_FONT_SIZE, 78);
        }
    }

    fn add_wrapped_text(&mut self, text: &str, font_size: f32, max_chars: usize) {
        for line in wrap_text(text, max_chars) {
            self.ensure_space(LINE_HEIGHT_MM);
            self.layer.use_text(
                sanitize_pdf_text(&line),
                font_size,
                Mm(PAGE_LEFT_MM),
                Mm(self.y_mm),
                &self.font,
            );
            self.y_mm -= LINE_HEIGHT_MM;
        }
    }

    fn ensure_space(&mut self, needed_mm: f32) {
        if self.y_mm - needed_mm >= PAGE_BOTTOM_MM {
            return;
        }

        let (page, layer) = self
            .doc
            .add_page(Mm(PAGE_WIDTH_MM), Mm(PAGE_HEIGHT_MM), "Layer");
        self.layer = self.doc.get_page(page).get_layer(layer);
        self.y_mm = PAGE_TOP_MM;
    }
}

fn load_report_font(doc: &PdfDocumentReference) -> PyResult<IndirectFontRef> {
    for path in candidate_font_paths() {
        if path.exists() {
            if let Ok(file) = File::open(&path) {
                if let Ok(font) = doc.add_external_font(file) {
                    return Ok(font);
                }
            }
        }
    }

    doc.add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|err| PyOSError::new_err(format!("failed to load pdf font: {err}")))
}

fn candidate_font_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if cfg!(target_os = "windows") {
        paths.push(PathBuf::from(r"C:\Windows\Fonts\arial.ttf"));
        paths.push(PathBuf::from(r"C:\Windows\Fonts\calibri.ttf"));
    }

    paths.push(PathBuf::from(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ));
    paths.push(PathBuf::from(
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ));

    paths
}

fn normalize_table_row(headers: &[String], row: Vec<String>) -> Vec<String> {
    let mut normalized = row;
    normalized.truncate(headers.len());
    while normalized.len() < headers.len() {
        normalized.push(String::new());
    }
    normalized
}

fn wrap_text(text: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();

    for word in text.split_whitespace() {
        if word.chars().count() > max_chars {
            if !current.is_empty() {
                lines.push(std::mem::take(&mut current));
            }
            lines.extend(split_long_word(word, max_chars));
            continue;
        }

        let next_len =
            current.chars().count() + word.chars().count() + usize::from(!current.is_empty());
        if next_len > max_chars && !current.is_empty() {
            lines.push(std::mem::take(&mut current));
        }

        if !current.is_empty() {
            current.push(' ');
        }
        current.push_str(word);
    }

    if !current.is_empty() {
        lines.push(current);
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}

fn split_long_word(word: &str, max_chars: usize) -> Vec<String> {
    let chars: Vec<char> = word.chars().collect();
    chars
        .chunks(max_chars)
        .map(|chunk| chunk.iter().collect())
        .collect()
}

fn sanitize_pdf_text(text: &str) -> String {
    text.chars()
        .map(|ch| if ch.is_control() { ' ' } else { ch })
        .collect()
}

fn unix_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default()
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
    module.add_function(wrap_pyfunction!(write_analytics_summary_pdf, module)?)?;
    module.add_function(wrap_pyfunction!(write_analytics_table_pdf, module)?)?;
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

    #[test]
    fn writes_summary_pdf() {
        let file_path = env::temp_dir().join(format!("stoloto-summary-{}.pdf", std::process::id()));

        write_analytics_summary_pdf(
            file_path.to_str().unwrap(),
            "Platform report",
            vec![
                ("Participants".to_string(), "42".to_string()),
                ("Volunteer hours".to_string(), "128.50".to_string()),
            ],
        )
        .unwrap();

        let bytes = fs::read(&file_path).unwrap();
        fs::remove_file(file_path).unwrap();
        assert!(bytes.starts_with(b"%PDF"));
        assert!(bytes.windows(5).any(|window| window == b"%%EOF"));
    }

    #[test]
    fn writes_table_pdf() {
        let file_path = env::temp_dir().join(format!("stoloto-table-{}.pdf", std::process::id()));

        write_analytics_table_pdf(
            file_path.to_str().unwrap(),
            "Participant report",
            vec!["Name".to_string(), "Tasks".to_string(), "Hours".to_string()],
            vec![
                vec!["Ivan Petrov".to_string(), "3".to_string(), "12".to_string()],
                vec![
                    "Anna Smirnova".to_string(),
                    "2".to_string(),
                    "8".to_string(),
                ],
            ],
        )
        .unwrap();

        let bytes = fs::read(&file_path).unwrap();
        fs::remove_file(file_path).unwrap();
        assert!(bytes.starts_with(b"%PDF"));
        assert!(bytes.windows(5).any(|window| window == b"%%EOF"));
    }
}
