use crate::salesforce::api::SalesforceApi;
use crate::salesforce::mapper::FromSalesforce;
use sqlx::SqlitePool;
use std::sync::Arc;

/// Pull sync handler - retrieves data from Salesforce
pub struct PullSync {
    pool: SqlitePool,
    api: Arc<SalesforceApi>,
}

impl PullSync {
    pub fn new(pool: SqlitePool, api: Arc<SalesforceApi>) -> Self {
        Self { pool, api }
    }

    /// Pull all data from Salesforce
    pub async fn pull_all(&self) -> Result<PullResult, String> {
        let mut result = PullResult::default();

        // Pull in order (master data first)
        result.merge(self.pull_gold_prices().await?);
        result.merge(self.pull_products().await?);
        result.merge(self.pull_inventory(None).await?);

        // Update sync metadata
        self.update_sync_metadata("full", result.records_pulled).await?;

        Ok(result)
    }

    /// Pull gold prices from Salesforce
    pub async fn pull_gold_prices(&self) -> Result<PullResult, String> {
        let mut result = PullResult::default();

        // Get today's date
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let sf_prices = self.api.get_gold_prices(Some(&today)).await?;

        for sf_price in sf_prices {
            let local_price = sf_price.from_salesforce();

            // Upsert based on date, gold_type, purity
            let existing: Option<(String,)> = sqlx::query_as(
                "SELECT id FROM gold_prices WHERE date = ? AND gold_type = ? AND purity = ?",
            )
            .bind(&local_price.date)
            .bind(&local_price.gold_type)
            .bind(local_price.purity)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

            if let Some((id,)) = existing {
                // Update existing
                sqlx::query(
                    r#"
                    UPDATE gold_prices
                    SET buy_price = ?, sell_price = ?, source = ?, salesforce_id = ?
                    WHERE id = ?
                    "#,
                )
                .bind(local_price.buy_price)
                .bind(local_price.sell_price)
                .bind(&local_price.source)
                .bind(sf_price.id.as_ref())
                .bind(&id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            } else {
                // Insert new
                sqlx::query(
                    r#"
                    INSERT INTO gold_prices (id, date, gold_type, purity, buy_price, sell_price, source, salesforce_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                )
                .bind(&local_price.id)
                .bind(&local_price.date)
                .bind(&local_price.gold_type)
                .bind(local_price.purity)
                .bind(local_price.buy_price)
                .bind(local_price.sell_price)
                .bind(&local_price.source)
                .bind(sf_price.id.as_ref())
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            }

            result.records_pulled += 1;
        }

        self.update_sync_metadata("gold_prices", result.records_pulled).await?;

        Ok(result)
    }

    /// Pull products from Salesforce
    pub async fn pull_products(&self) -> Result<PullResult, String> {
        let mut result = PullResult::default();

        // Get last sync time
        let last_sync = self.get_last_sync_time("products").await?;
        let sf_products = self.api.get_products(last_sync.as_deref()).await?;

        for sf_product in sf_products {
            let local_product = sf_product.from_salesforce();
            let sf_id = sf_product.id.as_ref();

            // Check if product exists by SKU or SF ID
            let existing: Option<(String,)> = if let Some(sku) = &sf_product.sku {
                sqlx::query_as("SELECT id FROM products WHERE sku = ? OR salesforce_id = ?")
                    .bind(sku)
                    .bind(sf_id)
                    .fetch_optional(&self.pool)
                    .await
                    .map_err(|e| e.to_string())?
            } else {
                sqlx::query_as("SELECT id FROM products WHERE salesforce_id = ?")
                    .bind(sf_id)
                    .fetch_optional(&self.pool)
                    .await
                    .map_err(|e| e.to_string())?
            };

            if let Some((id,)) = existing {
                // Update existing
                sqlx::query(
                    r#"
                    UPDATE products
                    SET name = ?, description = ?, gold_type = ?, gold_purity = ?,
                        weight_gram = ?, labor_cost = ?, is_active = ?, salesforce_id = ?
                    WHERE id = ?
                    "#,
                )
                .bind(&local_product.name)
                .bind(&local_product.description)
                .bind(&local_product.gold_type)
                .bind(local_product.gold_purity)
                .bind(local_product.weight_gram)
                .bind(local_product.labor_cost)
                .bind(local_product.is_active)
                .bind(sf_id)
                .bind(&id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            } else {
                // Insert new
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query(
                    r#"
                    INSERT INTO products (id, category_id, sku, name, description, gold_type, gold_purity, weight_gram, labor_cost, is_active, salesforce_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                )
                .bind(&id)
                .bind(&local_product.category_id)
                .bind(&local_product.sku)
                .bind(&local_product.name)
                .bind(&local_product.description)
                .bind(&local_product.gold_type)
                .bind(local_product.gold_purity)
                .bind(local_product.weight_gram)
                .bind(local_product.labor_cost)
                .bind(local_product.is_active)
                .bind(sf_id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            }

            result.records_pulled += 1;
        }

        self.update_sync_metadata("products", result.records_pulled).await?;

        Ok(result)
    }

    /// Pull inventory from Salesforce (optionally for other branches)
    pub async fn pull_inventory(&self, branch_sf_id: Option<&str>) -> Result<PullResult, String> {
        let mut result = PullResult::default();

        // Get last sync time
        let last_sync = self.get_last_sync_time("inventory").await?;
        let sf_inventory = self.api.get_inventory(last_sync.as_deref(), branch_sf_id).await?;

        // Build reverse lookup: SF ID -> local ID
        let product_lookup = self.build_product_lookup().await?;
        let branch_lookup = self.build_branch_lookup().await?;

        for sf_item in sf_inventory {
            let mut local_item = sf_item.from_salesforce();
            let sf_id = sf_item.id.as_ref();

            // Resolve product ID
            if let Some(product_sf_id) = &sf_item.product_id {
                if let Some(local_product_id) = product_lookup.get(product_sf_id) {
                    local_item.product_id = local_product_id.clone();
                } else {
                    // Skip if product not found locally
                    result.errors.push(format!("Product {} not found for inventory {}", product_sf_id, sf_item.barcode));
                    continue;
                }
            }

            // Resolve branch ID
            if let Some(branch_sf_id) = &sf_item.branch_id {
                if let Some(local_branch_id) = branch_lookup.get(branch_sf_id) {
                    local_item.branch_id = local_branch_id.clone();
                } else {
                    // Use default branch
                    local_item.branch_id = "default".to_string();
                }
            } else {
                local_item.branch_id = "default".to_string();
            }

            // Check if inventory exists by barcode or SF ID
            let existing: Option<(String,)> = sqlx::query_as(
                "SELECT id FROM inventory WHERE barcode = ? OR salesforce_id = ?",
            )
            .bind(&sf_item.barcode)
            .bind(sf_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

            if let Some((id,)) = existing {
                // Update existing (SF wins for status and location)
                sqlx::query(
                    r#"
                    UPDATE inventory
                    SET status = ?, location = ?, purchase_price = ?, supplier = ?,
                        notes = ?, sold_at = ?, salesforce_id = ?
                    WHERE id = ?
                    "#,
                )
                .bind(&local_item.status)
                .bind(&local_item.location)
                .bind(local_item.purchase_price)
                .bind(&local_item.supplier)
                .bind(&local_item.notes)
                .bind(&local_item.sold_at)
                .bind(sf_id)
                .bind(&id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            } else {
                // Insert new
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query(
                    r#"
                    INSERT INTO inventory (id, product_id, branch_id, barcode, status, location, purchase_price, purchase_date, supplier, notes, sold_at, salesforce_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                )
                .bind(&id)
                .bind(&local_item.product_id)
                .bind(&local_item.branch_id)
                .bind(&local_item.barcode)
                .bind(&local_item.status)
                .bind(&local_item.location)
                .bind(local_item.purchase_price)
                .bind(&local_item.purchase_date)
                .bind(&local_item.supplier)
                .bind(&local_item.notes)
                .bind(&local_item.sold_at)
                .bind(sf_id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
            }

            result.records_pulled += 1;
        }

        self.update_sync_metadata("inventory", result.records_pulled).await?;

        Ok(result)
    }

    /// Get last sync time for a table
    async fn get_last_sync_time(&self, table_name: &str) -> Result<Option<String>, String> {
        let result: Option<(Option<String>,)> = sqlx::query_as(
            "SELECT last_pull_at FROM sync_metadata WHERE table_name = ?",
        )
        .bind(table_name)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(result.and_then(|r| r.0))
    }

    /// Update sync metadata for a table
    async fn update_sync_metadata(&self, table_name: &str, records_count: i32) -> Result<(), String> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO sync_metadata (table_name, last_pull_at, records_pulled)
            VALUES (?, ?, ?)
            ON CONFLICT(table_name) DO UPDATE SET
                last_pull_at = excluded.last_pull_at,
                records_pulled = records_pulled + excluded.records_pulled
            "#,
        )
        .bind(table_name)
        .bind(&now)
        .bind(records_count)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Build reverse lookup: SF ID -> local ID for products
    async fn build_product_lookup(&self) -> Result<std::collections::HashMap<String, String>, String> {
        let products: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM products WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let mut lookup = std::collections::HashMap::new();
        for (local_id, sf_id) in products {
            if let Some(id) = sf_id {
                lookup.insert(id, local_id);
            }
        }

        Ok(lookup)
    }

    /// Build reverse lookup: SF ID -> local ID for branches
    async fn build_branch_lookup(&self) -> Result<std::collections::HashMap<String, String>, String> {
        let branches: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM branches WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let mut lookup = std::collections::HashMap::new();
        for (local_id, sf_id) in branches {
            if let Some(id) = sf_id {
                lookup.insert(id, local_id);
            }
        }

        Ok(lookup)
    }
}

/// Result of pull sync operation
#[derive(Debug, Default)]
pub struct PullResult {
    pub records_pulled: i32,
    pub errors: Vec<String>,
}

impl PullResult {
    pub fn merge(&mut self, other: PullResult) {
        self.records_pulled += other.records_pulled;
        self.errors.extend(other.errors);
    }

    pub fn is_success(&self) -> bool {
        self.errors.is_empty()
    }
}
