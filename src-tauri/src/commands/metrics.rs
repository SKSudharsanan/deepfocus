// src/commands/metrics.rs
use tauri::State;
use crate::AppState;

pub type CmdResult<T> = Result<T, String>;

#[tauri::command]
pub async fn count_tasks_by_project(state: State<'_, AppState>, project_id: String) -> CmdResult<i64> {
    let pool = &state.pool;
    let n: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM tasks WHERE project_id = ?1")
        .bind(project_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(n)
}

#[tauri::command]
pub async fn count_ideas_by_project(state: State<'_, AppState>, project_id: String) -> CmdResult<i64> {
    let pool = &state.pool;
    let n: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM idea WHERE project_id = ?1")
        .bind(project_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(n)
}

#[tauri::command]
pub async fn count_docs_by_project(state: State<'_, AppState>, project_id: String) -> CmdResult<i64> {
    let pool = &state.pool;
    let n: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM doc WHERE project_id = ?1")
        .bind(project_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(n)
}
