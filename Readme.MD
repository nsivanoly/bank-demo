# WSO2 DevStack

> A comprehensive Docker-based development environment for WSO2 Identity Server, API Manager, Micro Integrator, and sample applications demonstrating OAuth2/OIDC authentication flows.

[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![WSO2 IS](https://img.shields.io/badge/WSO2_IS-7.2.0-FF7300?logo=wso2&logoColor=white)](https://wso2.com/identity-server/)
[![WSO2 APIM](https://img.shields.io/badge/WSO2_APIM-4.6.0-FF7300?logo=wso2&logoColor=white)](https://wso2.com/api-manager/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 📋 Overview

WSO2 DevStack is a fully containerized development and demo environment that showcases enterprise-grade Identity and Access Management (IAM) and API Management capabilities. It includes:

- **WSO2 Identity Server** - OAuth2/OIDC provider, user management, SCIM2 provisioning
- **WSO2 API Manager** - API gateway, publisher, developer portal
- **WSO2 Micro Integrator** - Integration runtime for mediation and orchestration
- **WSO2 Integration Control Plane** - Dashboard for managing integrators
- **3 Backend Services** - REST API, GraphQL, WebSocket
- **2 Frontend Apps** - React SPA and PHP web application

**Perfect for:**
- Learning WSO2 product suite
- Prototyping OAuth2/OIDC implementations
- API management demonstrations
- Integration pattern development
- Security testing and training

---

## 🚀 Quick Start

### Prerequisites

- **Docker**: 20.10+ with Docker Compose v2
- **System**: 8GB+ RAM, 4+ CPU cores, 20GB disk
- **OS**: macOS, Linux, or Windows with WSL2

### Start the Stack

```bash
# Clone the repository
git clone https://github.com/nsivanoly/bank-demo.git
cd bank-demo

# Start all services (interactive mode)
./start.sh
```

**Select:**
1. **Default services** (recommended for first run)
2. **Build with cache** (faster)

Wait 3-5 minutes for initialization to complete.

### Verify Deployment

```bash
# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# All services should show "healthy"
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Manager** | https://localhost:9443 | admin / admin |
| **Identity Server** | https://localhost:9444 | admin / admin |
| **Integration Control Plane** | https://localhost:9743 | admin / admin |
| **React App** | http://localhost:3000 | customer1@carbon.super / Pass@123 |
| **PHP App** | http://localhost:7100 | customer1@carbon.super / Pass@123 |
| **Bank API (Swagger)** | https://localhost:3443/api-docs | - |
| **GraphQL Playground** | http://localhost:8082/graphql | - |

---

## 📚 Documentation

Comprehensive documentation is available in dedicated files:

| Document | Description |
|----------|-------------|
| **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** | Complete project introduction, technology stack, design principles |
| **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | System architecture, component details, data flows, network topology |
| **[CONFIGURATION.md](docs/CONFIGURATION.md)** | Environment variables reference (137 variables documented) |
| **[SETUP.md](docs/SETUP.md)** | Detailed installation guide, prerequisites, troubleshooting |
| **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Docker compose orchestration, build process, container lifecycle |
| **[OPERATIONS.md](docs/OPERATIONS.md)** | Monitoring, logging, maintenance, backup procedures |
| **[SECURITY.md](docs/SECURITY.md)** | Authentication flows, OAuth2/OIDC, TLS, security best practices |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Host (localhost)               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Docker Network: wso2net (bridge)          │  │
│  │                                                        │  │
│  │  ┌──────────────┐      ┌──────────────┐                │  │
│  │  │   WSO2 IS    │◄────►│  WSO2 APIM   │                │  │
│  │  │    :9444     │      │    :9443     │                │  │
│  │  │ (IdP/KeyMgr) │      │  (Gateway)   │                │  │
│  │  └──────────────┘      └──────────────┘                │  │
│  │         ▲                                              │  │
│  │         │                                              │  │
│  │  ┌──────────────┐      ┌──────────────┐                │  │
│  │  │   WSO2 MI    │────► │   WSO2 ICP   │                │  │
│  │  │    :8253     │      │    :9743     │                │  │
│  │  └──────────────┘      └──────────────┘                │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Bank API   │  │   GraphQL    │  │  WebSocket   │  │  │
│  │  │  :2001/:3443 │  │    :8082     │  │ :8081/:8443  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────┐                    ┌──────────────┐  │  │
│  │  │  React App   │                    │   PHP App    │  │  │
│  │  │    :3000     │                    │ :7100/:7400  │  │  │
│  │  └──────────────┘                    └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Key Flows:**
1. User authenticates via WSO2 IS (OAuth2/OIDC)
2. Application receives access token
3. API requests go through WSO2 APIM gateway
4. Gateway validates tokens with IS
5. Backend services process authorized requests

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed diagrams and component descriptions.

---

## 🛠️ Project Structure

```
bank-demo/
├── 📁 apps/                        # Frontend applications
│   ├── 📁 bank-app/                # React + TypeScript SPA
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/      # React components
│   │   │   ├── 📁 pages/           # Page components  
│   │   │   ├── 📁 services/        # API clients
│   │   │   ├── 📁 types/           # TypeScript types
│   │   │   ├── ⚛️ app.tsx          # Main app entry
│   │   │   └── 🎨 app.css          # Styles
│   │   ├── 🐳 Dockerfile
│   │   ├── 📦 package.json
│   │   ├── ⚙️ webpack.config.js
│   │   └── 📝 tsconfig.json
│   │
│   └── 📁 php-app/                 # PHP 8 + Apache application
│       ├── 📁 src/
│       │   ├── 🐘 index.php        # Main page
│       │   ├── 🐘 login.php        # Login handler
│       │   ├── 🐘 callback.php     # OAuth callback
│       │   └── 🐘 logout.php       # Logout handler
│       ├── 🐳 Dockerfile
│       └── 🐳 docker-compose.yml
│
├── 📁 services/                    # Backend microservices
│   ├── 📁 bank-api/                # Express REST API with Swagger
│   │   ├── 📁 src/
│   │   │   ├── 📁 Routes/          # API routes
│   │   │   └── 📁 Data/            # Mock data
│   │   ├── 📄 index.js
│   │   ├── 📦 package.json
│   │   └── 🐳 Dockerfile
│   │
│   ├── 📁 graphql/                 # Apollo GraphQL server
│   │   ├── 📁 data/
│   │   │   └── 📄 schema.js        # GraphQL schema
│   │   ├── 📄 server.js
│   │   ├── 📦 package.json
│   │   └── 🐳 Dockerfile
│   │
│   └── 📁 web-socket/              # WebSocket service
│       ├── 📄 index.js
│       ├── 📦 package.json
│       ├── 🩺 healthcheck.sh
│       └── 🐳 Dockerfile
│
├── 📁 platform/                    # WSO2 products
│   ├── 📁 wso2-am/                 # API Manager
│   │   ├── 📁 am-conf/             # Configuration files
│   │   ├── 📁 am-data/             # API definitions
│   │   ├── 📁 container-init/      # Setup scripts
│   │   └── 🐳 Dockerfile
│   │
│   ├── 📁 wso2-is/                 # Identity Server
│   │   ├── 📁 is-conf/             # Configuration files
│   │   ├── 📁 container-init/      # User setup scripts
│   │   └── 🐳 Dockerfile
│   │
│   ├── 📁 wso2-mi/                 # Micro Integrator
│   │   ├── 📁 mi-conf/             # Configuration files
│   │   └── 🐳 Dockerfile
│   │
│   └── 📁 wso2-icp/                # Integration Control Plane
│       └── 🐳 Dockerfile
│
├── 📁 infra/                       # Infrastructure
│   ├── 🐳 docker-compose.yml       # Service orchestration
│   └── 📁 certs/                   # TLS certificates
│
├── 📁 docs/                        # Documentation
│   ├── 📚 PROJECT_OVERVIEW.md      # Project introduction
│   ├── 🏗️ ARCHITECTURE.md          # System architecture
│   ├── ⚙️ CONFIGURATION.md         # Environment variables
│   ├── 🚀 SETUP.md                 # Installation guide
│   ├── 🐳 DEPLOYMENT.md            # Docker orchestration
│   ├── 🔧 OPERATIONS.md            # Monitoring & maintenance
│   └── 🔐 SECURITY.md              # Security best practices
│
├── 🚀 start.sh                     # Start script
├── 🛑 stop.sh                      # Stop script
├── 📊 monitor-setup.sh             # Monitoring script
├── 🧹 docker-clean-up.sh           # Cleanup script
├── 📋 .env.sample                  # Environment template
└── 📖 Readme.MD                    # This file
```

---

## 💻 Common Commands

### Service Management

```bash
# Start all services
./start.sh

# Start specific services
./start.sh
# Select: 2 5 8 (for wso2am, web-socket, bank-app)

# Monitor container status
./monitor-setup.sh

# Continuous monitoring (watch mode)
./monitor-setup.sh --watch

# Check recent errors
./monitor-setup.sh --logs

# Stop all services
./stop.sh

# View logs (all services)
docker compose -f infra/docker-compose.yml logs -f

# View logs (specific service)
docker logs -f wso2am

# Restart single service
docker restart wso2am

# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Development

```bash
# Rebuild specific service
docker compose -f infra/docker-compose.yml build bank-api

# Rebuild without cache
docker compose -f infra/docker-compose.yml build --no-cache

# Execute command in container
docker exec -it wso2am bash

# View container stats
docker stats
```

### Version Upgrades

```bash
# 1. Edit .env to update versions
vi .env

# 2. Stop services
./stop.sh

# 3. Rebuild without cache
./start.sh
# Choose option 2 "Build without cache"

# 4. Monitor logs
./monitor-setup.sh --watch
```

See [OPERATIONS.md](docs/OPERATIONS.md#update-procedures) for detailed upgrade procedures.

### Maintenance

```bash
# Clean Docker system (preserves Portainer)
./docker-clean-up.sh

# Remove containers and volumes
docker compose -f infra/docker-compose.yml down -v

# Backup volume
docker run --rm -v wso2_am_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/wso2_am_data_backup.tar.gz /data
```

---

## 🔧 Configuration

### Environment Variables

The stack uses 137 environment variables organized in 16 categories:

- Global settings (domain, platform)
- WSO2 product versions
- Service hostnames
- Port mappings (HTTP/HTTPS for all services)
- Admin credentials
- Key manager configuration
- Gateway endpoints
- Microservices URLs
- Application settings

**Setup:**
```bash
# Copy template (done automatically by start.sh)
cp .env.sample .env

# Edit as needed
vim .env
```

See [CONFIGURATION.md](docs/CONFIGURATION.md) for complete reference.

### Default Ports

| Service | HTTP | HTTPS | Description |
|---------|------|-------|-------------|
| WSO2 IS | - | 9444 | Identity Server |
| WSO2 APIM | - | 9443 | API Manager |
| WSO2 MI | - | 8253 | Micro Integrator |
| WSO2 ICP | - | 9743 | Integration Control Plane |
| Bank API | 2001 | 3443 | REST API |
| GraphQL | 8082 | - | GraphQL endpoint |
| WebSocket | 8081 | 8443 | WebSocket service |
| React App | 3000 | - | Frontend SPA |
| PHP App | 7100 | 7400 | PHP application |

---

## 👥 Demo Users

The stack includes 10 pre-configured demo users with different roles and group memberships. Use these credentials to test authentication flows and access different features.

### Admin Account
| Username | Password | Services |
|----------|----------|----------|
| **admin** | **admin** | All WSO2 services (IS, APIM, MI, ICP) |

### Demo Users

| First Name | Last Name | Username | Password | Groups | Roles | Email |
|-----------|----------|----------|----------|--------|-------|-------|
| Ahmed | Khalid | `ahmed.khalid` | `aBcd!23#` | Employees | api-admin | ahmed.khalid@demo.me |
| Fatima | Zahra | `fatima.zahra` | `Xyz@456!` | Employees | api-admin | fatima.zahra@demo.me |
| Omar | Haddad | `omar.haddad` | `Pass@789#` | Employees | api-dev | omar.haddad@demo.me |
| Laila | Hassan | `laila.hassan` | `Pwd@135!` | Employees | api-ops | laila.hassan@demo.me |
| Karim | Nasser | `karim.nasser` | `Safe@246#` | Employees, Sandbox | api-dev | karim.nasser@demo.me |
| Sara | Alhassan | `sara.alhassan` | `Code@864!` | Employees | api-dev | sara.alhassan@demo.me |
| Ziad | Farouk | `ziad.farouk` | `Ops@975#` | Partners, Sandbox | api-ops | ziad.farouk@demo.me |
| Rania | Samir | `rania.samir` | `Help@531!` | Partners, Auditors | support-analyst | rania.samir@demo.me |
| Yusuf | Mansour | `yusuf.mansour` | `View@864#` | Customers | read-only | yusuf.mansour@demo.me |
| Noura | Qasim | `noura.qasim` | `Read@753!` | Customers, Auditors | read-only | noura.qasim@demo.me |

**Usage Examples:**

```bash
# Login to React app with customer user
Username: yusuf.mansour
Password: View@864#
```

---

## 🔐 Security Notice

**⚠️ This is a development/demo environment only!**

Current configuration includes:
- Self-signed TLS certificates
- Default admin credentials
- H2 in-memory databases
- Relaxed CORS policies
- No rate limiting on some services

**For production deployment:**
- Use CA-signed certificates
- Change all default credentials
- Replace H2 with PostgreSQL/MySQL
- Implement proper CORS policies
- Enable rate limiting and throttling
- Use secrets management (Vault, AWS Secrets Manager)
- Implement monitoring and alerting
- Review security checklist in [SECURITY.md](docs/SECURITY.md)

---

## 🐛 Troubleshooting

### Services won't start

**Check Docker resources:**
```bash
docker system df
```

**Solution:** Ensure 8GB+ RAM and 20GB+ disk available

### Port conflicts

**Find process using port:**
```bash
lsof -i :9443
```

**Solution:** Stop conflicting service or change port in `.env`

### Health checks failing

**Manual health check:**
```bash
curl -k https://localhost:9443/services/Version
```

**Solution:** Wait longer (up to 5 minutes for initial startup) or check logs

### Authentication errors

**Verify IS is running:**
```bash
docker ps | grep wso2is
curl -k https://localhost:9444/oauth2/token/.well-known/openid-configuration
```

**Solution:** Ensure IS starts before APIM. Restart with: `./stop.sh && ./start.sh`

See [OPERATIONS.md](docs/OPERATIONS.md) for comprehensive troubleshooting guide.

---

## 📊 System Requirements

### Minimum
- **CPU:** 4 cores
- **RAM:** 8GB
- **Disk:** 20GB free space
- **Docker:** 20.10+
- **Docker Compose:** v2.x

### Recommended
- **CPU:** 6+ cores
- **RAM:** 16GB
- **Disk:** 50GB SSD
- **Network:** Stable internet for image downloads

### Platform-Specific Notes

**macOS:**
- Docker Desktop required
- Increase resources: Docker → Settings → Resources
- Use `:cached` volume mounts for performance

**Linux:**
- Docker Engine + Docker Compose plugin
- User must be in `docker` group: `sudo usermod -aG docker $USER`

**Windows:**
- WSL2 required
- Docker Desktop with WSL2 integration
- Run commands in WSL2 terminal

---

## 🧪 Testing the Stack

### 1. Test Authentication Flow

```bash
# Open React app
open http://localhost:3000

# Click "Login"
# Use: customer1@carbon.super / Pass@123
# Should redirect to IS, then back after login
```

### 2. Test API Gateway

```bash
# Access Bank API via Gateway
curl -k https://localhost:9443/bank/accounts

# View API in DevPortal
open https://localhost:9443/devportal
```

### 3. Test GraphQL

```bash
# Query GraphQL endpoint
curl http://localhost:8082/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

### 4. Test WebSocket

```bash
# Connect via wscat (install: npm i -g wscat)
wscat -c ws://localhost:8081
```

---

## 🔄 Initialization Process

When services start, automatic initialization occurs:

1. **WSO2 IS** - Creates demo users, groups, roles via SCIM2
2. **WSO2 APIM** - Registers IS as key manager, deploys sample APIs
3. **Applications** - Registers OAuth2 clients for React/PHP apps
4. **Marker Files** - Prevents re-initialization on restart

**Re-initialize:**
```bash
# Remove containers and volumes
docker compose -f infra/docker-compose.yml down -v

# Start fresh
./start.sh
```

---

## 📦 What's Included

### WSO2 Products
- ✅ Identity Server 7.2.0 (OAuth2/OIDC provider)
- ✅ API Manager 4.6.0 (Gateway + Publisher + DevPortal)
- ✅ Micro Integrator 4.5.0 (ESB/Integration runtime)
- ✅ Integration Control Plane 1.2.0 (MI dashboard)

### Backend Services
- ✅ Bank API - REST API with Swagger documentation
- ✅ GraphQL Server - Apollo Server with sample schema
- ✅ WebSocket Service - Real-time communication server

### Frontend Applications
- ✅ React App - TypeScript SPA with OAuth2 PKCE flow
- ✅ PHP App - Server-rendered app with OAuth2 standard flow

### Infrastructure
- ✅ Docker Compose orchestration
- ✅ Custom health checks per service
- ✅ Persistent volumes for data
- ✅ Bridge network for inter-service communication
- ✅ Automated initialization scripts

---

## 🎯 Use Cases

### For Developers
- Learn OAuth2/OIDC implementation
- Test API management features
- Prototype integration patterns
- Develop against WSO2 APIs

### For Architects
- Design authentication flows
- Evaluate WSO2 product suite
- Plan API gateway architecture
- Test security patterns

### For DevOps
- Practice container orchestration
- Learn WSO2 deployment
- Test monitoring solutions
- Implement CI/CD pipelines

### For Security Teams
- Analyze authentication flows
- Test OAuth2 vulnerabilities
- Review security configurations
- Audit access patterns

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

This project is licensed under the Apache License 2.0 - see [LICENSE](LICENSE) file for details.

WSO2 products are licensed separately. See:
- [WSO2 Identity Server License](https://wso2.com/licenses/)
- [WSO2 API Manager License](https://wso2.com/licenses/)

---

## 🔗 Resources

### Official Documentation
- [WSO2 Identity Server Docs](https://is.docs.wso2.com/)
- [WSO2 API Manager Docs](https://apim.docs.wso2.com/)
- [WSO2 Micro Integrator Docs](https://mi.docs.wso2.com/)

### Community
- [WSO2 Discord](https://discord.com/invite/wso2)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/wso2)
- [WSO2 Blog](https://wso2.com/blogs/)

### Related Projects
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Support

- **Documentation Issues**: Open an issue in this repository
- **Community Help**: [WSO2 Discord](https://discord.com/invite/wso2)

---

## ⭐ Acknowledgments

Built with:
- [WSO2](https://wso2.com/) - Identity and API management platform
- [Docker](https://www.docker.com/) - Containerization platform
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [React](https://reactjs.org/) - UI library
- [Express](https://expressjs.com/) - Web framework
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL server

---

<div align="center">

**Made with ❤️ for the WSO2 Community**

</div>
