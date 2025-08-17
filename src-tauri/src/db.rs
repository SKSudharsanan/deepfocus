use std::{fs, path::PathBuf, time::Duration};
use directories::ProjectDirs;
use sqlx::{sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous}, SqlitePool };

fn sqlite_path() -> PathBuf {
    // Change org/app names to whatever you like
    let proj = ProjectDirs::from("com", "DeepFocus", "DeepFocus")
        .expect("could not determine project dirs");
    let dir = proj.data_dir();
    print!("{:?}",dir);
    fs::create_dir_all(dir).expect("create app data dir");
    dir.join("deepfocus.db")
}

pub async fn init_pool() -> SqlitePool {
    let path = sqlite_path();
  //let url = format!("sqlite:{}", path.to_string_lossy());

    let opts = SqliteConnectOptions::new()
        .filename(&path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5)) // nice-to-have
        .foreign_keys(true);     

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await
        .unwrap_or_else(|e| {
            panic!("connect sqlite at {} failed: {e}", path.display());
        });

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("run migrations");

        sqlx::query("PRAGMA optimize;").execute(&pool).await.ok();


    pool
}