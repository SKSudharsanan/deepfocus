use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

// ---------- Types ----------
pub type CmdResult<T> = std::result::Result<T, String>;

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum IdeaStatus {
    Inbox,
    Exploring,
    Building,
    Paused,
    Shipped,
    Dropped,
}
impl ToString for IdeaStatus {
    fn to_string(&self) -> String {
        match self {
            IdeaStatus::Inbox => "inbox",
            IdeaStatus::Exploring => "exploring",
            IdeaStatus::Building => "building",
            IdeaStatus::Paused => "paused",
            IdeaStatus::Shipped => "shipped",
            IdeaStatus::Dropped => "dropped",
        }
        .to_string()
    }
}

#[derive(Deserialize)]
pub struct IdeaInput {
    pub project_id: String,
    pub title: String,
    pub summary: Option<String>,
    pub status: Option<IdeaStatus>, // default inbox if None
    pub priority: Option<i64>,      // 0..4
    pub effort_pts: Option<i64>,
    pub impact_pts: Option<i64>,
}

#[derive(Serialize)]
pub struct IdeaRow {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub status: String,
    pub priority: i64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct IdeaDetail {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub summary: Option<String>,
    pub status: String,
    pub priority: i64,
    pub effort_pts: i64,
    pub impact_pts: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct UpdateIdeaInput {
    pub id: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub status: Option<IdeaStatus>,
    pub priority: Option<i64>,
    pub effort_pts: Option<i64>,
    pub impact_pts: Option<i64>,
}

#[derive(Deserialize)]
pub struct IdeaNoteInput {
    pub idea_id: String,
    pub body_md: String,
}

#[derive(Deserialize)]
pub struct IdeaLinkInput {
    pub idea_id: String,
    pub kind: String, // ref | tweet | video | doc | other
    pub url: String,
    pub title: Option<String>,
}

#[derive(Deserialize)]
pub struct IdeaAttachmentInput {
    pub idea_id: String,
    pub filename: String,
    pub path: String,
    pub mime: Option<String>,
}

#[derive(Deserialize)]
pub struct IdeaDocLinkInput {
    pub idea_id: String,
    pub doc_id: String,
}

// create a task from an idea
#[derive(Deserialize)]
pub struct IdeaToTaskInput {
    pub idea_id: String,
    pub category: String,
    pub description: Option<String>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_est_at: Option<DateTime<Utc>>,
}

// ---------- Commands ----------

#[tauri::command]
pub async fn add_idea(state: State<'_, AppState>, input: IdeaInput) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let status = input.status.unwrap_or(IdeaStatus::Inbox).to_string();
    let priority = input.priority.unwrap_or(2);
    let effort = input.effort_pts.unwrap_or(1);
    let impact = input.impact_pts.unwrap_or(1);

    sqlx::query(
        r#"
        INSERT INTO idea (
          id, project_id, title, summary, status, priority, effort_pts, impact_pts, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&input.project_id)
    .bind(&input.title)
    .bind(&input.summary)
    .bind(&status)
    .bind(priority)
    .bind(effort)
    .bind(impact)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn list_ideas(state: State<'_, AppState>, project_id: String) -> CmdResult<Vec<IdeaRow>> {
    let pool: &SqlitePool = &state.pool;

    let rows = sqlx::query(
        r#"
        SELECT id, project_id, title, status, priority, updated_at
        FROM idea
        WHERE project_id = ?
        ORDER BY updated_at DESC
        "#,
    )
    .bind(&project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let ideas: Vec<IdeaRow> = rows
        .into_iter()
        .map(|row| IdeaRow {
            id: row.get("id"),
            project_id: row.get("project_id"),
            title: row.get("title"),
            status: row.get("status"),
            priority: row.get::<i64, _>("priority"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(ideas)
}

#[tauri::command]
pub async fn get_idea(state: State<'_, AppState>, id: String) -> CmdResult<IdeaDetail> {
    let pool: &SqlitePool = &state.pool;

    let row = sqlx::query(
        r#"
        SELECT id, project_id, title, summary, status, priority, effort_pts, impact_pts,
               created_at, updated_at
        FROM idea
        WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(IdeaDetail {
        id: row.get("id"),
        project_id: row.get("project_id"),
        title: row.get("title"),
        summary: row.get::<Option<String>, _>("summary"),
        status: row.get("status"),
        priority: row.get::<i64, _>("priority"),
        effort_pts: row.get::<i64, _>("effort_pts"),
        impact_pts: row.get::<i64, _>("impact_pts"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

#[tauri::command]
pub async fn update_idea(state: State<'_, AppState>, input: UpdateIdeaInput) -> CmdResult<()> {
    let pool: &SqlitePool = &state.pool;
    let now = Utc::now();

    let cur = sqlx::query(
        r#"
        SELECT title, summary, status, priority, effort_pts, impact_pts
        FROM idea WHERE id = ?
        "#,
    )
    .bind(&input.id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let title: String = input.title.unwrap_or_else(|| cur.get("title"));
    let summary: Option<String> = input.summary.or(cur.get::<Option<String>, _>("summary"));
    let status: String = input
        .status
        .map(|s| s.to_string())
        .unwrap_or_else(|| cur.get::<String, _>("status"));
    let priority: i64 = input.priority.unwrap_or_else(|| cur.get::<i64, _>("priority"));
    let effort: i64 = input.effort_pts.unwrap_or_else(|| cur.get::<i64, _>("effort_pts"));
    let impact: i64 = input.impact_pts.unwrap_or_else(|| cur.get::<i64, _>("impact_pts"));

    sqlx::query(
        r#"
        UPDATE idea SET
          title = ?, summary = ?, status = ?, priority = ?, effort_pts = ?, impact_pts = ?,
          updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&title)
    .bind(&summary)
    .bind(&status)
    .bind(priority)
    .bind(effort)
    .bind(impact)
    .bind(now)
    .bind(&input.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn add_idea_note(state: State<'_, AppState>, input: IdeaNoteInput) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO idea_note (id, idea_id, body_md, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&input.idea_id)
    .bind(&input.body_md)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn add_idea_link(state: State<'_, AppState>, input: IdeaLinkInput) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO idea_link (id, idea_id, kind, url, title, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&input.idea_id)
    .bind(&input.kind)
    .bind(&input.url)
    .bind(&input.title)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn add_idea_attachment(
    state: State<'_, AppState>,
    input: IdeaAttachmentInput,
) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO idea_attachment (id, idea_id, filename, path, mime, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&input.idea_id)
    .bind(&input.filename)
    .bind(&input.path)
    .bind(input.mime.unwrap_or_default())
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn link_idea_doc(state: State<'_, AppState>, input: IdeaDocLinkInput) -> CmdResult<()> {
    let pool: &SqlitePool = &state.pool;

    sqlx::query(
        r#"INSERT OR IGNORE INTO idea_doc_map (idea_id, doc_id) VALUES (?, ?)"#,
    )
    .bind(&input.idea_id)
    .bind(&input.doc_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn search_ideas(
    state: State<'_, AppState>,
    q: String,
    project_id: Option<String>,
) -> CmdResult<Vec<(String, String)>> {
    let pool: &SqlitePool = &state.pool;

    let rows = if let Some(pid) = project_id {
        sqlx::query(
            r#"
            SELECT i.id AS id, i.title AS title
            FROM idea_fts f
            JOIN idea i ON i.rowid = f.rowid
            WHERE idea_fts MATCH ? AND i.project_id = ?
            ORDER BY i.updated_at DESC
            "#,
        )
        .bind(&q)
        .bind(&pid)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query(
            r#"
            SELECT i.id AS id, i.title AS title
            FROM idea_fts f
            JOIN idea i ON i.rowid = f.rowid
            WHERE idea_fts MATCH ?
            ORDER BY i.updated_at DESC
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

/// Create a new task from an idea and link them.
#[tauri::command]
pub async fn create_task_from_idea(
    state: State<'_, AppState>,
    input: IdeaToTaskInput,
) -> CmdResult<String> {
    let pool: &SqlitePool = &state.pool;

    // 1) fetch idea
    let idea = sqlx::query(
        r#"SELECT id, project_id, title, summary FROM idea WHERE id = ?"#,
    )
    .bind(&input.idea_id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let project_id: String = idea.get("project_id");
    let title: String = idea.get("title");
    let summary: Option<String> = idea.get::<Option<String>, _>("summary");

    // 2) create task with same project (workspace inferred via join)
    let task_id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let status = "todo"; // starting status

    sqlx::query(
        r#"
        INSERT INTO tasks (
          id, name, category, short_summary, description, status, current_stage,
          start_at, end_est_at, created_at, updated_at,
          project_id, workspace_id, origin_idea_id
        )
        SELECT
          ?, ?, ?, ?, ?, ?, NULL,
          ?, ?, ?, ?,
          p.id, w.id, ?
        FROM project p
        JOIN workspace w ON w.id = p.workspace_id
        WHERE p.id = ?
        "#,
    )
    .bind(&task_id)
    .bind(&title)
    .bind(&input.category)
    .bind(&summary)
    .bind(&input.description)
    .bind(status)
    .bind(&input.start_at)
    .bind(&input.end_est_at)
    .bind(now)
    .bind(now)
    .bind(&input.idea_id)
    .bind(&project_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // 3) insert link
    sqlx::query(
        r#"INSERT OR IGNORE INTO idea_task_map (idea_id, task_id) VALUES (?, ?)"#,
    )
    .bind(&input.idea_id)
    .bind(&task_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(task_id)
}
