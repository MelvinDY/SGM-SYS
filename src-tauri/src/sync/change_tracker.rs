use sqlx::SqlitePool;
use uuid::Uuid;

/// Change tracker for logging local changes to sync_log table
pub struct ChangeTracker {
    pool: SqlitePool,
}

impl ChangeTracker {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Log a change for later sync
    pub async fn log_change(
        &self,
        table_name: &str,
        record_id: &str,
        action: &str,
        payload: Option<&str>,
    ) -> Result<(), String> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO sync_log (id, table_name, record_id, action, payload, synced)
            VALUES (?, ?, ?, ?, ?, 0)
            ON CONFLICT(table_name, record_id) DO UPDATE SET
                action = excluded.action,
                payload = excluded.payload,
                synced = 0,
                created_at = datetime('now')
            "#,
        )
        .bind(&id)
        .bind(table_name)
        .bind(record_id)
        .bind(action)
        .bind(payload)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to log change: {}", e))?;

        Ok(())
    }

    /// Get pending changes for a specific table
    pub async fn get_pending_changes(&self, table_name: &str) -> Result<Vec<PendingChange>, String> {
        let changes: Vec<PendingChange> = sqlx::query_as::<_, PendingChange>(
            r#"
            SELECT id, table_name, record_id, action, payload, retry_count
            FROM sync_log
            WHERE table_name = ? AND synced = 0 AND retry_count < 5
            ORDER BY created_at ASC
            "#,
        )
        .bind(table_name)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get pending changes: {}", e))?;

        Ok(changes)
    }

    /// Get all pending changes across all tables
    pub async fn get_all_pending_changes(&self) -> Result<Vec<PendingChange>, String> {
        let changes: Vec<PendingChange> = sqlx::query_as::<_, PendingChange>(
            r#"
            SELECT id, table_name, record_id, action, payload, retry_count
            FROM sync_log
            WHERE synced = 0 AND retry_count < 5
            ORDER BY created_at ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get pending changes: {}", e))?;

        Ok(changes)
    }

    /// Count pending changes
    pub async fn count_pending_changes(&self) -> Result<i32, String> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM sync_log WHERE synced = 0 AND retry_count < 5",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to count pending changes: {}", e))?;

        Ok(count.0 as i32)
    }

    /// Mark a change as synced
    pub async fn mark_synced(&self, id: &str) -> Result<(), String> {
        sqlx::query(
            "UPDATE sync_log SET synced = 1, synced_at = datetime('now') WHERE id = ?",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to mark as synced: {}", e))?;

        Ok(())
    }

    /// Mark multiple changes as synced
    pub async fn mark_synced_batch(&self, ids: &[String]) -> Result<(), String> {
        for id in ids {
            self.mark_synced(id).await?;
        }
        Ok(())
    }

    /// Mark a change as failed with error message
    pub async fn mark_failed(&self, id: &str, error_message: &str) -> Result<(), String> {
        sqlx::query(
            r#"
            UPDATE sync_log
            SET error_message = ?, retry_count = retry_count + 1
            WHERE id = ?
            "#,
        )
        .bind(error_message)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to mark as failed: {}", e))?;

        Ok(())
    }

    /// Clear old synced records (keep last 7 days)
    pub async fn cleanup_old_records(&self) -> Result<i32, String> {
        let result = sqlx::query(
            r#"
            DELETE FROM sync_log
            WHERE synced = 1 AND synced_at < datetime('now', '-7 days')
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to cleanup old records: {}", e))?;

        Ok(result.rows_affected() as i32)
    }
}

/// Pending change record
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PendingChange {
    pub id: String,
    pub table_name: String,
    pub record_id: String,
    pub action: String,
    pub payload: Option<String>,
    pub retry_count: i32,
}
