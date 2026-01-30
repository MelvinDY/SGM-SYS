use super::{ApiResponse, DbPool};
use crate::models::{DashboardSummary, SalesReport};
use tauri::State;

#[tauri::command]
pub async fn get_dashboard_summary(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<DashboardSummary>, String> {
    let now = chrono::Local::now();
    let today = now.format("%Y-%m-%d").to_string();
    let yesterday = (now - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();

    // Today's sales
    let today_sales: (Option<i64>,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_amount), 0)
        FROM transactions
        WHERE type = 'sale' AND status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&today)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Yesterday's sales (for comparison)
    let yesterday_sales: (Option<i64>,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_amount), 0)
        FROM transactions
        WHERE type = 'sale' AND status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&yesterday)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Today's transaction count
    let today_tx_count: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM transactions
        WHERE status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&today)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Yesterday's transaction count (for comparison)
    let yesterday_tx_count: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM transactions
        WHERE status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&yesterday)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Available stock count
    let stock_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM inventory WHERE status = 'available'")
            .fetch_one(&pool.0)
            .await
            .map_err(|e| e.to_string())?;

    // Total weight
    let total_weight: (Option<f64>,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(p.weight_gram), 0)
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.status = 'available'
        "#,
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Calculate percentage changes
    let today_sales_val = today_sales.0.unwrap_or(0) as f64;
    let yesterday_sales_val = yesterday_sales.0.unwrap_or(0) as f64;
    let sales_change = if yesterday_sales_val > 0.0 {
        ((today_sales_val - yesterday_sales_val) / yesterday_sales_val) * 100.0
    } else if today_sales_val > 0.0 {
        100.0
    } else {
        0.0
    };

    let today_tx_val = today_tx_count.0 as f64;
    let yesterday_tx_val = yesterday_tx_count.0 as f64;
    let transactions_change = if yesterday_tx_val > 0.0 {
        ((today_tx_val - yesterday_tx_val) / yesterday_tx_val) * 100.0
    } else if today_tx_val > 0.0 {
        100.0
    } else {
        0.0
    };

    Ok(ApiResponse::success(DashboardSummary {
        today_sales: today_sales.0.unwrap_or(0) as i32,
        today_transactions: today_tx_count.0 as i32,
        total_stock: stock_count.0 as i32,
        total_weight: total_weight.0.unwrap_or(0.0),
        sales_change: (sales_change * 10.0).round() / 10.0, // Round to 1 decimal
        transactions_change: (transactions_change * 10.0).round() / 10.0,
    }))
}

#[tauri::command]
pub async fn get_sales_report(
    pool: State<'_, DbPool>,
    date_from: String,
    date_to: String,
) -> Result<ApiResponse<Vec<SalesReport>>, String> {
    let rows = sqlx::query_as::<_, (String, Option<i64>, Option<i64>, i64)>(
        r#"
        SELECT
            DATE(created_at) as date,
            SUM(CASE WHEN type = 'sale' AND status = 'completed' THEN total_amount ELSE 0 END) as total_sales,
            SUM(CASE WHEN type = 'buyback' AND status = 'completed' THEN total_amount ELSE 0 END) as total_buyback,
            COUNT(*) as transaction_count
        FROM transactions
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        "#,
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let reports: Vec<SalesReport> = rows
        .into_iter()
        .map(|row| SalesReport {
            date: row.0,
            total_sales: row.1.unwrap_or(0) as i32,
            total_buyback: row.2.unwrap_or(0) as i32,
            transaction_count: row.3 as i32,
        })
        .collect();

    Ok(ApiResponse::success(reports))
}

#[tauri::command]
pub async fn get_daily_summary(
    pool: State<'_, DbPool>,
    date: String,
) -> Result<ApiResponse<serde_json::Value>, String> {
    // Sales summary
    let sales: (Option<i64>, i64) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
        FROM transactions
        WHERE type = 'sale' AND status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&date)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Buyback summary
    let buyback: (Option<i64>, i64) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
        FROM transactions
        WHERE type = 'buyback' AND status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&date)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Exchange summary
    let exchange: (Option<i64>, i64) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
        FROM transactions
        WHERE type = 'exchange' AND status = 'completed' AND DATE(created_at) = ?
        "#,
    )
    .bind(&date)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Payment breakdown
    let payments = sqlx::query_as::<_, (String, Option<i64>)>(
        r#"
        SELECT p.method, COALESCE(SUM(p.amount), 0)
        FROM payments p
        JOIN transactions t ON p.transaction_id = t.id
        WHERE p.status = 'success' AND DATE(t.created_at) = ?
        GROUP BY p.method
        "#,
    )
    .bind(&date)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let mut cash = 0i64;
    let mut qris = 0i64;
    let mut bank_transfer = 0i64;

    for (method, amount) in payments {
        match method.as_str() {
            "cash" => cash = amount.unwrap_or(0),
            "qris" => qris = amount.unwrap_or(0),
            "bank_transfer" => bank_transfer = amount.unwrap_or(0),
            _ => {}
        }
    }

    let summary = serde_json::json!({
        "date": date,
        "sales_count": sales.1,
        "sales_amount": sales.0.unwrap_or(0),
        "buyback_count": buyback.1,
        "buyback_amount": buyback.0.unwrap_or(0),
        "exchange_count": exchange.1,
        "exchange_amount": exchange.0.unwrap_or(0),
        "cash_received": cash,
        "qris_received": qris,
        "bank_transfer_received": bank_transfer,
        "payment_breakdown": {
            "cash": cash,
            "qris": qris,
            "bank_transfer": bank_transfer
        }
    });

    Ok(ApiResponse::success(summary))
}

#[tauri::command]
pub async fn get_stock_report(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<Vec<serde_json::Value>>, String> {
    let rows = sqlx::query_as::<_, (String, i64, i64, i64, Option<f64>, Option<i64>)>(
        r#"
        SELECT
            c.name as category,
            COUNT(*) as total_items,
            SUM(CASE WHEN i.status = 'available' THEN 1 ELSE 0 END) as available_items,
            SUM(CASE WHEN i.status = 'sold' THEN 1 ELSE 0 END) as sold_items,
            SUM(CASE WHEN i.status = 'available' THEN p.weight_gram ELSE 0 END) as total_weight,
            SUM(CASE WHEN i.status = 'available' THEN i.purchase_price ELSE 0 END) as total_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY c.name
        "#,
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let reports: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "category": row.0,
                "total_items": row.1,
                "available_items": row.2,
                "sold_items": row.3,
                "total_weight": row.4.unwrap_or(0.0),
                "total_value": row.5.unwrap_or(0)
            })
        })
        .collect();

    Ok(ApiResponse::success(reports))
}
