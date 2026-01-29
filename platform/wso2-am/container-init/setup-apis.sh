#!/bin/bash
# Setup APIs Script
# Imports and publishes APIs from Api-definitions directory

set -euo pipefail

# Configuration
APIM_HOST=${APIM_HOST:-https://localhost:9443}
APIM_ENV_NAME=${APIM_ENV_NAME:-dev}
APIM_USERNAME=${APIM_USERNAME:-admin}
APIM_PASSWORD=${APIM_PASSWORD:-admin}
API_DEFINITIONS_PATH="${API_DEFINITIONS_PATH:-${WSO2_SERVER_HOME}/am-data}"
MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️  [SETUP-APIS] $*${NC}"
}

log_success() {
  echo -e "${GREEN}✅ [SETUP-APIS] $*${NC}"
}

log_error() {
  echo -e "${RED}❌ [SETUP-APIS] $*${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  [SETUP-APIS] $*${NC}"
}

# Configure apictl
configure_apictl() {
  log_info "Configuring apictl environment..."
  
  # Remove existing environment if present
  apictl -k remove env "$APIM_ENV_NAME" 2>/dev/null || true
  
  # Add new environment
  if ! apictl -k add env "$APIM_ENV_NAME" --apim "$APIM_HOST"; then
    log_error "Failed to configure apictl environment"
    return 1
  fi
  
  log_success "apictl environment configured"
  
  # Login
  log_info "Authenticating with API Manager..."
  if ! apictl -k login "$APIM_ENV_NAME" -u "$APIM_USERNAME" -p "$APIM_PASSWORD"; then
    log_error "Failed to authenticate"
    return 1
  fi
  
  log_success "Successfully authenticated"
  return 0
}

# Extract API name from directory
extract_api_name() {
  local api_path="$1"
  local api_name=""
  
  # Try to extract from api.yaml or api_meta.yaml
  if [ -f "$api_path/api.yaml" ]; then
    api_name=$(grep -E "^\s*title:" "$api_path/api.yaml" | head -n1 | sed 's/.*title:[[:space:]]*\(.*\)/\1/' | tr -d '"' | xargs)
  elif [ -f "$api_path/api_meta.yaml" ]; then
    api_name=$(grep -E "^\s*name:" "$api_path/api_meta.yaml" | head -n1 | sed 's/.*name:[[:space:]]*\(.*\)/\1/' | tr -d '"' | xargs)
  fi
  
  # Fallback to directory name if not found
  if [ -z "$api_name" ]; then
    api_name=$(basename "$api_path")
  fi
  
  echo "$api_name"
}

# Import and publish API
import_and_publish_api() {
  local api_path="$1"
  local api_name
  
  api_name=$(extract_api_name "$api_path")
  
  if [ -z "$api_name" ]; then
    log_error "Could not determine API name from $api_path"
    return 1
  fi
  
  log_info "📥 Importing $api_name from $(basename "$api_path")..."
  
  # Import API
  if ! apictl -k import api -f "$api_path" -e "$APIM_ENV_NAME" --update --preserve-provider=true 2>/dev/null; then
    log_error "❌ Failed to import $api_name"
    return 1
  fi
  
  log_success "✅ $api_name imported successfully"
  
  # Wait for API to be registered
  sleep 2
  
  return 0
}

# Process all APIs from directory
process_all_apis() {
  local api_dir="$API_DEFINITIONS_PATH"
  local processed=0
  local failed=0
  
  if [ ! -d "$api_dir" ]; then
    log_error "API definitions directory not found: $api_dir"
    return 1
  fi
  
  log_info "Processing APIs from: $api_dir"
  
  # Process each API directory (skip 'bck' and other non-API folders)
  for api_path in "$api_dir"/*; do
    [ -d "$api_path" ] || continue
    
    # Skip backup or hidden directories
    local dirname=$(basename "$api_path")
    if [ "$dirname" = "bck" ] || [ "${dirname:0:1}" = "." ]; then
      log_info "Skipping directory: $dirname"
      continue
    fi
    
    # Check if directory contains API definition files
    if [ ! -f "$api_path/api.yaml" ] && [ ! -f "$api_path/api_meta.yaml" ]; then
      log_warn "No API definition found in: $dirname (skipping)"
      continue
    fi
    
    if import_and_publish_api "$api_path"; then
      processed=$((processed + 1))
    else
      failed=$((failed + 1))
      log_warn "⚠️  Continuing with next API despite previous error"
    fi
    
    echo ""  # Blank line for readability
  done
  
  log_info "API Import Summary: $processed succeeded, $failed failed"
  
  if [ $processed -gt 0 ]; then
    log_success "✅ APIs processed successfully"
  fi
  
  return 0
}

# Main execution
main() {
  log_info "=== Setting up APIs ==="
  
  configure_apictl || {
    log_error "Failed to configure apictl"
    exit 1
  }
  
  process_all_apis || {
    log_warn "API processing completed with errors"
  }
  
  log_success "API setup completed"
  return 0
}

main "$@"
