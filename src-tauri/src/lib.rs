mod commands;
mod db;
mod models;

use commands::DbPool;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let pool = db::init_database(&app_handle)
                    .await
                    .expect("Failed to initialize database");
                app_handle.manage(DbPool(pool));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            commands::login,
            commands::get_users,
            commands::create_user,
            commands::change_password,
            commands::toggle_user_status,
            // Inventory commands
            commands::get_categories,
            commands::get_products,
            commands::create_product,
            commands::get_inventory,
            commands::scan_barcode,
            commands::add_inventory,
            commands::update_inventory_location,
            commands::get_inventory_stats,
            // Transaction commands
            commands::create_transaction,
            commands::process_payment,
            commands::void_transaction,
            commands::get_transactions,
            commands::get_customers,
            commands::create_customer,
            commands::search_customer,
            // Gold price commands
            commands::get_today_prices,
            commands::set_gold_price,
            commands::get_price_history,
            commands::get_all_prices_for_date,
            commands::get_price_for_calculation,
            // Report commands
            commands::get_dashboard_summary,
            commands::get_sales_report,
            commands::get_daily_summary,
            commands::get_stock_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
