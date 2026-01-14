use super::{ApiResponse, DbPool};
use crate::models::{Category, CreateInventoryRequest, Inventory, Product};
use tauri::State;

#[tauri::command]
pub async fn get_categories(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<Vec<Category>>, String> {
    let categories: Vec<Category> = sqlx::query_as!(
        Category,
        "SELECT id, name, description, created_at FROM categories ORDER BY name"
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(categories))
}

#[tauri::command]
pub async fn get_products(pool: State<'_, DbPool>) -> Result<ApiResponse<Vec<Product>>, String> {
    let products: Vec<Product> = sqlx::query_as!(
        Product,
        r#"
        SELECT id, category_id, sku, name, description, gold_type, gold_purity,
               weight_gram, labor_cost, images, is_active as "is_active: bool", created_at
        FROM products
        WHERE is_active = 1
        ORDER BY name
        "#
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(products))
}

#[tauri::command]
pub async fn create_product(
    pool: State<'_, DbPool>,
    category_id: String,
    name: String,
    gold_type: String,
    gold_purity: i32,
    weight_gram: f64,
    labor_cost: i32,
    sku: Option<String>,
    description: Option<String>,
) -> Result<ApiResponse<Product>, String> {
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO products (id, category_id, sku, name, description, gold_type, gold_purity, weight_gram, labor_cost, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        "#,
    )
    .bind(&id)
    .bind(&category_id)
    .bind(&sku)
    .bind(&name)
    .bind(&description)
    .bind(&gold_type)
    .bind(gold_purity)
    .bind(weight_gram)
    .bind(labor_cost)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let product: Product = sqlx::query_as!(
        Product,
        r#"
        SELECT id, category_id, sku, name, description, gold_type, gold_purity,
               weight_gram, labor_cost, images, is_active as "is_active: bool", created_at
        FROM products WHERE id = ?
        "#,
        id
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(product))
}

#[tauri::command]
pub async fn get_inventory(
    pool: State<'_, DbPool>,
    status: Option<String>,
) -> Result<ApiResponse<Vec<Inventory>>, String> {
    let query = match status {
        Some(s) => format!(
            r#"
            SELECT i.id, i.product_id, i.branch_id, i.barcode, i.status, i.location,
                   i.purchase_price, i.purchase_date, i.supplier, i.notes, i.sold_at, i.created_at
            FROM inventory i
            WHERE i.status = '{}'
            ORDER BY i.created_at DESC
            "#,
            s
        ),
        None => r#"
            SELECT id, product_id, branch_id, barcode, status, location,
                   purchase_price, purchase_date, supplier, notes, sold_at, created_at
            FROM inventory
            ORDER BY created_at DESC
            "#
        .to_string(),
    };

    let rows = sqlx::query_as::<_, (
        String,
        String,
        String,
        String,
        String,
        Option<String>,
        i32,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        String,
    )>(&query)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let inventory: Vec<Inventory> = rows
        .into_iter()
        .map(|row| Inventory {
            id: row.0,
            product_id: row.1,
            branch_id: row.2,
            barcode: row.3,
            status: row.4,
            location: row.5,
            purchase_price: row.6,
            purchase_date: row.7,
            supplier: row.8,
            notes: row.9,
            sold_at: row.10,
            created_at: row.11,
            product: None,
        })
        .collect();

    Ok(ApiResponse::success(inventory))
}

#[tauri::command]
pub async fn scan_barcode(
    pool: State<'_, DbPool>,
    barcode: String,
) -> Result<ApiResponse<Option<Inventory>>, String> {
    let inventory: Option<Inventory> = sqlx::query_as!(
        Inventory,
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory
        WHERE barcode = ?
        "#,
        barcode
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?
    .map(|mut inv| {
        inv.product = None;
        inv
    });

    Ok(ApiResponse::success(inventory))
}

#[tauri::command]
pub async fn add_inventory(
    pool: State<'_, DbPool>,
    request: CreateInventoryRequest,
    branch_id: String,
) -> Result<ApiResponse<Inventory>, String> {
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO inventory (id, product_id, branch_id, barcode, status, location, purchase_price, purchase_date, supplier, notes)
        VALUES (?, ?, ?, ?, 'available', ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.product_id)
    .bind(&branch_id)
    .bind(&request.barcode)
    .bind(&request.location)
    .bind(request.purchase_price)
    .bind(&request.purchase_date)
    .bind(&request.supplier)
    .bind(&request.notes)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let inventory: Inventory = sqlx::query_as!(
        Inventory,
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory WHERE id = ?
        "#,
        id
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(inventory))
}

#[tauri::command]
pub async fn update_inventory_location(
    pool: State<'_, DbPool>,
    inventory_id: String,
    location: String,
) -> Result<ApiResponse<bool>, String> {
    sqlx::query("UPDATE inventory SET location = ? WHERE id = ?")
        .bind(&location)
        .bind(&inventory_id)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(true))
}

#[tauri::command]
pub async fn get_inventory_stats(
    pool: State<'_, DbPool>,
) -> Result<
    ApiResponse<(i64, i64, i64, f64, i64)>,
    String,
> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM inventory")
        .fetch_one(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    let available: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM inventory WHERE status = 'available'")
            .fetch_one(&pool.0)
            .await
            .map_err(|e| e.to_string())?;

    let sold: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM inventory WHERE status = 'sold'")
        .fetch_one(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    let weight: (Option<f64>,) = sqlx::query_as(
        r#"
        SELECT SUM(p.weight_gram)
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.status = 'available'
        "#,
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let value: (Option<i64>,) = sqlx::query_as(
        "SELECT SUM(purchase_price) FROM inventory WHERE status = 'available'",
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success((
        total.0,
        available.0,
        sold.0,
        weight.0.unwrap_or(0.0),
        value.0.unwrap_or(0),
    )))
}
