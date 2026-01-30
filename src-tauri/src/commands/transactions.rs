use super::{ApiResponse, DbPool};
use crate::models::{CreateTransactionRequest, Customer, Payment, ProcessPaymentRequest, Transaction};
use tauri::State;

#[tauri::command]
pub async fn create_transaction(
    pool: State<'_, DbPool>,
    request: CreateTransactionRequest,
    user_id: String,
    branch_id: String,
) -> Result<ApiResponse<Transaction>, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Local::now();
    let today = now.format("%Y%m%d").to_string();
    let invoice_prefix = match request.r#type.as_str() {
        "sale" => "INV",
        "buyback" => "BUY",
        "exchange" => "EXC",
        _ => "TRX",
    };

    // Get sequential number for today
    let pattern = format!("{}-{}-%", invoice_prefix, today);
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM transactions WHERE invoice_no LIKE ?")
        .bind(&pattern)
        .fetch_one(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    let sequence = count.0 + 1;
    let invoice_no = format!("{}-{}-{:03}", invoice_prefix, today, sequence);

    // Calculate totals
    let subtotal: i32 = request.items.iter().map(|i| i.unit_price).sum();
    let discount = request.discount.unwrap_or(0);
    let total_amount = subtotal - discount;

    // Start transaction
    sqlx::query(
        r#"
        INSERT INTO transactions (id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount, total_amount, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        "#,
    )
    .bind(&id)
    .bind(&branch_id)
    .bind(&user_id)
    .bind(&request.customer_id)
    .bind(&invoice_no)
    .bind(&request.r#type)
    .bind(subtotal)
    .bind(discount)
    .bind(total_amount)
    .bind(&request.notes)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Add transaction items
    for item in &request.items {
        let item_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO transaction_items (id, transaction_id, inventory_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, 1, ?, ?)
            "#,
        )
        .bind(&item_id)
        .bind(&id)
        .bind(&item.inventory_id)
        .bind(item.unit_price)
        .bind(item.unit_price)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

        // Update inventory status for sales
        if request.r#type == "sale" {
            sqlx::query("UPDATE inventory SET status = 'reserved' WHERE id = ?")
                .bind(&item.inventory_id)
                .execute(&pool.0)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    let transaction: Transaction = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount,
               total_amount, notes, status, created_at
        FROM transactions WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(transaction))
}

#[tauri::command]
pub async fn process_payment(
    pool: State<'_, DbPool>,
    request: ProcessPaymentRequest,
) -> Result<ApiResponse<Payment>, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO payments (id, transaction_id, method, amount, reference_no, bank_name, status, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, 'success', ?)
        "#,
    )
    .bind(&id)
    .bind(&request.transaction_id)
    .bind(&request.method)
    .bind(request.amount)
    .bind(&request.reference_no)
    .bind(&request.bank_name)
    .bind(&now)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    // Check if transaction is fully paid
    let transaction: Transaction = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount,
               total_amount, notes, status, created_at
        FROM transactions WHERE id = ?
        "#,
    )
    .bind(&request.transaction_id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let total_paid: (Option<i64>,) = sqlx::query_as(
        "SELECT SUM(amount) FROM payments WHERE transaction_id = ? AND status = 'success'",
    )
    .bind(&request.transaction_id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if total_paid.0.unwrap_or(0) >= transaction.total_amount as i64 {
        // Mark transaction as completed
        sqlx::query("UPDATE transactions SET status = 'completed' WHERE id = ?")
            .bind(&request.transaction_id)
            .execute(&pool.0)
            .await
            .map_err(|e| e.to_string())?;

        // Mark inventory items as sold (for sales)
        if transaction.r#type == "sale" {
            sqlx::query(
                r#"
                UPDATE inventory SET status = 'sold', sold_at = ?
                WHERE id IN (SELECT inventory_id FROM transaction_items WHERE transaction_id = ?)
                "#,
            )
            .bind(&now)
            .bind(&request.transaction_id)
            .execute(&pool.0)
            .await
            .map_err(|e| e.to_string())?;
        }

        // Update customer transaction count
        if let Some(customer_id) = &transaction.customer_id {
            sqlx::query(
                "UPDATE customers SET total_transactions = total_transactions + 1 WHERE id = ?",
            )
            .bind(customer_id)
            .execute(&pool.0)
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    let payment: Payment = sqlx::query_as::<_, Payment>(
        r#"
        SELECT id, transaction_id, method, amount, reference_no, bank_name, status, paid_at, created_at
        FROM payments WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(payment))
}

#[tauri::command]
pub async fn void_transaction(
    pool: State<'_, DbPool>,
    transaction_id: String,
    reason: String,
) -> Result<ApiResponse<bool>, String> {
    // Get transaction
    let transaction: Transaction = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount,
               total_amount, notes, status, created_at
        FROM transactions WHERE id = ?
        "#,
    )
    .bind(&transaction_id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    if transaction.status == "void" {
        return Ok(ApiResponse::error("Transaction already voided"));
    }

    // Void transaction
    let notes = format!("VOID: {}", reason);
    sqlx::query("UPDATE transactions SET status = 'void', notes = ? WHERE id = ?")
        .bind(&notes)
        .bind(&transaction_id)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    // Restore inventory if it was a sale
    if transaction.r#type == "sale" {
        sqlx::query(
            r#"
            UPDATE inventory SET status = 'available', sold_at = NULL
            WHERE id IN (SELECT inventory_id FROM transaction_items WHERE transaction_id = ?)
            "#,
        )
        .bind(&transaction_id)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(ApiResponse::success(true))
}

#[tauri::command]
pub async fn get_transactions(
    pool: State<'_, DbPool>,
    date_from: Option<String>,
    date_to: Option<String>,
    transaction_type: Option<String>,
) -> Result<ApiResponse<Vec<Transaction>>, String> {
    let mut query = String::from(
        r#"
        SELECT id, branch_id, user_id, customer_id, invoice_no, type, subtotal, discount,
               total_amount, notes, status, created_at
        FROM transactions WHERE 1=1
        "#,
    );

    if let Some(from) = &date_from {
        query.push_str(&format!(" AND DATE(created_at) >= '{}'", from));
    }

    if let Some(to) = &date_to {
        query.push_str(&format!(" AND DATE(created_at) <= '{}'", to));
    }

    if let Some(t) = &transaction_type {
        query.push_str(&format!(" AND type = '{}'", t));
    }

    query.push_str(" ORDER BY created_at DESC LIMIT 100");

    let transactions: Vec<Transaction> = sqlx::query_as::<_, Transaction>(&query)
        .fetch_all(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(transactions))
}

// Customer commands
#[tauri::command]
pub async fn get_customers(
    pool: State<'_, DbPool>,
) -> Result<ApiResponse<Vec<Customer>>, String> {
    let customers: Vec<Customer> = sqlx::query_as::<_, Customer>(
        "SELECT id, name, phone, nik, address, notes, total_transactions, created_at FROM customers ORDER BY name",
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(customers))
}

#[tauri::command]
pub async fn create_customer(
    pool: State<'_, DbPool>,
    name: String,
    phone: Option<String>,
    nik: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<ApiResponse<Customer>, String> {
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO customers (id, name, phone, nik, address, notes) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&name)
    .bind(&phone)
    .bind(&nik)
    .bind(&address)
    .bind(&notes)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let customer: Customer = sqlx::query_as::<_, Customer>(
        "SELECT id, name, phone, nik, address, notes, total_transactions, created_at FROM customers WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(customer))
}

#[tauri::command]
pub async fn search_customer(
    pool: State<'_, DbPool>,
    query: String,
) -> Result<ApiResponse<Vec<Customer>>, String> {
    let search_pattern = format!("%{}%", query);

    let customers: Vec<Customer> = sqlx::query_as::<_, Customer>(
        r#"
        SELECT id, name, phone, nik, address, notes, total_transactions, created_at
        FROM customers
        WHERE name LIKE ? OR phone LIKE ?
        ORDER BY name
        LIMIT 10
        "#,
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(customers))
}
