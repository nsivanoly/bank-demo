# Configuration Reference

## Overview

All configuration for WSO2 DevStack is managed through environment variables defined in the `.env` file located in the project root. If the `.env` file doesn't exist, the `start.sh` script automatically creates it from `.env.sample`.

## Configuration File Structure

### File Locations
- **Template**: `.env.sample` (version controlled, default values)
- **Active Config**: `.env` (gitignored, user-specific)
- **Docker Compose**: `infra/docker-compose.yml` (references `.env` variables)

### Configuration Sections

## 1. Global Configuration

```bash
HOST_DOMAIN=localhost
BUILD_PLATFORM=linux/amd64
WSO2_SERVER_HOME=/home/wso2carbon
```

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST_DOMAIN` | `localhost` | Domain for external access (used in OAuth callbacks) |
| `BUILD_PLATFORM` | `linux/amd64` | Docker build platform (`linux/amd64` or `linux/arm64` for Apple Silicon) |
| `WSO2_SERVER_HOME` | `/home/wso2carbon` | Base directory inside WSO2 containers |

**Notes**:
- Change `BUILD_PLATFORM` to `linux/arm64` for Apple Silicon Macs
- `HOST_DOMAIN` affects OAuth2 redirect URIs in frontend apps

## 2. WSO2 Product Versions

```bash
APIM_VERSION=4.6.0
MI_VERSION=4.5.0
IS_VERSION=7.2.0
ICP_VERSION=1.2.0
CUSTOM_APP_VERSION=1.0.0
```

| Variable | Default | Description |
|----------|---------|-------------|
| `APIM_VERSION` | `4.6.0` | WSO2 API Manager version |
| `MI_VERSION` | `4.5.0` | WSO2 Micro Integrator version |
| `IS_VERSION` | `7.2.0` | WSO2 Identity Server version |
| `ICP_VERSION` | `1.2.0` | Integration Control Plane version |
| `CUSTOM_APP_VERSION` | `1.0.0` | Tag for custom service images |

**Version Compatibility**:
- APIM 4.6.0 works with IS 7.2.0 as key manager
- MI 4.5.0 is compatible with ICP 1.2.0
- Always check WSO2 compatibility matrix when changing versions

**Changing Versions**:
```bash
# 1. Edit .env file
APIM_VERSION=4.7.0
IS_VERSION=7.3.0

# 2. Stop existing services
./stop.sh

# 3. Rebuild and start
./start.sh
# Select build option 2 (without cache)
```

## 3. WSO2 Home Paths

```bash
WSO2_BASE_HOME=/home/wso2carbon
WSO2_MI_HOME=${WSO2_BASE_HOME}/wso2mi-${MI_VERSION}
WSO2_APIM_HOME=${WSO2_BASE_HOME}/wso2am-${APIM_VERSION}
WSO2_IS_HOME=${WSO2_BASE_HOME}/wso2is-${IS_VERSION}
WSO2_ICP_HOME=${WSO2_BASE_HOME}/wso2-integration-control-plane-${ICP_VERSION}
```

These are internal container paths constructed from versions. Do not modify unless you have custom base images.

## 4. Service Hostnames

```bash
APIM_HOSTNAME=wso2am
IS_HOSTNAME=wso2is
ICP_HOSTNAME=wso2icp
MI_HOSTNAME=wso2mi
BANK_API_HOSTNAME=bank-api
PHP_APP_HOSTNAME=php-app
BANK_APP_HOSTNAME=bank-app
WSO2_WS_HOSTNAME=web-socket
GRAPHQL_HOSTNAME=graphql
```

These are Docker service names used for internal communication. Change only if you need custom service names.

## 5. WSO2 API Manager Configuration

```bash
APIM_HTTPS_PORT=9443
APIM_HTTP_PORT=8280
APIM_HTTPS_PASSTHROUGH=8243
APIM_WSS_PORT=8099
APIM_WS_PORT=9099
APIM_HOST=https://${APIM_HOSTNAME}:${APIM_HTTPS_PORT}
APIM_USERNAME=admin
APIM_PASSWORD=admin
APIM_ENV_NAME=dev
```

| Variable | Default | Description |
|----------|---------|-------------|
| `APIM_HTTPS_PORT` | `9443` | HTTPS port for Publisher/DevPortal/Admin portals |
| `APIM_HTTP_PORT` | `8280` | HTTP gateway port (usually not exposed) |
| `APIM_HTTPS_PASSTHROUGH` | `8243` | HTTPS gateway port for API requests |
| `APIM_WSS_PORT` | `8099` | WebSocket Secure port |
| `APIM_WS_PORT` | `9099` | WebSocket port |
| `APIM_USERNAME` | `admin` | Admin username |
| `APIM_PASSWORD` | `admin` | Admin password |
| `APIM_ENV_NAME` | `dev` | Environment name for apictl |

**Important Ports**:
- **9443**: Access Publisher at `https://localhost:9443/publisher`
- **8243**: APIs are exposed at `https://localhost:8243/<api-context>`

## 6. WSO2 Identity Server Configuration

```bash
IS_HTTPS_PORT=9444
IS_HTTP_PORT=9763
IS_HOST=https://${IS_HOSTNAME}:${IS_HTTPS_PORT}
IS_USERNAME=admin
IS_PASSWORD=admin
```

| Variable | Default | Description |
|----------|---------|-------------|
| `IS_HTTPS_PORT` | `9444` | HTTPS port for Carbon console |
| `IS_HTTP_PORT` | `9763` | HTTP port (not exposed by default) |
| `IS_USERNAME` | `admin` | Admin username |
| `IS_PASSWORD` | `admin` | Admin password |

**Access**: Carbon console at `https://localhost:9444/carbon`

## 7. Integration Control Plane Configuration

```bash
ICP_HTTPS_PORT=9743
ICP_HOST=https://${ICP_HOSTNAME}:${ICP_HTTPS_PORT}
ICP_USERNAME=admin
ICP_PASSWORD=admin
```

**Access**: ICP dashboard at `https://localhost:9743/login`

## 8. Micro Integrator Configuration

```bash
MI_HTTPS_PORT=8253
MI_HTTP_PORT=8290
MI_LIVENESS=9164
```

| Variable | Default | Description |
|----------|---------|-------------|
| `MI_HTTPS_PORT` | `8253` | HTTPS management API port |
| `MI_HTTP_PORT` | `8290` | HTTP port for proxy services |
| `MI_LIVENESS` | `9164` | Liveness probe port (internal) |

## 9. Key Manager Configuration

```bash
KEY_MANAGER_NAME=WSO2IS72
KEY_MANAGER_TYPE=WSO2-IS-7
KEY_MANAGER_DISPLAY_NAME=WSO2 IS 7.2
KEY_MANAGER_NAME_KM=:"Resident Key Manager"
```

These settings are used by the `setup-keymanager.sh` script to register Identity Server as a key manager in API Manager.

## 10. Gateway Configuration

```bash
GATEWAY_NAME=Demo-Gateway
GATEWAY_DISPLAY_NAME=Demo Gateway
GATEWAY_TYPE=hybrid
GATEWAY_MODE=WRITE_ONLY
GATEWAY_VHOST_HOST=demo.wso2.com
```

Used by `setup-gateway.sh` for gateway configuration in API Manager.

## 11. Bank API Service

```bash
BANK_API_HTTP_PORT=2001
BANK_API_HTTPS_PORT=3443
BANK_API_HOST=${HOST_DOMAIN}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `BANK_API_HTTP_PORT` | `2001` | HTTP port for Bank API |
| `BANK_API_HTTPS_PORT` | `3443` | HTTPS port for Bank API |

**Access**: 
- HTTP: `http://localhost:2001/accounts`
- HTTPS: `https://localhost:3443/accounts`
- Swagger: `http://localhost:2001/api-docs`

## 12. Frontend Applications

```bash
REACT_PORT=3000
PHP_HTTP_PORT=7100
PHP_HTTPS_PORT=7400
```

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_PORT` | `3000` | React app HTTPS port |
| `PHP_HTTP_PORT` | `7100` | PHP app HTTP port |
| `PHP_HTTPS_PORT` | `7400` | PHP app HTTPS port |

**Access**:
- React: `https://localhost:3000`
- PHP: `http://localhost:7100` or `https://localhost:7400`

## 13. React App Configuration

```bash
APP_NAME=BankingFrontendAppReact
APP_DESC=Banking Frontend Single Page Application React
FRONTEND_URL=https://${HOST_DOMAIN}:3000
CALLBACK_URL=${FRONTEND_URL}
LOGOUT_URL=${FRONTEND_URL}
APP_TIER=Unlimited
```

Used by `container-init/setup-app.sh` for OAuth2 client registration.

## 14. PHP App Configuration

```bash
APP_NAME_PHP=BankingFrontendAppPHP
APP_DESC_PHP=Banking Frontend PHP Application
CONFIG_FILE_PHP=/var/www/html/includes/config.php
```

## 15. Microservices Ports

```bash
WS_PORT=8081
WS_TLS_PORT=8443
GRAPHQL_PORT=8082
```

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PORT` | `8081` | WebSocket service port |
| `WS_TLS_PORT` | `8443` | WebSocket TLS port |
| `GRAPHQL_PORT` | `8082` | GraphQL service port |

## 16. Internal Configuration

```bash
API_DEFINITIONS_PATH=${WSO2_SERVER_HOME}/am-data
SETUP_SCRIPT=/app/container-init/setup-app.sh
CONFIG_FILE=/app/src/config.json
MAX_RETRY=50
RETRY_INTERVAL=10
INIT_MARKER_DIR=.
```

These variables are used internally by initialization scripts. Modify only if you understand their impact.

## Configuration Best Practices

### Development
- Use default ports unless conflicts exist
- Keep default credentials (`admin/admin`)
- Use `BUILD_PLATFORM=linux/amd64` (or `linux/arm64` for Apple Silicon)

### Port Conflicts
If ports are already in use:
```bash
# Check port usage
lsof -i :9443
netstat -an | grep 9443

# Change in .env
APIM_HTTPS_PORT=9444
```

### Security
For any shared or non-local environment:
- Change all `admin/admin` passwords
- Update OAuth2 client secrets
- Use proper TLS certificates (not self-signed)
- Restrict network access

### Version Upgrades
When upgrading WSO2 products:
1. Review WSO2 release notes for breaking changes
2. Backup persistent volumes
3. Update version variables
4. Rebuild without cache
5. Test functionality thoroughly

## Environment Variable Precedence

1. **Docker Compose**: Reads from `.env` file
2. **Shell Environment**: Can override with `export VAR=value`
3. **Defaults in Compose**: Fallback values like `${VAR:-default}`

## Troubleshooting Configuration

### Config Not Applied
```bash
# Ensure .env file exists
ls -la .env

# Restart services
./stop.sh && ./start.sh
```

### Port Already in Use
```bash
# Find process using port
lsof -i :9443

# Kill process or change port in .env
APIM_HTTPS_PORT=9444
```

### Version Mismatch
```bash
# Check running image versions
docker images | grep wso2

# Rebuild with correct version
# Edit .env first
./start.sh
# Select build option 2 (without cache)
```
