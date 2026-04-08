#!/bin/bash
# ============================================
# HVHC BigData - Database Restore Script
# ============================================

set -e

# Default local configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="hvhc_bigdata_dev"
DB_USER="hvhc_dev"
DB_PASS="hvhc_dev_2025"

# Parse arguments
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file> [options]"
  echo ""
  echo "Options:"
  echo "  --host <host>     Database host (default: localhost)"
  echo "  --port <port>     Database port (default: 5432)"
  echo "  --db <database>   Database name (default: hvhc_bigdata_dev)"
  echo "  --user <user>     Database user (default: hvhc_dev)"
  echo ""
  echo "Examples:"
  echo "  $0 hvhc_full_20260220.dump"
  echo "  $0 hvhc_sql_20260220.sql --db hvhc_production"
  exit 1
fi

# Parse additional options
shift
while [[ $# -gt 0 ]]; do
  case $1 in
    --host) DB_HOST="$2"; shift 2 ;;
    --port) DB_PORT="$2"; shift 2 ;;
    --db) DB_NAME="$2"; shift 2 ;;
    --user) DB_USER="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "==========================================="
echo "HVHC BigData - Database Restore"
echo "==========================================="
echo "Backup file: $BACKUP_FILE"
echo "Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "==========================================="

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirm
read -p "⚠️  This will overwrite the database. Continue? (y/N) " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Determine file type and restore
if [[ "$BACKUP_FILE" == *.dump ]]; then
  echo ""
  echo "Restoring from custom format backup..."
  PGPASSWORD="$DB_PASS" pg_restore \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --clean --if-exists \
    -v "$BACKUP_FILE"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
  echo ""
  echo "Restoring from SQL backup..."
  PGPASSWORD="$DB_PASS" psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f "$BACKUP_FILE"
else
  echo "❌ Unknown file format. Use .dump or .sql"
  exit 1
fi

if [ $? -eq 0 ]; then
  echo ""
  echo "==========================================="
  echo "✅ RESTORE COMPLETE"
  echo "==========================================="
  echo ""
  echo "Next steps:"
  echo "1. cd nextjs_space"
  echo "2. yarn prisma generate"
  echo "3. yarn dev"
else
  echo "❌ Restore failed"
  exit 1
fi
