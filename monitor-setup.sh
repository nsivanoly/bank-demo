#!/bin/bash

# Container Status Monitor Script
# Monitors the status of all the containers in the demo setup

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to display container status
show_container_status() {
    print_header "CONTAINER STATUS"
    
    # Get list of all containers (running and stopped)
    containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tail -n +2)
    
    if [ -z "$containers" ]; then
        echo -e "${YELLOW}No containers found${NC}"
        return
    fi
    
    # Count running and stopped containers
    running=$(docker ps -q | wc -l | tr -d ' ')
    total=$(docker ps -aq | wc -l | tr -d ' ')
    stopped=$((total - running))
    
    echo -e "${GREEN}Running: $running${NC} | ${RED}Stopped: $stopped${NC} | ${BLUE}Total: $total${NC}\n"
    
    # Display container details with color coding
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | while IFS= read -r line; do
        if echo "$line" | grep -q "Up"; then
            echo -e "${GREEN}$line${NC}"
        elif echo "$line" | grep -q "Exited"; then
            echo -e "${RED}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Function to show container health status
show_health_status() {
    print_header "HEALTH STATUS"
    
    # Get containers with health checks
    health_containers=$(docker ps --format "{{.Names}}" --filter "health=healthy" --filter "health=unhealthy" --filter "health=starting")
    
    if [ -z "$health_containers" ]; then
        echo -e "${YELLOW}No containers with health checks found${NC}"
        return
    fi
    
    echo -e "Container Name\t\tHealth Status"
    echo "----------------------------------------"
    
    while IFS= read -r container; do
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
        if [ "$health" = "healthy" ]; then
            echo -e "$container\t${GREEN}$health${NC}"
        elif [ "$health" = "unhealthy" ]; then
            echo -e "$container\t${RED}$health${NC}"
        elif [ "$health" = "starting" ]; then
            echo -e "$container\t${YELLOW}$health${NC}"
        else
            echo -e "$container\t$health"
        fi
    done <<< "$health_containers"
}

# Function to show resource usage
show_resource_usage() {
    print_header "RESOURCE USAGE"
    
    if [ -z "$(docker ps -q)" ]; then
        echo -e "${YELLOW}No running containers to monitor${NC}"
        return
    fi
    
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show logs summary
show_logs_summary() {
    print_header "RECENT ERRORS (Last 50 lines per container)"
    
    if [ -z "$(docker ps -q)" ]; then
        echo -e "${YELLOW}No running containers${NC}"
        return
    fi
    
    for container in $(docker ps --format "{{.Names}}"); do
        echo -e "\n${BLUE}=== $container ===${NC}"
        errors=$(docker logs --tail 50 "$container" 2>&1 | grep -i "error\|fatal\|exception" | head -5 || echo "No recent errors")
        if [ "$errors" = "No recent errors" ]; then
            echo -e "${GREEN}$errors${NC}"
        else
            echo -e "${RED}$errors${NC}"
        fi
    done
}

# Function to continuously monitor (watch mode)
watch_mode() {
    print_header "CONTINUOUS MONITORING (Press Ctrl+C to exit)"
    
    while true; do
        clear
        echo -e "${BLUE}Last updated: $(date)${NC}"
        show_container_status
        show_resource_usage
        sleep 5
    done
}

# Main function
main() {
    echo -e "${BLUE}Container Status Monitor${NC}"
    echo -e "${BLUE}========================${NC}"
    
    check_docker
    
    # Check for arguments
    case "${1:-}" in
        -w|--watch)
            watch_mode
            ;;
        -l|--logs)
            show_logs_summary
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (no args)    Show container status, health, and resource usage"
            echo "  -w, --watch  Continuous monitoring mode (refreshes every 5 seconds)"
            echo "  -l, --logs   Show recent errors from container logs"
            echo "  -h, --help   Show this help message"
            echo ""
            ;;
        *)
            show_container_status
            show_health_status
            show_resource_usage
            
            echo -e "\n${YELLOW}Tip: Use '$0 --watch' for continuous monitoring${NC}"
            echo -e "${YELLOW}Tip: Use '$0 --logs' to see recent errors${NC}"
            ;;
    esac
}

# Run main function
main "$@"
