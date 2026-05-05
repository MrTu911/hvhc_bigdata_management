#!/bin/bash

#######################################################
# HVHC BigData - Database Backup Script
# Hỗ trợ: Full backup, Incremental backup, Remote backup
#######################################################

set -e

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="hvhc_bigdata"
DB_USER="hvhc_admin"
BACKUP_DIR="/opt/hvhc_bigdata/backups"
REMOTE_BACKUP_DIR=""  # Để trống nếu không dùng remote
RETENTION_DAYS=30
LOG_FILE="/var/log/hvhc_backup.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables if exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../../.env" ]; then
    export $(grep -v '^#' "${SCRIPT_DIR}/../../.env" | xargs)
    
    # Parse DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        # Extract credentials from DATABASE_URL
        DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

print_header() {
    echo -e "${GREEN}"
    echo "============================================="
    echo "  HVHC BigData - Database Backup"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================="
    echo -e "${NC}"
}

# Full database backup
full_backup() {
    local BACKUP_TYPE=$1
    local BACKUP_SUBDIR="daily"
    
    case "$BACKUP_TYPE" in
        "--weekly"|"weekly")
            BACKUP_SUBDIR="weekly"
            ;;
        "--monthly"|"monthly")
            BACKUP_SUBDIR="monthly"
            ;;
        "--full"|"full")
            BACKUP_SUBDIR="full"
            mkdir -p "${BACKUP_DIR}/full"
            ;;
    esac
    
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="${BACKUP_DIR}/${BACKUP_SUBDIR}/${DB_NAME}_${TIMESTAMP}.dump"
    local BACKUP_SQL="${BACKUP_DIR}/${BACKUP_SUBDIR}/${DB_NAME}_${TIMESTAMP}.sql"
    
    log "Bắt đầu backup ${BACKUP_SUBDIR}..."
    log "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    
    # Set password for pg_dump
    export PGPASSWORD="${DB_PASSWORD}"
    
    # Backup as custom format (compressed)
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
        -F c -b -v -f "${BACKUP_FILE}" 2>> "${LOG_FILE}"
    
    # Also create SQL backup for readability
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
        --clean --if-exists -f "${BACKUP_SQL}" 2>> "${LOG_FILE}"
    
    # Compress SQL file
    gzip -f "${BACKUP_SQL}"
    
    # Calculate sizes
    local DUMP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    local SQL_SIZE=$(du -h "${BACKUP_SQL}.gz" | cut -f1)
    
    log "Backup hoàn tất:"
    log "  - Dump file: ${BACKUP_FILE} (${DUMP_SIZE})"
    log "  - SQL file: ${BACKUP_SQL}.gz (${SQL_SIZE})"
    
    unset PGPASSWORD
    
    echo -e "${GREEN}✓ Backup thành công: ${BACKUP_FILE}${NC}"
}

# Schema only backup
schema_backup() {
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local SCHEMA_FILE="${BACKUP_DIR}/schema_${TIMESTAMP}.sql"
    
    log "Backup schema..."
    
    export PGPASSWORD="${DB_PASSWORD}"
    
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
        -s -f "${SCHEMA_FILE}" 2>> "${LOG_FILE}"
    
    gzip -f "${SCHEMA_FILE}"
    
    unset PGPASSWORD
    
    log "Schema backup: ${SCHEMA_FILE}.gz"
    echo -e "${GREEN}✓ Schema backup: ${SCHEMA_FILE}.gz${NC}"
}

# Data only backup
data_backup() {
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local DATA_FILE="${BACKUP_DIR}/data_${TIMESTAMP}.sql"
    
    log "Backup data only..."
    
    export PGPASSWORD="${DB_PASSWORD}"
    
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
        -a -f "${DATA_FILE}" 2>> "${LOG_FILE}"
    
    gzip -f "${DATA_FILE}"
    
    unset PGPASSWORD
    
    log "Data backup: ${DATA_FILE}.gz"
    echo -e "${GREEN}✓ Data backup: ${DATA_FILE}.gz${NC}"
}

# Clean old backups
cleanup_old_backups() {
    log "Xóa backup cũ hơn ${RETENTION_DAYS} ngày..."
    
    # Daily backups - keep for RETENTION_DAYS
    find "${BACKUP_DIR}/daily" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    
    # Weekly backups - keep for 3 months
    find "${BACKUP_DIR}/weekly" -type f -mtime +90 -delete 2>/dev/null || true
    
    # Monthly backups - keep for 1 year
    find "${BACKUP_DIR}/monthly" -type f -mtime +365 -delete 2>/dev/null || true
    
    log "Cleanup hoàn tất"
}

# Copy to remote (optional)
remote_sync() {
    if [ -n "${REMOTE_BACKUP_DIR}" ]; then
        log "Đồng bộ backup lên remote..."
        rsync -avz --progress "${BACKUP_DIR}/" "${REMOTE_BACKUP_DIR}/"
        log "Remote sync hoàn tất"
    fi
}

# Show backup statistics
show_stats() {
    echo ""
    echo -e "${YELLOW}=== Thống kê Backup ===${NC}"
    echo "Thư mục backup: ${BACKUP_DIR}"
    echo ""
    
    echo "Daily backups:"
    ls -lh "${BACKUP_DIR}/daily/" 2>/dev/null | tail -5 || echo "  (trống)"
    echo ""
    
    echo "Weekly backups:"
    ls -lh "${BACKUP_DIR}/weekly/" 2>/dev/null | tail -3 || echo "  (trống)"
    echo ""
    
    echo "Tổng dung lượng:"
    du -sh "${BACKUP_DIR}" 2>/dev/null || echo "  N/A"
}

# Help
show_help() {
    echo "Sử dụng: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  (không có)     Backup hàng ngày (daily)"
    echo "  --full         Full backup"
    echo "  --weekly       Weekly backup"
    echo "  --monthly      Monthly backup"
    echo "  --schema       Chỉ backup schema"
    echo "  --data         Chỉ backup data"
    echo "  --stats        Hiển thị thống kê backup"
    echo "  --cleanup      Xóa backup cũ"
    echo "  --help         Hiển thị help"
}

# Main
main() {
    print_header
    
    case "$1" in
        "--help"|-h)
            show_help
            ;;
        "--stats")
            show_stats
            ;;
        "--cleanup")
            cleanup_old_backups
            ;;
        "--schema")
            schema_backup
            ;;
        "--data")
            data_backup
            ;;
        "--weekly")
            full_backup "weekly"
            cleanup_old_backups
            remote_sync
            ;;
        "--monthly")
            full_backup "monthly"
            cleanup_old_backups
            remote_sync
            ;;
        "--full")
            full_backup "full"
            schema_backup
            cleanup_old_backups
            remote_sync
            ;;
        *)
            full_backup "daily"
            cleanup_old_backups
            ;;
    esac
    
    log "=== Kết thúc backup ==="
}

main "$@"
