#!/bin/bash
# Key Manager Configuration Script
# Automates registration of WSO2 Identity Server as a Key Manager in API Manager
# Idempotent - safe to re-run

set -euo pipefail

# ==================== CONFIGURATION ====================

APIM_HOST=${APIM_HOST:-https://wso2am:9443}
APIM_USERNAME=${APIM_USERNAME:-admin}
APIM_PASSWORD=${APIM_PASSWORD:-admin}

IS_HOST=${IS_HOST:-https://wso2is:9444}
IS_USERNAME=${IS_USERNAME:-admin}
IS_PASSWORD=${IS_PASSWORD:-admin}

KEY_MANAGER_NAME=${KEY_MANAGER_NAME:-WSO2IS72}
KEY_MANAGER_TYPE=${KEY_MANAGER_TYPE:-WSO2-IS-7}
KEY_MANAGER_DISPLAY_NAME=${KEY_MANAGER_DISPLAY_NAME:-WSO2 IS 7.2}
MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}

# ==================== UTILITY FUNCTIONS ====================

log_info() {
  echo "ℹ️  [KM-CONFIG] $*"
}

log_success() {
  echo "✅ [KM-CONFIG] $*"
}

log_error() {
  echo "❌ [KM-CONFIG] $*" >&2
}

log_warn() {
  echo "⚠️  [KM-CONFIG] $*"
}

# Wait for API Manager to be ready
wait_for_apim() {
  local retry_count=0
  local admin_url="${APIM_HOST}/api/am/admin/v4/key-managers"
  
  log_info "Waiting for API Manager Admin APIs to be ready..."
  
  while [ $retry_count -lt $MAX_RETRY ]; do
    if curl -sk -u "${APIM_USERNAME}:${APIM_PASSWORD}" "$admin_url" > /dev/null 2>&1; then
      log_success "API Manager is ready"
      return 0
    fi
    retry_count=$((retry_count + 1))
    log_info "Attempt $retry_count/$MAX_RETRY - Waiting for API Manager..."
    sleep $RETRY_INTERVAL
  done
  
  log_error "API Manager did not become ready in time"
  return 1
}

# Wait for Identity Server to be ready
wait_for_is() {
  local retry_count=0
  local is_url="${IS_HOST}/carbon/admin/login.jsp"
  
  log_info "Waiting for Identity Server to be ready..."
  
  while [ $retry_count -lt $MAX_RETRY ]; do
    if curl -sk "$is_url" > /dev/null 2>&1; then
      log_success "Identity Server is ready"
      return 0
    fi
    retry_count=$((retry_count + 1))
    log_info "Attempt $retry_count/$MAX_RETRY - Waiting for Identity Server..."
    sleep $RETRY_INTERVAL
  done
  
  log_error "Identity Server did not become ready in time"
  return 1
}

# Check if Key Manager already exists
check_key_manager_exists() {
  local km_name="$1"
  local api_url="${APIM_HOST}/api/am/admin/v4/key-managers"
  
  log_info "Checking if Key Manager exists: $km_name"
  
  local response
  response=$(curl -sk -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    "$api_url" 2>/dev/null)
  
  if echo "$response" | grep -q "\"name\":\"$km_name\""; then
    log_info "Key Manager already exists: $km_name"
    
    # Extract Key Manager ID
    local km_id
    km_id=$(echo "$response" | grep -o "\"id\":\"[^\"]*\"" | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    
    if [ -n "$km_id" ]; then
      echo "$km_id"
      return 0
    fi
  fi
  
  log_info "Key Manager does not exist: $km_name"
  return 1
}

# Get Key Manager configuration JSON
get_key_manager_config() {
  cat <<EOF
{
  "name": "${KEY_MANAGER_NAME}",
  "displayName": "${KEY_MANAGER_DISPLAY_NAME}",
  "type": "${KEY_MANAGER_TYPE}",
  "description": "",
  "wellKnownEndpoint": "${IS_HOST}/oauth2/token/.well-known/openid-configuration",
  "introspectionEndpoint": "${IS_HOST}/oauth2/introspect",
  "clientRegistrationEndpoint": "${IS_HOST}/api/identity/oauth2/dcr/v1.1/register",
  "tokenEndpoint": "${IS_HOST}/oauth2/token",
  "displayTokenEndpoint": "${IS_HOST}/oauth2/token",
  "revokeEndpoint": "${IS_HOST}/oauth2/revoke",
  "displayRevokeEndpoint": "${IS_HOST}/oauth2/revoke",
  "userInfoEndpoint": "${IS_HOST}/oauth2/userinfo",
  "authorizeEndpoint": "${IS_HOST}/oauth2/authorize",
  "endpoints": [],
  "certificates": {
    "type": "JWKS",
    "value": "${IS_HOST}/oauth2/jwks"
  },
  "issuer": "${IS_HOST}/oauth2/token",
  "alias": "",
  "scopeManagementEndpoint": "${IS_HOST}/api/identity/oauth2/v1.0/scopes",
  "availableGrantTypes": [
    "refresh_token",
    "urn:ietf:params:oauth:grant-type:saml2-bearer",
    "password",
    "client_credentials",
    "iwa:ntlm",
    "urn:ietf:params:oauth:grant-type:device_code",
    "authorization_code",
    "account_switch",
    "urn:ietf:params:oauth:grant-type:token-exchange",
    "organization_switch",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  ],
  "enableTokenGeneration": true,
  "enableTokenEncryption": false,
  "enableTokenHashing": false,
  "enableMapOAuthConsumerApps": true,
  "enableOAuthAppCreation": true,
  "enableSelfValidationJWT": true,
  "claimMapping": [],
  "consumerKeyClaim": "azp",
  "scopesClaim": "scope",
  "tokenValidation": [],
  "enabled": true,
  "additionalProperties": {
    "Username": "admin",
    "Password": "admin",
    "api_resource_management_endpoint": "${IS_HOST}/api/server/v1/api-resources",
    "is7_roles_endpoint": "${IS_HOST}/scim2/v2/Roles",
    "enable_roles_creation": true
  },
  "permissions": null,
  "tokenType": "DIRECT",
  "allowedOrganizations": ["ALL"]
}
EOF
}

# Create Key Manager
create_key_manager() {
  local api_url="${APIM_HOST}/api/am/admin/v4/key-managers"
  
  log_info "Creating Key Manager: ${KEY_MANAGER_NAME}"
  
  local config_json
  config_json=$(get_key_manager_config)
  
  log_info "API URL: $api_url"
  
  local response
  local http_code
  
  response=$(curl -sk -w "\n%{http_code}" -X POST -u "${IS_USERNAME}:${IS_PASSWORD}" \
    -H "Content-Type: application/json" \
    -d "$config_json" \
    "$api_url" 2>&1)
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tail -1)
  # Extract response body
  response=$(echo "$response" | sed '$d')
  
  log_info "HTTP Status Code: $http_code"
  
  if echo "$response" | grep -q "\"id\":"; then
    log_success "Key Manager created successfully: ${KEY_MANAGER_NAME}"
    return 0
  else
    log_error "Failed to create Key Manager (HTTP $http_code)"
    log_error "Full response: $response"
    return 1
  fi
}

# Update existing Key Manager
update_key_manager() {
  local km_id="$1"
  local api_url="${APIM_HOST}/api/am/admin/v4/key-managers/${km_id}"
  
  log_info "Updating existing Key Manager: ${KEY_MANAGER_NAME} (ID: $km_id)"
  
  local config_json
  config_json=$(get_key_manager_config)
  
  local response
  response=$(curl -sk -X PUT -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    -d "$config_json" \
    "$api_url" 2>&1)
  
  if echo "$response" | grep -q "\"id\":"; then
    log_success "Key Manager updated successfully: ${KEY_MANAGER_NAME}"
    return 0
  else
    log_warn "Key Manager update may have failed (but could already be correct)"
    return 0
  fi
}

# Configure Key Manager (create or update)
configure_key_manager() {
  log_info "Configuring Key Manager: ${KEY_MANAGER_NAME}"
  
  local km_id
  if km_id=$(check_key_manager_exists "$KEY_MANAGER_NAME"); then
    # Key Manager exists - update it
    update_key_manager "$km_id"
  else
    # Key Manager doesn't exist - create it
    create_key_manager
  fi
}

# List all Key Managers
list_key_managers() {
  local api_url="${APIM_HOST}/api/am/admin/v4/key-managers"
  
  log_info "Current Key Managers:"
  
  local response
  response=$(curl -sk -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    "$api_url" 2>/dev/null)
  
  echo "$response" | grep -o '"name":"[^"]*"' | sed 's/"name":"\([^"]*\)"/  - \1/' || \
    log_warn "Could not list Key Managers"
}

# ==================== MAIN EXECUTION ====================

main() {
  log_info "Starting Key Manager configuration..."
  
  # Validate required variables
  if [ -z "$APIM_HOST" ] || [ -z "$IS_HOST" ]; then
    log_error "Required environment variables not set"
    log_error "APIM_HOST: $APIM_HOST"
    log_error "IS_HOST: $IS_HOST"
    exit 1
  fi
  
  log_info "Configuration:"
  log_info "  API Manager: $APIM_HOST"
  log_info "  Identity Server: $IS_HOST"
  log_info "  Key Manager Name: $KEY_MANAGER_NAME"
  log_info "  Key Manager Type: $KEY_MANAGER_TYPE"
  
  # Wait for services
  wait_for_apim || exit 1
  wait_for_is || exit 1
  
  # Configure Key Manager
  configure_key_manager || {
    log_error "Failed to configure Key Manager"
    exit 1
  }
  
  # Show final status
  echo ""
  list_key_managers
  
  log_success "Key Manager configuration completed successfully"
  return 0
}

# Handle script arguments
case "${1:-}" in
  list)
    wait_for_apim || exit 1
    list_key_managers
    ;;
  check)
    wait_for_apim || exit 1
    if check_key_manager_exists "$KEY_MANAGER_NAME" > /dev/null; then
      log_success "Key Manager exists: $KEY_MANAGER_NAME"
      exit 0
    else
      log_info "Key Manager does not exist: $KEY_MANAGER_NAME"
      exit 1
    fi
    ;;
  *)
    main "$@"
    ;;
esac
