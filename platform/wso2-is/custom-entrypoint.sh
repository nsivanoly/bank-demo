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
IS_HOST="${IS_HOST:-https://localhost:9444}"
MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}

# Script directory
SCRIPTS_DIR="/app/container-scripts"

# Initialization marker file (in WSO2 user's home)
INIT_MARKER="${WSO2_HOME:-.}/init_complete.marker"

OIDC_WELL_KNOWN_URL="${IS_HOST}/oauth2/token/.well-known/openid-configuration"

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

wait_for_is() {
  local attempt=0
  log_info "IS host           : ${IS_HOST}"
  log_info "OIDC well-known   : ${OIDC_WELL_KNOWN_URL}"
  log_info "Waiting for WSO2 Identity Server (OIDC discovery) at ${OIDC_WELL_KNOWN_URL}..."
  log_info "Maximum wait time: $((MAX_RETRY * RETRY_INTERVAL)) seconds (${MAX_RETRY} attempts × ${RETRY_INTERVAL}s)"

  while [ $attempt -lt $MAX_RETRY ]; do
    attempt=$((attempt + 1))

    if curl -sk --max-time 5 "$OIDC_WELL_KNOWN_URL" 2>/dev/null | grep -q '"issuer"'; then
      log_success "OIDC discovery endpoint is ready (attempt $attempt/$MAX_RETRY)"
      return 0
    fi

    if [ $((attempt % 3)) -eq 0 ]; then
      log_info "Still waiting... (attempt $attempt/$MAX_RETRY, elapsed: $((attempt * RETRY_INTERVAL))s)"
    fi

    sleep $RETRY_INTERVAL
  done

  log_error "WSO2 Identity Server did not start within $((MAX_RETRY * RETRY_INTERVAL)) seconds"
  return 1
}

# ==================== MAIN EXECUTION ====================
main() {
  log_header "WSO2 Identity Server - Starting"

  # Forward termination signals to child
  trap 'log_warn "Received termination signal, stopping IS (PID: ${IS_PID:-unknown})"; [ -n "${IS_PID:-}" ] && kill -TERM "$IS_PID" 2>/dev/null || true' SIGINT SIGTERM
  
  # Start Identity Server in background
  log_info "Starting WSO2 Identity Server in background..."
  ./docker-entrypoint.sh &
  IS_PID=$!
  log_info "Identity Server started with PID: $IS_PID"
  
  # Wait for Identity Server to be ready
  if ! wait_for_is; then
    log_error "Failed to start Identity Server"
    exit 1
  fi

  # Check if initialization has already been completed
  if [ ! -f "$INIT_MARKER" ]; then
    log_header "WSO2 Identity Server - Container Initialization"

    # Execute the container initialization script
    if [ -d "$SCRIPTS_DIR" ]; then
      # Add users groups and roles
      log_header "Step 1: Setting up users, groups and roles"
      if [ -f "$SCRIPTS_DIR/setup-users-groups.sh" ]; then
        log_info "Executing setup-users-groups.sh..."
        chmod +x "$SCRIPTS_DIR/setup-users-groups.sh"
        if "$SCRIPTS_DIR/setup-users-groups.sh"; then
          log_success "Users, groups, and roles setup completed successfully"
        else
          log_warn "Users, groups, and roles setup completed with warnings (continuing)"
        fi
      else
        log_warn "setup-users-groups.sh not found at: $SCRIPTS_DIR/setup-users-groups.sh"
      fi

      log_success "All initialization scripts completed"
    else
      log_warn "Container scripts directory not found: $SCRIPTS_DIR"
      log_info "Skipping custom initialization"
    fi

    # Mark initialization as complete
    touch "$INIT_MARKER"
    log_success "Initialization completed and marked as done"
    log_info "Marker file created at: $INIT_MARKER"
  else
    log_header "WSO2 Identity Server - Already Initialized"
    log_info "Initialization marker found at: $INIT_MARKER"
    log_success "Skipping setup steps (already initialized)"
  fi
  
  log_header "WSO2 Identity Server - Running"
  log_info "Container is ready. Press Ctrl+C to stop."
  
  # Wait for background Identity Server process
  wait $IS_PID
}

main "$@"
