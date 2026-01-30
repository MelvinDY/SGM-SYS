use super::change_tracker::ChangeTracker;
use super::pull::PullSync;
use super::push::PushSync;
use crate::models::{SyncConfig, SyncResult, SyncStatus};
use crate::salesforce::api::SalesforceApi;
use crate::salesforce::auth::{SalesforceCredentials, TokenManager};
use crate::salesforce::client::SalesforceClient;
use parking_lot::RwLock;
use sqlx::SqlitePool;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::interval;

/// Sync engine orchestrating push and pull operations
pub struct SyncEngine {
    pool: SqlitePool,
    token_manager: Arc<TokenManager>,
    client: Arc<SalesforceClient>,
    api: Arc<SalesforceApi>,
    push_sync: Arc<PushSync>,
    pull_sync: Arc<PullSync>,
    tracker: Arc<ChangeTracker>,
    is_syncing: Arc<RwLock<bool>>,
    last_error: Arc<RwLock<Option<String>>>,
}

impl SyncEngine {
    pub fn new(pool: SqlitePool) -> Self {
        let token_manager = Arc::new(TokenManager::new());
        let client = Arc::new(SalesforceClient::new(token_manager.clone()));
        let api = Arc::new(SalesforceApi::new(client.clone()));
        let push_sync = Arc::new(PushSync::new(pool.clone(), api.clone()));
        let pull_sync = Arc::new(PullSync::new(pool.clone(), api.clone()));
        let tracker = Arc::new(ChangeTracker::new(pool.clone()));

        Self {
            pool,
            token_manager,
            client,
            api,
            push_sync,
            pull_sync,
            tracker,
            is_syncing: Arc::new(RwLock::new(false)),
            last_error: Arc::new(RwLock::new(None)),
        }
    }

    /// Configure Salesforce credentials
    pub fn configure(&self, config: &SyncConfig) -> Result<(), String> {
        if config.sf_client_id.is_none() || config.sf_client_secret.is_none() {
            return Err("Missing Salesforce credentials".to_string());
        }

        let credentials = SalesforceCredentials::new(
            config.sf_client_id.clone().unwrap(),
            config.sf_client_secret.clone().unwrap(),
            config.sf_username.clone().unwrap_or_default(),
            config.sf_password.clone().unwrap_or_default(),
            config.sf_security_token.clone().unwrap_or_default(),
            config.is_sandbox,
        );

        self.token_manager.set_credentials(credentials);
        Ok(())
    }

    /// Test Salesforce connection
    pub async fn test_connection(&self) -> Result<String, String> {
        self.token_manager.test_connection().await
    }

    /// Get current sync status
    pub async fn get_status(&self) -> Result<SyncStatus, String> {
        let is_syncing = *self.is_syncing.read();
        let pending_changes = self.tracker.count_pending_changes().await?;
        let last_error = self.last_error.read().clone();

        // Get sync config
        let config: Option<SyncConfig> = sqlx::query_as(
            "SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token, sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at FROM sync_config WHERE id = 'default'",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Get last sync time from metadata
        let last_sync: Option<(String,)> = sqlx::query_as(
            "SELECT MAX(last_pull_at) FROM sync_metadata",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(SyncStatus {
            is_connected: self.token_manager.has_credentials(),
            sync_enabled: config.map(|c| c.sync_enabled).unwrap_or(false),
            last_sync_at: last_sync.and_then(|l| Some(l.0)),
            pending_changes,
            error_message: if is_syncing { Some("Syncing...".to_string()) } else { last_error },
        })
    }

    /// Run a full sync (push then pull)
    pub async fn run_full_sync(&self) -> Result<SyncResult, String> {
        // Check if already syncing
        {
            let mut is_syncing = self.is_syncing.write();
            if *is_syncing {
                return Err("Sync already in progress".to_string());
            }
            *is_syncing = true;
        }

        // Clear last error
        {
            let mut last_error = self.last_error.write();
            *last_error = None;
        }

        let result = self.do_sync().await;

        // Release sync lock
        {
            let mut is_syncing = self.is_syncing.write();
            *is_syncing = false;
        }

        // Store error if any
        if let Err(ref e) = result {
            let mut last_error = self.last_error.write();
            *last_error = Some(e.clone());
        }

        result
    }

    /// Internal sync implementation
    async fn do_sync(&self) -> Result<SyncResult, String> {
        let mut total_pushed = 0;
        let mut total_pulled = 0;
        let mut all_errors = Vec::new();

        // Push local changes first
        match self.push_sync.push_all().await {
            Ok(push_result) => {
                total_pushed = push_result.records_pushed;
                all_errors.extend(push_result.errors);
            }
            Err(e) => {
                all_errors.push(format!("Push failed: {}", e));
            }
        }

        // Then pull from Salesforce
        match self.pull_sync.pull_all().await {
            Ok(pull_result) => {
                total_pulled = pull_result.records_pulled;
                all_errors.extend(pull_result.errors);
            }
            Err(e) => {
                all_errors.push(format!("Pull failed: {}", e));
            }
        }

        // Cleanup old sync logs
        let _ = self.tracker.cleanup_old_records().await;

        Ok(SyncResult {
            success: all_errors.is_empty(),
            records_pushed: total_pushed,
            records_pulled: total_pulled,
            errors: all_errors,
            completed_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// Pull only gold prices (quick sync)
    pub async fn pull_gold_prices(&self) -> Result<SyncResult, String> {
        match self.pull_sync.pull_gold_prices().await {
            Ok(result) => Ok(SyncResult {
                success: result.errors.is_empty(),
                records_pushed: 0,
                records_pulled: result.records_pulled,
                errors: result.errors,
                completed_at: chrono::Utc::now().to_rfc3339(),
            }),
            Err(e) => Err(e),
        }
    }

    /// Pull inventory from other branches
    pub async fn pull_inventory(&self, branch_sf_id: Option<&str>) -> Result<SyncResult, String> {
        match self.pull_sync.pull_inventory(branch_sf_id).await {
            Ok(result) => Ok(SyncResult {
                success: result.errors.is_empty(),
                records_pushed: 0,
                records_pulled: result.records_pulled,
                errors: result.errors,
                completed_at: chrono::Utc::now().to_rfc3339(),
            }),
            Err(e) => Err(e),
        }
    }

    /// Start background sync worker
    pub async fn start_background_sync(self: Arc<Self>, interval_minutes: u64) {
        let mut interval = interval(Duration::from_secs(interval_minutes * 60));

        loop {
            interval.tick().await;

            // Check if sync is enabled
            let config: Option<SyncConfig> = match sqlx::query_as(
                "SELECT id, sf_client_id, sf_client_secret, sf_username, sf_password, sf_security_token, sf_instance_url, is_sandbox, sync_enabled, sync_interval_minutes, created_at, updated_at FROM sync_config WHERE id = 'default'",
            )
            .fetch_optional(&self.pool)
            .await
            {
                Ok(c) => c,
                Err(_) => continue,
            };

            if let Some(cfg) = config {
                if !cfg.sync_enabled {
                    continue;
                }

                // Configure if not already done
                if !self.token_manager.has_credentials() {
                    if let Err(e) = self.configure(&cfg) {
                        log::error!("Failed to configure sync: {}", e);
                        continue;
                    }
                }

                // Run sync
                match self.run_full_sync().await {
                    Ok(result) => {
                        log::info!(
                            "Background sync completed: {} pushed, {} pulled",
                            result.records_pushed,
                            result.records_pulled
                        );
                    }
                    Err(e) => {
                        log::error!("Background sync failed: {}", e);
                    }
                }
            }
        }
    }
}
