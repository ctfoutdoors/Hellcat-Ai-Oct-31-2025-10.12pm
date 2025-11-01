#!/bin/bash
set -e

echo "🚀 Carrier Dispute System - Deployment Script"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Pull latest code
echo -e "\n${YELLOW}📥 Pulling latest code...${NC}"
git pull origin master || {
    echo -e "${RED}Failed to pull code${NC}"
    exit 1
}

# Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
pnpm install || {
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
}

# Run database migrations
echo -e "\n${YELLOW}🗄️  Running database migrations...${NC}"
pnpm run db:push || {
    echo -e "${RED}Failed to run migrations${NC}"
    exit 1
}

# Build application
echo -e "\n${YELLOW}🔨 Building application...${NC}"
NODE_OPTIONS='--max-old-space-size=4096' pnpm run build || {
    echo -e "${RED}Failed to build application${NC}"
    exit 1
}

# Restart application
echo -e "\n${YELLOW}🔄 Restarting application...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart carrier-dispute-system || pm2 start dist/index.js --name carrier-dispute-system
elif command -v systemctl &> /dev/null; then
    sudo systemctl restart carrier-dispute
else
    echo -e "${YELLOW}No process manager found. Please restart manually.${NC}"
fi

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${GREEN}Application is running at http://localhost:3000${NC}"
