# WSO2 DevStack - Project Overview

## Purpose

WSO2 DevStack is a fully containerized development and demonstration environment for the WSO2 platform ecosystem. It provides a complete stack including WSO2 API Manager, Identity Server, Micro Integrator, and Integration Control Plane, along with sample applications and backend services to demonstrate OAuth2/OIDC flows, API management, and integration patterns.

## Target Audience

- **Developers**: Building applications that integrate with WSO2 products
- **Solution Architects**: Designing WSO2-based solutions
- **DevOps Engineers**: Setting up WSO2 environments
- **QA Engineers**: Testing API and identity integrations
- **Consultants**: Demonstrating WSO2 capabilities

## Technology Stack

### WSO2 Products
- **API Manager** (APIM) - Default v4.6.0 - API gateway and lifecycle management
- **Identity Server** (IS) - Default v7.2.0 - OAuth2/OIDC identity provider
- **Micro Integrator** (MI) - Default v4.5.0 - ESB and mediation
- **Integration Control Plane** (ICP) - Default v1.2.0 - MI monitoring

### Backend Services
- **Bank API** - Node.js 18 + Express - Mock REST API with Swagger
- **WebSocket Service** - Node.js 18 + ws library - Real-time communication
- **GraphQL Service** - Node.js 18 + Apollo Server - GraphQL API with Star Wars schema

### Frontend Applications
- **React Bank App** - React 18 + TypeScript - SPA with OAuth2 integration
- **PHP Bank App** - PHP 8 + Apache - Server-rendered app with OAuth2

### Infrastructure
- **Docker** 20.10+ - Containerization
- **Docker Compose** v2.x - Multi-container orchestration
- **Bash Scripts** - Automation and management

## Key Features

### 1. One-Command Deployment
Interactive `start.sh` script with service selection and build options.

### 2. Environment Configuration
Centralized `.env` file for all configuration with automatic creation from `.env.sample`.

### 3. Automated Setup Scripts
- **API Manager**: Automatic API deployment, gateway configuration, key manager registration
- **Identity Server**: Automatic user, group, and role creation via SCIM2 API
- **Applications**: Automatic OAuth2 client registration

### 4. Health Checks
All services include health checks with appropriate retry and timeout configurations.

### 5. Persistent Data
Named volumes for WSO2 Identity Server and API Manager data persistence.

### 6. TLS Support
SSL certificates mounted from `infra/certs/` for secure communication.

## Use Cases

### Development
- Local WSO2 platform for developing API integrations
- Testing OAuth2/OIDC flows
- Debugging API policies and mediation sequences

### Testing
- Pre-configured environment for integration testing
- Automated setup reduces test environment prep time
- Consistent configuration across test runs

### Demonstrations
- Quick platform demonstrations for customers
- Show OAuth2/OIDC authentication flows
- Demonstrate API management capabilities

### Learning
- Hands-on exploration of WSO2 products
- Understanding integration patterns
- OAuth2/OIDC flow experimentation

## Project Structure Philosophy

The project follows a modular monorepo structure:

- **`apps/`** - Frontend applications with their own build contexts
- **`services/`** - Backend microservices with independent lifecycles
- **`platform/`** - WSO2 product customizations and initialization scripts
- **`infra/`** - Infrastructure as code (Docker Compose) and shared resources
- **Root scripts** - User-facing management scripts (start, stop, cleanup)

## Design Principles

1. **Self-Contained**: Everything needed to run the stack is included
2. **Idempotent**: Setup scripts can be safely re-run
3. **Configurable**: Environment-based configuration without code changes
4. **Production-Like**: Uses official WSO2 Docker images
5. **Developer-Friendly**: Clear logs, health checks, and error messages

## System Requirements

### Minimum
- CPU: 4 cores
- RAM: 8GB
- Disk: 10GB free space
- OS: macOS, Linux, or Windows with WSL2

### Recommended
- CPU: 8 cores
- RAM: 16GB
- Disk: 20GB free space
- SSD storage for better performance

## Getting Started

```bash
# Clone repository
git clone https://github.com/nsivanoly/bank-demo.git
cd bank-demo

# Make scripts executable
chmod +x start.sh stop.sh docker-clean-up.sh

# Start with defaults
./start.sh
```

Default services started:
- wso2am (API Manager)
- wso2icp (Integration Control Plane)
- wso2mi (Micro Integrator)
- bank-api (REST API)
- bank-app (React application)

## Success Indicators

After successful startup:

1. **Containers Running**: `docker ps` shows all selected containers as healthy
2. **API Manager**: https://localhost:9443/publisher accessible
3. **Identity Server**: https://localhost:9444/carbon accessible (if selected)
4. **Bank API**: http://localhost:2001/accounts returns JSON response
5. **React App**: https://localhost:3000 loads successfully

## Support and Documentation

- **Architecture**: See `ARCHITECTURE.md` for system design
- **Configuration**: See `CONFIGURATION.md` for environment variables
- **Deployment**: See `DEPLOYMENT.md` for Docker details
- **Security**: See `SECURITY.md` for authentication setup
- **Operations**: See `OPERATIONS.md` for troubleshooting
