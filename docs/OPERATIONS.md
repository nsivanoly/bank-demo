# Operations Guide

## Overview

This guide covers day-to-day operations including monitoring, troubleshooting, maintenance, and backup procedures.

## Management Scripts

The project includes three main scripts for managing the container environment:

### start.sh - Start Services

Interactive script to start selected services with build options.

**Usage:**
```bash
./start.sh
```

**Features:**
- Interactive service selection (default, all, or custom)
- Automatic configuration file creation from samples
- Build options: with cache, without cache, or skip build
- Clean start option to remove existing containers
- Status display after startup

**Service Selection:**
- `d` - Default services (wso2am, wso2icp, wso2mi, bank-api, bank-app)
- `a` - All services
- Numbers (e.g., `1 3 5`) - Custom selection

**Build Options:**
- `1` - Build with cache (use for code changes)
- `2` - Build without cache (use for dependency changes)
- `3` - Skip build (fastest, use existing images)

### stop.sh - Stop Services

Interactive script to stop and optionally clean up services.

**Usage:**
```bash
./stop.sh
```

**Features:**
- Service selection (all or specific services)
- Multiple cleanup levels
- Current status display before stopping
- Confirmation prompts for destructive operations

**Cleanup Levels:**
1. **Graceful stop only** - Stops containers, preserves everything
2. **Stop and remove volumes** - Stops containers and removes data volumes
3. **Full cleanup** - Removes containers, images, volumes, and networks
4. **Exit** - Cancel operation

**Examples:**
```bash
# Stop all services gracefully
./stop.sh
# Select: a (all services)
# Select: 1 (graceful stop)

# Stop specific services with volume cleanup
./stop.sh
# Select: 2 5 8 (wso2am, web-socket, bank-app)
# Select: 2 (stop and remove volumes)
```

### monitor-setup.sh - Monitor Container Status

Comprehensive monitoring script for container health and resource usage.

**Usage:**
```bash
# Single status check
./monitor-setup.sh

# Continuous monitoring (refreshes every 5 seconds)
./monitor-setup.sh --watch

# Show recent error logs
./monitor-setup.sh --logs

# Show help
./monitor-setup.sh --help
```

**Features:**
- ✅ Container status overview with color-coded output
- ✅ Running/stopped container counts
- ✅ Health check status monitoring
- ✅ Real-time resource usage (CPU, memory, network, disk I/O)
- ✅ Recent error log scanning
- ✅ Watch mode for continuous monitoring
- ✅ Automatic Docker daemon check

**Output Sections:**
1. **Container Status** - Lists all containers with their state
2. **Health Status** - Shows health check results
3. **Resource Usage** - Displays CPU, memory, and I/O statistics

**Color Coding:**
- 🟢 Green - Running/Healthy
- 🔴 Red - Stopped/Unhealthy/Errors
- 🟡 Yellow - Starting/Warnings

## Health Monitoring

### Service Health Checks

**Check Container Status:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Check Health Status:**
```bash
docker inspect --format='{{.State.Health.Status}}' wso2am
docker inspect --format='{{.State.Health.Status}}' wso2is
docker inspect --format='{{.State.Health.Status}}' wso2-bank-api
```

**Health Status Values:**
- `healthy`: Service is responding correctly
- `unhealthy`: Health check failing
- `starting`: Initial state, not yet checked

### Service Endpoints

**Identity Server (wso2is):**
- **Port**: 9444 (HTTPS)
- **Health Endpoint**: `https://localhost:9444/oauth2/token/.well-known/openid-configuration`
- **Console**: `https://localhost:9444/carbon`

**API Manager (wso2am):**
- **Port**: 9443 (HTTPS)
- **Health Endpoint**: `https://localhost:9443/services/Version`
- **Publisher**: `https://localhost:9443/publisher`
- **DevPortal**: `https://localhost:9443/devportal`
- **Admin**: `https://localhost:9443/admin`

**Micro Integrator (wso2mi):**
- **Port**: 8253 (HTTPS)
- **Health Endpoint**: `https://localhost:8253/management/health`

**Integration Control Plane (wso2icp):**
- **Port**: 9743 (HTTPS)
- **Dashboard**: `https://localhost:9743/dashboard/login`

**Bank API:**
- **HTTP**: 2001
- **HTTPS**: 3443
- **Health**: `https://localhost:3443/accounts`
- **Swagger**: `https://localhost:3443/api-docs`

**GraphQL:**
- **Port**: 8082
- **Endpoint**: `http://localhost:8082/graphql`
- **Playground**: `http://localhost:8082/graphql` (GET request)

**WebSocket:**
- **Port**: 8081 (WS), 8443 (WSS)
- **Health**: `https://localhost:8443/health`
- **Connect**: `ws://localhost:8081`

**React App (bank-app):**
- **Port**: 3000
- **URL**: `http://localhost:3000`

**PHP App (php-app):**
- **HTTP**: 7100
- **HTTPS**: 7400
- **URL**: `http://localhost:7100`

### Manual Health Checks

**WSO2 Services:**
```bash
# Identity Server
curl -k https://localhost:9444/oauth2/token/.well-known/openid-configuration

# API Manager
curl -k https://localhost:9443/services/Version

# Micro Integrator
curl -k https://localhost:8253/management/health
```

**Backend Services:**
```bash
# Bank API
curl -k https://localhost:3443/accounts

# GraphQL
curl http://localhost:8082/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'

# WebSocket
curl -k https://localhost:8443/health
```

## Log Analysis

### Access Logs

**View Live Logs:**
```bash
# All services
docker compose -f infra/docker-compose.yml logs -f

# Specific service
docker logs -f wso2am
docker logs -f wso2-bank-api
```

**Filter by Time:**
```bash
# Last 100 lines
docker logs --tail 100 wso2am

# Since timestamp
docker logs --since 2024-01-28T10:00:00 wso2am

# Last 30 minutes
docker logs --since 30m wso2am
```

**Search Logs:**
```bash
# Grep for errors
docker logs wso2am 2>&1 | grep -i error

# Grep for specific pattern
docker logs wso2am 2>&1 | grep "OAuth"
```

### WSO2 Log Files

**Log Locations (inside containers):**
```
/home/wso2carbon/repository/logs/
├── audit.log              # Audit logs
├── carbon.log            # Server logs
├── http_access_*.log     # HTTP access logs
├── wso2carbon.log        # Application logs
└── wso2error.log         # Error logs
```

**Access from Host:**
```bash
# Copy log file from container
docker cp wso2am:/home/wso2carbon/repository/logs/wso2carbon.log ./

# View directly
docker exec wso2am tail -f /home/wso2carbon/repository/logs/wso2carbon.log
```

**Log Levels:**
- `ERROR`: Errors requiring attention
- `WARN`: Warnings that may indicate issues
- `INFO`: Informational messages
- `DEBUG`: Debug-level details (only in debug mode)

### Service-Specific Logs

**Bank API:**
```bash
# Application logs (stdout/stderr)
docker logs wso2-bank-api

# Search for specific endpoint
docker logs wso2-bank-api 2>&1 | grep "/accounts"
```

**React App:**
```bash
# Build logs
docker logs wso2-bank-app 2>&1 | grep "webpack"

# Runtime logs
docker logs wso2-bank-app
```

**PHP App:**
```bash
# Apache logs
docker exec wso2-php-app tail -f /var/log/apache2/access.log
docker exec wso2-php-app tail -f /var/log/apache2/error.log

# PHP errors
docker logs wso2-php-app 2>&1 | grep "PHP"
```

## Resource Monitoring

### Container Resource Usage

**Real-Time Stats:**
```bash
docker stats
```

**Output:**
```
CONTAINER ID   NAME            CPU %   MEM USAGE / LIMIT    MEM %    NET I/O         BLOCK I/O
abc123         wso2am          1.5%    1.2GiB / 4GiB        30%      1.2MB / 850KB   10MB / 5MB
def456         wso2is          1.2%    950MiB / 4GiB        23%      950KB / 600KB   8MB / 4MB
```

**Specific Containers:**
```bash
docker stats wso2am wso2is wso2mi
```

### Disk Usage

**Container Disk Usage:**
```bash
docker system df

# Verbose output
docker system df -v
```

**Volume Sizes:**
```bash
# List volumes with sizes
docker volume ls -q | xargs docker volume inspect | grep -A 5 Name

# Check specific volume
du -sh $(docker volume inspect wso2_am_data --format '{{.Mountpoint}}')
```

**Image Sizes:**
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Memory Usage

**Container Memory:**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

**WSO2 JVM Memory:**
```bash
# Check JVM heap usage (inside container)
docker exec wso2am sh -c 'cd /home/wso2carbon/bin && ./wso2server.sh -status'
```

## Troubleshooting

### Common Issues

#### Service Not Starting

**Symptoms:**
- Container exits immediately
- Container in restart loop
- Health check never passes

**Diagnosis:**
```bash
# Check logs
docker logs wso2am

# Check exit code
docker inspect --format='{{.State.ExitCode}}' wso2am

# Check restart count
docker inspect --format='{{.RestartCount}}' wso2am
```

**Solutions:**

1. **Port Conflict:**
```bash
# Check if port is in use
lsof -i :9443
netstat -an | grep 9443

# Change port in .env
APIM_HTTPS_PORT=9445
```

2. **Memory Limit:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 8GB+
```

3. **Volume Corruption:**
```bash
# Remove and recreate volumes
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```

4. **Environment Variable Missing:**
```bash
# Verify .env exists
ls -la .env

# Recreate from sample
cp .env.sample .env
```

#### Connection Refused

**Symptoms:**
- `curl: (7) Failed to connect`
- Applications can't reach services

**Diagnosis:**
```bash
# Check if container is running
docker ps | grep wso2am

# Check if service is listening
docker exec wso2am netstat -tlnp | grep 9443

# Test from another container
docker exec wso2-bank-api curl -k https://wso2am:9443/services/Version
```

**Solutions:**

1. **Service Not Ready:**
```bash
# Wait for health check to pass
docker ps --format "table {{.Names}}\t{{.Status}}"
```

2. **Network Issue:**
```bash
# Verify network exists
docker network ls | grep wso2net

# Reconnect container
docker network connect wso2net wso2am
```

3. **Firewall Blocking:**
```bash
# Check firewall rules (macOS)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow Docker
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Docker.app/Contents/MacOS/Docker
```

#### Authentication Failures

**Symptoms:**
- Login fails on IS/APIM
- OAuth token errors
- 401 Unauthorized responses

**Diagnosis:**
```bash
# Check if IS is healthy
curl -k https://localhost:9444/oauth2/token/.well-known/openid-configuration

# Check IS logs for errors
docker logs wso2is 2>&1 | grep -i "authentication"

# Verify credentials in .env
grep "ADMIN_USERNAME\|ADMIN_PASSWORD" .env
```

**Solutions:**

1. **Wrong Credentials:**
```bash
# Reset to defaults
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

2. **Key Manager Not Registered:**
```bash
# Re-run setup
docker exec wso2am /home/wso2carbon/container-init/setup-keymanager.sh
```

3. **Service Order:**
```bash
# Start IS before APIM
docker compose -f infra/docker-compose.yml up -d wso2is
# Wait for IS to be healthy
docker compose -f infra/docker-compose.yml up -d wso2am
```

#### Slow Performance

**Symptoms:**
- Slow API responses
- UI lag
- High CPU/memory usage

**Diagnosis:**
```bash
# Check resource usage
docker stats

# Check load inside container
docker exec wso2am top -bn1

# Check disk I/O
docker stats --no-stream --format "table {{.Name}}\t{{.BlockIO}}"
```

**Solutions:**

1. **Increase Resources:**
```bash
# Docker Desktop → Settings → Resources
# CPU: 4+ cores
# Memory: 8+ GB
```

2. **Clean Build Cache:**
```bash
docker builder prune -a
```

3. **Optimize Volumes (macOS):**
```yaml
volumes:
  - ../apps/bank-app/src:/app/src:cached  # Add :cached
```

4. **Reduce Logging:**
Edit `platform/wso2-am/am-conf/repository/conf/log4j2.properties`:
```properties
logger.root.level = WARN
```

### Emergency Procedures

#### Complete Reset

```bash
# 1. Stop all services
./stop.sh

# 2. Remove all containers and volumes
docker compose -f infra/docker-compose.yml down -v

# 3. Clean Docker system (except Portainer)
./docker-clean-up.sh

# 4. Rebuild from scratch
./start.sh
# Choose "all" and "build without cache"
```

#### Backup Before Reset

```bash
# Backup volumes
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine tar czf /backup/wso2_am_data_backup.tar.gz /data
docker run --rm -v wso2_is_data:/data -v $(pwd):/backup alpine tar czf /backup/wso2_is_data_backup.tar.gz /data

# Backup .env
cp .env .env.backup.$(date +%s)
```

#### Quick Restart

```bash
# Restart single service
docker restart wso2am

# Restart all services
docker compose -f infra/docker-compose.yml restart
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review logs for errors
- Check disk usage: `docker system df`
- Verify all health checks passing

**Monthly:**
- Clean unused images: `docker image prune -a`
- Clean build cache: `docker builder prune`
- Review and backup volumes

**As Needed:**
- Update WSO2 versions in `.env`
- Update Node.js dependencies
- Rebuild images after code changes

### Update Procedures

#### Update WSO2 Versions

```bash
# 1. Edit .env
APIM_VERSION=4.7.0
IS_VERSION=7.3.0
MI_VERSION=4.6.0
ICP_VERSION=1.3.0

# 2. Stop services
./stop.sh

# 3. Remove old images
docker image rm wso2am wso2is wso2mi wso2icp

# 4. Rebuild
./start.sh
# Choose "build without cache"
```

#### Update Application Code

**Backend Services:**
```bash
# 1. Update code in services/bank-api/src
# 2. Rebuild service
docker compose -f infra/docker-compose.yml build bank-api
# 3. Restart service
docker compose -f infra/docker-compose.yml up -d bank-api
```

**React App:**
```bash
# If using bind mount (dev mode), changes auto-reload
# Otherwise:
docker compose -f infra/docker-compose.yml build bank-app
docker compose -f infra/docker-compose.yml up -d bank-app
```

#### Update Dependencies

**Node.js Services:**
```bash
# 1. Update package.json
# 2. Rebuild (will run npm install)
docker compose -f infra/docker-compose.yml build --no-cache bank-api

# 3. Restart
docker compose -f infra/docker-compose.yml up -d bank-api
```

### Backup and Restore

#### Backup Persistent Data

**WSO2 Volumes:**
```bash
# API Manager data
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/wso2_am_data_$(date +%Y%m%d).tar.gz /data

# Identity Server data
docker run --rm -v wso2_is_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/wso2_is_data_$(date +%Y%m%d).tar.gz /data
```

**Configuration Files:**
```bash
# Backup .env
tar czf env_backup_$(date +%Y%m%d).tar.gz .env .env.sample

# Backup custom configs
tar czf configs_backup_$(date +%Y%m%d).tar.gz \
  platform/wso2-am/am-conf \
  platform/wso2-is/is-conf \
  platform/wso2-mi/mi-conf
```

#### Restore Data

**Restore WSO2 Volume:**
```bash
# 1. Stop service
docker compose -f infra/docker-compose.yml stop wso2am

# 2. Remove existing volume
docker volume rm wso2_am_data

# 3. Create new volume
docker volume create wso2_am_data

# 4. Restore data
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/wso2_am_data_20240128.tar.gz -C /

# 5. Start service
docker compose -f infra/docker-compose.yml up -d wso2am
```

**Restore Configuration:**
```bash
# Extract backup
tar xzf configs_backup_20240128.tar.gz

# Restart services
./stop.sh && ./start.sh
```

### Performance Tuning

#### JVM Tuning (WSO2 Services)

Edit Dockerfile or create custom `wso2server.sh`:

```bash
# Example: Increase heap size for API Manager
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC"
```

#### Database Tuning

For production, replace H2 with external database:

```yaml
# docker-compose.yml
environment:
  DB_TYPE: mysql
  DB_HOST: mysql-host
  DB_PORT: 3306
  DB_NAME: apim_db
  DB_USER: wso2carbon
  DB_PASSWORD: wso2carbon
```

#### Container Resource Limits

Add to docker-compose.yml:

```yaml
services:
  wso2am:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Monitoring Tools

### Recommended External Tools

**Portainer:**
- GUI for Docker management
- Install: `docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce`

**Grafana + Prometheus:**
- Metrics collection and visualization
- Requires additional configuration

**ELK Stack:**
- Log aggregation and analysis
- Ship logs from containers to Elasticsearch

### Built-in Monitoring

**Docker Events:**
```bash
docker events --filter type=container
```

**Container Processes:**
```bash
docker top wso2am
```

**Filesystem Changes:**
```bash
docker diff wso2am
```

## Useful Commands Reference

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh

# View logs (all services)
docker compose -f infra/docker-compose.yml logs -f

# View logs (specific service)
docker logs -f wso2am

# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Restart single service
docker restart wso2am

# Execute command in container
docker exec -it wso2am bash

# Copy file from container
docker cp wso2am:/home/wso2carbon/repository/logs/wso2carbon.log ./

# View resource usage
docker stats

# Clean unused resources
docker system prune -a

# Backup volume
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine tar czf /backup/wso2_am_data.tar.gz /data

# Restore volume
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine tar xzf /backup/wso2_am_data.tar.gz -C /
```
