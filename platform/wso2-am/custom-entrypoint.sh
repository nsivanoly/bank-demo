#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
APIM_HOST="${APIM_HOST:-https://localhost:9443}"

# Script directory
SCRIPTS_DIR="/app/container-scripts"

# Initialization marker file (in WSO2 user's home)
INIT_MARKER="${WSO2_HOME:-.}/init_complete.marker"

APIM_VERSION_CHECK_URL="${APIM_HOST}/services/Version"

log_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} ${BOLD}$*${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

log_info() {
  echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $*${NC}"
}

log_error() {
  echo -e "${RED}❌ $*${NC}" >&2
}

log_warn() {
  echo -e "${YELLOW}⚠️  $*${NC}"
}

wait_for_apim() {
  echo "⏳ Waiting for WSO2 API Manager to start..."
  until curl -sk "$APIM_VERSION_CHECK_URL" | grep -q "WSO2 API Manager"; do
    sleep 0.5
  done
  echo "✅ WSO2 API Manager is running."
}

# ==================== MAIN EXECUTION ====================
main() {
  # Start API Manager in background
  ./docker-entrypoint.sh &
  
  # Wait for API Manager to be ready
  wait_for_apim

  # Execute the container initialization script
  if [ -d "$SCRIPTS_DIR" ]; then
    # Check if initialization has already been completed
    if [ ! -f "$INIT_MARKER" ]; then
      # Import APIs
      log_header "Step 1: Setting up APIs"
      if [ -f "$SCRIPTS_DIR/setup-apis.sh" ]; then
        "$SCRIPTS_DIR/setup-apis.sh" || {
          log_warn "API setup completed with warnings (continuing)"
        }
      else
        log_warn "setup-apis.sh not found, skipping"
      fi

      # Configure Gateway
      log_header "Step 2: Configuring Gateway"
      if [ -f "$SCRIPTS_DIR/setup-gateway.sh" ]; then
        "$SCRIPTS_DIR/setup-gateway.sh" || {
          log_warn "Gateway configuration completed with warnings (continuing)"
        }
      else
        log_warn "setup-gateway.sh not found, skipping"
      fi

      # Register Key Manager
      log_header "Step 3: Registering Key Manager"
      if [ -f "$SCRIPTS_DIR/setup-keymanager.sh" ]; then
        "$SCRIPTS_DIR/setup-keymanager.sh" || {
          log_warn "Key Manager registration completed with warnings (continuing)"
        }
      else
        log_warn "setup-keymanager.sh not found, skipping"
      fi

      # Mark initialization as complete
      touch "$INIT_MARKER"
      log_success "Initialization completed and marked as done."
    else
      log_success "System already initialized. Skipping setup steps."
    fi

    log_success "Initialization scripts completed"
  else
    log_warn "Container scripts directory not found: $SCRIPTS_DIR"
    log_info "Skipping custom initialization"
  fi
  
  wait  # Wait for background processes
}

main "$@"
