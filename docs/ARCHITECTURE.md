# System Architecture

## Architecture Overview

WSO2 DevStack implements a layered microservices architecture with containerized components orchestrated by Docker Compose.

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host (localhost)              │
│                                                         │
│  ┌────────────────────────────────────────────────── ┐  │
│  │          WSO2 Platform Services Layer             │  │
│  │                                                   │  │
│  │  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │  │   Identity   │  │     API Manager           │  │  │
│  │  │   Server     │◄─┤  - Publisher :9443        │  │  │
│  │  │   (IS)       │  │  - DevPortal              │  │  │
│  │  │   :9444      │  │  - Admin Portal           │  │  │
│  │  │              │  │  - Gateway :8243          │  │  │
│  │  │  OAuth2/OIDC │  │  - WebSocket :8099/9099   │  │  │
│  │  └──────────────┘  └───────────────────────────┘  │  │
│  │                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │  Micro       │  │ Integration  │               │  │
│  │  │  Integrator  │─►│ Control Plane│               │  │
│  │  │  (MI)        │  │  (ICP)       │               │  │
│  │  │  :8253       │  │  :9743       │               │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └───────────────────────────────────────────────────┘  │
│                          ▲                              │
│                          │ API Calls                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Backend Services Layer                   │   │
│  │  ┌──────────┬───────────────┬──────────────────┐ │   │
│  │  │Bank API  │ WebSocket API │  GraphQL API     │ │   │
│  │  │:2001     │ :8081/:8443   │  :8082           │ │   │
│  │  │:3443     │               │                  │ │   │
│  │  │Express   │ ws library    │  Apollo Server   │ │   │
│  │  │Swagger   │ Notifications │  Star Wars Schema│ │   │
│  │  └──────────┴───────────────┴──────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▲                              │
│                          │ HTTP/WS/GraphQL              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Frontend Applications Layer              │   │
│  │  ┌──────────────────┬─────────────────────────┐  │   │
│  │  │  React Bank App  │   PHP Bank App          │  │   │
│  │  │  :3000           │   :7100 (HTTP)          │  │   │
│  │  │                  │   :7400 (HTTPS)         │  │   │
│  │  │  TypeScript SPA  │   Server-Rendered       │  │   │
│  │  │  OAuth2 Client   │   OAuth2 Client         │  │   │
│  │  └──────────────────┴─────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Infrastructure Layer                  │   │
│  │  - Docker Network: wso2net (bridge)              │   │
│  │  - Volumes: wso2_is_data, wso2_am_data           │   │
│  │  - Shared Certs: infra/certs/                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### WSO2 Identity Server (wso2is)
- **Base Image**: `wso2/wso2is:7.2.0` (configurable)
- **Container**: `wso2is`
- **Ports**: 9444 (HTTPS), 9763 (HTTP)
- **Function**: OAuth2/OIDC provider, user management, key manager for APIM
- **Initialization**: Automated user, group, and role creation via SCIM2 API
- **Health Check**: OAuth2 well-known endpoint
- **Data**: Persistent volume at `/home/wso2carbon`

### WSO2 API Manager (wso2am)
- **Base Image**: `wso2/wso2am:4.6.0` (configurable)
- **Container**: `wso2am`
- **Ports**: 
  - 9443 (HTTPS - Publisher/DevPortal/Admin)
  - 8243 (HTTPS passthrough for APIs)
  - 8280 (HTTP passthrough)
  - 8099 (WSS)
  - 9099 (WS)
- **Function**: API gateway, lifecycle management, policy enforcement
- **Initialization**: 
  - API deployment from `am-data/` directory
  - Gateway configuration
  - Key manager registration (IS integration)
- **Health Check**: `/services/Version` endpoint
- **Data**: Persistent volume at `/home/wso2carbon`

### WSO2 Micro Integrator (wso2mi)
- **Base Image**: `wso2/wso2mi:4.5.0` (configurable)
- **Container**: `wso2mi`
- **Ports**: 8253 (HTTPS), 8290 (HTTP), 9164 (liveness)
- **Function**: ESB, mediation, integration flows
- **Health Check**: Liveness probe endpoint
- **Configuration**: Mounted from `platform/wso2-mi/mi-conf/`

### WSO2 Integration Control Plane (wso2icp)
- **Base Image**: `wso2/wso2-integration-control-plane:1.2.0` (configurable)
- **Container**: `wso2icp`
- **Port**: 9743 (HTTPS)
- **Function**: Monitoring and management for Micro Integrator
- **Health Check**: Favicon endpoint

### Bank API Service (bank-api)
- **Base Image**: `node:18`
- **Container**: `wso2-bank-api`
- **Ports**: 2001 (HTTP), 3443 (HTTPS)
- **Technology**: Express.js, Swagger UI, lowdb
- **Function**: Mock banking REST API with CRUD operations
- **Endpoints**:
  - `/accounts` - Account management
  - `/api-docs` - Swagger documentation
- **Health Check**: `/accounts` endpoint

### WebSocket Service (web-socket)
- **Base Image**: `node:18`
- **Container**: `wso2-web-socket-api`
- **Ports**: 8081 (WS), 8443 (WSS)
- **Technology**: ws library
- **Function**: Real-time notifications and chat rooms
- **Endpoints**:
  - `/notifications` - Push notifications
  - `/support` - General support channel
  - `/rooms?room={name}` - Chat rooms (payments, transfers, cards)
  - `/health` - Health check
- **Health Check**: HTTP `/health` endpoint

### GraphQL Service (graphql)
- **Base Image**: `node:18`
- **Container**: `wso2-graphql-api`
- **Port**: 8082
- **Technology**: Apollo Server, Express
- **Function**: GraphQL API with Star Wars demo schema
- **Features**: Queries, mutations, subscriptions
- **Health Check**: HTTP `/health` endpoint

### React Bank App (bank-app)
- **Base Image**: `node:18`
- **Container**: `wso2-bank-app`
- **Port**: 3000 (HTTPS)
- **Technology**: React 18, TypeScript, Webpack
- **Function**: Single-page application demonstrating OAuth2/OIDC flows
- **Configuration**: `src/config.ts` and `src/config.json`
- **Initialization**: Automatic OAuth2 client registration
- **Health Check**: Root endpoint

### PHP Bank App (php-app)
- **Base Image**: `php:8-apache`
- **Container**: `wso2-php-app`
- **Ports**: 7100 (HTTP), 7400 (HTTPS)
- **Function**: Server-rendered application with OAuth2 integration
- **Configuration**: `src/includes/config.php`
- **Initialization**: Automatic OAuth2 client registration
- **Health Check**: Root endpoint

## Network Architecture

### Docker Network
- **Name**: `wso2net`
- **Driver**: bridge
- **Purpose**: Inter-container communication
- **DNS**: Automatic service discovery by container/hostname

### Service Communication
- **Internal**: Containers communicate via hostname (e.g., `wso2am:9443`)
- **External**: Host machine accesses via `localhost` with mapped ports
- **Security**: TLS certificates mounted from `infra/certs/`

## Data Flow

### OAuth2 Authentication Flow
```
User → Frontend App → API Manager Gateway → Identity Server
                                ↓
                          OAuth2 Token
                                ↓
                     Authorized API Request
                                ↓
                          Backend Service
```

### API Request Flow
```
Client → APIM Gateway :8243 → Backend Service (bank-api:2001)
         (with policies)
```

### Real-time Communication Flow
```
Client → WebSocket Service :8081
         (persistent connection)
         ↓
      Notifications/Chat
```

## Storage Architecture

### Persistent Volumes
- **wso2_is_data**: Identity Server data (users, tokens, sessions)
- **wso2_am_data**: API Manager data (APIs, applications, subscriptions)

### Configuration Mounts
- **Platform configs**: Read-only mounts from `platform/wso2-*/`
- **Certificates**: Read-only mounts from `infra/certs/`
- **Application source**: Read-write mounts for hot-reload (dev mode)

## Initialization Architecture

### Custom Entrypoints
Each WSO2 product and application has a `custom-entrypoint.sh` that:
1. Starts the service in background
2. Waits for service readiness
3. Runs initialization scripts from `container-init/`
4. Marks initialization complete with marker file
5. Keeps service running

### Idempotency
- Marker files prevent re-running initialization
- API checks for existing resources before creation
- Graceful handling of already-existing resources

## Security Architecture

### Authentication
- **Admin Credentials**: Default `admin/admin` (configurable via `.env`)
- **OAuth2/OIDC**: Identity Server as authorization server
- **Key Manager**: Identity Server integrated with API Manager

### TLS/SSL
- Self-signed certificates in `infra/certs/`
- Mounted to all services requiring HTTPS
- Suitable for development; replace for production

### Network Isolation
- All services on private Docker network
- Only specified ports exposed to host
- No direct inter-service port exposure to host

## Scalability Considerations

### Current Architecture
- Single instance per service
- Suitable for development and demo purposes

### Production Considerations
- Requires clustering for high availability
- Database externalization (currently embedded H2)
- Load balancer in front of APIM gateway
- Session persistence for multi-node setup

## Health Check Strategy

### Health Check Types
1. **HTTP/HTTPS Endpoints**: Service-specific health endpoints
2. **Well-Known URLs**: OAuth2 well-known configuration
3. **Liveness Probes**: MI liveness endpoint
4. **Static Resources**: ICP favicon

### Health Check Configuration
- **Initial Delay**: 60-600s (start_period)
- **Interval**: 10-30s
- **Timeout**: 5-10s
- **Retries**: 3-60 (varies by service)

### Startup Order
Services start independently; health checks ensure readiness before dependent operations.
