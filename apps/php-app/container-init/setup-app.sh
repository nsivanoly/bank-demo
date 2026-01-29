#!/bin/bash
# Bank App Registration Script
# Registers BankingFrontendAppPHP in:
#   1. WSO2 Developer Portal (APIM)
#   2. WSO2 Identity Server (as OIDC application)
#   3. Maps OAuth2 credentials in APIM
# Updates config.php with client IDs and secrets
# Idempotent - safe to re-run

set -e

# ==================== CONFIGURATION ====================

APIM_HOST=${APIM_HOST:-https://${APIM_HOSTNAME:-wso2am}:9443}
APIM_USERNAME=${APIM_USERNAME:-admin}
APIM_PASSWORD=${APIM_PASSWORD:-admin}
IS_HOST=${IS_HOST:-https://${APIM_HOSTNAME:-wso2is}:9444}
IS_USERNAME=${IS_USERNAME:-admin}
IS_PASSWORD=${IS_PASSWORD:-admin}

APP_NAME=${APP_NAME_PHP:-BankingFrontendAppPHP}
APP_DESC=${APP_DESC_PHP:-"Banking Frontend PHP Application"}
FRONTEND_URL=${FRONTEND_URL:-https://localhost:${PHP_HTTPS_PORT:-7400}}
CALLBACK_URL=${CALLBACK_URL:-${FRONTEND_URL}/callback}
LOGOUT_URL=${LOGOUT_URL:-${FRONTEND_URL}/logout}
APP_TIER=${APP_TIER:-Unlimited}
KEY_MANAGER_NAME=${KEY_MANAGER_NAME:-WSO2IS72}
KEY_MANAGER_NAME_KM=${KEY_MANAGER_NAME_KM:-Resident Key Manager}

CONFIG_FILE=${CONFIG_FILE_PHP:-/var/www/html/includes/config.php}
MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}
INIT_MARKER_DIR=${INIT_MARKER_DIR:-.}
INIT_MARKER="${INIT_MARKER_DIR}/setup-app.marker"

# ==================== LOGGING ====================

log_info() { echo "ℹ️  [BANK-PHP-APP-SETUP] $*" >&2; }
log_success() { echo "✅ [BANK-PHP-APP-SETUP] $*" >&2; }
log_error() { echo "❌ [BANK-PHP-APP-SETUP] $*" >&2; }
log_warn() { echo "⚠️  [BANK-PHP-APP-SETUP] $*" >&2; }

# ==================== COMMON API FUNCTIONS ====================

# Make API request and handle response
api_request() {
  local method="$1" url="$2" username="$3" password="$4" data="$5"
  local temp_file response http_code
  
  temp_file=$(mktemp)
  
  local curl_cmd=(curl -sk -w "%{http_code}" -X "$method" -u "${username}:${password}")
  curl_cmd+=(-H "Content-Type: application/json" -H "Accept: application/json")
  
  if [ -n "$data" ]; then
    curl_cmd+=(-d "$data")
  fi
  
  http_code=$("${curl_cmd[@]}" -o "$temp_file" "$url" 2>&1)
  response=$(cat "$temp_file" 2>/dev/null || echo "")
  rm -f "$temp_file"
  
  echo "$http_code|$response"
}

# Extract JSON value by key
json_get() {
  local json="$1" key="$2"
  echo "$json" | grep -o "\"${key}\":\"[^\"]*\"" | head -1 | sed "s/\"${key}\":\"\([^\"]*\)\"/\1/"
}

# Escape special characters for sed
escape_sed() {
  sed 's/[&/\]/\\&/g'
}

# Check if setup has already completed
check_setup_complete() {
  if [ -f "$INIT_MARKER" ]; then
    log_info "Setup already completed (marker found at $INIT_MARKER)"
    source "$INIT_MARKER" 2>/dev/null || true
    return 0
  fi
  return 1
}

# Wait for service to be ready
wait_for_service() {
  local service_name="$1" service_url="$2" max_retry="${3:-$MAX_RETRY}" retry_interval="${4:-$RETRY_INTERVAL}"
  local retry_count=0
  
  log_info "Waiting for $service_name to be ready at $service_url..."
  
  while [ $retry_count -lt $max_retry ]; do
    if curl -k -s --connect-timeout 5 "$service_url" > /dev/null 2>&1; then
      log_success "$service_name is ready"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    [ $((retry_count % 5)) -eq 0 ] && log_info "Waiting for $service_name... Attempt $retry_count/$max_retry"
    sleep "$retry_interval"
  done
  
  log_error "$service_name did not become ready in time"
  return 1
}

# Get application from APIM devportal by name
get_devportal_app_id() {
  local app_name="$1" result
  
  log_info "Looking up devportal application ID for: $app_name"
  
  result=$(api_request GET "${APIM_HOST}/api/am/devportal/v3/applications?limit=100" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "")
  
  local http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" = "200" ] && echo "$response" | grep -q "\"name\":\"${app_name}\""; then
    local app_id
    app_id=$(json_get "$response" "applicationId")
    if [ -n "$app_id" ]; then
      log_success "Found devportal application ID: $app_id"
      echo "$app_id"
      return 0
    fi
  fi
  
  log_info "Devportal application not found: $app_name"
  return 1
}

# Create application in APIM DevPortal
create_devportal_app() {
  log_info "Creating devportal application: $APP_NAME"
  
  local payload result http_code response app_id
  
  payload=$(cat <<EOF
{
  "name": "${APP_NAME}",
  "throttlingPolicy": "${APP_TIER}",
  "description": "${APP_DESC}",
  "tokenType": "JWT",
  "attributes": {}
}
EOF
)
  
  result=$(api_request POST "${APIM_HOST}/api/am/devportal/v3/applications" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "$payload")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    app_id=$(json_get "$response" "applicationId")
    if [ -n "$app_id" ] && [ "$app_id" != "null" ]; then
      log_success "Devportal application created: $app_id"
      echo "$app_id"
      return 0
    fi
  fi
  
  log_error "Failed to create devportal application (HTTP $http_code)"
  log_error "Response: $response"
  return 1
}

# Register or get devportal application
register_devportal_app() {
  log_info "Registering/locating devportal application: $APP_NAME"
  
  if get_devportal_app_id "$APP_NAME" 2>/dev/null; then
    return 0
  fi
  
  log_info "Devportal application does not exist, creating..."
  create_devportal_app
}

# Get all published APIs
get_all_apis() {
  log_info "Retrieving all published APIs from APIM..."
  
  local result http_code response
  result=$(api_request GET "${APIM_HOST}/api/am/publisher/v4/apis?limit=100" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" = "200" ] && echo "$response" | grep -q '"list"'; then
    echo "$response"
    return 0
  fi
  
  log_error "Failed to retrieve API list (HTTP $http_code)"
  return 1
}

# Subscribe application to a single API
subscribe_to_api() {
  local api_id="$1" api_name="$2" app_id="$3" api_type="$4"
  local throttle_policy="${APP_TIER}"
  
  # Use AsyncUnlimited for async APIs
  if [ "$api_type" = "ASYNC" ] || [ "$api_type" = "WS" ] || [ "$api_type" = "WEBSOCKET" ] || [ "$api_type" = "SSE" ]; then
    throttle_policy="AsyncUnlimited"
  fi
  
  local payload result http_code response
  
  payload=$(cat <<EOF
{
  "apiId": "${api_id}",
  "applicationId": "${app_id}",
  "throttlingPolicy": "${throttle_policy}"
}
EOF
)
  
  result=$(api_request POST "${APIM_HOST}/api/am/devportal/v3/subscriptions" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "$payload")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    log_success "Subscribed to API: $api_name"
    return 0
  elif echo "$response" | grep -q "already exists"; then
    log_info "Already subscribed to API: $api_name"
    return 0
  fi
  
  log_warn "Failed to subscribe to API: $api_name (HTTP $http_code)"
  return 0
}

# Subscribe app to all published APIs
subscribe_to_all_apis() {
  local app_id="$1" api_list
  
  log_info "Subscribing app to all published APIs..."
  
  if ! api_list=$(get_all_apis); then
    log_error "Cannot retrieve API list"
    return 1
  fi
  
  local api_count=0 subscribed=0
  
  echo "$api_list" | sed 's/},{/\n},\n{/g' | while read -r api_obj; do
    [[ ! "$api_obj" =~ ^[{] ]] && continue
    
    local api_id api_name api_type
    api_id=$(json_get "$api_obj" "id")
    api_name=$(json_get "$api_obj" "name")
    api_type=$(json_get "$api_obj" "type")
    
    if [ -n "$api_id" ] && [ -n "$api_name" ]; then
      api_count=$((api_count + 1))
      log_info "[$api_count] Subscribing to API: $api_name (Type: ${api_type:-N/A})"
      subscribe_to_api "$api_id" "$api_name" "$app_id" "$api_type" && subscribed=$((subscribed + 1))
      sleep 1
    fi
  done
  
  log_success "API subscription completed - Subscribed: $subscribed of $api_count"
  return 0
}

# Register application in WSO2 Identity Server
register_app_in_is() {
  local is_app_name="${1:-${APP_NAME}}" result http_code response is_app_id app_list
  
  log_info "Registering application in WSO2 IS: $is_app_name"
  
  # Check if app already exists
  result=$(api_request GET "${IS_HOST}/api/server/v1/applications?limit=100" \
    "${IS_USERNAME}" "${IS_PASSWORD}" "")
  
  http_code="${result%%|*}" app_list="${result#*|}"
  
  if [ "$http_code" = "200" ] && echo "$app_list" | grep -q "\"name\":\"${is_app_name}\""; then
    is_app_id=$(echo "$app_list" | grep -B2 "\"name\":\"${is_app_name}\"" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    if [ -n "$is_app_id" ] && [ "$is_app_id" != "null" ]; then
      log_success "Found existing IS application: $is_app_id"
      echo "$is_app_id"
      return 0
    fi
  fi
  
  # Create new application with OIDC configuration
  local app_payload
  app_payload=$(cat <<'EOF'
{
  "name": "APP_NAME_PLACEHOLDER",
  "description": "APP_DESC_PLACEHOLDER",
  "inboundProtocolConfiguration": {
    "oidc": {
      "grantTypes": ["authorization_code", "refresh_token"],
      "callbackURLs": ["regexp=(CALLBACK_URL_PLACEHOLDER|CALLBACK_URL_PLACEHOLDER/)"],
      "allowedOrigins": ["FRONTEND_URL_PLACEHOLDER"],
      "publicClient": true,
      "pkce": {"mandatory": false, "supportPlainTransformAlgorithm": false},
      "accessToken": {"type": "JWT", "userAccessTokenExpiryInSeconds": 3600, "applicationAccessTokenExpiryInSeconds": 3600},
      "refreshToken": {"expiryInSeconds": 86400, "renewRefreshToken": true},
      "idToken": {"expiryInSeconds": 3600},
      "logout": {"backChannelLogoutUrl": "", "frontChannelLogoutUrl": "LOGOUT_URL_PLACEHOLDER"},
      "validateRequestObjectSignature": false,
      "scopeValidators": []
    }
  },
  "authenticationSequence": {
    "type": "DEFAULT",
    "steps": [{"id": 1, "options": [{"idp": "LOCAL", "authenticator": "BasicAuthenticator"}]}]
  },
  "claimConfiguration": {
    "dialect": "LOCAL",
    "requestedClaims": [
      {"claim": {"uri": "http://wso2.org/claims/emailaddress"}},
      {"claim": {"uri": "http://wso2.org/claims/givenname"}},
      {"claim": {"uri": "http://wso2.org/claims/lastname"}},
      {"claim": {"uri": "http://wso2.org/claims/groups"}},
      {"claim": {"uri": "http://wso2.org/claims/roles"}}
    ],
    "subject": {"claim": {"uri": "http://wso2.org/claims/username"}, "includeTenantDomain": false, "includeUserDomain": false, "useMappedLocalSubject": false}
  }
}
EOF
)
  
  app_payload="${app_payload//APP_NAME_PLACEHOLDER/$is_app_name}"
  app_payload="${app_payload//APP_DESC_PLACEHOLDER/$APP_DESC}"
  app_payload="${app_payload//CALLBACK_URL_PLACEHOLDER/$CALLBACK_URL}"
  app_payload="${app_payload//FRONTEND_URL_PLACEHOLDER/$FRONTEND_URL}"
  app_payload="${app_payload//LOGOUT_URL_PLACEHOLDER/$LOGOUT_URL}"
  
  log_info "Creating new IS app"
  
  result=$(api_request POST "${IS_HOST}/api/server/v1/applications" \
    "${IS_USERNAME}" "${IS_PASSWORD}" "$app_payload")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" != "201" ] && [ "$http_code" != "200" ]; then
    log_error "Failed to create IS application (HTTP $http_code)"
    log_error "Response: $response"
    return 1
  fi
  
  is_app_id=$(json_get "$response" "id")
  
  # Try alternative patterns if first fails
  if [ -z "$is_app_id" ] || [ "$is_app_id" = "null" ]; then
    is_app_id=$(echo "$response" | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\([^"]*\)"/\1/')
  fi
  
  # If still empty, fetch by name
  if [ -z "$is_app_id" ] || [ "$is_app_id" = "null" ]; then
    log_info "Fetching recently created application by name..."
    sleep 2
    result=$(api_request GET "${IS_HOST}/api/server/v1/applications?limit=100" \
      "${IS_USERNAME}" "${IS_PASSWORD}" "")
    http_code="${result%%|*}" app_list="${result#*|}"
    if [ "$http_code" = "200" ] && echo "$app_list" | grep -q "\"name\":\"${is_app_name}\""; then
      is_app_id=$(echo "$app_list" | grep -B2 "\"name\":\"${is_app_name}\"" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    fi
  fi
  
  if [ -z "$is_app_id" ] || [ "$is_app_id" = "null" ]; then
    log_error "Could not extract application ID from IS response"
    return 1
  fi
  
  log_success "IS Application created: $is_app_id"
  echo "$is_app_id"
  return 0
}

# Get client ID and secret from IS application
get_client_credentials_from_is() {
  local is_app_id="$1" result http_code response client_id client_secret
  
  log_info "Fetching OIDC credentials from IS app: $is_app_id"
  
  result=$(api_request GET "${IS_HOST}/api/server/v1/applications/${is_app_id}/inbound-protocols/oidc" \
    "${IS_USERNAME}" "${IS_PASSWORD}" "")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" != "200" ]; then
    log_error "Failed to get OIDC config (HTTP $http_code)"
    return 1
  fi
  
  client_id=$(json_get "$response" "clientId")
  client_secret=$(json_get "$response" "clientSecret")
  
  if [ -z "$client_id" ] || [ "$client_id" = "null" ] || [ -z "$client_secret" ] || [ "$client_secret" = "null" ]; then
    log_error "Could not extract client credentials from IS response"
    return 1
  fi
  
  log_success "Retrieved OIDC credentials from IS"
  echo "${client_id}|${client_secret}"
  return 0
}

# Import OAuth2 credentials as production key in APIM
import_oauth_keys_to_apim() {
  local consumer_key="$1" client_secret="$2" app_id="$3"
  local result http_code response payload
  
  log_info "Importing OAuth2 credentials to APIM as production key"
  log_info "App ID: $app_id"
  log_info "Consumer Key: ${consumer_key:0:20}..."
  log_info "Key Manager: ${KEY_MANAGER_NAME}"
  
  payload=$(cat <<EOF
{
  "consumerKey": "${consumer_key}",
  "consumerSecret": "${client_secret}",
  "keyType": "PRODUCTION",
  "keyManager": "${KEY_MANAGER_NAME}"
}
EOF
)
  
  result=$(api_request POST "${APIM_HOST}/api/am/devportal/v3/applications/${app_id}/map-keys" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "$payload")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  if [ "$http_code" != "201" ] && [ "$http_code" != "200" ]; then
    log_error "Failed to map keys in APIM (HTTP $http_code)"
    log_error "consumer_key: $consumer_key"
    log_error "client_secret: $client_secret"
    log_error "Response: $response"
    log_warn "Continuing... Keys may need manual mapping"
    return 0
  fi
  
  log_success "OAuth2 credentials mapped to APIM as production key"
  return 0
}

# Generate keys for application in APIM using Key Manager
configure_oidc_in_km() {
  local devportal_app_id="$1" result http_code response consumer_key consumer_secret payload
  
  log_info "Generating keys for APIM application: $devportal_app_id"
  log_info "Using Key Manager: ${KEY_MANAGER_NAME_KM}"
  
  payload=$(cat <<EOF
{
  "keyType": "PRODUCTION",
  "grantTypesToBeSupported": ["authorization_code", "refresh_token", "client_credentials"],
  "callbackUrl": "${CALLBACK_URL}",
  "additionalProperties": {
    "application_access_token_expiry_time": "3600",
    "user_access_token_expiry_time": "3600",
    "refresh_token_expiry_time": "86400",
    "id_token_expiry_time": "3600",
    "pkceMandatory": "false",
    "pkceSupportPlain": "false",
    "bypassClientCredentials": "true"
  },
  "keyManager": "${KEY_MANAGER_NAME_KM}",
  "validityTime": 3600,
  "scopes": ["default"]
}
EOF
)
  
  result=$(api_request POST "${APIM_HOST}/api/am/devportal/v3/applications/${devportal_app_id}/generate-keys" \
    "${APIM_USERNAME}" "${APIM_PASSWORD}" "$payload")
  
  http_code="${result%%|*}" response="${result#*|}"
  
  log_info "Generate Keys Response (HTTP $http_code)"
  
  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    log_error "Failed to generate keys in APIM (HTTP $http_code)"
    log_error "Response: $response"
    return 1
  fi
  
  consumer_key=$(json_get "$response" "consumerKey")
  consumer_secret=$(json_get "$response" "consumerSecret")
  
  if [ -z "$consumer_key" ] || [ "$consumer_key" = "null" ]; then
    log_error "Could not extract consumer key from response"
    return 1
  fi
  
  log_success "Keys generated successfully via APIM"
  
  echo "${consumer_key}|${consumer_secret}"
  return 0
}

# Update config.php with credentials
update_config_php() {
  local is_client_id="$1" km_client_id="$2" apim_km_client_id="$3"
  
  log_info "Updating config.php with client credentials"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Config file not found: ${CONFIG_FILE}"
    return 1
  fi
  
  # Create backup
  cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%s)"
  log_info "Backup created"
  
  # Update WSO2_IS clientID in PHP config
  if [ -n "$is_client_id" ]; then
    log_info "Updating WSO2_IS clientID: ${is_client_id:0:15}..."
    sed -i.tmp "/'WSO2_IS' => \[/,/\],/{/^[[:space:]]*'clientID'[[:space:]]*=>/ s/'clientID' => '[^']*'/'clientID' => '$(echo "$is_client_id" | escape_sed)'/}" "$CONFIG_FILE"
    # sed -i.tmp "/'WSO2_IS'/,/'TYPE'/{ s/'clientID' => '[^']*'/'clientID' => '$(echo "$is_client_id" | escape_sed)'/; }" "$CONFIG_FILE"
  fi
  
  # Update WSO2_IS_KM clientID in PHP config
  if [ -n "$km_client_id" ]; then
    log_info "Updating WSO2_IS_KM clientID: ${km_client_id:0:15}..."
    sed -i.tmp "/'WSO2_IS_KM' => \[/,/\],/{/^[[:space:]]*'clientID'[[:space:]]*=>/ s/'clientID' => '[^']*'/'clientID' => '$(echo "$km_client_id" | escape_sed)'/}" "$CONFIG_FILE"
    # sed -i.tmp "/'WSO2_IS_KM'/,/'TYPE'/{ s/'clientID' => '[^']*'/'clientID' => '$(echo "$km_client_id" | escape_sed)'/; }" "$CONFIG_FILE"
  fi
  
  # Update WSO2_APIM_KM clientID in PHP config
  if [ -n "$apim_km_client_id" ]; then
    log_info "Updating WSO2_APIM_KM clientID: ${apim_km_client_id:0:15}..."
    sed -i.tmp "/'WSO2_APIM_KM' => \[/,/\],/{/^[[:space:]]*'clientID'[[:space:]]*=>/ s/'clientID' => '[^']*'/'clientID' => '$(echo "$apim_km_client_id" | escape_sed)'/}" "$CONFIG_FILE"
    # sed -i.tmp "/'WSO2_APIM_KM'/,/'TYPE'/{ s/'clientID' => '[^']*'/'clientID' => '$(echo "$apim_km_client_id" | escape_sed)'/; }" "$CONFIG_FILE"
  fi
  
  rm -f "${CONFIG_FILE}.tmp"
  log_success "Config file updated successfully"
  return 0
}

# Save setup completion marker
save_setup_marker() {
  local is_client_id="$1" km_client_id="$2" apim_km_client_id="$3"
  
  mkdir -p "$INIT_MARKER_DIR"
  
  cat > "$INIT_MARKER" <<EOF
# Bank App Setup Completion Marker - $(date -u +"%Y-%m-%d %H:%M:%S UTC")
SETUP_COMPLETE=true
APP_NAME="${APP_NAME}"
IS_CLIENT_ID="${is_client_id}"
KM_CLIENT_ID="${km_client_id}"
APIM_KM_CLIENT_ID="${apim_km_client_id}"
DEVPORTAL_APP_ID="${DEVPORTAL_APP_ID}"
EOF
  
  log_success "Setup marker saved to $INIT_MARKER"
}

# Display summary
display_summary() {
  local devportal_app_id="$1" is_app_id="$2" is_client_id="$3" apim_km_client_id="$4"
  
  cat <<EOF

==========================================
  Bank App Setup Complete
==========================================

📱 Developer Portal Application
  App ID: ${devportal_app_id}
  App Name: ${APP_NAME}

🔐 WSO2 Identity Server (WSO2_IS)
  App ID: ${is_app_id}
  Client ID: ${is_client_id:0:20}...
  Type: OIDC SPA (Public Client)


🔐 WSO2 API Manager Key Manager (WSO2_APIM_KM)
  App ID: ${devportal_app_id}
  Client ID: ${apim_km_client_id:0:20}...
  Type: OIDC SPA (Public Client)

⚙️  Configuration File
  Location: ${CONFIG_FILE}
  Updated: YES

📋 Configuration Details
  Frontend URL: ${FRONTEND_URL}
  Callback URL: ${CALLBACK_URL}
  Logout URL: ${LOGOUT_URL}
  API Tier: ${APP_TIER}

==========================================
✅ All registrations completed successfully!
==========================================

EOF
}

# ==================== MAIN EXECUTION ====================

main() {
  log_info "Starting Bank App Setup..."
  log_info "Configuration: App Name: $APP_NAME | Frontend: $FRONTEND_URL | APIM: $APIM_HOST | IS: $IS_HOST"
  
  # Wait for all services
  wait_for_service "APIM" "${APIM_HOST}/publisher" || exit 1
  wait_for_service "IS" "${IS_HOST}/oauth2/token/.well-known/openid-configuration" || exit 1
  
  echo ""
  log_info "========================================="
  log_info "Step 1: Register in Developer Portal"
  log_info "========================================="
  local devportal_app_id
  devportal_app_id=$(register_devportal_app) || exit 1
  DEVPORTAL_APP_ID="$devportal_app_id"
  
  echo ""
  log_info "========================================="
  log_info "Step 2: Subscribe to All APIs"
  log_info "========================================="
  subscribe_to_all_apis "$devportal_app_id" || log_warn "API subscription had issues, continuing..."
  
  echo ""
  log_info "========================================="
  log_info "Step 3: Register in Identity Server"
  log_info "========================================="
  local is_app_id is_credentials is_client_id is_secret
  
  is_app_id=$(register_app_in_is) || exit 1
  log_info "IS App registered successfully"
  
  sleep 2
  is_credentials=$(get_client_credentials_from_is "$is_app_id") || exit 1
  is_client_id="${is_credentials%%|*}"
  is_secret="${is_credentials##*|}"
  log_success "IS Client ID: ${is_client_id:0:20}..."
  
  echo ""
  log_info "========================================="
  log_info "Step 4: Map Keys in APIM"
  log_info "========================================="
  import_oauth_keys_to_apim "$is_client_id" "$is_secret" "$devportal_app_id"
  
  echo ""
  log_info "========================================="
  log_info "Step 5: Generate Keys with APIM Key Manager"
  log_info "========================================="
  km_credentials=$(configure_oidc_in_km "$devportal_app_id") || exit 1
  apim_km_client_id="${km_credentials%%|*}"
  apim_km_secret_id="${km_credentials##*|}"
  log_success "KM Client ID: ${apim_km_client_id:0:20}..."
  
  echo ""
  log_info "========================================="
  log_info "Step 6: Update Configuration File"
  log_info "========================================="
  update_config_php "$is_client_id" "$is_client_id" "$apim_km_client_id"
  
  # Save completion marker
  save_setup_marker "$is_client_id" "$is_client_id" "$apim_km_client_id"
  
  echo ""
  display_summary "$devportal_app_id" "$is_app_id" "$is_client_id" "$apim_km_client_id"
  
  log_success "All done! 🎉"
  return 0
}

# ==================== ENTRY POINT ====================

if check_setup_complete; then
  log_info "Setup already completed previously"
  exit 0
fi

main "$@"
