use super::auth::TokenManager;
use reqwest::{Client, Method, StatusCode};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

/// Salesforce REST API error response
#[derive(Debug, Clone, Deserialize)]
pub struct SalesforceError {
    pub message: String,
    #[serde(rename = "errorCode")]
    pub error_code: String,
    pub fields: Option<Vec<String>>,
}

/// Salesforce query result
#[derive(Debug, Clone, Deserialize)]
pub struct QueryResult<T> {
    #[serde(rename = "totalSize")]
    pub total_size: i32,
    pub done: bool,
    #[serde(rename = "nextRecordsUrl")]
    pub next_records_url: Option<String>,
    pub records: Vec<T>,
}

/// Composite API request item
#[derive(Debug, Clone, Serialize)]
pub struct CompositeSubrequest {
    pub method: String,
    pub url: String,
    #[serde(rename = "referenceId")]
    pub reference_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<serde_json::Value>,
}

/// Composite API request
#[derive(Debug, Clone, Serialize)]
pub struct CompositeRequest {
    #[serde(rename = "allOrNone")]
    pub all_or_none: bool,
    #[serde(rename = "compositeRequest")]
    pub composite_request: Vec<CompositeSubrequest>,
}

/// Composite API response item
#[derive(Debug, Clone, Deserialize)]
pub struct CompositeSubresponse {
    pub body: serde_json::Value,
    #[serde(rename = "httpStatusCode")]
    pub http_status_code: i32,
    #[serde(rename = "referenceId")]
    pub reference_id: String,
}

/// Composite API response
#[derive(Debug, Clone, Deserialize)]
pub struct CompositeResponse {
    #[serde(rename = "compositeResponse")]
    pub composite_response: Vec<CompositeSubresponse>,
}

/// Record creation/update result
#[derive(Debug, Clone, Deserialize)]
pub struct SaveResult {
    pub id: String,
    pub success: bool,
    pub errors: Vec<SalesforceError>,
}

/// Salesforce REST API client
pub struct SalesforceClient {
    token_manager: Arc<TokenManager>,
    http_client: Client,
    api_version: String,
    max_retries: u32,
    retry_delay: Duration,
}

impl SalesforceClient {
    pub fn new(token_manager: Arc<TokenManager>) -> Self {
        Self {
            token_manager,
            http_client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
            api_version: "v59.0".to_string(),
            max_retries: 3,
            retry_delay: Duration::from_secs(1),
        }
    }

    /// Build the API URL for a given endpoint
    fn build_url(&self, instance_url: &str, endpoint: &str) -> String {
        format!("{}/services/data/{}{}", instance_url, self.api_version, endpoint)
    }

    /// Execute a GET request
    pub async fn get<T: DeserializeOwned>(&self, endpoint: &str) -> Result<T, String> {
        self.request(Method::GET, endpoint, None::<&()>).await
    }

    /// Execute a POST request
    pub async fn post<T: DeserializeOwned, B: Serialize>(&self, endpoint: &str, body: &B) -> Result<T, String> {
        self.request(Method::POST, endpoint, Some(body)).await
    }

    /// Execute a PATCH request
    pub async fn patch<B: Serialize>(&self, endpoint: &str, body: &B) -> Result<(), String> {
        let _: serde_json::Value = self.request(Method::PATCH, endpoint, Some(body)).await?;
        Ok(())
    }

    /// Execute a DELETE request
    pub async fn delete(&self, endpoint: &str) -> Result<(), String> {
        let _: serde_json::Value = self.request(Method::DELETE, endpoint, None::<&()>).await?;
        Ok(())
    }

    /// Execute a request with automatic retry and token refresh
    async fn request<T: DeserializeOwned, B: Serialize>(
        &self,
        method: Method,
        endpoint: &str,
        body: Option<&B>,
    ) -> Result<T, String> {
        let mut last_error = String::new();

        for attempt in 0..=self.max_retries {
            // Get fresh token
            let token = self.token_manager.get_token().await?;
            let url = self.build_url(&token.instance_url, endpoint);

            let mut request = self
                .http_client
                .request(method.clone(), &url)
                .header("Authorization", format!("Bearer {}", token.access_token))
                .header("Content-Type", "application/json");

            if let Some(b) = body {
                request = request.json(b);
            }

            let response = match request.send().await {
                Ok(r) => r,
                Err(e) => {
                    last_error = format!("Request failed: {}", e);
                    if attempt < self.max_retries {
                        sleep(self.retry_delay * (attempt + 1)).await;
                        continue;
                    }
                    return Err(last_error);
                }
            };

            let status = response.status();

            // Handle rate limiting
            if status == StatusCode::TOO_MANY_REQUESTS {
                if attempt < self.max_retries {
                    let retry_after = response
                        .headers()
                        .get("Retry-After")
                        .and_then(|v| v.to_str().ok())
                        .and_then(|v| v.parse::<u64>().ok())
                        .unwrap_or(5);
                    sleep(Duration::from_secs(retry_after)).await;
                    continue;
                }
                return Err("Rate limited by Salesforce".to_string());
            }

            // Handle session expired - force token refresh
            if status == StatusCode::UNAUTHORIZED {
                if attempt < self.max_retries {
                    self.token_manager.refresh_token().await?;
                    continue;
                }
                return Err("Session expired and refresh failed".to_string());
            }

            let body_text = response
                .text()
                .await
                .map_err(|e| format!("Failed to read response: {}", e))?;

            // Handle no content responses
            if status == StatusCode::NO_CONTENT || body_text.is_empty() {
                // Return empty JSON value for void responses
                return serde_json::from_str("null")
                    .map_err(|_| "Failed to parse empty response".to_string());
            }

            if status.is_success() {
                return serde_json::from_str(&body_text)
                    .map_err(|e| format!("Failed to parse response: {} - Body: {}", e, body_text));
            }

            // Parse error response
            if let Ok(errors) = serde_json::from_str::<Vec<SalesforceError>>(&body_text) {
                let error_messages: Vec<String> = errors.iter().map(|e| e.message.clone()).collect();
                last_error = format!("Salesforce error: {}", error_messages.join(", "));
            } else {
                last_error = format!("Salesforce error ({}): {}", status, body_text);
            }

            if attempt < self.max_retries && status.is_server_error() {
                sleep(self.retry_delay * (attempt + 1)).await;
                continue;
            }

            return Err(last_error);
        }

        Err(last_error)
    }

    /// Execute a SOQL query
    pub async fn query<T: DeserializeOwned>(&self, soql: &str) -> Result<QueryResult<T>, String> {
        let encoded = url::form_urlencoded::byte_serialize(soql.as_bytes()).collect::<String>();
        let endpoint = format!("/query?q={}", encoded);
        self.get(&endpoint).await
    }

    /// Query with automatic pagination
    pub async fn query_all<T: DeserializeOwned + Clone>(&self, soql: &str) -> Result<Vec<T>, String> {
        let mut all_records = Vec::new();
        let mut result: QueryResult<T> = self.query(soql).await?;
        all_records.extend(result.records);

        while let Some(next_url) = result.next_records_url {
            // Extract just the path from the next URL
            let endpoint = next_url
                .split("/services/data/")
                .nth(1)
                .map(|s| format!("/{}", s.split('/').skip(1).collect::<Vec<_>>().join("/")))
                .ok_or_else(|| "Invalid next records URL".to_string())?;

            result = self.get(&endpoint).await?;
            all_records.extend(result.records);
        }

        Ok(all_records)
    }

    /// Create a record
    pub async fn create(&self, sobject: &str, data: &serde_json::Value) -> Result<SaveResult, String> {
        let endpoint = format!("/sobjects/{}", sobject);
        self.post(&endpoint, data).await
    }

    /// Update a record
    pub async fn update(&self, sobject: &str, id: &str, data: &serde_json::Value) -> Result<(), String> {
        let endpoint = format!("/sobjects/{}/{}", sobject, id);
        self.patch(&endpoint, data).await
    }

    /// Upsert a record using external ID
    pub async fn upsert(
        &self,
        sobject: &str,
        external_id_field: &str,
        external_id_value: &str,
        data: &serde_json::Value,
    ) -> Result<SaveResult, String> {
        let endpoint = format!(
            "/sobjects/{}/{}/{}",
            sobject, external_id_field, external_id_value
        );

        // PATCH returns 200 for update or 201 for create
        // The response body contains the result
        self.post(&endpoint, data).await
    }

    /// Delete a record
    pub async fn delete_record(&self, sobject: &str, id: &str) -> Result<(), String> {
        let endpoint = format!("/sobjects/{}/{}", sobject, id);
        self.delete(&endpoint).await
    }

    /// Execute composite request for batch operations
    pub async fn composite(&self, request: CompositeRequest) -> Result<CompositeResponse, String> {
        self.post("/composite", &request).await
    }

    /// Batch upsert using composite API (max 25 operations per request)
    pub async fn batch_upsert(
        &self,
        sobject: &str,
        external_id_field: &str,
        records: Vec<(String, serde_json::Value)>, // (external_id_value, data)
    ) -> Result<Vec<Result<SaveResult, String>>, String> {
        let mut results = Vec::new();

        // Process in batches of 25 (Salesforce composite API limit)
        for chunk in records.chunks(25) {
            let subrequests: Vec<CompositeSubrequest> = chunk
                .iter()
                .enumerate()
                .map(|(i, (external_id, data))| CompositeSubrequest {
                    method: "PATCH".to_string(),
                    url: format!(
                        "/services/data/{}/sobjects/{}/{}/{}",
                        self.api_version, sobject, external_id_field, external_id
                    ),
                    reference_id: format!("ref{}", i),
                    body: Some(data.clone()),
                })
                .collect();

            let request = CompositeRequest {
                all_or_none: false,
                composite_request: subrequests,
            };

            let response = self.composite(request).await?;

            for subresponse in response.composite_response {
                if subresponse.http_status_code >= 200 && subresponse.http_status_code < 300 {
                    // Try to parse as SaveResult, or create a synthetic one
                    let save_result = serde_json::from_value::<SaveResult>(subresponse.body.clone())
                        .unwrap_or_else(|_| SaveResult {
                            id: subresponse.body.get("id")
                                .and_then(|v| v.as_str())
                                .unwrap_or("")
                                .to_string(),
                            success: true,
                            errors: vec![],
                        });
                    results.push(Ok(save_result));
                } else {
                    let error_msg = subresponse.body.to_string();
                    results.push(Err(error_msg));
                }
            }
        }

        Ok(results)
    }
}
