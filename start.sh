#!/bin/bash
# start.sh - Select and start Docker Compose services with build options and clean start

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/infra/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_SAMPLE="$SCRIPT_DIR/.env.sample"

# ===============================
# Check and create .env file
# ===============================
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env file not found!"
  
  if [ -f "$ENV_SAMPLE" ]; then
    echo "📋 Creating .env from .env.sample..."
    cp "$ENV_SAMPLE" "$ENV_FILE"
    echo "✅ .env file created successfully!"
    echo ""
    echo "💡 TIP: You can customize the configuration in .env file"
    echo "   Default values are ready to use for development."
    echo ""
  else
    echo "❌ ERROR: .env.sample file not found!"
    echo "   Please ensure .env.sample exists in the project root."
    exit 1
  fi
else
  echo "✅ .env file found"
fi

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

DEFAULT_SERVICES=(wso2am wso2icp wso2mi bank-api bank-app)

echo "🛠️  Available services:"
for i in "${!SERVICES[@]}"; do
  echo "  $((i+1))) ${SERVICES[i]}"
done
echo "  d) Default services [${DEFAULT_SERVICES[*]}]"
echo "  a) All services"
echo ""

read -p "➡️ Enter service numbers (e.g. 1 3 5), 'd' for default, or 'a' for all (default: d): " -a choices

if [ ${#choices[@]} -eq 0 ] || [[ "${choices[0]}" == "d" ]]; then
  SELECTED_SERVICES=("${DEFAULT_SERVICES[@]}")
elif [[ "${choices[0]}" == "a" ]]; then
  SELECTED_SERVICES=("${SERVICES[@]}")
else
  SELECTED_SERVICES=()
  for c in "${choices[@]}"; do
    if [[ "$c" =~ ^[0-9]+$ ]] && (( c >= 1 && c <= ${#SERVICES[@]} )); then
      SELECTED_SERVICES+=("${SERVICES[c-1]}")
    else
      echo "❌ Invalid selection: $c"
      exit 1
    fi
  done
fi

echo ""
echo "✅ Selected services: ${SELECTED_SERVICES[*]}"
echo ""

echo "⚙️  Choose build option:"
echo "  1) Build with cache"
echo "  2) Build without cache"
echo "  3) Skip build"
read -p "➡️ Enter choice [1-3] (default 3): " build_choice

build_choice=${build_choice:-3}

echo ""
echo "📋 ========= Summary ========="
echo "🛡️  Services to start: ${SELECTED_SERVICES[*]}"
case "$build_choice" in
  1) echo "🔨 Build option: Build with cache" ;;
  2) echo "🚫 Build option: Build without cache" ;;
  3) echo "⏭️ Build option: Skip build" ;;
  *) echo "⚠️ Build option: Invalid choice" ;;
esac
echo "============================="
echo ""

echo "🛑 Stopping and cleaning existing containers, volumes, and orphans..."
"${COMPOSE_CMD[@]}" down --remove-orphans -v

case "$build_choice" in
  1)
    echo "🔨 Building selected services with cache..."
    # Remove marker file if building wso2is or wso2am
    if [[ " ${SELECTED_SERVICES[@]} " =~ " wso2is " ]] || [[ " ${SELECTED_SERVICES[@]} " =~ " wso2am " ]]; then
      MARKER_FILE="$SCRIPT_DIR/apps/php-app/src/setup-app.marker"
      if [ -f "$MARKER_FILE" ]; then
        echo "🗑️  Removing marker file: $MARKER_FILE"
        rm -f "$MARKER_FILE"
      fi
    fi
    "${COMPOSE_CMD[@]}" build "${SELECTED_SERVICES[@]}"
    ;;
  2)
    echo "🚫 Building selected services without cache..."
    # Remove marker file if building wso2is or wso2am
    if [[ " ${SELECTED_SERVICES[@]} " =~ " wso2is " ]] || [[ " ${SELECTED_SERVICES[@]} " =~ " wso2am " ]]; then
      MARKER_FILE="$SCRIPT_DIR/apps/php-app/src/setup-app.marker"
      if [ -f "$MARKER_FILE" ]; then
        echo "🗑️  Removing marker file: $MARKER_FILE"
        rm -f "$MARKER_FILE"
      fi
    fi
    "${COMPOSE_CMD[@]}" build --no-cache "${SELECTED_SERVICES[@]}"
    ;;
  3)
    echo "⏭️ Skipping build..."
    ;;
  *)
    echo "❌ Invalid choice, exiting."
    echo "⏭️ Continuing with the previous build..."
    ;;
esac

echo ""
echo "▶️ Starting selected services..."
"${COMPOSE_CMD[@]}" up -d "${SELECTED_SERVICES[@]}"

echo ""
echo "✅ Containers started: ${SELECTED_SERVICES[*]}"

# read -p "Do you want to follow the logs? (y/N): " follow
# if [[ "$follow" =~ ^[Yy]$ ]]; then
#   docker-compose logs -f "${SELECTED_SERVICES[@]}"
# else
#   echo "You can check logs later with: docker-compose logs -f ${SELECTED_SERVICES[*]}"
# fi

# # Trap Ctrl+C (SIGINT) to stop only selected services
# trap "echo; echo 'Stopping selected services...'; docker-compose stop ${SELECTED_SERVICES[*]}; exit 0" SIGINT

# echo "Press Ctrl+C to stop selected services."

# while true; do
#   sleep 5
# done
