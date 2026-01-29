#!/bin/bash
# PHP App Custom Entrypoint
# Runs setup before starting Apache/PHP

set -e

# ==================== CONFIGURATION ====================

SETUP_SCRIPT=${SETUP_SCRIPT:-/opt/container-init/setup-app.sh}
CONFIG_FILE=${CONFIG_FILE:-/var/www/html/includes/config.php}

# ==================== UTILITY FUNCTIONS ====================

log_info() {
  echo "ℹ️  [BANK-APP-ENTRYPOINT] $*" >&2
}

log_success() {
  echo "✅ [BANK-APP-ENTRYPOINT] $*" >&2
}

log_error() {
  echo "❌ [BANK-APP-ENTRYPOINT] $*" >&2
}

log_warn() {
  echo "⚠️  [BANK-APP-ENTRYPOINT] $*" >&2
}

# ==================== MAIN EXECUTION ====================

main() {
  log_info "Starting PHP Bank App Initialization..."

  # Step 1: Run setup-app.sh if it exists
  if [ -f "$SETUP_SCRIPT" ]; then
    log_info "Running application setup script: $SETUP_SCRIPT"
    
    if chmod +x "$SETUP_SCRIPT" && "$SETUP_SCRIPT"; then
      log_success "Application setup completed successfully"
      
      # Verify config was updated
      if [ -f "$CONFIG_FILE" ]; then
        log_success "Configuration file found at: $CONFIG_FILE"
        log_info "Config file size: $(du -h "$CONFIG_FILE" | cut -f1)"
      else
        log_warn "Config file not found at $CONFIG_FILE (may be created during build)"
      fi
    else
      log_warn "Setup script failed, but continuing with app startup..."
    fi
  else
    log_warn "Setup script not found at $SETUP_SCRIPT"
    log_info "Application will start without WSO2 registration"
  fi

  echo ""
  log_info "========================================="
  log_info "🌐 Starting Apache Web Server"
  log_info "========================================="
  
  # Step 2: Start the Apache Web Server server
  log_info "Executing: apache2-foreground"
  exec apache2-foreground
}

main "$@"
