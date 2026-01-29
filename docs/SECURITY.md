# Security Guide

## Overview

This guide documents the security model, authentication mechanisms, default credentials, and security best practices for the WSO2 DevStack.

## Security Architecture

### Authentication Flow

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Client    │          │  WSO2 IS    │          │  WSO2 APIM  │
│  (Browser)  │          │  (IdP/KM)   │          │  (Gateway)  │
└─────────────┘          └─────────────┘          └─────────────┘
      │                         │                         │
      │ 1. Redirect to login    │                         │
      │────────────────────────>│                         │
      │                         │                         │
      │ 2. Login credentials    │                         │
      │────────────────────────>│                         │
      │                         │                         │
      │ 3. Authorization code   │                         │
      │<────────────────────────│                         │
      │                         │                         │
      │ 4. Exchange code        │                         │
      │─────────────────────────┼────────────────────────>│
      │                         │                         │
      │                         │ 5. Validate with IS     │
      │                         │<────────────────────────│
      │                         │                         │
      │                         │ 6. User info            │
      │                         │─────────────────────────>│
      │                         │                         │
      │ 7. Access token         │                         │
      │<─────────────────────────────────────────────────│
      │                         │                         │
      │ 8. API call + token     │                         │
      │─────────────────────────┼────────────────────────>│
      │                         │                         │
      │                         │ 9. Validate token       │
      │                         │<────────────────────────│
      │                         │                         │
      │ 10. API response        │                         │
      │<─────────────────────────────────────────────────│
```

### Components

**Identity Server (wso2is):**
- **Role**: Identity Provider (IdP) and Key Manager (KM)
- **Functions**:
  - User authentication
  - OAuth2 authorization
  - Token issuance and validation
  - User/group/role management
  - SCIM2 user provisioning

**API Manager (wso2am):**
- **Role**: API Gateway and Publisher
- **Functions**:
  - API proxy and routing
  - Rate limiting and throttling
  - Token validation (via IS)
  - API subscription management
  - Analytics and monitoring

## Authentication Protocols

### OAuth 2.0

**Supported Grant Types:**

1. **Authorization Code Flow** (Recommended)
   - Used by: React app, PHP app
   - Most secure for web applications
   - Requires user interaction

2. **Client Credentials**
   - Used by: Service-to-service communication
   - No user context
   - Machine-to-machine authentication

3. **Password Grant** (Development only)
   - Direct username/password exchange
   - Not recommended for production

4. **Implicit Flow** (Deprecated)
   - Legacy browser-based apps
   - Less secure than Authorization Code

### OpenID Connect (OIDC)

**Features:**
- Built on OAuth 2.0
- ID Token (JWT) with user claims
- UserInfo endpoint for profile data
- Discovery endpoint for metadata

**OIDC Discovery Endpoint:**
```
https://localhost:9444/oauth2/token/.well-known/openid-configuration
```

**Key Claims:**
- `sub`: Subject (user ID)
- `iss`: Issuer (Identity Server URL)
- `aud`: Audience (client ID)
- `exp`: Expiration time
- `iat`: Issued at time

## Default Credentials

### WSO2 Admin Accounts

**Default Username/Password:**
```
Username: admin
Password: admin
```

**Applies To:**
- WSO2 Identity Server (port 9444)
- WSO2 API Manager (port 9443)
- WSO2 Micro Integrator (port 8253)
- WSO2 Integration Control Plane (port 9743)

**Change Credentials:**

Edit `.env`:
```bash
ADMIN_USERNAME=myadmin
ADMIN_PASSWORD=SecureP@ssw0rd
```

**Note**: Changing admin credentials requires:
1. Update `.env` file
2. Remove volumes: `docker compose down -v`
3. Rebuild: `./start.sh`

### Demo User Accounts

Created by `setup-users-groups.sh`:

**Bank Customer Users:**
```
Username: customer1@carbon.super
Password: Pass@123

Username: customer2@carbon.super
Password: Pass@123
```

**Bank Employee Users:**
```
Username: employee1@carbon.super
Password: Pass@123

Username: employee2@carbon.super  
Password: Pass@123
```

**Credentials in .env:**
```bash
DEMO_USER_PASSWORD=Pass@123
```

### Application Credentials

**React App OAuth Client:**
```
Client ID: (generated during initialization)
Client Secret: (not required for PKCE flow)
Grant Type: authorization_code
PKCE: Enabled
```

**PHP App OAuth Client:**
```
Client ID: (generated during initialization)
Client Secret: (generated during initialization)
Grant Type: authorization_code
```

**Configuration Location:**
- React: `apps/bank-app/src/config.json`
- PHP: `apps/php-app/src/includes/config.php`

## TLS/SSL Configuration

### Self-Signed Certificates

**Default Setup:**
- All WSO2 services use self-signed certificates
- Certificates generated during container startup
- Valid for development only

**Certificate Location:**
```
platform/wso2-am/am-conf/repository/resources/security/wso2carbon.jks
platform/wso2-is/is-conf/repository/resources/security/wso2carbon.jks
```

**Default Keystore:**
```
Keystore: wso2carbon.jks
Alias: wso2carbon
Password: wso2carbon
```

### Custom Certificates

**Provided Certificate Profiles:**
```
infra/certs/
├── listenerprofiles.xml    # HTTP/HTTPS listeners
└── sslprofiles.xml          # SSL/TLS profiles
```

**Mount Custom Certificates:**

Edit `docker-compose.yml`:
```yaml
volumes:
  - ./certs:/home/wso2carbon/repository/resources/security:ro
```

**Generate Custom Certificate:**
```bash
# Generate keystore
keytool -genkey -alias myapp \
  -keyalg RSA -keysize 2048 \
  -validity 365 -keystore myapp.jks \
  -dname "CN=localhost,O=MyOrg,C=US" \
  -storepass mypassword -keypass mypassword

# Export certificate
keytool -export -alias myapp \
  -file myapp.crt \
  -keystore myapp.jks \
  -storepass mypassword
```

### Client Certificate Validation

**Disabled by Default**: For development ease

**Enable (Production):**
```bash
# In wso2am Dockerfile, add:
RUN sed -i 's/HostnameVerifier.ALLOW_ALL/HostnameVerifier.STRICT/g' \
  ${WSO2_APIM_HOME}/repository/conf/security/Oasis.java
```

## Security Features

### Token Management

**Access Token:**
- **Type**: JWT (JSON Web Token)
- **Lifetime**: 3600 seconds (1 hour) - configurable
- **Storage**: Client-side (localStorage or memory)
- **Validation**: Every API request

**Refresh Token:**
- **Lifetime**: 86400 seconds (24 hours) - configurable
- **Purpose**: Obtain new access token without re-login
- **Storage**: Secure HTTP-only cookie (recommended)

**Token Revocation:**
```bash
# Revoke token via APIM
curl -k -X POST https://localhost:9443/oauth2/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=<access_token>" \
  -u "<client_id>:<client_secret>"
```

### API Security

**Subscription Model:**
1. Developer subscribes to API in DevPortal
2. Generates application key (access token)
3. Includes token in API requests
4. Gateway validates token before proxying

**Rate Limiting:**
- **Throttling Tiers**: Bronze, Silver, Gold, Unlimited
- **Limits**: Requests per minute/hour/day
- **Enforcement**: At gateway level

**API Keys:**
```bash
# Generate API key (alternative to OAuth)
curl -k -X POST https://localhost:9443/api/am/devportal/v2/applications/{appId}/generate-keys \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"grantTypesToBeSupported":["client_credentials"]}'
```

### CORS Configuration

**Default**: Allowed origins configured per service

**React App CORS:**
```javascript
// Configured in apps/bank-app/src/config.ts
allowedOrigins: ['https://localhost:9443']
```

**Bank API CORS:**
```javascript
// services/bank-api/index.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

**APIM CORS:**
```xml
<!-- platform/wso2-am/am-conf/repository/conf/deployment.toml -->
[apim.cors]
allow_origins = ["*"]
allow_methods = ["GET","PUT","POST","DELETE","PATCH","OPTIONS"]
allow_headers = ["Authorization","Content-Type"]
allow_credentials = true
```

### SCIM2 User Management

**SCIM Endpoints:**
```
# Users
https://localhost:9444/scim2/Users

# Groups
https://localhost:9444/scim2/Groups

# Roles
https://localhost:9444/scim2/Roles
```

**Create User via SCIM:**
```bash
curl -k -X POST https://localhost:9444/scim2/Users \
  -H "Authorization: Basic $(echo -n admin:admin | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "testuser@carbon.super",
    "password": "Test@123",
    "emails": [{"primary": true, "value": "testuser@example.com"}]
  }'
```

**User Provisioning Script:**
- **Location**: `platform/wso2-is/container-init/setup-users-groups.sh`
- **Creates**: 4 demo users, 3 roles, 2 groups
- **Idempotent**: Uses marker file to prevent duplicates

## Security Best Practices

### Development Environment

**Current Configuration:**
- ✅ Self-signed certificates (acceptable for dev)
- ✅ Default credentials (documented)
- ✅ CORS configured for localhost
- ✅ PKCE enabled for React app
- ❌ HTTP enabled (should be HTTPS only in production)
- ❌ No rate limiting on backend services

### Hardening Checklist

**For Production Deployment:**

1. **Credentials:**
   - [ ] Change all default admin passwords
   - [ ] Use strong passwords (12+ chars, complexity)
   - [ ] Store credentials in secrets manager (Vault, AWS Secrets Manager)
   - [ ] Rotate credentials regularly (90 days)

2. **Certificates:**
   - [ ] Replace self-signed certs with CA-signed certificates
   - [ ] Enable hostname verification
   - [ ] Configure certificate revocation (CRL/OCSP)
   - [ ] Use TLS 1.2+ only (disable TLS 1.0/1.1)

3. **Network:**
   - [ ] Disable HTTP endpoints
   - [ ] Use reverse proxy (nginx, Apache) with TLS termination
   - [ ] Restrict CORS to specific origins
   - [ ] Enable API gateway rate limiting
   - [ ] Implement IP whitelisting

4. **Authentication:**
   - [ ] Enable MFA for admin accounts
   - [ ] Implement password policies (complexity, expiry)
   - [ ] Use short-lived access tokens (5-15 min)
   - [ ] Enable token binding
   - [ ] Implement logout functionality

5. **Database:**
   - [ ] Replace H2 with production database (PostgreSQL/MySQL)
   - [ ] Enable database encryption at rest
   - [ ] Use separate DB credentials per service
   - [ ] Implement database backups

6. **Logging:**
   - [ ] Enable audit logging
   - [ ] Mask sensitive data in logs (passwords, tokens)
   - [ ] Centralize log collection (ELK, Splunk)
   - [ ] Set up security alerting

7. **Container Security:**
   - [ ] Use minimal base images
   - [ ] Scan images for vulnerabilities (Trivy, Snyk)
   - [ ] Run containers as non-root user
   - [ ] Implement resource limits (CPU, memory)
   - [ ] Use read-only filesystem where possible

8. **API Security:**
   - [ ] Implement API authentication for all endpoints
   - [ ] Enable request/response validation
   - [ ] Implement input sanitization
   - [ ] Set up WAF (Web Application Firewall)
   - [ ] Enable API versioning

### Secrets Management

**Current**: Environment variables in `.env` file

**Recommended**:

**Docker Secrets:**
```yaml
# docker-compose.yml
secrets:
  admin_password:
    file: ./secrets/admin_password.txt

services:
  wso2am:
    secrets:
      - admin_password
    environment:
      ADMIN_PASSWORD_FILE: /run/secrets/admin_password
```

**External Vault:**
```bash
# Fetch from HashiCorp Vault
export ADMIN_PASSWORD=$(vault kv get -field=password secret/wso2/admin)
```

### Vulnerability Scanning

**Scan Docker Images:**
```bash
# Using Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image wso2am:latest

# Using Snyk
snyk container test wso2am:latest
```

**Scan Dependencies:**
```bash
# Node.js
cd services/bank-api
npm audit

# Fix vulnerabilities
npm audit fix
```

## Authentication Modes

### Mode 1: Authorization Code Flow (PKCE)

**Used By**: React app (bank-app)

**Configuration:**
```javascript
// apps/bank-app/src/config.ts
export const authConfig = {
  authorizationEndpoint: 'https://localhost:9444/oauth2/authorize',
  tokenEndpoint: 'https://localhost:9444/oauth2/token',
  userinfoEndpoint: 'https://localhost:9444/oauth2/userinfo',
  grantType: 'authorization_code',
  responseType: 'code',
  scope: 'openid profile',
  usePKCE: true
};
```

**Flow:**
1. Generate PKCE code verifier and challenge
2. Redirect to `/oauth2/authorize` with challenge
3. User logs in on IS
4. Redirect back with authorization code
5. Exchange code + verifier for tokens
6. Store tokens securely

### Mode 2: Authorization Code Flow (Standard)

**Used By**: PHP app (php-app)

**Configuration:**
```php
// apps/php-app/src/includes/config.php
define('OAUTH_AUTHORIZE_URL', 'https://wso2is:9444/oauth2/authorize');
define('OAUTH_TOKEN_URL', 'https://wso2is:9444/oauth2/token');
define('OAUTH_USERINFO_URL', 'https://wso2is:9444/oauth2/userinfo');
define('OAUTH_GRANT_TYPE', 'authorization_code');
define('OAUTH_RESPONSE_TYPE', 'code');
```

**Flow:**
1. Redirect to `/oauth2/authorize` with client_id
2. User logs in on IS
3. Redirect back with authorization code
4. Exchange code + client_secret for tokens
5. Store tokens in session

### Mode 3: Client Credentials

**Used By**: Service-to-service authentication

**Example:**
```bash
curl -k -X POST https://localhost:9444/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "scope=default" \
  -u "<client_id>:<client_secret>"
```

## Key Manager Configuration

**Registration:**
- **Script**: `platform/wso2-am/container-init/setup-keymanager.sh`
- **Purpose**: Register WSO2 IS as key manager for APIM
- **Configuration**: Resident Key Manager mode

**Key Manager Endpoints (from IS):**
```
Token: https://wso2is:9444/oauth2/token
Revoke: https://wso2is:9444/oauth2/revoke
Introspect: https://wso2is:9444/oauth2/introspect
UserInfo: https://wso2is:9444/oauth2/userinfo
Authorize: https://wso2is:9444/oauth2/authorize
JWKS: https://wso2is:9444/oauth2/jwks
```

## Security Headers

**Recommended Headers:**

```nginx
# Add to reverse proxy configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## Audit and Compliance

**Audit Logs:**
```
Location: /home/wso2carbon/repository/logs/audit.log
```

**Log Events:**
- User login/logout
- OAuth token generation
- API invocations
- Configuration changes
- Admin operations

**Access Audit Log:**
```bash
docker exec wso2is tail -f /home/wso2carbon/repository/logs/audit.log
```

**Compliance Considerations:**
- GDPR: User consent for data processing
- PCI-DSS: If handling payment data
- HIPAA: If handling health data
- SOC 2: Security controls documentation

## Incident Response

**Suspected Breach:**
1. Isolate affected containers
2. Review audit logs
3. Revoke all tokens
4. Reset credentials
5. Analyze attack vector
6. Patch vulnerabilities
7. Document incident

**Quick Actions:**
```bash
# Stop all services immediately
docker compose -f infra/docker-compose.yml stop

# Revoke all tokens (manual - via APIM admin console)

# Export logs for analysis
docker logs wso2am > apim_logs_$(date +%Y%m%d).log
docker logs wso2is > is_logs_$(date +%Y%m%d).log

# Reset environment
docker compose -f infra/docker-compose.yml down -v
```

## Security Contacts

**Report Security Issues:**
- For WSO2 products: https://docs.wso2.com/display/Security/
- For this demo stack: Contact repository maintainer

**Security Advisories:**
- WSO2 Security: https://wso2.com/security-patch-releases/
- Node.js Security: https://nodejs.org/en/blog/vulnerability/
- Docker Security: https://docs.docker.com/engine/security/
