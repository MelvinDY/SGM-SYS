use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub mod schema;

pub async fn init_database(app_handle: &AppHandle) -> Result<SqlitePool, sqlx::Error> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");

    std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

    let db_path = app_dir.join("emaspos.db");
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Run migrations
    schema::run_migrations(&pool).await?;

    Ok(pool)
}

pub async fn init_database_path(db_path: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Run migrations
    schema::run_migrations(&pool).await?;

    Ok(pool)
}
