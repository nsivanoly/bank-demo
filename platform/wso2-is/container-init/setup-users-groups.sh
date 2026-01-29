#!/bin/bash
# Setup Users, Groups, and Roles Script
# Creates and associates users, groups, and roles via SCIM2 API
# Idempotent - safe to re-run
# Compatible with bash 3.2+ (macOS)

set -o pipefail  # Catch errors in pipes

# ==================== CONFIGURATION ====================

IS_HOST=${IS_HOST:-https://localhost:9444}
IS_USERNAME=${IS_USERNAME:-admin}
IS_PASSWORD=${IS_PASSWORD:-admin}
MAX_RETRY=${MAX_RETRY:-50}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==================== LOGGING ====================

log_info() {
  echo -e "${BLUE}ℹ️  [SETUP] $*${NC}" >&2
}

log_success() {
  echo -e "${GREEN}✅ [SETUP] $*${NC}" >&2
}

log_error() {
  echo -e "${RED}❌ [SETUP] $*${NC}" >&2
}

log_warn() {
  echo -e "${YELLOW}⚠️  [SETUP] $*${NC}" >&2
}

# ==================== HTTP UTILITIES ====================

# Check if HTTP status code is successful
is_success_code() {
  local code="$1"
  [[ "$code" =~ ^(200|201|204)$ ]]
}

# URL encode filter string
url_encode_filter() {
  echo "$1" | sed 's/ /%20/g' | sed 's/"/%22/g'
}

# Extract ID from JSON response
extract_id() {
  echo "$1" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/'
}

# ==================== SCIM API FUNCTIONS ====================

# Wait for Identity Server to be ready
wait_for_is() {
  local retry_count=0
  local scim_url="${IS_HOST}/scim2/Users"
  
  log_info "Waiting for Identity Server SCIM2 API to be ready..."
  
  while [ $retry_count -lt $MAX_RETRY ]; do
    if curl -sk -u "${IS_USERNAME}:${IS_PASSWORD}" \
         -H "Accept: application/json" \
         "$scim_url" > /dev/null 2>&1; then
      log_success "Identity Server SCIM2 API is ready"
      return 0
    fi
    retry_count=$((retry_count + 1))
    log_info "Attempt $retry_count/$MAX_RETRY - Waiting for IS..."
    sleep $RETRY_INTERVAL
  done
  
  log_error "Identity Server SCIM2 API did not become ready in time"
  return 1
}

# Generic function to check if resource exists
# Args: resource_type, display_field, value, endpoint, content_type
check_resource_exists() {
  local resource_type="$1"
  local display_field="$2"
  local value="$3"
  local endpoint="$4"
  local content_type="${5:-application/json}"
  
  local filter="${display_field} eq \"${value}\""
  local encoded_filter=$(url_encode_filter "$filter")
  
  local response
  response=$(curl -sk -u "${IS_USERNAME}:${IS_PASSWORD}" \
    -H "Accept: ${content_type}" \
    "${IS_HOST}${endpoint}?filter=${encoded_filter}" 2>/dev/null)
  
  if echo "$response" | grep -q "\"${display_field}\":\"${value}\""; then
    local id=$(extract_id "$response")
    log_info "${resource_type} already exists: ${value} (ID: ${id})"
    echo "$id"
    return 0
  else
    return 1
  fi
}

# Generic function to create SCIM resource
# Args: resource_type, payload, endpoint, content_type
create_resource() {
  local resource_type="$1"
  local payload="$2"
  local endpoint="$3"
  local content_type="${4:-application/json}"
  
  local response http_code
  response=$(curl -sk -w "\n%{http_code}" -X POST \
    -u "${IS_USERNAME}:${IS_PASSWORD}" \
    -H "Content-Type: ${content_type}" \
    -H "Accept: ${content_type}" \
    -d "$payload" \
    "${IS_HOST}${endpoint}" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  response=$(echo "$response" | sed '$d')
  
  if is_success_code "$http_code"; then
    local id=$(extract_id "$response")
    echo "$id"
    return 0
  else
    log_error "Failed to create ${resource_type} (HTTP ${http_code})"
    return 1
  fi
}

# Generic PATCH operation with add/replace fallback
# Args: resource_type, resource_id, path, value_json, endpoint, content_type, display_name
patch_resource() {
  local resource_type="$1"
  local resource_id="$2"
  local path="$3"
  local value_json="$4"
  local endpoint="$5"
  local content_type="${6:-application/json}"
  local display_name="${7:-$resource_type}"
  
  # Try add operation first
  local patch_payload=$(cat <<EOF
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{"op": "add", "path": "${path}", "value": ${value_json}}]
}
EOF
)
  
  local response http_code
  response=$(curl -sk -w "\n%{http_code}" -X PATCH \
    -u "${IS_USERNAME}:${IS_PASSWORD}" \
    -H "Content-Type: ${content_type}" \
    -H "Accept: ${content_type}" \
    -d "$patch_payload" \
    "${IS_HOST}${endpoint}/${resource_id}" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  
  if is_success_code "$http_code"; then
    return 0
  fi
  
  # Fallback to replace operation
  log_warn "PATCH add failed (HTTP ${http_code}), trying replace..." >&2
  
  patch_payload=$(cat <<EOF
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{"op": "replace", "path": "${path}", "value": ${value_json}}]
}
EOF
)
  
  response=$(curl -sk -w "\n%{http_code}" -X PATCH \
    -u "${IS_USERNAME}:${IS_PASSWORD}" \
    -H "Content-Type: ${content_type}" \
    -H "Accept: ${content_type}" \
    -d "$patch_payload" \
    "${IS_HOST}${endpoint}/${resource_id}" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  
  if is_success_code "$http_code"; then
    return 0
  fi
  
  log_error "Failed to patch ${display_name}" >&2
  return 1
}

# ==================== RESOURCE-SPECIFIC FUNCTIONS ====================

# Create user
create_user() {
  local username="$1" given_name="$2" family_name="$3" password="$4" email="$5"
  
  log_info "Creating user: $username"
  
  local payload=$(cat <<EOF
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "name": {"givenName": "${given_name}", "familyName": "${family_name}"},
  "userName": "${username}",
  "password": "${password}",
  "emails": [{"value": "${email}", "primary": true}]
}
EOF
)
  
  if id=$(create_resource "user" "$payload" "/scim2/Users"); then
    log_success "User created: $username (ID: $id)"
    echo "$id"
    return 0
  fi
  return 1
}

# Create group
create_group() {
  local groupname="$1"
  
  log_info "Creating group: $groupname"
  
  local payload=$(cat <<EOF
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
  "displayName": "${groupname}"
}
EOF
)
  
  if id=$(create_resource "group" "$payload" "/scim2/Groups"); then
    log_success "Group created: $groupname (ID: $id)"
    echo "$id"
    return 0
  fi
  return 1
}

# Create role (V2 API)
create_role() {
  local rolename="$1"
  
  log_info "Creating role: $rolename"
  
  local payload=$(cat <<EOF
{
  "schemas": ["urn:ietf:params:scim:schemas:extension:2.0:Role"],
  "displayName": "${rolename}"
}
EOF
)
  
  if id=$(create_resource "role" "$payload" "/scim2/v2/Roles" "application/scim+json"); then
    log_success "Role created: $rolename (ID: $id)"
    echo "$id"
    return 0
  fi
  return 1
}

# Add user to group
add_user_to_group() {
  local group_id="$1" user_id="$2" username="$3" groupname="$4"
  
  local value=$(cat <<EOF
[{"value": "${user_id}", "display": "${username}"}]
EOF
)
  
  if patch_resource "group" "$group_id" "members" "$value" "/scim2/Groups" \
     "application/json" "user '${username}' to group '${groupname}'"; then
    log_success "User '$username' added to group '$groupname'" >&2
    return 0
  fi
  return 0  # Don't fail script
}

# Add user to role
add_user_to_role() {
  local role_id="$1" user_id="$2" username="$3" rolename="$4"
  
  local value=$(cat <<EOF
[{"value": "${user_id}", "display": "${username}"}]
EOF
)
  
  if patch_resource "role" "$role_id" "users" "$value" "/scim2/v2/Roles" \
     "application/scim+json" "user '${username}' to role '${rolename}'"; then
    log_success "User '$username' added to role '$rolename'" >&2
    return 0
  fi
  return 0  # Don't fail script
}

# Add group to role
add_group_to_role() {
  local role_id="$1" group_id="$2" groupname="$3" rolename="$4"
  
  local value=$(cat <<EOF
[{"value": "${group_id}", "display": "${groupname}"}]
EOF
)
  
  if patch_resource "role" "$role_id" "groups" "$value" "/scim2/v2/Roles" \
     "application/scim+json" "group '${groupname}' to role '${rolename}'"; then
    log_success "Group '$groupname' added to role '$rolename'" >&2
    return 0
  fi
  return 0  # Don't fail script
}

# ==================== ORCHESTRATION HELPERS ====================

# Ensure resource exists (check or create)
ensure_resource() {
  local resource_type="$1" name="$2" check_func="$3" create_func="$4"
  
  local id
  if id=$($check_func "$name"); then
    echo "$id"
  else
    if id=$($create_func "$name"); then
      echo "$id"
    else
      log_error "Failed to ensure ${resource_type}: ${name}"
      return 1
    fi
  fi
}

# ==================== DATA DEFINITIONS ====================

# User data definitions
get_users_data() {
  cat <<'EOF'
ahmed.khalid:Ahmed:Khalid:aBcd!23#:ahmed.khalid@demo.me
fatima.zahra:Fatima:Zahra:Xyz@456!:fatima.zahra@demo.me
omar.haddad:Omar:Haddad:Pass@789#:omar.haddad@demo.me
laila.hassan:Laila:Hassan:Pwd@135!:laila.hassan@demo.me
karim.nasser:Karim:Nasser:Safe@246#:karim.nasser@demo.me
sara.alhassan:Sara:Alhassan:Code@864!:sara.alhassan@demo.me
ziad.farouk:Ziad:Farouk:Ops@975#:ziad.farouk@demo.me
rania.samir:Rania:Samir:Help@531!:rania.samir@demo.me
yusuf.mansour:Yusuf:Mansour:View@864#:yusuf.mansour@demo.me
noura.qasim:Noura:Qasim:Read@753!:noura.qasim@demo.me
EOF
}

# User-to-group mappings (user:group1,group2,...)
get_user_group_mappings() {
  cat <<'EOF'
ahmed.khalid:Employees
fatima.zahra:Employees
omar.haddad:Employees
laila.hassan:Employees
karim.nasser:Employees,Sandbox
sara.alhassan:Employees
ziad.farouk:Partners,Sandbox
rania.samir:Partners,Auditors
yusuf.mansour:Customers
noura.qasim:Customers,Auditors
EOF
}

# User-to-role mappings (user:role1,role2,...)
get_user_role_mappings() {
  cat <<'EOF'
ahmed.khalid:api-admin
fatima.zahra:api-admin
omar.haddad:api-dev
karim.nasser:api-dev
sara.alhassan:api-dev
laila.hassan:api-ops
ziad.farouk:api-ops
rania.samir:support-analyst
yusuf.mansour:read-only
noura.qasim:read-only
EOF
}

# Group-to-role mappings (role:group1,group2,...)
get_group_role_mappings() {
  cat <<'EOF'
api-admin:Employees
api-dev:Employees
api-ops:Employees,Partners
support-analyst:Partners,Auditors
read-only:Customers,Auditors
EOF
}

# ==================== MAIN ORCHESTRATION ====================

main() {
  log_info "=== WSO2 Identity Server Setup: Users, Groups & Roles ==="
  echo ""
  
  # Wait for IS to be ready
  wait_for_is || {
    log_error "Identity Server not ready"
    exit 1
  }
  
  # Declare associative-array-like storage for IDs (bash 3.2 compatible)
  declare -a user_ids group_ids role_ids
  declare -a user_names group_names role_names
  
  # ==================== STEP 1: CREATE USERS ====================
  log_info "Step 1: Creating users..."
  echo ""
  
  local idx=0
  while IFS=: read -r username given_name family_name password email; do
    [ -z "$username" ] && continue
    
    local user_id
    if user_id=$(check_resource_exists "User" "userName" "$username" "/scim2/Users"); then
      :
    elif user_id=$(create_user "$username" "$given_name" "$family_name" "$password" "$email"); then
      :
    else
      log_error "Failed to create user: $username"
      continue
    fi
    
    user_names[$idx]="$username"
    user_ids[$idx]="$user_id"
    idx=$((idx + 1))
    sleep 0.5
  done < <(get_users_data)
  
  echo ""
  log_success "User creation completed (${#user_names[@]} users)"
  
  # ==================== STEP 2: CREATE GROUPS ====================
  log_info "Step 2: Creating groups..."
  echo ""
  
  local groups="Employees Partners Customers Auditors Sandbox"
  idx=0
  for group in $groups; do
    local group_id
    if group_id=$(check_resource_exists "Group" "displayName" "$group" "/scim2/Groups"); then
      :
    elif group_id=$(create_group "$group"); then
      :
    else
      log_error "Failed to create group: $group"
      continue
    fi
    
    group_names[$idx]="$group"
    group_ids[$idx]="$group_id"
    idx=$((idx + 1))
    sleep 0.5
  done
  
  echo ""
  log_success "Group creation completed (${#group_names[@]} groups)"
  
  # ==================== STEP 3: CREATE ROLES ====================
  log_info "Step 3: Creating roles..."
  echo ""
  
  local roles="api-admin api-dev api-ops support-analyst read-only"
  idx=0
  for role in $roles; do
    local role_id
    if role_id=$(check_resource_exists "Role" "displayName" "$role" "/scim2/v2/Roles" "application/scim+json"); then
      :
    elif role_id=$(create_role "$role"); then
      :
    else
      log_error "Failed to create role: $role"
      continue
    fi
    
    role_names[$idx]="$role"
    role_ids[$idx]="$role_id"
    idx=$((idx + 1))
    sleep 0.5
  done
  
  echo ""
  log_success "Role creation completed (${#role_names[@]} roles)"
  
  # Helper: Get ID by name
  get_user_id() {
    for i in "${!user_names[@]}"; do
      [ "${user_names[$i]}" = "$1" ] && echo "${user_ids[$i]}" && return 0
    done
    return 1
  }
  
  get_group_id() {
    for i in "${!group_names[@]}"; do
      [ "${group_names[$i]}" = "$1" ] && echo "${group_ids[$i]}" && return 0
    done
    return 1
  }
  
  get_role_id() {
    for i in "${!role_names[@]}"; do
      [ "${role_names[$i]}" = "$1" ] && echo "${role_ids[$i]}" && return 0
    done
    return 1
  }
  
  # ==================== STEP 4: ASSIGN USERS TO GROUPS ====================
  log_info "Step 4: Assigning users to groups..."
  echo ""
  
  local count=0
  while IFS=: read -r username groups_str; do
    [ -z "$username" ] && continue
    
    local user_id=$(get_user_id "$username")
    [ -z "$user_id" ] && continue
    
    IFS=',' read -ra groups_array <<< "$groups_str"
    for group in "${groups_array[@]}"; do
      local group_id=$(get_group_id "$group")
      [ -z "$group_id" ] && continue
      
      add_user_to_group "$group_id" "$user_id" "$username" "$group"
      count=$((count + 1))
      sleep 0.3
    done
  done < <(get_user_group_mappings)
  
  echo ""
  log_success "User-to-group assignments completed ($count assignments)"
  
  # ==================== STEP 5: ASSIGN USERS TO ROLES ====================
  log_info "Step 5: Assigning users to roles..."
  echo ""
  
  count=0
  while IFS=: read -r username roles_str; do
    [ -z "$username" ] && continue
    
    local user_id=$(get_user_id "$username")
    [ -z "$user_id" ] && continue
    
    IFS=',' read -ra roles_array <<< "$roles_str"
    for role in "${roles_array[@]}"; do
      local role_id=$(get_role_id "$role")
      [ -z "$role_id" ] && continue
      
      add_user_to_role "$role_id" "$user_id" "$username" "$role"
      count=$((count + 1))
      sleep 0.3
    done
  done < <(get_user_role_mappings)
  
  echo ""
  log_success "User-to-role assignments completed ($count assignments)"
  
  # ==================== STEP 6: ASSIGN GROUPS TO ROLES ====================
  log_info "Step 6: Assigning groups to roles..."
  echo ""
  
  count=0
  while IFS=: read -r role groups_str; do
    [ -z "$role" ] && continue
    
    local role_id=$(get_role_id "$role")
    [ -z "$role_id" ] && continue
    
    IFS=',' read -ra groups_array <<< "$groups_str"
    for group in "${groups_array[@]}"; do
      local group_id=$(get_group_id "$group")
      [ -z "$group_id" ] && continue
      
      add_group_to_role "$role_id" "$group_id" "$group" "$role"
      count=$((count + 1))
      sleep 0.3
    done
  done < <(get_group_role_mappings)
  
  echo ""
  log_success "Group-to-role assignments completed ($count assignments)"
  
  # ==================== SUMMARY ====================
  echo ""
  echo "=========================================="
  log_info "=== Setup Summary ==="
  echo "=========================================="
  echo ""
  
  log_info "✓ Users: ${#user_names[@]}"
  for i in "${!user_names[@]}"; do
    echo "  • ${user_names[$i]} (${user_ids[$i]})"
  done
  
  echo ""
  log_info "✓ Groups: ${#group_names[@]}"
  for i in "${!group_names[@]}"; do
    echo "  • ${group_names[$i]} (${group_ids[$i]})"
  done
  
  echo ""
  log_info "✓ Roles: ${#role_names[@]}"
  for i in "${!role_names[@]}"; do
    echo "  • ${role_names[$i]} (${role_ids[$i]})"
  done
  
  echo ""
  echo "=========================================="
  log_success "Setup completed successfully!"
  echo "=========================================="
  
  return 0
}

# Execute main function
main "$@"
