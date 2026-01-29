#!/bin/bash

# ===============================
# ⚠️ Confirmation Prompt
# ===============================
echo "🚨 WARNING: This will remove all Docker containers, images, volumes, and networks"
echo "🚨 EXCEPT: Portainer container, image, volume (portainer_data), and default networks"
read -p "❓ Are you sure you want to continue? Type 'yes' to proceed: " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "❌ Cleanup aborted by user."
  exit 1
fi

# ===============================
# Docker Cleanup Script (macOS)
# Keeps only Portainer resources
# ===============================

echo "⚙️ Starting Docker cleanup..."

# 1. Stop and remove all containers except Portainer
echo "🛑 Stopping and removing containers (except Portainer)..."
PORTAINER_CONTAINER_ID=$(docker ps -aqf "name=portainer")
docker ps -q | grep -v "$PORTAINER_CONTAINER_ID" | xargs -r docker stop
docker ps -aq | grep -v "$PORTAINER_CONTAINER_ID" | xargs -r docker rm -f

# 2. Remove all Docker images except Portainer image
echo "🧹 Removing Docker images (except Portainer)..."
PORTAINER_IMAGE_ID=$(docker images -q portainer/portainer-ce)
docker images -q | grep -v "$PORTAINER_IMAGE_ID" | xargs -r docker rmi -f

# 3. Remove all Docker volumes except portainer_data
echo "🧼 Removing Docker volumes (except portainer_data)..."
docker volume ls -q | grep -v "portainer_data" | xargs -r docker volume rm -f

# 4. Remove all custom Docker networks (except default and Portainer)
echo "🌐 Removing Docker networks (except defaults and Portainer)..."
docker network ls --format '{{.Name}}' | grep -v -E "bridge|host|none|portainer" | xargs -r docker network rm

# 5. Prune build cache
echo "🧱 Pruning Docker builder cache..."
docker builder prune -af

# 6. Display final state
echo "✅ Final Docker state:"
docker ps -a
docker images
docker volume ls
docker network ls

echo "🚀 Docker cleanup complete!"
