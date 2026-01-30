use super::{ApiResponse, DbPool};
use crate::models::{Category, CreateInventoryRequest, Inventory, Product};
use tauri::State;

#[tauri::command]
pub async fn get_categories(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<Vec<Category>>, String> {
    let categories: Vec<Category> = sqlx::query_as::<_, Category>(
        "SELECT id, name, description, created_at FROM categories ORDER BY name",
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(categories))
}

#[tauri::command]
pub async fn get_products(pool: State<'_, DbPool>) -> Result<ApiResponse<Vec<Product>>, String> {
    let products: Vec<Product> = sqlx::query_as::<_, Product>(
        r#"
        SELECT id, category_id, sku, name, description, gold_type, gold_purity,
               weight_gram, labor_cost, images, is_active, created_at
        FROM products
        WHERE is_active = 1
        ORDER BY name
        "#,
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

    let product: Product = sqlx::query_as::<_, Product>(
        r#"
        SELECT id, category_id, sku, name, description, gold_type, gold_purity,
               weight_gram, labor_cost, images, is_active, created_at
        FROM products WHERE id = ?
        "#,
    )
    .bind(&id)
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
    // First get all inventory items
    let inv_query = match &status {
        Some(s) => format!(
            "SELECT id, product_id, branch_id, barcode, status, location, purchase_price, purchase_date, supplier, notes, sold_at, created_at FROM inventory WHERE status = '{}' ORDER BY created_at DESC",
            s
        ),
        None => "SELECT id, product_id, branch_id, barcode, status, location, purchase_price, purchase_date, supplier, notes, sold_at, created_at FROM inventory ORDER BY created_at DESC".to_string(),
    };

    let inventory_items: Vec<Inventory> = sqlx::query_as::<_, Inventory>(&inv_query)
        .fetch_all(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    // Get all products for joining
    let products: Vec<Product> = sqlx::query_as::<_, Product>(
        "SELECT id, category_id, sku, name, description, gold_type, gold_purity, weight_gram, labor_cost, images, is_active, created_at FROM products",
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Create a map for quick lookup
    let product_map: std::collections::HashMap<String, Product> = products
        .into_iter()
        .map(|p| (p.id.clone(), p))
        .collect();

    // Join products to inventory
    let inventory: Vec<Inventory> = inventory_items
        .into_iter()
        .map(|mut inv| {
            inv.product = product_map.get(&inv.product_id).cloned();
            inv
        })
        .collect();

    Ok(ApiResponse::success(inventory))
}

#[tauri::command]
pub async fn scan_barcode(
    pool: State<'_, DbPool>,
    barcode: String,
) -> Result<ApiResponse<Option<Inventory>>, String> {
    let inventory: Option<Inventory> = sqlx::query_as::<_, Inventory>(
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory
        WHERE barcode = ?
        "#,
    )
    .bind(&barcode)
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

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

    let inventory: Inventory = sqlx::query_as::<_, Inventory>(
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory WHERE id = ?
        "#,
    )
    .bind(&id)
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

#[tauri::command]
pub async fn update_inventory(
    pool: State<'_, DbPool>,
    inventory_id: String,
    location: Option<String>,
    purchase_price: Option<i32>,
    supplier: Option<String>,
    notes: Option<String>,
) -> Result<ApiResponse<Inventory>, String> {
    // Build dynamic update query
    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(loc) = location {
        updates.push("location = ?");
        params.push(loc);
    }
    if let Some(price) = purchase_price {
        updates.push("purchase_price = ?");
        params.push(price.to_string());
    }
    if let Some(sup) = supplier {
        updates.push("supplier = ?");
        params.push(sup);
    }
    if let Some(n) = notes {
        updates.push("notes = ?");
        params.push(n);
    }

    if updates.is_empty() {
        return Ok(ApiResponse::error("No fields to update"));
    }

    let query = format!(
        "UPDATE inventory SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut q = sqlx::query(&query);
    for param in &params {
        q = q.bind(param);
    }
    q = q.bind(&inventory_id);

    q.execute(&pool.0).await.map_err(|e| e.to_string())?;

    // Fetch updated inventory
    let inventory: Inventory = sqlx::query_as::<_, Inventory>(
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory WHERE id = ?
        "#,
    )
    .bind(&inventory_id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(inventory))
}

#[tauri::command]
pub async fn delete_inventory(
    pool: State<'_, DbPool>,
    inventory_id: String,
) -> Result<ApiResponse<bool>, String> {
    // Check if inventory exists and is available (not sold)
    let inventory: Option<Inventory> = sqlx::query_as::<_, Inventory>(
        r#"
        SELECT id, product_id, branch_id, barcode, status, location,
               purchase_price, purchase_date, supplier, notes, sold_at, created_at
        FROM inventory WHERE id = ?
        "#,
    )
    .bind(&inventory_id)
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    match inventory {
        Some(inv) => {
            if inv.status != "available" {
                return Ok(ApiResponse::error("Cannot delete inventory that is not available"));
            }

            sqlx::query("DELETE FROM inventory WHERE id = ?")
                .bind(&inventory_id)
                .execute(&pool.0)
                .await
                .map_err(|e| e.to_string())?;

            Ok(ApiResponse::success(true))
        }
        None => Ok(ApiResponse::error("Inventory not found")),
    }
}

/// Generate a barcode in format: EM-[CAT]-[SEQ]-[CHK]
/// where CAT is category code, SEQ is sequential number, CHK is Luhn checksum
#[tauri::command]
pub async fn generate_barcode(
    pool: State<'_, DbPool>,
    category_code: String,
) -> Result<ApiResponse<String>, String> {
    // Get next sequence number for this category
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM inventory WHERE barcode LIKE ?",
    )
    .bind(format!("EM-{}-%%", category_code))
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let sequence = count.0 + 1;
    let seq_str = format!("{:06}", sequence);

    // Calculate Luhn checksum
    let digits: Vec<u32> = seq_str.chars().filter_map(|c| c.to_digit(10)).collect();
    let mut sum = 0u32;
    for (i, &digit) in digits.iter().rev().enumerate() {
        if i % 2 == 1 {
            let doubled = digit * 2;
            sum += if doubled > 9 { doubled - 9 } else { doubled };
        } else {
            sum += digit;
        }
    }
    let checksum = (10 - (sum % 10)) % 10;

    let barcode = format!("EM-{}-{}-{}", category_code, seq_str, checksum);

    Ok(ApiResponse::success(barcode))
}
