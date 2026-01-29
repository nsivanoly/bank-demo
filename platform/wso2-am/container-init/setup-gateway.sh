#!/bin/bash
# Gateway Configuration Script
# Automates registration of custom gateway in API Manager
# Idempotent - safe to re-run

set -euo pipefail

# ==================== CONFIGURATION ====================

APIM_HOST=${APIM_HOST:-https://localhost:9443}
APIM_USERNAME=${APIM_USERNAME:-admin}
APIM_PASSWORD=${APIM_PASSWORD:-admin}

GATEWAY_NAME=${GATEWAY_NAME:-Demo-Gateway}
GATEWAY_DISPLAY_NAME=${GATEWAY_DISPLAY_NAME:-Demo Gateway}
GATEWAY_TYPE=${GATEWAY_TYPE:-hybrid}
GATEWAY_MODE=${GATEWAY_MODE:-WRITE_ONLY}
GATEWAY_VHOST_HOST=${GATEWAY_VHOST_HOST:-demo.wso2.com}
APIM_HTTP_PORT=${APIM_HTTP_PORT:-8280}
APIM_HTTPS_PASSTHROUGH=${APIM_HTTPS_PASSTHROUGH:-8243}
APIM_WS_PORT=${APIM_WS_PORT:-9099}
APIM_WSS_PORT=${APIM_WSS_PORT:-8099}

MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}

# ==================== UTILITY FUNCTIONS ====================

log_info() {
  echo "ℹ️  [GW-CONFIG] $*"
}

log_success() {
  echo "✅ [GW-CONFIG] $*"
}

log_error() {
  echo "❌ [GW-CONFIG] $*" >&2
}

log_warn() {
  echo "⚠️  [GW-CONFIG] $*"
}

# Check if Gateway already exists
check_gateway_exists() {
  local gw_name="$1"
  local api_url="${APIM_HOST}/api/am/admin/v4/environments"
  
  log_info "Checking if Gateway exists: $gw_name"
  
  local response
  response=$(curl -sk -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    "$api_url" 2>/dev/null)
  
  if echo "$response" | grep -q "\"name\":\"$gw_name\""; then
    log_info "Gateway already exists: $gw_name"
    
    # Extract Gateway ID
    local gw_id
    gw_id=$(echo "$response" | grep -B5 "\"name\":\"$gw_name\"" | grep -o "\"id\":\"[^\"]*\"" | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    
    if [ -n "$gw_id" ]; then
      echo "$gw_id"
      return 0
    fi
  fi
  
  log_info "Gateway does not exist: $gw_name"
  return 1
}

# Get Gateway configuration JSON
get_gateway_config() {
  cat <<EOF
{
  "name": "${GATEWAY_NAME}",
  "displayName": "${GATEWAY_DISPLAY_NAME}",
  "type": "${GATEWAY_TYPE}",
  "description": "",
  "gatewayType": "Regular",
  "mode": "${GATEWAY_MODE}",
  "apiDiscoveryScheduledWindow": 0,
  "vhosts": [
    {
      "host": "${GATEWAY_VHOST_HOST}",
      "httpContext": "",
      "httpPort": ${APIM_HTTP_PORT},
      "httpsPort": ${APIM_HTTPS_PASSTHROUGH},
      "wsPort": ${APIM_WS_PORT},
      "wssPort": ${APIM_WSS_PORT}
    }
  ],
  "permissions": {
    "roles": [],
    "permissionType": "PUBLIC"
  },
  "additionalProperties": [],
  "provider": "wso2"
}
EOF
}

# Create Gateway
create_gateway() {
  local api_url="${APIM_HOST}/api/am/admin/v4/environments"
  
  log_info "Creating Gateway: ${GATEWAY_NAME}"
  
  local config_json
  config_json=$(get_gateway_config)
  
  log_info "API URL: $api_url"
  
  local response
  local http_code
  
  response=$(curl -sk -w "\n%{http_code}" -X POST -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    -d "$config_json" \
    "$api_url" 2>&1)
  
  http_code=$(echo "$response" | tail -1)
  response=$(echo "$response" | sed '$d')
  
  log_info "HTTP Status Code: $http_code"
  log_info "Response: $response"
  
  if echo "$response" | grep -q "\"id\":"; then
    log_success "Gateway created successfully: ${GATEWAY_NAME}"
    return 0
  else
    log_error "Failed to create Gateway (HTTP $http_code)"
    log_error "Full response: $response"
    return 1
  fi
}

# Update existing Gateway
update_gateway() {
  local gw_id="$1"
  local api_url="${APIM_HOST}/api/am/admin/v4/environments/${gw_id}"
  
  log_info "Updating existing Gateway: ${GATEWAY_NAME} (ID: $gw_id)"
  
  local config_json
  config_json=$(get_gateway_config)
  
  local response
  response=$(curl -sk -X PUT -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    -d "$config_json" \
    "$api_url" 2>&1)
  
  if echo "$response" | grep -q "\"id\":"; then
    log_success "Gateway updated successfully: ${GATEWAY_NAME}"
    return 0
  else
    log_warn "Gateway update may have failed (but could already be correct)"
    return 0
  fi
}

# Configure Gateway (create or update)
configure_gateway() {
  log_info "Configuring Gateway: ${GATEWAY_NAME}"
  
  local gw_id
  if gw_id=$(check_gateway_exists "$GATEWAY_NAME"); then
    update_gateway "$gw_id"
  else
    create_gateway
  fi
}

# List all Gateways
list_gateways() {
  local api_url="${APIM_HOST}/api/am/admin/v4/environments"
  
  log_info "Current Gateways:"
  
  local response
  response=$(curl -sk -u "${APIM_USERNAME}:${APIM_PASSWORD}" \
    -H "Content-Type: application/json" \
    "$api_url" 2>/dev/null)
  
  echo "$response" | grep -o '"name":"[^\"]*"' | sed 's/"name":"\([^"]*\)"/  - \1/' || \
    log_warn "Could not list Gateways"
}

main() {
  log_info "Starting Gateway configuration..."
  
  if [ -z "$APIM_HOST" ]; then
    log_error "Required environment variable not set: APIM_HOST"
    exit 1
  fi
  
  log_info "Configuration:"
  log_info "  API Manager: $APIM_HOST"
  log_info "  Gateway Name: $GATEWAY_NAME"
  log_info "  Gateway Type: $GATEWAY_TYPE"
  log_info "  VHost: ${GATEWAY_VHOST_HOST}:${APIM_HTTP_PORT}/${APIM_HTTPS_PASSTHROUGH}"
  
  configure_gateway || {
    log_error "Failed to configure Gateway"
    exit 1
  }
  
  echo ""
  list_gateways
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
