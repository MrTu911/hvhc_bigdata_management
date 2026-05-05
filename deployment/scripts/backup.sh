
#!/bin/bash

###############################################################################
# HVHC Big Data - Backup Script
# Automatically backup database, files, and configurations
###############################################################################

set -e

# Configuration
BACKUP_DIR="/backup/hvhc_bigdata"
APP_DIR="/opt/hvhc_bigdata"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔄 Starting backup process..."
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Backup PostgreSQL database
echo ""
echo "📊 Backing up PostgreSQL database..."
sudo -u postgres pg_dump hvhc_bigdata | gzip > "$BACKUP_DIR/$TIMESTAMP/database.sql.gz"
echo -e "${GREEN}✓ Database backup complete${NC}"

# Backup Redis data
echo ""
echo "🔴 Backing up Redis data..."
redis-cli --rdb "$BACKUP_DIR/$TIMESTAMP/redis_dump.rdb" BGSAVE
sleep 2
gzip "$BACKUP_DIR/$TIMESTAMP/redis_dump.rdb"
echo -e "${GREEN}✓ Redis backup complete${NC}"

# Backup application files
echo ""
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/$TIMESTAMP/app_files.tar.gz" \
    -C "$APP_DIR" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='uploads' \
    .
echo -e "${GREEN}✓ Application files backup complete${NC}"

# Backup uploads directory
echo ""
echo "📤 Backing up uploads..."
if [ -d "$APP_DIR/uploads" ]; then
    tar -czf "$BACKUP_DIR/$TIMESTAMP/uploads.tar.gz" -C "$APP_DIR" uploads
    echo -e "${GREEN}✓ Uploads backup complete${NC}"
else
    echo -e "${YELLOW}⚠ No uploads directory found${NC}"
fi

# Backup environment file
echo ""
echo "⚙️  Backing up environment configuration..."
if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BACKUP_DIR/$TIMESTAMP/.env.backup"
    echo -e "${GREEN}✓ Environment backup complete${NC}"
fi

# Create backup manifest
echo ""
echo "📝 Creating backup manifest..."
cat > "$BACKUP_DIR/$TIMESTAMP/MANIFEST.txt" <<EOF
HVHC Big Data System Backup
=============================
Timestamp: $TIMESTAMP
Date: $(date)
Hostname: $(hostname)
System: $(uname -a)

Contents:
- database.sql.gz (PostgreSQL dump)
- redis_dump.rdb.gz (Redis snapshot)
- app_files.tar.gz (Application code)
- uploads.tar.gz (User uploads)
- .env.backup (Environment configuration)

Database Info:
$(sudo -u postgres psql -d hvhc_bigdata -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "Could not retrieve user count")

Backup Size:
$(du -sh "$BACKUP_DIR/$TIMESTAMP" | cut -f1)
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$TIMESTAMP" | cut -f1)

# Clean old backups
echo ""
echo "🗑️  Cleaning old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;
echo -e "${GREEN}✓ Old backups cleaned${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Backup Complete!${NC}"
echo "=========================================="
echo "Backup Location: $BACKUP_DIR/$TIMESTAMP"
echo "Backup Size: $BACKUP_SIZE"
echo "Retention: $RETENTION_DAYS days"
echo ""
echo "Contents:"
echo "  - Database dump"
echo "  - Redis snapshot"
echo "  - Application files"
echo "  - Uploads"
echo "  - Configuration"
echo ""

# Send notification (optional)
# curl -X POST "https://your-notification-service.com/notify" \
#   -d "Backup completed: $TIMESTAMP"

exit 0
