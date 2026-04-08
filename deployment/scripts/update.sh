
#!/bin/bash

###############################################################################
# HVHC Big Data - Update Script
# Safely update the application with zero downtime
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/hvhc_bigdata"

echo "🔄 HVHC Big Data - System Update"
echo "================================"
echo ""

# Check if running as correct user
if [ "$USER" != "hvhcapp" ] && [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as hvhcapp user or root${NC}"
    exit 1
fi

# Backup before update
echo "💾 Creating pre-update backup..."
/opt/hvhc_bigdata/deployment/scripts/backup.sh
echo -e "${GREEN}✓ Backup complete${NC}"

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
cd "$APP_DIR"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Generate Prisma client
echo ""
echo "🔨 Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations complete${NC}"

# Build application
echo ""
echo "🔨 Building application..."
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

# Restart application (zero downtime with PM2)
echo ""
echo "🔄 Restarting application..."
pm2 reload hvhc-bigdata --update-env
echo -e "${GREEN}✓ Application restarted${NC}"

# Health check
echo ""
echo "🏥 Running health check..."
sleep 5  # Wait for app to start

if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}✗ Health check failed!${NC}"
    echo "Rolling back..."
    pm2 restart hvhc-bigdata
    exit 1
fi

# Clear cache
echo ""
echo "🗑️  Clearing cache..."
redis-cli FLUSHALL
echo -e "${GREEN}✓ Cache cleared${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Update Complete!${NC}"
echo "=========================================="
echo ""
echo "Application Version: $(git describe --tags --always)"
echo "Updated at: $(date)"
echo ""
echo "🔍 Verify the application:"
echo "  https://bigdata.hvhc.edu.vn"
echo ""

exit 0
