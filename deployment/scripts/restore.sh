
#!/bin/bash

###############################################################################
# HVHC Big Data - Restore Script
# Restore database, files, and configurations from backup
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Usage: $0 <backup_timestamp>${NC}"
    echo ""
    echo "Available backups:"
    ls -1 /backup/hvhc_bigdata/ | grep -E '^[0-9]{8}_[0-9]{6}$'
    exit 1
fi

BACKUP_TIMESTAMP=$1
BACKUP_DIR="/backup/hvhc_bigdata/$BACKUP_TIMESTAMP"
APP_DIR="/opt/hvhc_bigdata"

# Verify backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo "🔄 HVHC Big Data - Restore from Backup"
echo "======================================"
echo "Backup: $BACKUP_TIMESTAMP"
echo "Location: $BACKUP_DIR"
echo ""

# Show backup manifest
if [ -f "$BACKUP_DIR/MANIFEST.txt" ]; then
    cat "$BACKUP_DIR/MANIFEST.txt"
    echo ""
fi

# Confirmation
read -p "$(echo -e ${YELLOW}Are you sure you want to restore from this backup? This will OVERWRITE current data! [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop services
echo ""
echo "🛑 Stopping services..."
pm2 stop hvhc-bigdata || true
sudo systemctl stop redis
echo -e "${GREEN}✓ Services stopped${NC}"

# Restore database
echo ""
echo "📊 Restoring PostgreSQL database..."
if [ -f "$BACKUP_DIR/database.sql.gz" ]; then
    # Backup current database first
    sudo -u postgres pg_dump hvhc_bigdata | gzip > "/tmp/hvhc_pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    # Drop and recreate database
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS hvhc_bigdata;
CREATE DATABASE hvhc_bigdata;
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata TO hvhcapp;
EOF
    
    # Restore from backup
    gunzip -c "$BACKUP_DIR/database.sql.gz" | sudo -u postgres psql hvhc_bigdata
    echo -e "${GREEN}✓ Database restored${NC}"
else
    echo -e "${YELLOW}⚠ No database backup found${NC}"
fi

# Restore Redis data
echo ""
echo "🔴 Restoring Redis data..."
if [ -f "$BACKUP_DIR/redis_dump.rdb.gz" ]; then
    sudo systemctl stop redis
    gunzip -c "$BACKUP_DIR/redis_dump.rdb.gz" > /var/lib/redis/dump.rdb
    sudo chown redis:redis /var/lib/redis/dump.rdb
    sudo systemctl start redis
    echo -e "${GREEN}✓ Redis data restored${NC}"
else
    echo -e "${YELLOW}⚠ No Redis backup found${NC}"
    sudo systemctl start redis
fi

# Restore application files
echo ""
echo "📁 Restoring application files..."
if [ -f "$BACKUP_DIR/app_files.tar.gz" ]; then
    # Backup current app
    tar -czf "/tmp/hvhc_app_pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$APP_DIR" .
    
    # Restore from backup
    tar -xzf "$BACKUP_DIR/app_files.tar.gz" -C "$APP_DIR"
    echo -e "${GREEN}✓ Application files restored${NC}"
else
    echo -e "${YELLOW}⚠ No application files backup found${NC}"
fi

# Restore uploads
echo ""
echo "📤 Restoring uploads..."
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    rm -rf "$APP_DIR/uploads"
    tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$APP_DIR"
    echo -e "${GREEN}✓ Uploads restored${NC}"
else
    echo -e "${YELLOW}⚠ No uploads backup found${NC}"
fi

# Restore environment configuration
echo ""
echo "⚙️  Restoring environment configuration..."
if [ -f "$BACKUP_DIR/.env.backup" ]; then
    cp "$BACKUP_DIR/.env.backup" "$APP_DIR/.env"
    echo -e "${GREEN}✓ Environment configuration restored${NC}"
else
    echo -e "${YELLOW}⚠ No environment backup found${NC}"
fi

# Reinstall dependencies
echo ""
echo "📦 Reinstalling dependencies..."
cd "$APP_DIR"
npm install
npx prisma generate
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Rebuild application
echo ""
echo "🔨 Rebuilding application..."
npm run build
echo -e "${GREEN}✓ Application rebuilt${NC}"

# Fix permissions
echo ""
echo "🔒 Fixing permissions..."
sudo chown -R hvhcapp:hvhcapp "$APP_DIR"
echo -e "${GREEN}✓ Permissions fixed${NC}"

# Start services
echo ""
echo "🚀 Starting services..."
pm2 start hvhc-bigdata
pm2 save
echo -e "${GREEN}✓ Services started${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Restore Complete!${NC}"
echo "=========================================="
echo "Restored from: $BACKUP_TIMESTAMP"
echo ""
echo "Pre-restore backups saved to /tmp/"
echo "  - Database: /tmp/hvhc_pre_restore_*.sql.gz"
echo "  - App files: /tmp/hvhc_app_pre_restore_*.tar.gz"
echo ""
echo "⚠️  Please verify the application is working correctly!"
echo "Visit: https://bigdata.hvhc.edu.vn"
echo ""

exit 0
