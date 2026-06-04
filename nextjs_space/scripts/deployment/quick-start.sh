#!/bin/bash

#######################################################
# HVHC BigData - Quick Start Script
# Chạy nhanh sau khi đã cài đặt
#######################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "============================================="
echo "  HVHC BigData - Quick Start"
echo "============================================="
echo -e "${NC}"

cd "${APP_DIR}"

case "$1" in
    "dev")
        echo "Khởi động Development mode..."
        yarn dev
        ;;
    "prod")
        echo "Khởi động Production mode..."
        yarn build && yarn start
        ;;
    "pm2")
        echo "Khởi động với PM2..."
        if [ -f ecosystem.config.js ]; then
            pm2 start ecosystem.config.js
        else
            pm2 start yarn --name "hvhc-bigdata" -- start
        fi
        pm2 status
        ;;
    "docker")
        echo "Khởi động với Docker..."
        cd "${SCRIPT_DIR}"
        docker-compose up -d
        docker-compose ps
        ;;
    "stop")
        echo "Dừng ứng dụng..."
        pm2 stop hvhc-bigdata 2>/dev/null || true
        docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" down 2>/dev/null || true
        echo "Đã dừng."
        ;;
    "logs")
        pm2 logs hvhc-bigdata
        ;;
    "status")
        echo "=== PM2 Status ==="
        pm2 status 2>/dev/null || echo "PM2 không chạy"
        echo ""
        echo "=== Docker Status ==="
        docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" ps 2>/dev/null || echo "Docker không chạy"
        ;;
    "backup")
        "${SCRIPT_DIR}/backup-database.sh" "$2"
        ;;
    "restore")
        "${SCRIPT_DIR}/restore-database.sh" "$2" "$3"
        ;;
    *)
        echo "Sử dụng: $0 {dev|prod|pm2|docker|stop|logs|status|backup|restore}"
        echo ""
        echo "Commands:"
        echo "  dev       - Chạy development mode (yarn dev)"
        echo "  prod      - Build và chạy production (yarn build && yarn start)"
        echo "  pm2       - Chạy với PM2 process manager"
        echo "  docker    - Chạy với Docker Compose"
        echo "  stop      - Dừng tất cả services"
        echo "  logs      - Xem PM2 logs"
        echo "  status    - Kiểm tra trạng thái services"
        echo "  backup    - Backup database (--daily|--weekly|--full)"
        echo "  restore   - Restore database (--latest|--file <path>)"
        echo ""
        echo "Ví dụ:"
        echo "  $0 dev              # Chạy development"
        echo "  $0 backup --daily   # Backup hàng ngày"
        echo "  $0 restore --latest # Restore backup mới nhất"
        ;;
esac
