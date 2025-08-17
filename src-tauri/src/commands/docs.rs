use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::Uuid;
use base64::Engine;

use crate::AppState;

// ---------- Types ----------
pub type CmdResult<T> = std::result::Result<T, String>;

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum DocStatus {
    Draft,
    InReview,
    Published,
}
impl ToString for DocStatus {
    fn to_string(&self) -> String {
        match self {
            DocStatus::Draft => "draft",
            DocStatus::InReview => "in_review",
            DocStatus::Published => "published",
        }
        .to_string()
    }
}

#[derive(Deserialize)]
pub struct DocInput {
    pub project_id: String,
    pub title: String,
    pub slug: Option<String>,
    pub body_md: String,
    pub cover_path: Option<String>,
    pub status: Option<DocStatus>, // default draft
}

#[derive(Serialize)]
pub struct DocRow {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub slug: Option<String>,
    pub status: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct DocDetail {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub slug: Option<String>,
    pub body_md: String,
    pub body_html: String,
    pub cover_path: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct UpdateDocBodyInput {
    pub id: String,
    pub body_md: String,
}

#[derive(Deserialize)]
pub struct UpdateDocMetaInput {
    pub id: String,
    pub title: Option<String>,
    pub slug: Option<String>,
    pub cover_path: Option<String>,
    pub status: Option<DocStatus>,
}

#[derive(Deserialize)]
pub struct SaveDocAttachmentInput {
    pub doc_id: String,
    pub filename: String,
    pub bytes_base64: String,
    pub mime: Option<String>,
}

// ---------- Commands ----------

#[tauri::command]
pub async fn add_doc(state: State<'_, AppState>, input: DocInput) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    // client-side renders markdown; keep html = md as a cache
    let body_html = input.body_md.clone();
    let status = input.status.unwrap_or(DocStatus::Draft).to_string();

    sqlx::query(
        r#"
        INSERT INTO doc (
          id, project_id, title, slug, body_md, body_html, cover_path, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&input.project_id)
    .bind(&input.title)
    .bind(&input.slug)
    .bind(&input.body_md)
    .bind(&body_html)
    .bind(input.cover_path.unwrap_or_default())
    .bind(status)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // initial version snapshot
    sqlx::query(
        r#"INSERT INTO doc_version (id, doc_id, body_md, created_at) VALUES (?, ?, ?, ?)"#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&id)
    .bind(&input.body_md)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn list_docs(state: State<'_, AppState>, project_id: String) -> CmdResult<Vec<DocRow>> {
    let pool: &SqlitePool = &state.pool;

    let rows = sqlx::query(
        r#"
        SELECT id, project_id, title, slug, status, updated_at
        FROM doc
        WHERE project_id = ?
        ORDER BY updated_at DESC
        "#,
    )
    .bind(&project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let docs: Vec<DocRow> = rows
        .into_iter()
        .map(|row| DocRow {
            id: row.get("id"),
            project_id: row.get("project_id"),
            title: row.get("title"),
            slug: row.get::<Option<String>, _>("slug"),
            status: row.get("status"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(docs)
}

#[tauri::command]
pub async fn get_doc(state: State<'_, AppState>, id: String) -> CmdResult<DocDetail> {
    let pool: &SqlitePool = &state.pool;

    let row = sqlx::query(
        r#"
        SELECT id, project_id, title, slug, body_md, body_html, cover_path, status, created_at, updated_at
        FROM doc WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DocDetail {
        id: row.get("id"),
        project_id: row.get("project_id"),
        title: row.get("title"),
        slug: row.get::<Option<String>, _>("slug"),
        body_md: row.get("body_md"),
        body_html: row.get("body_html"),
        cover_path: {
            let s: String = row.get("cover_path");
            if s.is_empty() { None } else { Some(s) }
        },
        status: row.get("status"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

#[tauri::command]
pub async fn update_doc_body(
    state: State<'_, AppState>,
    input: UpdateDocBodyInput,
) -> CmdResult<()> {
    let pool: &SqlitePool = &state.pool;
    let now = Utc::now();

    // naive html = md (client renders)
    let body_html = input.body_md.clone();

    sqlx::query(
        r#"
        UPDATE doc SET body_md = ?, body_html = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&input.body_md)
    .bind(&body_html)
    .bind(now)
    .bind(&input.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // version snapshot
    sqlx::query(
        r#"INSERT INTO doc_version (id, doc_id, body_md, created_at) VALUES (?, ?, ?, ?)"#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&input.id)
    .bind(&input.body_md)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_doc_meta(
    state: State<'_, AppState>,
    input: UpdateDocMetaInput,
) -> CmdResult<()> {
    let pool: &SqlitePool = &state.pool;
    let now = Utc::now();

    let cur = sqlx::query(
        r#"
        SELECT title, slug, cover_path, status
        FROM doc WHERE id = ?
        "#,
    )
    .bind(&input.id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let title: String = input.title.unwrap_or_else(|| cur.get("title"));
    let slug: Option<String> = input.slug.or(cur.get::<Option<String>, _>("slug"));
    let cover_path: String = input
        .cover_path
        .or_else(|| {
            let s: String = cur.get("cover_path");
            if s.is_empty() { None } else { Some(s) }
        })
        .unwrap_or_default();
    let status: String = input
        .status
        .map(|s| s.to_string())
        .unwrap_or_else(|| cur.get::<String, _>("status"));

    sqlx::query(
        r#"
        UPDATE doc SET title = ?, slug = ?, cover_path = ?, status = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&title)
    .bind(&slug)
    .bind(&cover_path)
    .bind(&status)
    .bind(now)
    .bind(&input.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn search_docs(
    state: State<'_, AppState>,
    q: String,
    project_id: Option<String>,
) -> CmdResult<Vec<(String, String)>> {
    let pool: &SqlitePool = &state.pool;

    let rows = if let Some(pid) = project_id {
        sqlx::query(
            r#"
            SELECT d.id AS id, d.title AS title
            FROM doc_fts f
            JOIN doc d ON d.rowid = f.rowid
            WHERE doc_fts MATCH ? AND d.project_id = ?
            ORDER BY d.updated_at DESC
            "#,
        )
        .bind(&q)
        .bind(&pid)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query(
            r#"
            SELECT d.id AS id, d.title AS title
            FROM doc_fts f
            JOIN doc d ON d.rowid = f.rowid
            WHERE doc_fts MATCH ?
            ORDER BY d.updated_at DESC
            "#,
        )
        .bind(&q)
        .fetch_all(pool)
        .await
    }
    .map_err(|e| e.to_string())?;

    let out = rows
        .into_iter()
        .map(|r| (r.get::<String, _>("id"), r.get::<String, _>("title")))
        .collect();

    Ok(out)
}

/// Save a binary attachment to disk and create a doc_attachment row.
/// Frontend should then render it in Markdown using `convertFileSrc(path)`.
#[tauri::command]
pub async fn save_doc_attachment(
    state: State<'_, AppState>,
    input: SaveDocAttachmentInput,
) -> CmdResult<String> {
    

    let pool: &SqlitePool = &state.pool;
    let dir = state.app_dir.join("attachments").join(&input.doc_id);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join(&input.filename);
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&input.bytes_base64)
        .map_err(|e| e.to_string())?;
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;

    sqlx::query(
        r#"INSERT INTO doc_attachment (id, doc_id, filename, path, mime, created_at) VALUES (?, ?, ?, ?, ?, ?)"#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&input.doc_id)
    .bind(&input.filename)
    .bind(path.to_string_lossy().to_string())
    .bind(input.mime.unwrap_or_default())
    .bind(Utc::now())
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}
