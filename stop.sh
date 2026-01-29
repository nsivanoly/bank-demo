#!/bin/bash
# stop.sh - Stop and optionally remove specific Docker Compose services, or all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/infra/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

SERVICES=(
  wso2is
  wso2am
  wso2icp
  wso2mi
  bank-api
  web-socket
  graphql
  bank-app
  php-app
)

# Function to display container status
show_status() {
  local services=("$@")
  echo ""
  echo "📊 Current Status:"
  echo "═══════════════════════════════════════════════════════════════"
  printf "%-20s %-15s %-15s\n" "SERVICE" "STATUS" "STATE"
  echo "───────────────────────────────────────────────────────────────"
  
  for service in "${services[@]}"; do
    # Get container status
    container_status=$(docker ps -a --filter "name=${service}" --format "{{.Status}}" 2>/dev/null | head -n1)
    container_state=$(docker ps -a --filter "name=${service}" --format "{{.State}}" 2>/dev/null | head -n1)
    
    if [ -z "$container_status" ]; then
      printf "%-20s %-15s %-15s\n" "$service" "not found" "—"
    else
      # Determine status icon
      case "$container_state" in
        running)
          status_icon="🟢 running"
          ;;
        exited)
          status_icon="🔴 stopped"
          ;;
        created)
          status_icon="🟡 created"
          ;;
        paused)
          status_icon="🟠 paused"
          ;;
        *)
          status_icon="⚪ $container_state"
          ;;
      esac
      
      # Truncate status if too long
      status_display="${container_status:0:30}"
      printf "%-20s %-15s\n" "$service" "$status_icon"
    fi
  done
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
}

echo "Available services:"
for i in "${!SERVICES[@]}"; do
  echo "  $((i+1))) ${SERVICES[i]}"
done
echo "  a) All services"
echo ""

read -p "Enter service numbers separated by space (e.g. 2 4 7) or 'a' for all (default: all): " -a choices

# If no input or 'a' selected, select all services
if [ ${#choices[@]} -eq 0 ] || [[ "${choices[0]}" == "a" ]]; then
  SELECTED_SERVICES=("${SERVICES[@]}")
  echo "Selected: All services"
else
  SELECTED_SERVICES=()
  for c in "${choices[@]}"; do
    if [[ "$c" =~ ^[0-9]+$ ]] && (( c >= 1 && c <= ${#SERVICES[@]} )); then
      SELECTED_SERVICES+=("${SERVICES[c-1]}")
    else
      echo "Invalid selection: $c"
      exit 1
    fi
  done
fi

# Show current status of selected services
show_status "${SELECTED_SERVICES[@]}"

echo "Select cleanup level:"
echo "  1) Graceful stop only (preserve everything)"
echo "  2) Stop and remove volumes"
echo "  3) Full cleanup (remove all images and networks)"
echo "  4) Exit"
echo ""
read -p "Enter your choice (1-4, default: 1): " cleanup_choice

case "${cleanup_choice:-1}" in
  1)
    echo "🛑 Gracefully stopping selected services: ${SELECTED_SERVICES[*]}"
    "${COMPOSE_CMD[@]}" stop "${SELECTED_SERVICES[@]}"
    echo "✅ Services stopped. Containers, volumes, and images preserved."
    show_status "${SELECTED_SERVICES[@]}"
    ;;
  2)
    echo "🛑 Stopping and removing selected services with volumes: ${SELECTED_SERVICES[*]}"
    "${COMPOSE_CMD[@]}" rm -f -s -v "${SELECTED_SERVICES[@]}"
    echo "✅ Services stopped and removed with volumes."
    show_status "${SELECTED_SERVICES[@]}"
    ;;
  3)
    echo "🧹 Full cleanup: stopping and removing services, volumes, images, and networks..."
    echo "Selected services: ${SELECTED_SERVICES[*]}"
    # Stop and remove containers with volumes
    "${COMPOSE_CMD[@]}" rm -f -s -v "${SELECTED_SERVICES[@]}"
    # Remove images for selected services
    for service in "${SELECTED_SERVICES[@]}"; do
      echo "🗑️  Removing images for $service..."
      "${COMPOSE_CMD[@]}" images "$service" -q | xargs -r docker rmi -f 2>/dev/null || true
    done
    # Clean up unused networks
    echo "🌐 Pruning unused networks..."
    docker network prune -f
    echo "✅ Full cleanup completed."
    show_status "${SELECTED_SERVICES[@]}"
    ;;
  4)
    echo "👋 Exiting without changes."
    exit 0
    ;;
  *)
    echo "❌ Invalid choice. Exiting without changes."
    exit 1
    ;;
esac
