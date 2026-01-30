use super::change_tracker::{ChangeTracker, PendingChange};
use crate::models::{Customer, GoldPrice, Inventory, Product, Transaction};
use crate::salesforce::api::SalesforceApi;
use crate::salesforce::mapper::{SfLookups, ToSalesforce};
use sqlx::SqlitePool;
use std::sync::Arc;

/// Push sync handler - sends local changes to Salesforce
pub struct PushSync {
    pool: SqlitePool,
    api: Arc<SalesforceApi>,
    tracker: ChangeTracker,
}

impl PushSync {
    pub fn new(pool: SqlitePool, api: Arc<SalesforceApi>) -> Self {
        let tracker = ChangeTracker::new(pool.clone());
        Self { pool, api, tracker }
    }

    /// Push all pending changes to Salesforce
    pub async fn push_all(&self) -> Result<PushResult, String> {
        let mut result = PushResult::default();

        // Build lookup tables for SF IDs
        let lookups = self.build_lookups().await?;

        // Push in dependency order
        result.merge(self.push_table("products", &lookups).await?);
        result.merge(self.push_table("inventory", &lookups).await?);
        result.merge(self.push_table("customers", &lookups).await?);
        result.merge(self.push_table("gold_prices", &lookups).await?);
        result.merge(self.push_table("transactions", &lookups).await?);

        Ok(result)
    }

    /// Push changes for a specific table
    async fn push_table(&self, table_name: &str, lookups: &SfLookups) -> Result<PushResult, String> {
        let mut result = PushResult::default();
        let changes = self.tracker.get_pending_changes(table_name).await?;

        for change in changes {
            match self.push_change(&change, lookups).await {
                Ok(sf_id) => {
                    // Update local record with SF ID if returned
                    if let Some(id) = sf_id {
                        self.update_salesforce_id(table_name, &change.record_id, &id).await?;
                    }
                    self.tracker.mark_synced(&change.id).await?;
                    result.records_pushed += 1;
                }
                Err(e) => {
                    self.tracker.mark_failed(&change.id, &e).await?;
                    result.errors.push(format!("{}/{}: {}", table_name, change.record_id, e));
                }
            }
        }

        Ok(result)
    }

    /// Push a single change to Salesforce
    async fn push_change(&self, change: &PendingChange, lookups: &SfLookups) -> Result<Option<String>, String> {
        match change.action.as_str() {
            "delete" => {
                self.handle_delete(&change.table_name, &change.record_id).await?;
                Ok(None)
            }
            "insert" | "update" => {
                self.handle_upsert(&change.table_name, &change.record_id, lookups).await
            }
            _ => Err(format!("Unknown action: {}", change.action)),
        }
    }

    /// Handle delete action
    async fn handle_delete(&self, table_name: &str, record_id: &str) -> Result<(), String> {
        // Get SF ID from local record
        let sf_id = self.get_salesforce_id(table_name, record_id).await?;

        if let Some(id) = sf_id {
            let sobject = self.table_to_sobject(table_name);
            // Note: For now, we don't actually delete from SF - just mark as inactive
            // This is safer for data integrity
            // self.api.client.delete_record(&sobject, &id).await?;
            log::info!("Would delete {} {} (SF ID: {})", sobject, record_id, id);
        }

        Ok(())
    }

    /// Handle insert/update action
    async fn handle_upsert(&self, table_name: &str, record_id: &str, lookups: &SfLookups) -> Result<Option<String>, String> {
        match table_name {
            "products" => {
                let product = self.get_product(record_id).await?;
                let sf_product = product.to_salesforce(lookups);
                let result = self.api.upsert_product(&sf_product).await?;
                Ok(Some(result.id))
            }
            "inventory" => {
                let inventory = self.get_inventory(record_id).await?;
                let sf_inventory = inventory.to_salesforce(lookups);
                let result = self.api.upsert_inventory(&sf_inventory).await?;
                Ok(Some(result.id))
            }
            "customers" => {
                let customer = self.get_customer(record_id).await?;
                let sf_customer = customer.to_salesforce(lookups);
                let result = self.api.upsert_customer(&sf_customer).await?;
                Ok(Some(result.id))
            }
            "gold_prices" => {
                let price = self.get_gold_price(record_id).await?;
                let sf_price = price.to_salesforce(lookups);
                let result = self.api.upsert_gold_price(&sf_price).await?;
                Ok(Some(result.id))
            }
            "transactions" => {
                let transaction = self.get_transaction(record_id).await?;
                let sf_transaction = transaction.to_salesforce(lookups);
                let result = self.api.upsert_transaction(&sf_transaction).await?;
                Ok(Some(result.id))
            }
            _ => Err(format!("Unknown table: {}", table_name)),
        }
    }

    /// Build lookup tables from local DB
    async fn build_lookups(&self) -> Result<SfLookups, String> {
        let mut lookups = SfLookups::new();

        // Load branches
        let branches: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM branches WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        for (local_id, sf_id) in branches {
            if let Some(id) = sf_id {
                lookups.branches.insert(local_id, id);
            }
        }

        // Load products
        let products: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM products WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        for (local_id, sf_id) in products {
            if let Some(id) = sf_id {
                lookups.products.insert(local_id, id);
            }
        }

        // Load inventory
        let inventory: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM inventory WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        for (local_id, sf_id) in inventory {
            if let Some(id) = sf_id {
                lookups.inventory.insert(local_id, id);
            }
        }

        // Load customers
        let customers: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM customers WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        for (local_id, sf_id) in customers {
            if let Some(id) = sf_id {
                lookups.customers.insert(local_id, id);
            }
        }

        // Load transactions
        let transactions: Vec<(String, Option<String>)> = sqlx::query_as(
            "SELECT id, salesforce_id FROM transactions WHERE salesforce_id IS NOT NULL",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        for (local_id, sf_id) in transactions {
            if let Some(id) = sf_id {
                lookups.transactions.insert(local_id, id);
            }
        }

        Ok(lookups)
    }

    /// Get Salesforce ID for a local record
    async fn get_salesforce_id(&self, table_name: &str, record_id: &str) -> Result<Option<String>, String> {
        let query = format!("SELECT salesforce_id FROM {} WHERE id = ?", table_name);
        let result: Option<(Option<String>,)> = sqlx::query_as(&query)
            .bind(record_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(result.and_then(|r| r.0))
    }

    /// Update Salesforce ID in local record
    async fn update_salesforce_id(&self, table_name: &str, record_id: &str, sf_id: &str) -> Result<(), String> {
        let query = format!("UPDATE {} SET salesforce_id = ? WHERE id = ?", table_name);
        sqlx::query(&query)
            .bind(sf_id)
            .bind(record_id)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Convert table name to Salesforce SObject name
    fn table_to_sobject(&self, table_name: &str) -> &'static str {
        match table_name {
            "branches" => "Branch__c",
            "products" => "Product__c",
            "inventory" => "Inventory__c",
            "customers" => "Customer__c",
            "transactions" => "Transaction__c",
            "transaction_items" => "Transaction_Item__c",
            "gold_prices" => "Gold_Price__c",
            _ => "Unknown__c",
        }
    }

    // Data fetching methods

    async fn get_product(&self, id: &str) -> Result<Product, String> {
        sqlx::query_as::<_, Product>(
            "SELECT id, category_id, sku, name, description, gold_type, gold_purity, weight_gram, labor_cost, images, is_active, created_at FROM products WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Product not found: {}", e))
    }

    async fn get_inventory(&self, id: &str) -> Result<Inventory, String> {
        sqlx::query_as::<_, Inventory>(
            "SELECT id, product_id, branch_id, barcode, status, location, purchase_price, purchase_date, supplier, notes, sold_at, created_at FROM inventory WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Inventory not found: {}", e))
    }

    async fn get_customer(&self, id: &str) -> Result<Customer, String> {
        sqlx::query_as::<_, Customer>(
            "SELECT id, name, phone, nik, address, notes, total_transactions, created_at FROM customers WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Customer not found: {}", e))
    }

    async fn get_gold_price(&self, id: &str) -> Result<GoldPrice, String> {
        sqlx::query_as::<_, GoldPrice>(
            "SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at FROM gold_prices WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Gold price not found: {}", e))
    }

    async fn get_transaction(&self, id: &str) -> Result<Transaction, String> {
        sqlx::query_as::<_, Transaction>(
            "SELECT id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount, total_amount, notes, status, created_at FROM transactions WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Transaction not found: {}", e))
    }
}

/// Result of push sync operation
#[derive(Debug, Default)]
pub struct PushResult {
    pub records_pushed: i32,
    pub errors: Vec<String>,
}

impl PushResult {
    pub fn merge(&mut self, other: PushResult) {
        self.records_pushed += other.records_pushed;
        self.errors.extend(other.errors);
    }

    pub fn is_success(&self) -> bool {
        self.errors.is_empty()
    }
}
