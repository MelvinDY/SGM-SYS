use parking_lot::RwLock;
use serde::Deserialize;
use std::time::{Duration, Instant};

/// OAuth 2.0 token response from Salesforce
#[derive(Debug, Clone, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub instance_url: String,
    pub id: String,
    pub token_type: String,
    pub issued_at: String,
}

/// Error response from Salesforce OAuth
#[derive(Debug, Clone, Deserialize)]
pub struct OAuthError {
    pub error: String,
    pub error_description: String,
}

/// Cached token with expiration tracking
#[derive(Debug, Clone)]
struct CachedToken {
    token: TokenResponse,
    obtained_at: Instant,
}

/// Salesforce OAuth credentials
#[derive(Debug, Clone)]
pub struct SalesforceCredentials {
    pub client_id: String,
    pub client_secret: String,
    pub username: String,
    pub password: String,
    pub security_token: String,
    pub login_url: String,
}

impl SalesforceCredentials {
    pub fn new(
        client_id: String,
        client_secret: String,
        username: String,
        password: String,
        security_token: String,
        is_sandbox: bool,
    ) -> Self {
        let login_url = if is_sandbox {
            "https://test.salesforce.com".to_string()
        } else {
            "https://login.salesforce.com".to_string()
        };

        Self {
            client_id,
            client_secret,
            username,
            password,
            security_token,
            login_url,
        }
    }
}

/// Token manager for Salesforce OAuth 2.0
/// Handles token caching and automatic refresh
pub struct TokenManager {
    credentials: RwLock<Option<SalesforceCredentials>>,
    cached_token: RwLock<Option<CachedToken>>,
    http_client: reqwest::Client,
    /// Token lifetime in seconds (default 2 hours, refresh before expiry)
    token_lifetime: Duration,
}

impl TokenManager {
    pub fn new() -> Self {
        Self {
            credentials: RwLock::new(None),
            cached_token: RwLock::new(None),
            http_client: reqwest::Client::new(),
            token_lifetime: Duration::from_secs(7200 - 300), // 2 hours minus 5 minutes buffer
        }
    }

    /// Set credentials for authentication
    pub fn set_credentials(&self, credentials: SalesforceCredentials) {
        let mut creds = self.credentials.write();
        *creds = Some(credentials);
        // Clear cached token when credentials change
        let mut token = self.cached_token.write();
        *token = None;
    }

    /// Clear stored credentials and token
    pub fn clear_credentials(&self) {
        let mut creds = self.credentials.write();
        *creds = None;
        let mut token = self.cached_token.write();
        *token = None;
    }

    /// Check if credentials are configured
    pub fn has_credentials(&self) -> bool {
        self.credentials.read().is_some()
    }

    /// Get valid access token, refreshing if necessary
    pub async fn get_token(&self) -> Result<TokenResponse, String> {
        // Check if we have a valid cached token
        {
            let cached = self.cached_token.read();
            if let Some(ref token) = *cached {
                if token.obtained_at.elapsed() < self.token_lifetime {
                    return Ok(token.token.clone());
                }
            }
        }

        // Need to refresh token
        self.refresh_token().await
    }

    /// Force refresh the token
    pub async fn refresh_token(&self) -> Result<TokenResponse, String> {
        let credentials = {
            let creds = self.credentials.read();
            creds.clone().ok_or_else(|| "Salesforce credentials not configured".to_string())?
        };

        let token = self.authenticate(&credentials).await?;

        // Cache the new token
        {
            let mut cached = self.cached_token.write();
            *cached = Some(CachedToken {
                token: token.clone(),
                obtained_at: Instant::now(),
            });
        }

        Ok(token)
    }

    /// Perform OAuth 2.0 username-password flow authentication
    async fn authenticate(&self, credentials: &SalesforceCredentials) -> Result<TokenResponse, String> {
        let token_url = format!("{}/services/oauth2/token", credentials.login_url);

        // Password + security token combined
        let password_with_token = format!("{}{}", credentials.password, credentials.security_token);

        let params = [
            ("grant_type", "password"),
            ("client_id", &credentials.client_id),
            ("client_secret", &credentials.client_secret),
            ("username", &credentials.username),
            ("password", &password_with_token),
        ];

        let response = self
            .http_client
            .post(&token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Salesforce: {}", e))?;

        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response: {}", e))?;

        if status.is_success() {
            serde_json::from_str::<TokenResponse>(&body)
                .map_err(|e| format!("Failed to parse token response: {}", e))
        } else {
            // Try to parse error response
            if let Ok(error) = serde_json::from_str::<OAuthError>(&body) {
                Err(format!("Salesforce authentication failed: {} - {}", error.error, error.error_description))
            } else {
                Err(format!("Salesforce authentication failed: {} - {}", status, body))
            }
        }
    }

    /// Test the connection with current credentials
    pub async fn test_connection(&self) -> Result<String, String> {
        let token = self.get_token().await?;
        Ok(format!("Connected to: {}", token.instance_url))
    }
}

impl Default for TokenManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credentials_sandbox_url() {
        let creds = SalesforceCredentials::new(
            "client_id".to_string(),
            "client_secret".to_string(),
            "user@test.com".to_string(),
            "password".to_string(),
            "token".to_string(),
            true,
        );
        assert_eq!(creds.login_url, "https://test.salesforce.com");
    }

    #[test]
    fn test_credentials_production_url() {
        let creds = SalesforceCredentials::new(
            "client_id".to_string(),
            "client_secret".to_string(),
            "user@test.com".to_string(),
            "password".to_string(),
            "token".to_string(),
            false,
        );
        assert_eq!(creds.login_url, "https://login.salesforce.com");
    }
}
