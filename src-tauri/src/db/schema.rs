use sqlx::SqlitePool;

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Enable foreign keys
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(pool)
        .await?;

    // Create branches table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS branches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            branch_id TEXT REFERENCES branches(id),
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('owner', 'kasir')),
            is_active INTEGER DEFAULT 1,
            last_login TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create customers table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            nik TEXT,
            address TEXT,
            notes TEXT,
            total_transactions INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create categories table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create products table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            category_id TEXT REFERENCES categories(id),
            sku TEXT UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            gold_type TEXT NOT NULL CHECK (gold_type IN ('LM', 'UBS', 'Lokal')),
            gold_purity INTEGER NOT NULL CHECK (gold_purity BETWEEN 375 AND 999),
            weight_gram REAL NOT NULL,
            labor_cost INTEGER DEFAULT 0,
            images TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create inventory table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL REFERENCES products(id),
            branch_id TEXT NOT NULL REFERENCES branches(id),
            barcode TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
            location TEXT,
            purchase_price INTEGER NOT NULL,
            purchase_date TEXT,
            supplier TEXT,
            notes TEXT,
            sold_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create gold_prices table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS gold_prices (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            gold_type TEXT NOT NULL,
            purity INTEGER NOT NULL,
            buy_price INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            source TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(date, gold_type, purity)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create transactions table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            branch_id TEXT NOT NULL REFERENCES branches(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            customer_id TEXT REFERENCES customers(id),
            invoice_no TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('sale', 'buyback', 'exchange')),
            subtotal INTEGER NOT NULL,
            discount INTEGER DEFAULT 0,
            total_amount INTEGER NOT NULL,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'void')),
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create transaction_items table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS transaction_items (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL REFERENCES transactions(id),
            inventory_id TEXT NOT NULL REFERENCES inventory(id),
            quantity INTEGER DEFAULT 1,
            unit_price INTEGER NOT NULL,
            subtotal INTEGER NOT NULL,
            gold_price_ref INTEGER
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create payments table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL REFERENCES transactions(id),
            method TEXT NOT NULL CHECK (method IN ('cash', 'qris', 'bank_transfer')),
            amount INTEGER NOT NULL,
            reference_no TEXT,
            bank_name TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
            paid_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create sync_log table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS sync_log (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
            synced INTEGER DEFAULT 0,
            synced_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_no)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_gold_prices_date ON gold_prices(date)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced)")
        .execute(pool)
        .await?;

    // Insert default data if tables are empty
    insert_default_data(pool).await?;

    Ok(())
}

async fn insert_default_data(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Check if branches exist
    let branch_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM branches")
        .fetch_one(pool)
        .await?;

    if branch_count.0 == 0 {
        // Insert default branch
        sqlx::query(
            r#"
            INSERT INTO branches (id, name, address, phone, is_active)
            VALUES ('default', 'Toko Emas Sejahtera', 'Jl. Raya No. 123, Jakarta', '021-1234567', 1)
            "#,
        )
        .execute(pool)
        .await?;

        // Insert default admin user (password: admin)
        let password_hash =
            bcrypt::hash("admin", bcrypt::DEFAULT_COST).expect("Failed to hash password");
        sqlx::query(
            r#"
            INSERT INTO users (id, branch_id, username, password_hash, full_name, role, is_active)
            VALUES ('admin', 'default', 'admin', ?, 'Administrator', 'owner', 1)
            "#,
        )
        .bind(&password_hash)
        .execute(pool)
        .await?;

        // Insert default categories
        let categories = vec![
            ("cat-1", "Cincin", "Berbagai jenis cincin emas"),
            ("cat-2", "Kalung", "Kalung dan liontin emas"),
            ("cat-3", "Gelang", "Gelang emas berbagai model"),
            ("cat-4", "Anting", "Anting dan subang emas"),
            ("cat-5", "Liontin", "Liontin emas"),
            ("cat-6", "Batangan", "Emas batangan/lantakan"),
            ("cat-7", "Koin", "Koin emas"),
        ];

        for (id, name, desc) in categories {
            sqlx::query(
                "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
            )
            .bind(id)
            .bind(name)
            .bind(desc)
            .execute(pool)
            .await?;
        }

        // Insert today's gold prices
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let prices = vec![
            ("LM", 999, 1150000, 1250000),
            ("LM", 750, 950000, 1050000),
            ("LM", 375, 475000, 525000),
            ("UBS", 999, 1145000, 1245000),
            ("UBS", 750, 945000, 1045000),
            ("Lokal", 750, 880000, 980000),
            ("Lokal", 375, 440000, 490000),
        ];

        for (gold_type, purity, buy_price, sell_price) in prices {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query(
                r#"
                INSERT INTO gold_prices (id, date, gold_type, purity, buy_price, sell_price, source)
                VALUES (?, ?, ?, ?, ?, ?, 'Manual')
                "#,
            )
            .bind(&id)
            .bind(&today)
            .bind(gold_type)
            .bind(purity)
            .bind(buy_price)
            .bind(sell_price)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}
