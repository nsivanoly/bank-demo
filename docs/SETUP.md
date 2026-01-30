# Setup and Installation Guide

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Installation |
|----------|----------------|-------------|--------------|
| **Docker** | 20.10.0 | 24.0+ | [Get Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2.0.0 | v2.20+ | Included with Docker Desktop |
| **Bash** | 3.2+ | 4.0+ | Pre-installed on macOS/Linux |
| **curl** | Any | Latest | Pre-installed on most systems |

### System Requirements

#### Minimum
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk Space**: 10 GB free
- **OS**: macOS 10.15+, Linux (Ubuntu 20.04+, CentOS 8+), Windows 10+ with WSL2

#### Recommended
- **CPU**: 8 cores or more
- **RAM**: 16 GB or more
- **Disk Space**: 20 GB free (SSD preferred)
- **Network**: Stable internet for image pulls

### Port Requirements

Ensure the following ports are free:

**WSO2 Platform:**
- 9443 (API Manager HTTPS)
- 9444 (Identity Server HTTPS)
- 8243 (API Gateway HTTPS)
- 8253 (Micro Integrator HTTPS)
- 9743 (Integration Control Plane)

**Services:**
- 2001, 3443 (Bank API)
- 8081, 8443 (WebSocket)
- 8082 (GraphQL)

**Applications:**
- 3000 (React App)
- 7100, 7400 (PHP App)

**Check port availability:**
```bash
# macOS/Linux
lsof -i :9443
netstat -an | grep 9443

# If port is in use, either stop the process or change the port in .env
```

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd demo-setup-2026
```

### 2. Verify Prerequisites

```bash
# Check Docker
docker --version
# Should show: Docker version 20.10.0 or higher

# Check Docker Compose
docker compose version
# Should show: Docker Compose version v2.0.0 or higher

# Check if Docker daemon is running
docker ps
# Should list running containers or show empty table
```

### 3. Make Scripts Executable

```bash
chmod +x start.sh stop.sh docker-clean-up.sh monitor-setup.sh
```

### 4. Review Configuration (Optional)

```bash
# View default configuration
cat .env.sample

# Create .env for customization (optional, start.sh does this automatically)
cp .env.sample .env

# Edit if needed
nano .env
# or
vi .env
```

**Common customizations:**
- Change ports if defaults conflict
- Set `BUILD_PLATFORM=linux/arm64` for Apple Silicon
- Update passwords for shared environments

### 5. Start the Stack

The `start.sh` script provides an interactive way to start services with automatic configuration setup.

```bash
./start.sh
```

**Features:**
- ✅ Automatic `.env` file creation from `.env.sample`
- ✅ Automatic React app `.env` and `config.json` creation
- ✅ Automatic PHP app `config.php` creation
- ✅ Interactive service selection
- ✅ Build options (with cache, without cache, or skip)
- ✅ Clean start option to remove existing containers
- ✅ Status display after startup

**Interactive prompts:**

**Prompt 1: Service Selection**
```
🛠️  Available services:
  1) wso2is
  2) wso2am
  3) wso2icp
  4) wso2mi
  5) bank-api
  6) web-socket
  7) graphql
  8) bank-app
  9) php-app
  d) Default services [wso2am wso2icp wso2mi bank-api bank-app]
  a) All services

➡️ Enter service numbers (e.g. 1 3 5), 'd' for default, or 'a' for all (default: d):
```

**Options:**
- Press **Enter** or type **d** for default services (recommended for first run)
- Type **a** for all services
- Type specific numbers (e.g., **2 5 8**) for custom selection

**Prompt 2: Build Option**
```
⚙️  Choose build option:
  1) Build with cache
  2) Build without cache
  3) Skip build

➡️ Enter choice [1-3] (default 3):
```

**Options:**
- **3** (default): Skip build, use existing images (fastest)
- **1**: Build with cache (for code changes)
- **2**: Build without cache (for version changes or troubleshooting)

**First Run**: Use option **1** or **2** to build images

### 6. Wait for Startup

**Expected time:**
- First run: 5-10 minutes (image pulls + builds)
- Subsequent runs: 2-5 minutes
- Individual services: 1-3 minutes

**Monitor startup:**
```bash
# Watch all container logs
docker compose -f infra/docker-compose.yml logs -f

# Watch specific service
docker logs -f wso2am

# Check container status
docker ps
```

### 7. Verify Installation

**Check container health:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

All containers should show `healthy` status.

**Test services:**

```bash
# API Manager
curl -k https://localhost:9443/services/Version

# Identity Server (if started)
curl -k https://localhost:9444/oauth2/token/.well-known/openid-configuration

# Bank API
curl http://localhost:2001/accounts

# GraphQL
curl http://localhost:8082/health

# WebSocket
curl http://localhost:8081/health
```

**Access web interfaces:**

| Service | URL | Credentials |
|---------|-----|-------------|
| API Manager Publisher | https://localhost:9443/publisher | admin / admin |
| API Manager DevPortal | https://localhost:9443/devportal | admin / admin |
| Identity Server | https://localhost:9444/carbon | admin / admin |
| Integration CP | https://localhost:9743/login | admin / admin |
| React Bank App | https://localhost:3000 | OAuth2 login |
| PHP Bank App | http://localhost:7100 | OAuth2 login |
| Bank API Swagger | http://localhost:2001/api-docs | None |
| GraphQL Playground | http://localhost:8082/graphql | None |

## Post-Installation Steps

### 1. Verify Automated Setup

The following should be configured automatically:

**API Manager:**
- APIs deployed from `platform/wso2-am/am-data/`
- Gateway configured
- Identity Server registered as key manager

**Identity Server:**
- Demo users created (if IS was started)
- Groups and roles configured
- Example users: `ahmed.khalid`, `fatima.zahra`, etc.

**Verify in UI:**
1. Login to API Manager Publisher (https://localhost:9443/publisher)
2. Check if APIs are listed
3. Go to Admin Portal → Key Managers
4. Verify "WSO2IS72" key manager is present

### 2. Test OAuth2 Flow

```bash
# Access React app
open https://localhost:3000
# or
xdg-open https://localhost:3000

# Click "Sign In"
# Login with: admin / admin
# Should redirect back with access token
```

### 3. Test API Call

```bash
# Get account list
curl http://localhost:2001/accounts

# Create account
curl -X POST http://localhost:2001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "balance": 1000,
    "currency": "USD"
  }'
```

## Troubleshooting Installation

### Issue: Port Already in Use

**Error:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:9443: bind: address already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :9443

# Option 1: Stop conflicting process
kill -9 <PID>

# Option 2: Change port in .env
echo "APIM_HTTPS_PORT=9444" >> .env
```

### Issue: Out of Memory

**Symptoms:**
- Containers crash or restart frequently
- `docker ps` shows containers as `Restarting`
- Logs show `OutOfMemory` errors

**Solution:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory → 8GB or more

# Restart Docker daemon
# macOS: Docker Desktop → Restart
# Linux:
sudo systemctl restart docker
```

### Issue: Slow Startup

**Symptoms:**
- Containers stay in `starting` state for >10 minutes
- Health checks keep failing

**Solution:**
```bash
# Check logs for errors
docker logs wso2am

# Verify network connectivity
docker network inspect wso2net

# Restart with fresh state
./stop.sh
docker compose -f infra/docker-compose.yml down -v
./start.sh
```

### Issue: `.env` File Not Created

**Error:**
```
❌ ERROR: .env.sample file not found!
```

**Solution:**
```bash
# Verify you're in project root
pwd
# Should end in: demo-setup-2026

# Check if .env.sample exists
ls -la .env.sample

# If missing, repository may be incomplete
git pull origin main
```

### Issue: Permission Denied on Scripts

**Error:**
```
bash: ./start.sh: Permission denied
```

**Solution:**
```bash
chmod +x start.sh stop.sh docker-clean-up.sh
```

### Issue: Image Pull Failures

**Error:**
```
Error response from daemon: pull access denied for wso2/wso2am
```

**Solution:**
```bash
# Login to Docker Hub (if using rate-limited account)
docker login

# Or wait and retry (public rate limit)
./start.sh
```

### Issue: Build Failures

**Symptoms:**
- Build errors during `docker compose build`
- Missing dependencies

**Solution:**
```bash
# Clean Docker build cache
docker builder prune -af

# Rebuild without cache
./start.sh
# Select option 2 (build without cache)
```

## Platform-Specific Notes

### macOS
- **Apple Silicon (M1/M2/M3)**: Set `BUILD_PLATFORM=linux/arm64` in `.env`
- **Rosetta**: Some WSO2 images may run under Rosetta (slower but functional)
- **File System**: Uses osxfs for volume mounts (may be slower than Linux)

### Linux
- **Docker Installation**: Use official Docker repository, not snap
- **User Permissions**: Add user to `docker` group: `sudo usermod -aG docker $USER`
- **Firewall**: Ensure Docker network interface is allowed
- **File Permissions**: Volume-mounted files maintain host permissions

### Windows (WSL2)
- **WSL2 Required**: Docker Desktop must use WSL2 backend
- **File System**: Clone repository in WSL file system (`~/projects/`), not Windows (`/mnt/c/`)
- **Line Endings**: Set `git config core.autocrlf input` before cloning
- **Resources**: Allocate sufficient memory to WSL2 in `.wslconfig`

## Uninstallation

### Remove Containers and Images

```bash
# Stop all services
./stop.sh

# Remove containers, networks, and volumes
docker compose -f infra/docker-compose.yml down -v

# Remove images (optional)
docker rmi $(docker images -q 'wso2*-local')
```

### Complete Cleanup

```bash
# Nuclear option: removes ALL Docker resources except Portainer
./docker-clean-up.sh

# When prompted, type: yes
```

### Remove Repository

```bash
cd ..
rm -rf bank-demo
```

## Next Steps

After successful installation:

1. **Explore UI**: Navigate through API Manager Publisher, DevPortal, and Admin portals
2. **Review APIs**: Check deployed APIs in `platform/wso2-am/am-data/`
3. **Test Applications**: Try the React and PHP applications
4. **Read Documentation**: Review `ARCHITECTURE.md` and `OPERATIONS.md`
5. **Customize**: Modify configuration for your specific needs

## Getting Help

- **Check Logs**: `docker logs <container-name>`
- **Health Status**: `docker ps` and look for `(healthy)` status
- **Documentation**: Review `OPERATIONS.md` for troubleshooting
- **Community**: Search WSO2 documentation and forums
