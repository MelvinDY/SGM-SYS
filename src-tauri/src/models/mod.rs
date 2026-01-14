use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    pub id: String,
    pub name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub branch_id: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub role: String, // "owner" | "kasir"
    pub is_active: bool,
    pub last_login: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub branch_id: String,
    pub username: String,
    pub full_name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login: Option<String>,
    pub created_at: String,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            branch_id: user.branch_id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login,
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub nik: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub total_transactions: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub category_id: String,
    pub sku: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub gold_type: String, // "LM" | "UBS" | "Lokal"
    pub gold_purity: i32,  // 375-999
    pub weight_gram: f64,
    pub labor_cost: i32,
    pub images: Option<String>,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Inventory {
    pub id: String,
    pub product_id: String,
    pub branch_id: String,
    pub barcode: String,
    pub status: String, // "available" | "sold" | "reserved"
    pub location: Option<String>,
    pub purchase_price: i32,
    pub purchase_date: Option<String>,
    pub supplier: Option<String>,
    pub notes: Option<String>,
    pub sold_at: Option<String>,
    pub created_at: String,
    // Joined fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product: Option<Product>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPrice {
    pub id: String,
    pub date: String,
    pub gold_type: String,
    pub purity: i32,
    pub buy_price: i32,
    pub sell_price: i32,
    pub source: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub branch_id: String,
    pub user_id: String,
    pub customer_id: Option<String>,
    pub invoice_no: String,
    pub r#type: String, // "sale" | "buyback" | "exchange"
    pub subtotal: i32,
    pub discount: i32,
    pub total_amount: i32,
    pub notes: Option<String>,
    pub status: String, // "pending" | "completed" | "void"
    pub created_at: String,
    // Joined fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer: Option<Customer>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Vec<TransactionItem>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payments: Option<Vec<Payment>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItem {
    pub id: String,
    pub transaction_id: String,
    pub inventory_id: String,
    pub quantity: i32,
    pub unit_price: i32,
    pub subtotal: i32,
    pub gold_price_ref: Option<i32>,
    // Joined
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inventory: Option<Inventory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub transaction_id: String,
    pub method: String, // "cash" | "qris" | "bank_transfer"
    pub amount: i32,
    pub reference_no: Option<String>,
    pub bank_name: Option<String>,
    pub status: String, // "pending" | "success" | "failed"
    pub paid_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncLog {
    pub id: String,
    pub table_name: String,
    pub record_id: String,
    pub action: String, // "insert" | "update" | "delete"
    pub synced: bool,
    pub synced_at: Option<String>,
    pub created_at: String,
}

// Request/Response types
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: UserResponse,
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateInventoryRequest {
    pub product_id: String,
    pub barcode: String,
    pub location: Option<String>,
    pub purchase_price: i32,
    pub purchase_date: Option<String>,
    pub supplier: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub customer_id: Option<String>,
    pub r#type: String,
    pub items: Vec<CreateTransactionItem>,
    pub discount: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionItem {
    pub inventory_id: String,
    pub unit_price: i32,
}

#[derive(Debug, Deserialize)]
pub struct ProcessPaymentRequest {
    pub transaction_id: String,
    pub method: String,
    pub amount: i32,
    pub reference_no: Option<String>,
    pub bank_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetGoldPriceRequest {
    pub gold_type: String,
    pub purity: i32,
    pub buy_price: i32,
    pub sell_price: i32,
}

// Dashboard summary types
#[derive(Debug, Serialize)]
pub struct DashboardSummary {
    pub today_sales: i32,
    pub today_transactions: i32,
    pub available_stock: i32,
    pub total_weight: f64,
}

#[derive(Debug, Serialize)]
pub struct SalesReport {
    pub date: String,
    pub total_sales: i32,
    pub total_buyback: i32,
    pub transaction_count: i32,
}
