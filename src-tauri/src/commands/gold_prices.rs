use super::{ApiResponse, DbPool};
use crate::models::{GoldPrice, SetGoldPriceRequest};
use tauri::State;

#[tauri::command]
pub async fn get_today_prices(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<Vec<GoldPrice>>, String> {
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    let prices: Vec<GoldPrice> = sqlx::query_as::<_, GoldPrice>(
        r#"
        SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at
        FROM gold_prices
        WHERE date = ?
        ORDER BY gold_type, purity DESC
        "#,
    )
    .bind(&today)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(prices))
}

#[tauri::command]
pub async fn set_gold_price(
    pool: State<'_, DbPool>,
    request: SetGoldPriceRequest,
) -> Result<ApiResponse<GoldPrice>, String> {
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let id = uuid::Uuid::new_v4().to_string();

    // Upsert price
    sqlx::query(
        r#"
        INSERT INTO gold_prices (id, date, gold_type, purity, buy_price, sell_price, source)
        VALUES (?, ?, ?, ?, ?, ?, 'Manual')
        ON CONFLICT(date, gold_type, purity)
        DO UPDATE SET buy_price = excluded.buy_price, sell_price = excluded.sell_price
        "#,
    )
    .bind(&id)
    .bind(&today)
    .bind(&request.gold_type)
    .bind(request.purity)
    .bind(request.buy_price)
    .bind(request.sell_price)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let price: GoldPrice = sqlx::query_as::<_, GoldPrice>(
        r#"
        SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at
        FROM gold_prices
        WHERE date = ? AND gold_type = ? AND purity = ?
        "#,
    )
    .bind(&today)
    .bind(&request.gold_type)
    .bind(request.purity)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(price))
}

#[tauri::command]
pub async fn get_price_history(
    pool: State<'_, DbPool>,
    gold_type: String,
    purity: i32,
    days: i32,
) -> Result<ApiResponse<Vec<GoldPrice>>, String> {
    let prices: Vec<GoldPrice> = sqlx::query_as::<_, GoldPrice>(
        r#"
        SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at
        FROM gold_prices
        WHERE gold_type = ? AND purity = ?
        ORDER BY date DESC
        LIMIT ?
        "#,
    )
    .bind(&gold_type)
    .bind(purity)
    .bind(days)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(prices))
}

#[tauri::command]
pub async fn get_all_prices_for_date(
    pool: State<'_, DbPool>,
    date: String,
) -> Result<ApiResponse<Vec<GoldPrice>>, String> {
    let prices: Vec<GoldPrice> = sqlx::query_as::<_, GoldPrice>(
        r#"
        SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at
        FROM gold_prices
        WHERE date = ?
        ORDER BY gold_type, purity DESC
        "#,
    )
    .bind(&date)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(prices))
}

#[tauri::command]
pub async fn get_price_for_calculation(
    pool: State<'_, DbPool>,
    gold_type: String,
    purity: i32,
) -> Result<ApiResponse<Option<GoldPrice>>, String> {
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    let price: Option<GoldPrice> = sqlx::query_as::<_, GoldPrice>(
        r#"
        SELECT id, date, gold_type, purity, buy_price, sell_price, source, created_at
        FROM gold_prices
        WHERE date = ? AND gold_type = ? AND purity = ?
        "#,
    )
    .bind(&today)
    .bind(&gold_type)
    .bind(purity)
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(price))
}
