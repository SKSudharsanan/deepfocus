// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn invoke_task(task: &str) -> String {
    format!("Here is your first task, {}! !", task)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![invoke_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
