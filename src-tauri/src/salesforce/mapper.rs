use crate::models::{Branch, Customer, GoldPrice, Inventory, Product, Transaction, TransactionItem};
use super::api::{SfBranch, SfCustomer, SfGoldPrice, SfInventory, SfProduct, SfTransaction, SfTransactionItem};

/// Trait for converting local models to Salesforce format
pub trait ToSalesforce {
    type SfType;
    fn to_salesforce(&self, sf_lookups: &SfLookups) -> Self::SfType;
}

/// Trait for converting Salesforce models to local format
pub trait FromSalesforce {
    type LocalType;
    fn from_salesforce(&self) -> Self::LocalType;
}

/// Lookup table for resolving local IDs to Salesforce IDs
#[derive(Debug, Clone, Default)]
pub struct SfLookups {
    pub branches: std::collections::HashMap<String, String>,    // local_id -> sf_id
    pub products: std::collections::HashMap<String, String>,
    pub inventory: std::collections::HashMap<String, String>,
    pub customers: std::collections::HashMap<String, String>,
    pub transactions: std::collections::HashMap<String, String>,
}

impl SfLookups {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_branch_sf_id(&self, local_id: &str) -> Option<&String> {
        self.branches.get(local_id)
    }

    pub fn get_product_sf_id(&self, local_id: &str) -> Option<&String> {
        self.products.get(local_id)
    }

    pub fn get_inventory_sf_id(&self, local_id: &str) -> Option<&String> {
        self.inventory.get(local_id)
    }

    pub fn get_customer_sf_id(&self, local_id: &str) -> Option<&String> {
        self.customers.get(local_id)
    }

    pub fn get_transaction_sf_id(&self, local_id: &str) -> Option<&String> {
        self.transactions.get(local_id)
    }
}

// ==================== Branch Mapping ====================

impl ToSalesforce for Branch {
    type SfType = SfBranch;

    fn to_salesforce(&self, _lookups: &SfLookups) -> SfBranch {
        SfBranch {
            id: None, // Will be set by SF
            name: self.name.clone(),
            code: self.id.clone(), // Use local ID as code if no code field
            address: self.address.clone(),
            phone: self.phone.clone(),
            is_active: self.is_active,
        }
    }
}

impl FromSalesforce for SfBranch {
    type LocalType = Branch;

    fn from_salesforce(&self) -> Branch {
        Branch {
            id: self.code.clone(), // Use code as local ID
            name: self.name.clone(),
            address: self.address.clone(),
            phone: self.phone.clone(),
            is_active: self.is_active,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: Some(chrono::Utc::now().to_rfc3339()),
        }
    }
}

// ==================== Product Mapping ====================

impl ToSalesforce for Product {
    type SfType = SfProduct;

    fn to_salesforce(&self, _lookups: &SfLookups) -> SfProduct {
        SfProduct {
            id: None,
            name: self.name.clone(),
            sku: self.sku.clone(),
            description: self.description.clone(),
            gold_type: self.gold_type.clone(),
            gold_purity: self.gold_purity,
            weight_gram: self.weight_gram,
            labor_cost: self.labor_cost,
            is_active: self.is_active,
        }
    }
}

impl FromSalesforce for SfProduct {
    type LocalType = Product;

    fn from_salesforce(&self) -> Product {
        Product {
            id: self.sku.clone().unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            category_id: "cat-1".to_string(), // Default category
            sku: self.sku.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            gold_type: self.gold_type.clone(),
            gold_purity: self.gold_purity,
            weight_gram: self.weight_gram,
            labor_cost: self.labor_cost,
            images: None,
            is_active: self.is_active,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

// ==================== Inventory Mapping ====================

impl ToSalesforce for Inventory {
    type SfType = SfInventory;

    fn to_salesforce(&self, lookups: &SfLookups) -> SfInventory {
        SfInventory {
            id: None,
            name: Some(self.barcode.clone()),
            barcode: self.barcode.clone(),
            product_id: lookups.get_product_sf_id(&self.product_id).cloned(),
            branch_id: lookups.get_branch_sf_id(&self.branch_id).cloned(),
            status: self.status.clone(),
            location: self.location.clone(),
            purchase_price: self.purchase_price,
            purchase_date: self.purchase_date.clone(),
            supplier: self.supplier.clone(),
            notes: self.notes.clone(),
            sold_at: self.sold_at.clone(),
        }
    }
}

impl FromSalesforce for SfInventory {
    type LocalType = Inventory;

    fn from_salesforce(&self) -> Inventory {
        Inventory {
            id: uuid::Uuid::new_v4().to_string(),
            product_id: String::new(), // Will be resolved by caller
            branch_id: String::new(),  // Will be resolved by caller
            barcode: self.barcode.clone(),
            status: self.status.clone(),
            location: self.location.clone(),
            purchase_price: self.purchase_price,
            purchase_date: self.purchase_date.clone(),
            supplier: self.supplier.clone(),
            notes: self.notes.clone(),
            sold_at: self.sold_at.clone(),
            created_at: chrono::Utc::now().to_rfc3339(),
            product: None,
        }
    }
}

// ==================== Gold Price Mapping ====================

impl ToSalesforce for GoldPrice {
    type SfType = SfGoldPrice;

    fn to_salesforce(&self, _lookups: &SfLookups) -> SfGoldPrice {
        SfGoldPrice {
            id: None,
            name: Some(format!("{}_{}_{}", self.date, self.gold_type, self.purity)),
            date: self.date.clone(),
            gold_type: self.gold_type.clone(),
            purity: self.purity,
            buy_price: self.buy_price,
            sell_price: self.sell_price,
            source: self.source.clone(),
        }
    }
}

impl FromSalesforce for SfGoldPrice {
    type LocalType = GoldPrice;

    fn from_salesforce(&self) -> GoldPrice {
        GoldPrice {
            id: uuid::Uuid::new_v4().to_string(),
            date: self.date.clone(),
            gold_type: self.gold_type.clone(),
            purity: self.purity,
            buy_price: self.buy_price,
            sell_price: self.sell_price,
            source: self.source.clone(),
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

// ==================== Customer Mapping ====================

impl ToSalesforce for Customer {
    type SfType = SfCustomer;

    fn to_salesforce(&self, _lookups: &SfLookups) -> SfCustomer {
        SfCustomer {
            id: None,
            name: self.name.clone(),
            phone: self.phone.clone(),
            nik: self.nik.clone(),
            address: self.address.clone(),
            notes: self.notes.clone(),
            total_transactions: self.total_transactions,
        }
    }
}

impl FromSalesforce for SfCustomer {
    type LocalType = Customer;

    fn from_salesforce(&self) -> Customer {
        Customer {
            id: uuid::Uuid::new_v4().to_string(),
            name: self.name.clone(),
            phone: self.phone.clone(),
            nik: self.nik.clone(),
            address: self.address.clone(),
            notes: self.notes.clone(),
            total_transactions: self.total_transactions,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

// ==================== Transaction Mapping ====================

impl ToSalesforce for Transaction {
    type SfType = SfTransaction;

    fn to_salesforce(&self, lookups: &SfLookups) -> SfTransaction {
        SfTransaction {
            id: None,
            name: Some(self.invoice_no.clone()),
            invoice_no: self.invoice_no.clone(),
            branch_id: lookups.get_branch_sf_id(&self.branch_id).cloned(),
            customer_id: self.customer_id.as_ref().and_then(|cid| lookups.get_customer_sf_id(cid).cloned()),
            transaction_type: self.r#type.clone(),
            subtotal: self.subtotal,
            discount: self.discount,
            total_amount: self.total_amount,
            notes: self.notes.clone(),
            status: self.status.clone(),
            created_at: Some(self.created_at.clone()),
        }
    }
}

impl FromSalesforce for SfTransaction {
    type LocalType = Transaction;

    fn from_salesforce(&self) -> Transaction {
        Transaction {
            id: uuid::Uuid::new_v4().to_string(),
            branch_id: String::new(), // Will be resolved by caller
            user_id: String::new(),   // Will be resolved by caller
            customer_id: None,        // Will be resolved by caller
            invoice_no: self.invoice_no.clone(),
            r#type: self.transaction_type.clone(),
            subtotal: self.subtotal,
            discount: self.discount,
            total_amount: self.total_amount,
            notes: self.notes.clone(),
            status: self.status.clone(),
            created_at: self.created_at.clone().unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
            customer: None,
            items: None,
            payments: None,
        }
    }
}

// ==================== Transaction Item Mapping ====================

impl ToSalesforce for TransactionItem {
    type SfType = SfTransactionItem;

    fn to_salesforce(&self, lookups: &SfLookups) -> SfTransactionItem {
        SfTransactionItem {
            id: None,
            name: None,
            transaction_id: lookups.get_transaction_sf_id(&self.transaction_id).cloned().unwrap_or_default(),
            inventory_id: lookups.get_inventory_sf_id(&self.inventory_id).cloned().unwrap_or_default(),
            quantity: self.quantity,
            unit_price: self.unit_price,
            subtotal: self.subtotal,
        }
    }
}

impl FromSalesforce for SfTransactionItem {
    type LocalType = TransactionItem;

    fn from_salesforce(&self) -> TransactionItem {
        TransactionItem {
            id: uuid::Uuid::new_v4().to_string(),
            transaction_id: String::new(), // Will be resolved by caller
            inventory_id: String::new(),   // Will be resolved by caller
            quantity: self.quantity,
            unit_price: self.unit_price,
            subtotal: self.subtotal,
            gold_price_ref: None,
            inventory: None,
        }
    }
}
