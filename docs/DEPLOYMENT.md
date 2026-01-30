# Deployment Guide

## Overview

WSO2 DevStack uses Docker Compose for orchestration. All services are defined in `infra/docker-compose.yml` and configured via the `.env` file.

## Docker Compose Structure

### File Location
- **Compose File**: `infra/docker-compose.yml`
- **Environment**: `.env` (root directory)
- **Execution**: Scripts in root directory (`start.sh`, `stop.sh`)

### Service Definitions

The compose file defines 9 services:

**WSO2 Platform (4 services):**
- `wso2is` - Identity Server
- `wso2am` - API Manager
- `wso2mi` - Micro Integrator
- `wso2icp` - Integration Control Plane

**Backend Services (3 services):**
- `bank-api` - REST API
- `web-socket` - WebSocket service
- `graphql` - GraphQL API

**Frontend Applications (2 services):**
- `bank-app` - React application
- `php-app` - PHP application

## Deployment Workflow

### Start Services

**Using start.sh (Recommended):**
```bash
./start.sh
```

**Interactive Mode:**
1. Select services (default/all/custom)
2. Choose build option (with cache/without cache/skip)
3. Script executes:
   - Creates `.env` from `.env.sample` if missing
   - Stops existing containers
   - Builds images (if selected)
   - Starts selected services

**Manual Docker Compose:**
```bash
# Start all services
docker compose -f infra/docker-compose.yml --env-file .env up -d

# Start specific services
docker compose -f infra/docker-compose.yml --env-file .env up -d wso2am bank-api bank-app

# Follow logs
docker compose -f infra/docker-compose.yml --env-file .env logs -f
```

### Stop Services

**Using stop.sh (Recommended):**
```bash
./stop.sh
```

**Interactive Mode:**
1. Select services to stop (all/specific)
2. Script stops and removes selected containers

**Manual Docker Compose:**
```bash
# Stop all services
docker compose -f infra/docker-compose.yml --env-file .env stop

# Stop specific services
docker compose -f infra/docker-compose.yml --env-file .env stop wso2am bank-api

# Stop and remove containers
docker compose -f infra/docker-compose.yml --env-file .env down

# Stop and remove including volumes
docker compose -f infra/docker-compose.yml --env-file .env down -v
```

## Build Process

### Image Build Strategy

**WSO2 Products:**
- **Base Images**: Official WSO2 Docker images from Docker Hub
- **Customization**: Dockerfiles in `platform/wso2-*` directories
- **Layers**:
  1. Official WSO2 base image
  2. Configuration files (`*-conf/`)
  3. Data files (`*-data/`)
  4. Custom entrypoint script
  5. Initialization scripts (`container-init/`)

**Custom Services:**
- **Base Image**: `node:18` (bank-api, web-socket, graphql, bank-app)
- **Base Image**: `php:8-apache` (php-app)
- **Layers**:
  1. Base runtime image
  2. Dependencies installation
  3. Application code
  4. Custom entrypoint
  5. Initialization scripts

### Build Commands

**Build All Services:**
```bash
docker compose -f infra/docker-compose.yml --env-file .env build
```

**Build Without Cache:**
```bash
docker compose -f infra/docker-compose.yml --env-file .env build --no-cache
```

**Build Specific Service:**
```bash
docker compose -f infra/docker-compose.yml --env-file .env build wso2am
```

**Build with Platform Override:**
```bash
docker compose -f infra/docker-compose.yml --env-file .env build --build-arg BUILD_PLATFORM=linux/arm64
```

### When to Rebuild

**Must Rebuild:**
- Version changes in `.env` (APIM_VERSION, IS_VERSION, etc.)
- Code changes in `services/` or `apps/`
- Dockerfile modifications
- New dependencies added

**Can Skip Rebuild:**
- Configuration-only changes in `.env` (ports, credentials)
- Volume-mounted code changes (React/PHP apps with hot reload)

## Container Lifecycle

### Startup Sequence

1. **Container Creation**: Docker creates container from image
2. **Volume Mounting**: Attaches volumes and bind mounts
3. **Network Connection**: Connects to `wso2net` bridge network
4. **Entrypoint Execution**: Custom entrypoint script runs
5. **Service Start**: Main service starts in background
6. **Health Check Wait**: Container waits for service readiness
7. **Initialization**: Runs `container-init/` scripts
8. **Marker Creation**: Creates marker file to prevent re-initialization
9. **Running State**: Container enters running state

### Health Checks

Each service has a health check configured:

**API Manager:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-k", "-f", "https://wso2am:9443/services/Version"]
  interval: 15s
  timeout: 10s
  retries: 20
  start_period: 60s
```

**Identity Server:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-k", "-f", "https://wso2is:9444/oauth2/token/.well-known/openid-configuration"]
  interval: 10s
  timeout: 10s
  retries: 60
  start_period: 600s
```

**Bank API:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-k", "-f", "https://bank-api:3443/accounts"]
  interval: 15s
  timeout: 10s
  retries: 5
```

**Health Check States:**
- `starting`: Initial state, health check not started
- `healthy`: Health check passing
- `unhealthy`: Health check failing

**View Health Status:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Container Restart Policies

**WSO2 Platform Services:**
- No explicit restart policy (default: `no`)
- Fail fast to catch configuration errors

**Backend Services & Apps:**
- `restart: unless-stopped`
- Automatically restart on failure
- Don't restart if manually stopped

## Networking

### Docker Network

**Network Name**: `wso2net`
**Driver**: `bridge`
**Purpose**: Inter-container communication

**Network Configuration:**
```yaml
networks:
  wso2net:
    driver: bridge
```

**Service Discovery:**
- Containers can communicate using service names as hostnames
- Example: `wso2am` resolves to API Manager container IP
- DNS provided by Docker's embedded DNS server

**External Access:**
- Host machine accesses services via `localhost:<port>`
- Port mapping defined in `ports:` section of each service

### Port Mapping

**Format**: `"<host-port>:<container-port>"`

**Example:**
```yaml
ports:
  - "${APIM_HTTPS_PORT:-9443}:9443"
```

- Maps container port 9443 to host port defined in `APIM_HTTPS_PORT`
- Falls back to 9443 if variable not set
- Allows dynamic port configuration via `.env`

## Storage

### Persistent Volumes

**Named Volumes:**
```yaml
volumes:
  wso2_is_data:
    driver: local
  wso2_am_data:
    driver: local
```

**Purpose**: Persist data across container restarts

**Mounted To:**
- `wso2_is_data` → `wso2is:/home/wso2carbon`
- `wso2_am_data` → `wso2am:/home/wso2carbon`

**Contains:**
- Database files (H2)
- Registry data
- Deployment artifacts
- Generated configurations

**Backup Volumes:**
```bash
# Export volume data
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine tar czf /backup/wso2_am_data_backup.tar.gz /data

# Restore volume data
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine tar xzf /backup/wso2_am_data_backup.tar.gz -C /
```

### Bind Mounts

**Read-Only Mounts:**
```yaml
volumes:
  - ./certs:${WSO2_APIM_HOME}/repository/resources/security:ro
```

**Purpose**: Share certificates across services
**Mode**: Read-only (`:ro`)

**Read-Write Mounts (Development):**
```yaml
volumes:
  - ../apps/bank-app/src:/app/src:cached
```

**Purpose**: Hot reload for development
**Mode**: Cached for performance on macOS

## Environment Variables

### Variable Sources

1. **`.env` File**: Primary source for all configuration
2. **Docker Compose File**: Default values (`${VAR:-default}`)
3. **Environment Section**: Service-specific env vars

**Example:**
```yaml
environment:
  HOST: ${HOST_DOMAIN:-localhost}
  PORT_HTTP: ${BANK_API_HTTP_PORT:-2001}
```

### Variable Expansion

Docker Compose performs variable substitution:
- `${VAR}`: Required variable (fails if not set)
- `${VAR:-default}`: Optional with default
- `${VAR:?error}`: Required with error message

### Version Configuration

WSO2 component versions are controlled via environment variables in `.env`:

```env
# WSO2 Product Versions
APIM_VERSION=4.6.0
MI_VERSION=4.5.0
IS_VERSION=7.2.0
ICP_VERSION=1.2.0
```

**Version Selection:**
- Versions correspond to official WSO2 Docker image tags
- Must match available tags on Docker Hub
- Check compatibility matrix before upgrading

**Common Version Variables:**
```env
# WSO2 Products
APIM_VERSION=4.6.0              # API Manager version
MI_VERSION=4.5.0                # Micro Integrator version
IS_VERSION=7.2.0                # Identity Server version
ICP_VERSION=1.2.0               # Integration Control Plane version

# Additional Components (if needed)
MYSQL_CONNECTOR_VERSION=8.0.33  # MySQL JDBC driver (for MI)
NODE_VERSION=18                  # Node.js for backend services
PHP_VERSION=8.2                  # PHP version for php-app
```

**Usage in Dockerfiles:**
```dockerfile
# Example: WSO2 API Manager Dockerfile
ARG APIM_VERSION=4.6.0
FROM wso2/wso2am:${APIM_VERSION}
```

**Build Args in Docker Compose:**
```yaml
services:
  wso2am:
    build:
      context: ../platform/wso2-am
      args:
        APIM_VERSION: ${APIM_VERSION:-4.6.0}
```

### Component Compatibility Matrix

| APIM | MI | IS | ICP | Java | Notes |
|------|----|----|-----|------|-------|
| 4.6.0 | 4.5.0 | 7.2.0 | 1.2.0 | 21 | Current stable |
| 4.7.0 | 4.6.0 | 7.3.0 | 1.3.0 | 21 | Newer versions |
| 4.5.0 | 4.4.0 | 7.1.0 | 1.1.0 | 17 | Older versions |

**Important Notes:**
- **Java Version**: APIM 4.6.0+ requires Java 21 (pre-configured in Dockerfile)
- **IS Console**: Version 7.2.0+ uses new console UI (different from 6.x)
- **MI Integration**: MI version should be compatible with APIM version
- **ICP Version**: Must match MI version for proper integration

## Cleanup Operations

### Remove Containers

```bash
# Stop and remove containers only
docker compose -f infra/docker-compose.yml --env-file .env down
```

### Remove Containers and Volumes

```bash
# Stop, remove containers, networks, and volumes
docker compose -f infra/docker-compose.yml --env-file .env down -v
```

**Warning**: This deletes all data in persistent volumes (users, APIs, applications).

### Remove Orphaned Containers

```bash
# Remove containers not defined in current compose file
docker compose -f infra/docker-compose.yml --env-file .env down --remove-orphans
```

### Complete Docker Cleanup

```bash
# Use cleanup script (removes ALL Docker resources except Portainer)
./docker-clean-up.sh
```

**What it does:**
1. Stops all containers (except Portainer)
2. Removes all containers (except Portainer)
3. Removes all images (except Portainer)
4. Removes all volumes (except `portainer_data`)
5. Removes all custom networks (except defaults)
6. Prunes build cache

## Monitoring and Logging

### View Logs

**All Services:**
```bash
docker compose -f infra/docker-compose.yml --env-file .env logs -f
```

**Specific Service:**
```bash
docker logs -f wso2am
docker logs -f wso2-bank-api
```

**Last N Lines:**
```bash
docker logs --tail 100 wso2am
```

**Since Timestamp:**
```bash
docker logs --since 2024-01-28T10:00:00 wso2am
```

### Container Stats

```bash
# Real-time stats for all containers
docker stats

# Specific containers
docker stats wso2am wso2is
```

**Metrics shown:**
- CPU %
- Memory usage / limit
- Memory %
- Network I/O
- Block I/O

### Container Inspection

```bash
# Full container details
docker inspect wso2am

# Specific fields
docker inspect --format='{{.State.Health.Status}}' wso2am
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' wso2am
```

## Troubleshooting Deployment

### Container Won't Start

**Check logs:**
```bash
docker logs wso2am
```

**Check previous run:**
```bash
docker logs --tail 500 wso2am
```

**Common issues:**
- Port already in use
- Volume mount permission errors
- Missing environment variables
- Out of memory

### Container Keeps Restarting

**Check restart policy:**
```bash
docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' wso2am
```

**View restart count:**
```bash
docker inspect --format='{{.RestartCount}}' wso2am
```

**Prevent restart for debugging:**
```bash
docker update --restart=no wso2am
```

### Health Check Failing

**Check health check command:**
```bash
docker inspect --format='{{.Config.Healthcheck.Test}}' wso2am
```

**Manual health check:**
```bash
docker exec wso2am curl -k -f https://localhost:9443/services/Version
```

**Increase retries:**
Edit `docker-compose.yml` and increase `retries` value.

### Network Issues

**List networks:**
```bash
docker network ls
```

**Inspect network:**
```bash
docker network inspect wso2net
```

**Test connectivity:**
```bash
# From one container to another
docker exec wso2am ping -c 3 wso2is
docker exec wso2am curl -k https://wso2is:9444
```

### Volume Issues

**List volumes:**
```bash
docker volume ls
```

**Inspect volume:**
```bash
docker volume inspect wso2_am_data
```

**Check volume size:**
```bash
docker system df -v
```

**Clean unused volumes:**
```bash
docker volume prune
```

## Best Practices

### Development
- Use `./start.sh` with default services
- Build with cache for faster iterations
- Use bind mounts for hot reload
- Keep `.env` in `.gitignore`

### Testing
- Start with fresh state: `down -v` then `up`
- Use named volumes for data persistence
- Tag images with version numbers
- Document test scenarios

### Production Considerations

**This stack is NOT production-ready. For production:**

1. **Clustering**: Deploy multi-node clusters for HA
2. **External Databases**: Replace H2 with PostgreSQL/MySQL
3. **Load Balancer**: Add load balancer in front of gateways
4. **TLS**: Use proper CA-signed certificates
5. **Secrets Management**: Use Docker secrets or external vault
6. **Monitoring**: Add Prometheus/Grafana
7. **Backup**: Automated backup solutions for volumes
8. **Hardening**: Security scanning, minimal base images
9. **Resource Limits**: Set CPU/memory limits
10. **Orchestration**: Consider Kubernetes for production
