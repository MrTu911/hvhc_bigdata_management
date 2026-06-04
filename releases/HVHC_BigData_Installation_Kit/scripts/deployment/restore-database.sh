#!/bin/bash

#######################################################
# HVHC BigData - Database Restore Script
# Khôi phục database từ backup
#######################################################

set -e

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="hvhc_bigdata"
DB_USER="hvhc_admin"
BACKUP_DIR="/opt/hvhc_bigdata/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../../.env" ]; then
    export $(grep -v '^#' "${SCRIPT_DIR}/../../.env" | xargs)
    
    if [ -n "$DATABASE_URL" ]; then
        DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi
fi

print_header() {
    echo -e "${YELLOW}"
    echo "============================================="
    echo "  HVHC BigData - Database Restore"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================="
    echo -e "${NC}"
}

print_warning() {
    echo -e "${RED}"
    echo "⚠️  CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu hiện tại!"
    echo "    Đảm bảo bạn đã backup dữ liệu mới nhất trước khi tiếp tục."
    echo -e "${NC}"
}

list_backups() {
    echo -e "${GREEN}=== Danh sách Backup có sẵn ===${NC}"
    echo ""
    
    echo "📁 Daily backups:"
    ls -lh "${BACKUP_DIR}/daily/"*.dump 2>/dev/null | tail -10 || echo "  (không có)"
    echo ""
    
    echo "📁 Weekly backups:"
    ls -lh "${BACKUP_DIR}/weekly/"*.dump 2>/dev/null | tail -5 || echo "  (không có)"
    echo ""
    
    echo "📁 Monthly backups:"
    ls -lh "${BACKUP_DIR}/monthly/"*.dump 2>/dev/null | tail -5 || echo "  (không có)"
    echo ""
    
    echo "📁 Full backups:"
    ls -lh "${BACKUP_DIR}/full/"*.dump 2>/dev/null | tail -5 || echo "  (không có)"
}

restore_from_dump() {
    local BACKUP_FILE=$1
    
    if [ ! -f "${BACKUP_FILE}" ]; then
        echo -e "${RED}Lỗi: File không tồn tại: ${BACKUP_FILE}${NC}"
        exit 1
    fi
    
    print_warning
    
    echo "File backup: ${BACKUP_FILE}"
    echo "Database đích: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo ""
    
    read -p "Bạn có chắc chắn muốn restore? (gõ 'YES' để xác nhận): " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo "Đã hủy restore."
        exit 0
    fi
    
    echo ""
    echo -e "${YELLOW}Đang restore...${NC}"
    
    export PGPASSWORD="${DB_PASSWORD}"
    
    # Drop and recreate database
    echo "Bước 1/3: Xóa database cũ..."
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
    
    echo "Bước 2/3: Tạo database mới..."
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    
    echo "Bước 3/3: Restore dữ liệu..."
    pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
        --clean --if-exists -v "${BACKUP_FILE}" 2>&1 | grep -v "WARNING" || true
    
    unset PGPASSWORD
    
    echo ""
    echo -e "${GREEN}✓ Restore hoàn tất!${NC}"
    echo ""
    echo "Các bước tiếp theo:"
    echo "  1. Kiểm tra dữ liệu: yarn prisma studio"
    echo "  2. Regenerate Prisma: yarn prisma generate"
    echo "  3. Khởi động lại app: pm2 restart hvhc-bigdata"
}

restore_from_sql() {
    local SQL_FILE=$1
    
    # Handle gzipped files
    if [[ "${SQL_FILE}" == *.gz ]]; then
        echo "Giải nén file..."
        gunzip -k "${SQL_FILE}"
        SQL_FILE="${SQL_FILE%.gz}"
    fi
    
    if [ ! -f "${SQL_FILE}" ]; then
        echo -e "${RED}Lỗi: File không tồn tại: ${SQL_FILE}${NC}"
        exit 1
    fi
    
    print_warning
    
    read -p "Bạn có chắc chắn muốn restore? (gõ 'YES' để xác nhận): " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo "Đã hủy restore."
        exit 0
    fi
    
    echo -e "${YELLOW}Đang restore từ SQL...${NC}"
    
    export PGPASSWORD="${DB_PASSWORD}"
    
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${SQL_FILE}"
    
    unset PGPASSWORD
    
    echo -e "${GREEN}✓ Restore hoàn tất!${NC}"
}

restore_latest() {
    local BACKUP_TYPE=$1
    local SEARCH_DIR="${BACKUP_DIR}/daily"
    
    case "$BACKUP_TYPE" in
        "weekly")
            SEARCH_DIR="${BACKUP_DIR}/weekly"
            ;;
        "monthly")
            SEARCH_DIR="${BACKUP_DIR}/monthly"
            ;;
        "full")
            SEARCH_DIR="${BACKUP_DIR}/full"
            ;;
    esac
    
    local LATEST=$(ls -t "${SEARCH_DIR}/"*.dump 2>/dev/null | head -1)
    
    if [ -z "${LATEST}" ]; then
        echo -e "${RED}Không tìm thấy backup ${BACKUP_TYPE}!${NC}"
        exit 1
    fi
    
    echo "Backup mới nhất: ${LATEST}"
    restore_from_dump "${LATEST}"
}

show_help() {
    echo "Sử dụng: $0 [OPTION] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  --list              Liệt kê các backup có sẵn"
    echo "  --latest            Restore từ backup daily mới nhất"
    echo "  --latest-weekly     Restore từ backup weekly mới nhất"
    echo "  --latest-monthly    Restore từ backup monthly mới nhất"
    echo "  --file <path>       Restore từ file cụ thể (.dump hoặc .sql)"
    echo "  --help              Hiển thị help"
    echo ""
    echo "Ví dụ:"
    echo "  $0 --list"
    echo "  $0 --latest"
    echo "  $0 --file /path/to/backup.dump"
    echo "  $0 backup_20250228_120000.dump"
}

main() {
    print_header
    
    case "$1" in
        "--help"|-h)
            show_help
            ;;
        "--list")
            list_backups
            ;;
        "--latest")
            restore_latest "daily"
            ;;
        "--latest-weekly")
            restore_latest "weekly"
            ;;
        "--latest-monthly")
            restore_latest "monthly"
            ;;
        "--file")
            if [ -z "$2" ]; then
                echo -e "${RED}Lỗi: Thiếu đường dẫn file${NC}"
                exit 1
            fi
            
            if [[ "$2" == *.dump ]]; then
                restore_from_dump "$2"
            else
                restore_from_sql "$2"
            fi
            ;;
        "")
            show_help
            ;;
        *)
            # Assume it's a file path
            if [ -f "$1" ]; then
                if [[ "$1" == *.dump ]]; then
                    restore_from_dump "$1"
                else
                    restore_from_sql "$1"
                fi
            elif [ -f "${BACKUP_DIR}/daily/$1" ]; then
                restore_from_dump "${BACKUP_DIR}/daily/$1"
            else
                echo -e "${RED}Lỗi: File không tồn tại: $1${NC}"
                exit 1
            fi
            ;;
    esac
}

main "$@"
