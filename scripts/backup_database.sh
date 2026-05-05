#!/bin/bash
# ============================================
# HVHC BigData - Database Backup Script
# ============================================

# Configuration
DB_HOST="db-10861c45f0.db002.hosteddb.reai.io"
DB_PORT="5432"
DB_NAME="10861c45f0"
DB_USER="role_10861c45f0"
DB_PASS="s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt"

# Backup directory
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "==========================================="
echo "HVHC BigData - Database Backup"
echo "Date: $(date)"
echo "==========================================="

# 1. Full backup (custom format - recommended)
echo "[1/4] Creating full backup (custom format)..."
PGPASSWORD="$DB_PASS" pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c -b -v \
  -f "$BACKUP_DIR/hvhc_full_$DATE.dump" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Full backup created: hvhc_full_$DATE.dump"
else
  echo "❌ Full backup failed"
fi

# 2. SQL backup (plain text)
echo "[2/4] Creating SQL backup..."
PGPASSWORD="$DB_PASS" pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --no-owner --no-acl \
  -f "$BACKUP_DIR/hvhc_sql_$DATE.sql" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ SQL backup created: hvhc_sql_$DATE.sql"
else
  echo "❌ SQL backup failed"
fi

# 3. Schema only
echo "[3/4] Creating schema backup..."
PGPASSWORD="$DB_PASS" pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --schema-only --no-owner --no-acl \
  -f "$BACKUP_DIR/hvhc_schema_$DATE.sql" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Schema backup created: hvhc_schema_$DATE.sql"
else
  echo "❌ Schema backup failed"
fi

# 4. Export important tables to CSV
echo "[4/4] Exporting CSV files..."
TABLES="users personnel units user_positions party_members officer_careers soldier_profiles insurance_info policy_records"

mkdir -p "$BACKUP_DIR/csv_$DATE"

for table in $TABLES; do
  PGPASSWORD="$DB_PASS" psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -c "\COPY $table TO '$BACKUP_DIR/csv_$DATE/${table}.csv' WITH CSV HEADER" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Exported: ${table}.csv"
  else
    echo "  ⚠️  Table $table not found or export failed"
  fi
done

# Summary
echo ""
echo "==========================================="
echo "BACKUP COMPLETE"
echo "==========================================="
echo "Location: $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$DATE* 2>/dev/null
echo ""
echo "To restore on new server:"
echo "  pg_restore -h localhost -U hvhc_admin -d hvhc_bigdata hvhc_full_$DATE.dump"
echo "  OR"
echo "  psql -h localhost -U hvhc_admin -d hvhc_bigdata < hvhc_sql_$DATE.sql"
