use sqlx::SqlitePool;

pub mod auth;
pub mod inventory;
pub mod transactions;
pub mod gold_prices;
pub mod reports;
pub mod sync;

// Re-export all commands
pub use auth::*;
pub use inventory::*;
pub use transactions::*;
pub use gold_prices::*;
pub use reports::*;
pub use sync::*;

// Database state wrapper
pub struct DbPool(pub SqlitePool);

// Generic API response
#[derive(serde::Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}
