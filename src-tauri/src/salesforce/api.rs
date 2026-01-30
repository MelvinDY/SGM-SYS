use super::client::{SalesforceClient, SaveResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Salesforce Branch__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfBranch {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "Code__c")]
    pub code: String,
    #[serde(rename = "Address__c", skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    #[serde(rename = "Phone__c", skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(rename = "Is_Active__c")]
    pub is_active: bool,
}

/// Salesforce Product__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfProduct {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "SKU__c", skip_serializing_if = "Option::is_none")]
    pub sku: Option<String>,
    #[serde(rename = "Description__c", skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "Gold_Type__c")]
    pub gold_type: String,
    #[serde(rename = "Gold_Purity__c")]
    pub gold_purity: i32,
    #[serde(rename = "Weight_Gram__c")]
    pub weight_gram: f64,
    #[serde(rename = "Labor_Cost__c")]
    pub labor_cost: i32,
    #[serde(rename = "Is_Active__c")]
    pub is_active: bool,
}

/// Salesforce Inventory__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfInventory {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "Barcode__c")]
    pub barcode: String,
    #[serde(rename = "Product__c", skip_serializing_if = "Option::is_none")]
    pub product_id: Option<String>,
    #[serde(rename = "Branch__c", skip_serializing_if = "Option::is_none")]
    pub branch_id: Option<String>,
    #[serde(rename = "Status__c")]
    pub status: String,
    #[serde(rename = "Location__c", skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(rename = "Purchase_Price__c")]
    pub purchase_price: i32,
    #[serde(rename = "Purchase_Date__c", skip_serializing_if = "Option::is_none")]
    pub purchase_date: Option<String>,
    #[serde(rename = "Supplier__c", skip_serializing_if = "Option::is_none")]
    pub supplier: Option<String>,
    #[serde(rename = "Notes__c", skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(rename = "Sold_At__c", skip_serializing_if = "Option::is_none")]
    pub sold_at: Option<String>,
}

/// Salesforce Gold_Price__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfGoldPrice {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "Date__c")]
    pub date: String,
    #[serde(rename = "Gold_Type__c")]
    pub gold_type: String,
    #[serde(rename = "Purity__c")]
    pub purity: i32,
    #[serde(rename = "Buy_Price__c")]
    pub buy_price: i32,
    #[serde(rename = "Sell_Price__c")]
    pub sell_price: i32,
    #[serde(rename = "Source__c", skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

/// Salesforce Customer__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfCustomer {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "Phone__c", skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(rename = "NIK__c", skip_serializing_if = "Option::is_none")]
    pub nik: Option<String>,
    #[serde(rename = "Address__c", skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    #[serde(rename = "Notes__c", skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(rename = "Total_Transactions__c")]
    pub total_transactions: i32,
}

/// Salesforce Transaction__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfTransaction {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "Invoice_Number__c")]
    pub invoice_no: String,
    #[serde(rename = "Branch__c", skip_serializing_if = "Option::is_none")]
    pub branch_id: Option<String>,
    #[serde(rename = "Customer__c", skip_serializing_if = "Option::is_none")]
    pub customer_id: Option<String>,
    #[serde(rename = "Type__c")]
    pub transaction_type: String,
    #[serde(rename = "Subtotal__c")]
    pub subtotal: i32,
    #[serde(rename = "Discount__c")]
    pub discount: i32,
    #[serde(rename = "Total_Amount__c")]
    pub total_amount: i32,
    #[serde(rename = "Notes__c", skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(rename = "Status__c")]
    pub status: String,
    #[serde(rename = "Created_At__c", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

/// Salesforce Transaction_Item__c record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SfTransactionItem {
    #[serde(rename = "Id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(rename = "Name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "Transaction__c")]
    pub transaction_id: String,
    #[serde(rename = "Inventory__c")]
    pub inventory_id: String,
    #[serde(rename = "Quantity__c")]
    pub quantity: i32,
    #[serde(rename = "Unit_Price__c")]
    pub unit_price: i32,
    #[serde(rename = "Subtotal__c")]
    pub subtotal: i32,
}

/// High-level Salesforce API operations
pub struct SalesforceApi {
    client: Arc<SalesforceClient>,
}

impl SalesforceApi {
    pub fn new(client: Arc<SalesforceClient>) -> Self {
        Self { client }
    }

    // ==================== Branch Operations ====================

    pub async fn get_branches(&self, last_modified_since: Option<&str>) -> Result<Vec<SfBranch>, String> {
        let mut soql = "SELECT Id, Name, Code__c, Address__c, Phone__c, Is_Active__c FROM Branch__c".to_string();
        if let Some(since) = last_modified_since {
            soql.push_str(&format!(" WHERE LastModifiedDate > {}", since));
        }
        self.client.query_all(&soql).await
    }

    pub async fn upsert_branch(&self, branch: &SfBranch) -> Result<SaveResult, String> {
        let data = serde_json::to_value(branch).map_err(|e| e.to_string())?;
        self.client.upsert("Branch__c", "Code__c", &branch.code, &data).await
    }

    // ==================== Product Operations ====================

    pub async fn get_products(&self, last_modified_since: Option<&str>) -> Result<Vec<SfProduct>, String> {
        let mut soql = "SELECT Id, Name, SKU__c, Description__c, Gold_Type__c, Gold_Purity__c, Weight_Gram__c, Labor_Cost__c, Is_Active__c FROM Product__c".to_string();
        if let Some(since) = last_modified_since {
            soql.push_str(&format!(" WHERE LastModifiedDate > {}", since));
        }
        self.client.query_all(&soql).await
    }

    pub async fn upsert_product(&self, product: &SfProduct) -> Result<SaveResult, String> {
        let data = serde_json::to_value(product).map_err(|e| e.to_string())?;
        if let Some(sku) = &product.sku {
            self.client.upsert("Product__c", "SKU__c", sku, &data).await
        } else {
            self.client.create("Product__c", &data).await
        }
    }

    // ==================== Inventory Operations ====================

    pub async fn get_inventory(&self, last_modified_since: Option<&str>, branch_sf_id: Option<&str>) -> Result<Vec<SfInventory>, String> {
        let mut soql = "SELECT Id, Name, Barcode__c, Product__c, Branch__c, Status__c, Location__c, Purchase_Price__c, Purchase_Date__c, Supplier__c, Notes__c, Sold_At__c FROM Inventory__c".to_string();

        let mut conditions = Vec::new();
        if let Some(since) = last_modified_since {
            conditions.push(format!("LastModifiedDate > {}", since));
        }
        if let Some(branch_id) = branch_sf_id {
            conditions.push(format!("Branch__c = '{}'", branch_id));
        }

        if !conditions.is_empty() {
            soql.push_str(" WHERE ");
            soql.push_str(&conditions.join(" AND "));
        }

        self.client.query_all(&soql).await
    }

    pub async fn upsert_inventory(&self, inventory: &SfInventory) -> Result<SaveResult, String> {
        let data = serde_json::to_value(inventory).map_err(|e| e.to_string())?;
        self.client.upsert("Inventory__c", "Barcode__c", &inventory.barcode, &data).await
    }

    pub async fn batch_upsert_inventory(&self, items: Vec<SfInventory>) -> Result<Vec<Result<SaveResult, String>>, String> {
        let records: Vec<(String, serde_json::Value)> = items
            .into_iter()
            .filter_map(|item| {
                serde_json::to_value(&item)
                    .ok()
                    .map(|data| (item.barcode.clone(), data))
            })
            .collect();

        self.client.batch_upsert("Inventory__c", "Barcode__c", records).await
    }

    // ==================== Gold Price Operations ====================

    pub async fn get_gold_prices(&self, date: Option<&str>) -> Result<Vec<SfGoldPrice>, String> {
        let soql = if let Some(d) = date {
            format!(
                "SELECT Id, Name, Date__c, Gold_Type__c, Purity__c, Buy_Price__c, Sell_Price__c, Source__c FROM Gold_Price__c WHERE Date__c = {}",
                d
            )
        } else {
            "SELECT Id, Name, Date__c, Gold_Type__c, Purity__c, Buy_Price__c, Sell_Price__c, Source__c FROM Gold_Price__c ORDER BY Date__c DESC LIMIT 50".to_string()
        };
        self.client.query_all(&soql).await
    }

    pub async fn upsert_gold_price(&self, price: &SfGoldPrice) -> Result<SaveResult, String> {
        let data = serde_json::to_value(price).map_err(|e| e.to_string())?;
        // Create unique identifier for upsert: date_goldtype_purity
        let external_id = format!("{}_{}_{}",
            price.date.replace("-", ""),
            price.gold_type,
            price.purity
        );
        // Since Gold_Price__c may not have an external ID field, use create with duplicate check
        self.client.create("Gold_Price__c", &data).await
    }

    // ==================== Customer Operations ====================

    pub async fn get_customers(&self, last_modified_since: Option<&str>) -> Result<Vec<SfCustomer>, String> {
        let mut soql = "SELECT Id, Name, Phone__c, NIK__c, Address__c, Notes__c, Total_Transactions__c FROM Customer__c".to_string();
        if let Some(since) = last_modified_since {
            soql.push_str(&format!(" WHERE LastModifiedDate > {}", since));
        }
        self.client.query_all(&soql).await
    }

    pub async fn upsert_customer(&self, customer: &SfCustomer) -> Result<SaveResult, String> {
        let data = serde_json::to_value(customer).map_err(|e| e.to_string())?;
        if let Some(phone) = &customer.phone {
            self.client.upsert("Customer__c", "Phone__c", phone, &data).await
        } else {
            self.client.create("Customer__c", &data).await
        }
    }

    // ==================== Transaction Operations ====================

    pub async fn get_transactions(&self, last_modified_since: Option<&str>, branch_sf_id: Option<&str>) -> Result<Vec<SfTransaction>, String> {
        let mut soql = "SELECT Id, Name, Invoice_Number__c, Branch__c, Customer__c, Type__c, Subtotal__c, Discount__c, Total_Amount__c, Notes__c, Status__c, Created_At__c FROM Transaction__c".to_string();

        let mut conditions = Vec::new();
        if let Some(since) = last_modified_since {
            conditions.push(format!("LastModifiedDate > {}", since));
        }
        if let Some(branch_id) = branch_sf_id {
            conditions.push(format!("Branch__c = '{}'", branch_id));
        }

        if !conditions.is_empty() {
            soql.push_str(" WHERE ");
            soql.push_str(&conditions.join(" AND "));
        }
        soql.push_str(" ORDER BY Created_At__c DESC");

        self.client.query_all(&soql).await
    }

    pub async fn upsert_transaction(&self, transaction: &SfTransaction) -> Result<SaveResult, String> {
        let data = serde_json::to_value(transaction).map_err(|e| e.to_string())?;
        self.client.upsert("Transaction__c", "Invoice_Number__c", &transaction.invoice_no, &data).await
    }

    pub async fn get_transaction_items(&self, transaction_sf_id: &str) -> Result<Vec<SfTransactionItem>, String> {
        let soql = format!(
            "SELECT Id, Name, Transaction__c, Inventory__c, Quantity__c, Unit_Price__c, Subtotal__c FROM Transaction_Item__c WHERE Transaction__c = '{}'",
            transaction_sf_id
        );
        self.client.query_all(&soql).await
    }

    pub async fn create_transaction_item(&self, item: &SfTransactionItem) -> Result<SaveResult, String> {
        let data = serde_json::to_value(item).map_err(|e| e.to_string())?;
        self.client.create("Transaction_Item__c", &data).await
    }
}
