use super::{ApiResponse, DbPool};
use crate::models::{SaveSyncConfigRequest, SyncConfig, SyncResult, SyncStatus};
use crate::sync::SyncEngine;
use parking_lot::RwLock;
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::State;

/// Global sync engine state
pub struct SyncState(pub Arc<RwLock<Option<Arc<SyncEngine>>>>);

impl SyncState {
    pub fn new() -> Self {
        Self(Arc::new(RwLock::new(None)))
    }

    pub fn get_or_init(&self, pool: &SqlitePool) -> Arc<SyncEngine> {
        let mut engine = self.0.write();
        if engine.is_none() {
            *engine = Some(Arc::new(SyncEngine::new(pool.clone())));
        }
        engine.as_ref().unwrap().clone()
    }
}

impl Default for SyncState {
    fn default() -> Self {
        Self::new()
    }
}

/// Get sync configuration
#[tauri::command]
pub async fn get_sync_config(pool: State<'_, DbPool>) -> Result<ApiResponse<Option<SyncConfig>>, String> {
    let config: Option<SyncConfig> = sqlx::query_as(
        r#"
        SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token,
               sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at
        FROM sync_config WHERE id = 'default'
        "#,
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(config))
}

/// Save sync configuration
#[tauri::command]
pub async fn save_sync_config(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
    request: SaveSyncConfigRequest,
) -> Result<ApiResponse<SyncConfig>, String> {
    let now = chrono::Utc::now().to_rfc3339();

    // Determine instance URL based on sandbox flag
    let instance_url = request.sf_instance_url.unwrap_or_else(|| {
        if request.is_sandbox {
            "https://test.salesforce.com".to_string()
        } else {
            "https://login.salesforce.com".to_string()
        }
    });

    sqlx::query(
        r#"
        INSERT INTO sync_config (id, sf_client_id, sf_client_secret, sf_username, sf_password,
                                  sf_security_token, sf_instance_url, is_sandbox, sync_enabled,
                                  sync_interval_minutes, updated_at)
        VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            sf_client_id = excluded.sf_client_id,
            sf_client_secret = excluded.sf_client_secret,
            sf_username = excluded.sf_username,
            sf_password = excluded.sf_password,
            sf_security_token = excluded.sf_security_token,
            sf_instance_url = excluded.sf_instance_url,
            is_sandbox = excluded.is_sandbox,
            sync_enabled = excluded.sync_enabled,
            sync_interval_minutes = excluded.sync_interval_minutes,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&request.sf_client_id)
    .bind(&request.sf_client_secret)
    .bind(&request.sf_username)
    .bind(&request.sf_password)
    .bind(&request.sf_security_token)
    .bind(&instance_url)
    .bind(request.is_sandbox)
    .bind(request.sync_enabled)
    .bind(request.sync_interval_minutes)
    .bind(&now)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Reconfigure sync engine with new credentials
    let engine = sync_state.get_or_init(&pool.0);
    let config = SyncConfig {
        id: "default".to_string(),
        sf_client_id: Some(request.sf_client_id),
        sf_client_secret: Some(request.sf_client_secret),
        sf_username: Some(request.sf_username),
        sf_password: Some(request.sf_password),
        sf_security_token: Some(request.sf_security_token),
        sf_instance_url: Some(instance_url.clone()),
        is_sandbox: request.is_sandbox,
        sync_enabled: request.sync_enabled,
        sync_interval_minutes: request.sync_interval_minutes,
        created_at: now.clone(),
        updated_at: Some(now),
    };

    if let Err(e) = engine.configure(&config) {
        return Ok(ApiResponse::error(&format!("Config saved but failed to apply: {}", e)));
    }

    Ok(ApiResponse::success(config))
}

/// Test Salesforce connection
#[tauri::command]
pub async fn test_sf_connection(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
) -> Result<ApiResponse<String>, String> {
    let engine = sync_state.get_or_init(&pool.0);

    // Load and apply config if not already configured
    let config: Option<SyncConfig> = sqlx::query_as(
        r#"
        SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token,
               sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at
        FROM sync_config WHERE id = 'default'
        "#,
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        if let Err(e) = engine.configure(&cfg) {
            return Ok(ApiResponse::error(&e));
        }
    } else {
        return Ok(ApiResponse::error("Salesforce not configured"));
    }

    match engine.test_connection().await {
        Ok(message) => Ok(ApiResponse::success(message)),
        Err(e) => Ok(ApiResponse::error(&e)),
    }
}

/// Get sync status
#[tauri::command]
pub async fn get_sync_status(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
) -> Result<ApiResponse<SyncStatus>, String> {
    let engine = sync_state.get_or_init(&pool.0);

    match engine.get_status().await {
        Ok(status) => Ok(ApiResponse::success(status)),
        Err(e) => Ok(ApiResponse::error(&e)),
    }
}

/// Manual full sync (push + pull)
#[tauri::command]
pub async fn manual_sync(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
) -> Result<ApiResponse<SyncResult>, String> {
    let engine = sync_state.get_or_init(&pool.0);

    // Load and apply config if not already configured
    let config: Option<SyncConfig> = sqlx::query_as(
        r#"
        SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token,
               sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at
        FROM sync_config WHERE id = 'default'
        "#,
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        if let Err(e) = engine.configure(&cfg) {
            return Ok(ApiResponse::error(&e));
        }
    } else {
        return Ok(ApiResponse::error("Salesforce not configured"));
    }

    match engine.run_full_sync().await {
        Ok(result) => Ok(ApiResponse::success(result)),
        Err(e) => Ok(ApiResponse::error(&e)),
    }
}

/// Pull gold prices from Salesforce
#[tauri::command]
pub async fn pull_gold_prices_from_sf(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
) -> Result<ApiResponse<SyncResult>, String> {
    let engine = sync_state.get_or_init(&pool.0);

    // Load and apply config
    let config: Option<SyncConfig> = sqlx::query_as(
        r#"
        SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token,
               sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at
        FROM sync_config WHERE id = 'default'
        "#,
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        if let Err(e) = engine.configure(&cfg) {
            return Ok(ApiResponse::error(&e));
        }
    } else {
        return Ok(ApiResponse::error("Salesforce not configured"));
    }

    match engine.pull_gold_prices().await {
        Ok(result) => Ok(ApiResponse::success(result)),
        Err(e) => Ok(ApiResponse::error(&e)),
    }
}

/// Pull inventory from Salesforce (optionally from other branches)
#[tauri::command]
pub async fn pull_inventory_from_sf(
    pool: State<'_, DbPool>,
    sync_state: State<'_, SyncState>,
    branch_sf_id: Option<String>,
) -> Result<ApiResponse<SyncResult>, String> {
    let engine = sync_state.get_or_init(&pool.0);

    // Load and apply config
    let config: Option<SyncConfig> = sqlx::query_as(
        r#"
        SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token,
               sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at
        FROM sync_config WHERE id = 'default'
        "#,
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        if let Err(e) = engine.configure(&cfg) {
            return Ok(ApiResponse::error(&e));
        }
    } else {
        return Ok(ApiResponse::error("Salesforce not configured"));
    }

    match engine.pull_inventory(branch_sf_id.as_deref()).await {
        Ok(result) => Ok(ApiResponse::success(result)),
        Err(e) => Ok(ApiResponse::error(&e)),
    }
}

/// Toggle sync enabled/disabled
#[tauri::command]
pub async fn toggle_sync_enabled(
    pool: State<'_, DbPool>,
    enabled: bool,
) -> Result<ApiResponse<bool>, String> {
    sqlx::query("UPDATE sync_config SET sync_enabled = ?, updated_at = datetime('now') WHERE id = 'default'")
        .bind(enabled)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(enabled))
}
