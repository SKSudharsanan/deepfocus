use thiserror::Error;

use sqlx::SqlitePool;
use tauri::Manager;
use std::path::PathBuf;
use directories::ProjectDirs;

 // <-- needed for .manage()

pub mod commands{
    pub mod tasks;
    pub mod ideas;
    pub mod docs;
    pub mod projects;
    pub mod metrics;
}
pub mod db;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub app_dir: PathBuf,
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
             let proj = ProjectDirs::from("com", "DeepFocus", "DeepFocus")
                .expect("could not determine project dirs");
            let app_dir = proj.data_dir().to_path_buf();
            std::fs::create_dir_all(&app_dir).ok();

            // Initialize sqlx pool at startup and store in global state
            tauri::async_runtime::block_on(async {
                let pool = db::init_pool().await; // <- db::init_pool() returns SqlitePool
                app.manage(AppState {pool, app_dir});
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            invoke_task,
            // tasks.rs commands
            commands::tasks::add_task,
            commands::tasks::list_tasks,
            commands::tasks::get_task,
            commands::tasks::set_task_status,
            commands::tasks::add_reason,
            commands::tasks::update_task,
             // IDEAS
            commands::ideas::add_idea,
            commands::ideas::list_ideas,
            commands::ideas::get_idea,
            commands::ideas::update_idea,
            commands::ideas::add_idea_note,
            commands::ideas::add_idea_link,
            commands::ideas::add_idea_attachment,
            commands::ideas::link_idea_doc,
            commands::ideas::search_ideas,
            commands::ideas::create_task_from_idea,
            // DOCS
            commands::docs::add_doc,
            commands::docs::list_docs,
            commands::docs::get_doc,
            commands::docs::update_doc_body,
            commands::docs::update_doc_meta,
            commands::docs::search_docs,
            commands::docs::save_doc_attachment,
            //project
            commands::projects::list_workspaces,
            commands::projects::create_workspace,
            commands::projects::list_projects,
            commands::projects::create_project,
            //metrics 
            commands::metrics::count_tasks_by_project,
            commands::metrics::count_ideas_by_project,
            commands::metrics::count_docs_by_project,
              // <-- save file to disk + db row
 // <-- idea → task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}