use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{ SqlitePool, Row};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

// ---------- Types ----------

pub type CmdResult<T> = std::result::Result<T, String>;

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum TaskStatus {
    Todo,
    Started,
    InProgress,
    StageComplete,
    Completed,
    Dropped,
}
impl ToString for TaskStatus {
    fn to_string(&self) -> String {
        match self {
            TaskStatus::Todo => "todo",
            TaskStatus::Started => "started",
            TaskStatus::InProgress => "in-progress",
            TaskStatus::StageComplete => "stage-complete",
            TaskStatus::Completed => "completed",
            TaskStatus::Dropped => "dropped",
        }
        .to_string()
    }
}

#[derive(Deserialize)]
pub struct TaskInput {
    pub name: String,
    pub category: String,
    pub short_summary: Option<String>,
    pub description: Option<String>,
    pub status: TaskStatus,            // default to todo on the frontend if you want
    pub current_stage: Option<String>, // stage name
    pub start_at: Option<String>,      // ISO 8601
    pub end_est_at: Option<String>,    // ISO 8601
}

#[derive(Serialize)]
pub struct TaskRow {
    pub id: String,
    pub name: String,
    pub category: String,
    pub status: String,
    pub current_stage: Option<String>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_est_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct TaskDetail {
    pub id: String,
    pub name: String,
    pub category: String,
    pub short_summary: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub current_stage: Option<String>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_est_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct ReasonInput {
    pub task_id: String,
    pub status: TaskStatus,
    pub note: String,
}

#[derive(Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub name: Option<String>,
    pub category: Option<String>,
    pub short_summary: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub current_stage: Option<String>,
    pub start_at:  Option<DateTime<Utc>>,
    pub end_est_at:  Option<DateTime<Utc>>,
}

#[tauri::command]
pub async fn add_task(state: State<'_, AppState>, input: TaskInput) -> CmdResult<String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let pool = &state.pool;
    let status_str = input.status.to_string();


    sqlx::query!(
        r#"
        INSERT INTO tasks (
          id, name, category, short_summary, description, status, current_stage,
          start_at, end_est_at, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        "#,
        id,
        input.name,
        input.category,
        input.short_summary,
        input.description,
        status_str,
        input.current_stage,
        input.start_at,
        input.end_est_at,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn list_tasks(state: State<'_, AppState>) -> CmdResult<Vec<TaskRow>> {
    let pool: &SqlitePool = &state.pool;   // simple reference

    let rows = sqlx::query(
        r#"
        SELECT id, name, category, status, current_stage, start_at, end_est_at, updated_at
        FROM tasks
        ORDER BY updated_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;


    let tasks: Vec<TaskRow> = rows.into_iter().map(|row| TaskRow {
        id: row.get("id"),
        name: row.get("name"),
        category: row.get("category"),
        status: row.get("status"),
        current_stage: row.get::<Option<String>, _>("current_stage"),
        start_at: row.get("start_at"),
        end_est_at: row.get("end_est_at"),
        updated_at: row.get("updated_at"),
    }).collect();

    Ok(tasks)
}


#[tauri::command]
pub async fn get_task(state: State<'_, AppState>, id: String) -> CmdResult<TaskDetail> {
    let pool: &sqlx::SqlitePool = &state.pool;

    let row = sqlx::query(
        r#"
        SELECT id, name, category, short_summary, description, status, current_stage,
               start_at, end_est_at, created_at, updated_at
        FROM tasks
        WHERE id = ?
        "#
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let task = TaskDetail {
        id: row.get::<String, _>("id"),
        name: row.get::<String, _>("name"),
        category: row.get::<String, _>("category"),
        short_summary: row.get::<Option<String>, _>("short_summary"),
        description: row.get::<Option<String>, _>("description"),
        status: row.get::<String, _>("status"),
        current_stage: row.get::<Option<String>, _>("current_stage"),
        start_at: row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("start_at"),
        end_est_at: row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("end_est_at"),
        created_at: row.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
        updated_at: row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at"),
    };

    Ok(task)
}
#[tauri::command]
pub async fn set_task_status(
    state: State<'_, AppState>,
    id: String,
    status: TaskStatus,
) -> CmdResult<()> {
    let pool: &sqlx::SqlitePool = &state.pool;
    let now = Utc::now();
    let status_str = status.to_string(); // avoid temporary drop issue

    sqlx::query!(
        r#"UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3"#,
        status_str,
        now,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn add_reason(
    state: State<'_, AppState>,
    input: ReasonInput
) -> CmdResult<()> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let pool: &sqlx::SqlitePool = &state.pool;
    let status_str =  input.status.to_string();


    sqlx::query!(
        r#"
        INSERT INTO status_reasons (id, task_id, status, note, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        id,
        input.task_id,
        status_str,
        input.note,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_task(state: State<'_, AppState>, input: UpdateTaskInput) -> CmdResult<()> {
    let pool: &sqlx::SqlitePool = &state.pool;
    let now = Utc::now();

    // 1) Fetch current values
    let cur = sqlx::query(
        r#"
        SELECT
          name, category, short_summary, description, status, current_stage,
          start_at, end_est_at
        FROM tasks
        WHERE id = ?
        "#
    )
    .bind(&input.id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    // 2) Merge incoming fields with current ones
    let name: String = input.name.unwrap_or_else(|| cur.get::<String, _>("name"));
    let category: String = input.category.unwrap_or_else(|| cur.get::<String, _>("category"));
    let short_summary: Option<String> =
        input.short_summary.or(cur.get::<Option<String>, _>("short_summary"));
    let description: Option<String> =
        input.description.or(cur.get::<Option<String>, _>("description"));
    let status: String = input
        .status
        .map(|s| s.to_string())
        .unwrap_or_else(|| cur.get::<String, _>("status"));
    let current_stage: Option<String> =
        input.current_stage.or(cur.get::<Option<String>, _>("current_stage"));
    let start_at: Option<DateTime<Utc>> =
        input.start_at.or(cur.get::<Option<DateTime<Utc>>, _>("start_at"));
    let end_est_at: Option<DateTime<Utc>> =
        input.end_est_at.or(cur.get::<Option<DateTime<Utc>>, _>("end_est_at"));

    // 3) Update
    sqlx::query(
        r#"
        UPDATE tasks SET
          name = ?, category = ?, short_summary = ?, description = ?,
          status = ?, current_stage = ?, start_at = ?, end_est_at = ?,
          updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&name)
    .bind(&category)
    .bind(&short_summary)
    .bind(&description)
    .bind(&status)
    .bind(&current_stage)
    .bind(&start_at)
    .bind(&end_est_at)
    .bind(now)
    .bind(&input.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}