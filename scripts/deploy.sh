#!/bin/bash
# ============================================
# BastionAuth - VPS Deployment Script
# ============================================
#
# This script deploys BastionAuth to a VPS with Docker
#
# Prerequisites:
#   - Docker and Docker Compose installed on VPS
#   - nginx-proxy-manager running
#   - DNS records pointing to VPS IP
#
# Usage:
#   ./scripts/deploy.sh
#
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/mawtechsolutions/bastion-auth.git"
DEPLOY_DIR="/root/bastionauth"
BRANCH="main"

echo -e "${BLUE}"
echo "============================================"
echo "       BastionAuth Deployment Script        "
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Installing...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Clone or update repository
echo -e "${YELLOW}📦 Fetching latest code...${NC}"
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    git pull origin $BRANCH
else
    git clone -b $BRANCH "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Check for .env file
if [ ! -f "docker/.env" ]; then
    echo -e "${RED}❌ Missing docker/.env file!${NC}"
    echo -e "${YELLOW}Please create it from the template:${NC}"
    echo "  cp docker/env.example docker/.env"
    echo "  nano docker/.env"
    echo ""
    echo -e "${YELLOW}Required variables:${NC}"
    echo "  - DB_PASSWORD"
    echo "  - REDIS_PASSWORD"
    echo "  - JWT_PRIVATE_KEY"
    echo "  - JWT_PUBLIC_KEY"
    echo "  - ENCRYPTION_KEY"
    echo "  - SMTP credentials"
    exit 1
fi

# Create nginx-proxy-manager network if it doesn't exist
echo -e "${YELLOW}🌐 Ensuring nginx-proxy-manager network exists...${NC}"
docker network create nginx-proxy-manager_default 2>/dev/null || true

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
cd docker
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo ""
echo -e "${YELLOW}📋 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  🌐 API Server:    http://localhost:3001"
echo "  📊 Admin Panel:   http://localhost:3002"
echo "  📱 Example App:   http://localhost:3000"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure nginx-proxy-manager proxy hosts:"
echo "     - api.bastionauth.dev → bastionauth-server:3001"
echo "     - admin.bastionauth.dev → bastionauth-admin:3002"
echo "     - app.bastionauth.dev → bastionauth-example:3000"
echo ""
echo "  2. Enable SSL with Let's Encrypt for each domain"
echo ""
echo "  3. Test the endpoints:"
echo "     - https://api.bastionauth.dev/health"
echo "     - https://admin.bastionauth.dev"
echo "     - https://app.bastionauth.dev"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:         docker-compose -f docker-compose.prod.yml down"
echo ""

