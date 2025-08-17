// src/commands/projects.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

use crate::AppState;

pub type CmdResult<T> = Result<T, String>;

// ---------- Types returned to the UI ----------

#[derive(Serialize)]
pub struct WorkspaceRow {
    pub id: String,
    pub name: String,
    pub kind: String, // personal | work | custom
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ProjectRow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String, // active | paused | archived
    pub workspace_id: String,
    pub workspace_name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ---------- Inputs from the UI ----------

#[derive(Deserialize)]
pub struct CreateWorkspaceInput {
    pub name: String,
    #[serde(default = "default_kind")]
    pub kind: String, // personal | work | custom
}
fn default_kind() -> String { "custom".into() }

#[derive(Deserialize)]
pub struct CreateProjectInput {
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(default = "default_status")]
    pub status: String, // active | paused | archived
}
fn default_status() -> String { "active".into() }

// ---------- Commands ----------

#[tauri::command]
pub async fn list_workspaces(state: State<'_, AppState>) -> CmdResult<Vec<WorkspaceRow>> {
    let pool = &state.pool;
    let rows = sqlx::query(
        r#"
        SELECT id, name, kind, created_at, updated_at
        FROM workspace
        ORDER BY
          CASE kind WHEN 'personal' THEN 0 WHEN 'work' THEN 1 ELSE 2 END,
          name
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|r| WorkspaceRow {
            id: r.get("id"),
            name: r.get("name"),
            kind: r.get("kind"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}

#[tauri::command]
pub async fn create_workspace(state: State<'_, AppState>, input: CreateWorkspaceInput) -> CmdResult<String> {
    let pool = &state.pool;
    let now = Utc::now();

    let name = input.name.trim();
    if name.is_empty() {
        return Err("Workspace name is required".into());
    }

    // pick a stable id for common cases, otherwise UUID
    let id = if input.kind == "personal" && name.eq_ignore_ascii_case("personal") {
        "ws_personal".to_string()
    } else if input.kind == "work" && name.eq_ignore_ascii_case("work") {
        "ws_work".to_string()
    } else {
        format!("ws_{}", Uuid::new_v4())
    };

    // INSERT OR IGNORE so re-creating the same one doesn't blow up
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO workspace (id, name, kind, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#
    )
    .bind(&id)
    .bind(name)
    .bind(&input.kind)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>, workspace_id: Option<String>) -> CmdResult<Vec<ProjectRow>> {
    let pool = &state.pool;

    let rows = if let Some(ws) = workspace_id {
        sqlx::query(
            r#"
            SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at,
                   w.id AS workspace_id, w.name AS workspace_name
            FROM project p
            JOIN workspace w ON w.id = p.workspace_id
            WHERE p.workspace_id = ?1
            ORDER BY w.name, p.name
            "#
        )
        .bind(ws)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query(
            r#"
            SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at,
                   w.id AS workspace_id, w.name AS workspace_name
            FROM project p
            JOIN workspace w ON w.id = p.workspace_id
            ORDER BY w.name, p.name
            "#
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    };

    Ok(rows
        .into_iter()
        .map(|r| ProjectRow {
            id: r.get("id"),
            name: r.get("name"),
            description: r.get::<Option<String>, _>("description"),
            status: r.get("status"),
            workspace_id: r.get("workspace_id"),
            workspace_name: r.get("workspace_name"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}

#[tauri::command]
pub async fn create_project(state: State<'_, AppState>, input: CreateProjectInput) -> CmdResult<String> {
    let pool = &state.pool;
    let now = Utc::now();

    let name = input.name.trim();
    if name.is_empty() {
        return Err("Project name is required".into());
    }

    // validate FK exists (nicer error than FK panic)
    let exists: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM workspace WHERE id = ?1")
        .bind(&input.workspace_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    if exists == 0 {
        return Err("Workspace not found for workspace_id".into());
    }

    let id = format!("prj_{}", Uuid::new_v4());

    sqlx::query(
        r#"
        INSERT INTO project (id, workspace_id, name, description, status, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(name)
    .bind(&input.description)
    .bind(&input.status)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}
