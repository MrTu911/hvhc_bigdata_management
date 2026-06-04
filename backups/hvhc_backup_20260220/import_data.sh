#!/bin/bash
# ============================================
# HVHC BigData - CSV Data Import Script
# ============================================

# Default configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hvhc_bigdata_dev}"
DB_USER="${DB_USER:-hvhc_dev}"
DB_PASS="${DB_PASS:-hvhc_dev_2025}"

CSV_DIR="$(dirname "$0")/csv"

echo "=== HVHC BigData Data Import ==="
echo "Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Import order matters due to foreign keys
# First: tables without dependencies
TABLES_ORDER=(
  "units"
  "functions"
  "positions"
  "position_functions"
  "users"
  "user_positions"
  "personnel"
  "party_members"
  "officer_careers"
  "soldier_profiles"
  "policy_records"
  "awards_records"
  "education_history"
  "work_experience"
  "family_relations"
)

for table in "${TABLES_ORDER[@]}"; do
  CSV_FILE="$CSV_DIR/${table}.csv"
  if [ -f "$CSV_FILE" ]; then
    # Check if file has data (more than header)
    LINES=$(wc -l < "$CSV_FILE")
    if [ "$LINES" -gt 1 ]; then
      PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "TRUNCATE TABLE $table CASCADE;" 2>/dev/null
      
      PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY $table FROM '$CSV_FILE' WITH CSV HEADER" 2>/dev/null
      
      if [ $? -eq 0 ]; then
        echo "✅ $table: $((LINES-1)) records imported"
      else
        echo "⚠️  $table: import failed"
      fi
    else
      echo "⏭️  $table: empty, skipped"
    fi
  else
    echo "⏭️  $table: file not found"
  fi
done

echo ""
echo "Import complete!"
