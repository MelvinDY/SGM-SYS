use super::{ApiResponse, DbPool};
use crate::models::{LoginRequest, LoginResponse, User, UserResponse};
use tauri::State;

#[tauri::command]
pub async fn login(
    pool: State<'_, DbPool>,
    request: LoginRequest,
) -> Result<ApiResponse<LoginResponse>, String> {
    let user: Option<User> = sqlx::query_as!(
        User,
        r#"
        SELECT id, branch_id, username, password_hash, full_name, role,
               is_active as "is_active: bool", last_login, created_at
        FROM users
        WHERE username = ? AND is_active = 1
        "#,
        request.username
    )
    .fetch_optional(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    match user {
        Some(user) => {
            // Verify password
            let valid = bcrypt::verify(&request.password, &user.password_hash)
                .map_err(|e| e.to_string())?;

            if valid {
                // Update last login
                let now = chrono::Utc::now().to_rfc3339();
                sqlx::query("UPDATE users SET last_login = ? WHERE id = ?")
                    .bind(&now)
                    .bind(&user.id)
                    .execute(&pool.0)
                    .await
                    .map_err(|e| e.to_string())?;

                // Generate token (simple for now, should use JWT in production)
                let token = format!("token-{}-{}", user.id, chrono::Utc::now().timestamp());

                Ok(ApiResponse::success(LoginResponse {
                    user: UserResponse::from(user),
                    token,
                }))
            } else {
                Ok(ApiResponse::error("Invalid password"))
            }
        }
        None => Ok(ApiResponse::error("User not found")),
    }
}

#[tauri::command]
pub async fn get_users(pool: State<'_, DbPool>) -> Result<ApiResponse<Vec<UserResponse>>, String> {
    let users: Vec<User> = sqlx::query_as!(
        User,
        r#"
        SELECT id, branch_id, username, password_hash, full_name, role,
               is_active as "is_active: bool", last_login, created_at
        FROM users
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let user_responses: Vec<UserResponse> = users.into_iter().map(UserResponse::from).collect();
    Ok(ApiResponse::success(user_responses))
}

#[tauri::command]
pub async fn create_user(
    pool: State<'_, DbPool>,
    username: String,
    password: String,
    full_name: String,
    role: String,
    branch_id: String,
) -> Result<ApiResponse<UserResponse>, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let password_hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;

    sqlx::query(
        r#"
        INSERT INTO users (id, branch_id, username, password_hash, full_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        "#,
    )
    .bind(&id)
    .bind(&branch_id)
    .bind(&username)
    .bind(&password_hash)
    .bind(&full_name)
    .bind(&role)
    .execute(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    let user: User = sqlx::query_as!(
        User,
        r#"
        SELECT id, branch_id, username, password_hash, full_name, role,
               is_active as "is_active: bool", last_login, created_at
        FROM users WHERE id = ?
        "#,
        id
    )
    .fetch_one(&pool.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(UserResponse::from(user)))
}

#[tauri::command]
pub async fn change_password(
    pool: State<'_, DbPool>,
    user_id: String,
    new_password: String,
) -> Result<ApiResponse<bool>, String> {
    let password_hash =
        bcrypt::hash(&new_password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&password_hash)
        .bind(&user_id)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(true))
}

#[tauri::command]
pub async fn toggle_user_status(
    pool: State<'_, DbPool>,
    user_id: String,
) -> Result<ApiResponse<bool>, String> {
    sqlx::query("UPDATE users SET is_active = NOT is_active WHERE id = ?")
        .bind(&user_id)
        .execute(&pool.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(true))
}
