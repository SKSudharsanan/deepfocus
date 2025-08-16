use thiserror::Error;

use sqlx::SqlitePool;
use tauri::Manager; // <-- needed for .manage()

pub mod tasks;
pub mod db;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("db: {0}")] Db(#[from] sqlx::Error),
    #[error("{0}")] Other(String),
}
pub type Result<T> = std::result::Result<T, AppError>;

#[tauri::command]
fn invoke_task(task: &str) -> String {
    format!("Here is your first task, {}!", task)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize sqlx pool at startup and store in global state
            tauri::async_runtime::block_on(async {
                let pool = db::init_pool().await; // <- db::init_pool() returns SqlitePool
                app.manage(AppState {pool});
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            invoke_task,
            // tasks.rs commands
            tasks::add_task,
            tasks::list_tasks,
            tasks::get_task,
            tasks::set_task_status,
            tasks::add_reason,
            tasks::update_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}