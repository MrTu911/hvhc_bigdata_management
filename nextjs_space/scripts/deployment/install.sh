#!/bin/bash

#######################################################
# HVHC BigData Management System - Installation Script
# Version: 1.0
# Hỗ trợ: Ubuntu 20.04, 22.04, 24.04
#######################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hvhc-bigdata"
INSTALL_DIR="/opt/hvhc_bigdata"
DB_NAME="hvhc_bigdata"
DB_USER="hvhc_admin"
DB_PASSWORD="MatKhauManh@2025"  # THAY ĐỔI MẬT KHẨU NÀY!
NODE_VERSION="20"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "============================================="
    echo "  HVHC BigData - Hệ thống Quản lý Dữ liệu Lớn"
    echo "  Script Cài đặt Tự động v1.0"
    echo "============================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Không nên chạy script này với quyền root!"
        print_warning "Hãy chạy với user thường, script sẽ tự động dùng sudo khi cần."
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        print_error "Script này chỉ hỗ trợ Ubuntu!"
        exit 1
    fi
}

install_dependencies() {
    print_step "Cập nhật hệ thống và cài đặt dependencies..."
    sudo apt update
    sudo apt install -y curl wget git build-essential software-properties-common
}

install_nodejs() {
    print_step "Cài đặt Node.js v${NODE_VERSION}..."
    
    if command -v node &> /dev/null; then
        current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$current_version" -ge "${NODE_VERSION}" ]; then
            print_success "Node.js v$(node -v) đã được cài đặt"
            return
        fi
    fi
    
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node.js
    nvm install ${NODE_VERSION}
    nvm use ${NODE_VERSION}
    nvm alias default ${NODE_VERSION}
    
    print_success "Node.js v$(node -v) đã được cài đặt"
}

install_yarn() {
    print_step "Cài đặt Yarn..."
    npm install -g yarn
    print_success "Yarn v$(yarn -v) đã được cài đặt"
}

install_postgresql() {
    print_step "Cài đặt PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL đã được cài đặt"
    else
        sudo apt install -y postgresql postgresql-contrib
    fi
    
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    print_success "PostgreSQL đã sẵn sàng"
}

setup_database() {
    print_step "Tạo database và user..."
    
    # Check if database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
        print_warning "Database '${DB_NAME}' đã tồn tại"
    else
        sudo -u postgres psql <<EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
        print_success "Database '${DB_NAME}' đã được tạo"
    fi
}

install_redis() {
    print_step "Cài đặt Redis (tùy chọn)..."
    
    read -p "Bạn có muốn cài đặt Redis (cho caching)? [y/N]: " install_redis_choice
    
    if [[ "$install_redis_choice" =~ ^[Yy]$ ]]; then
        sudo apt install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
        print_success "Redis đã được cài đặt"
    else
        print_warning "Bỏ qua cài đặt Redis"
    fi
}

setup_application() {
    print_step "Cài đặt ứng dụng..."
    
    # Get script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
    
    cd "${APP_DIR}"
    
    print_step "Cài đặt Node.js dependencies..."
    yarn install
    
    print_step "Tạo file .env..."
    if [ ! -f .env ]; then
        cat > .env <<EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Redis (tùy chọn)
REDIS_URL="redis://localhost:6379"

# AI/ML API (tùy chọn)
# ABACUSAI_API_KEY="your-api-key"
EOF
        print_success "File .env đã được tạo"
    else
        print_warning "File .env đã tồn tại, bỏ qua"
    fi
    
    print_step "Khởi tạo Prisma..."
    yarn prisma generate
    
    print_step "Tạo database schema..."
    yarn prisma db push
    
    print_step "Seed dữ liệu mẫu..."
    yarn prisma db seed || print_warning "Seed có thể đã được chạy trước đó"
}

build_application() {
    print_step "Build ứng dụng production..."
    yarn build
    print_success "Build hoàn tất"
}

install_pm2() {
    print_step "Cài đặt PM2..."
    npm install -g pm2
    print_success "PM2 đã được cài đặt"
}

setup_pm2() {
    print_step "Cấu hình PM2..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
    
    cd "${APP_DIR}"
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'yarn',
    args: 'start',
    cwd: '${APP_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
    
    print_success "PM2 ecosystem file đã được tạo"
}

print_completion() {
    echo -e "${GREEN}"
    echo "============================================="
    echo "  CÀI ĐẶT HOÀN TẤT!"
    echo "============================================="
    echo -e "${NC}"
    echo ""
    echo "Thông tin cài đặt:"
    echo "  - Database: ${DB_NAME}"
    echo "  - User: ${DB_USER}"
    echo "  - URL: http://localhost:3000"
    echo ""
    echo "Các lệnh hữu ích:"
    echo "  yarn dev          # Chạy development mode"
    echo "  yarn start        # Chạy production mode"
    echo "  pm2 start ecosystem.config.js  # Chạy với PM2"
    echo ""
    echo "Tài khoản mặc định:"
    echo "  Email: admin@hvhc.edu.vn"
    echo "  Mật khẩu: Hv@2025"
    echo ""
    print_warning "Hãy thay đổi mật khẩu database và các credentials ngay!"
}

# Main installation
main() {
    print_header
    
    check_root
    check_ubuntu
    
    echo -e "${YELLOW}Bắt đầu cài đặt HVHC BigData Management System...${NC}"
    echo ""
    
    read -p "Tiếp tục cài đặt? [Y/n]: " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo "Đã hủy cài đặt."
        exit 0
    fi
    
    install_dependencies
    install_nodejs
    
    # Reload NVM for this session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    install_yarn
    install_postgresql
    setup_database
    install_redis
    setup_application
    build_application
    install_pm2
    setup_pm2
    
    print_completion
}

# Run main function
main "$@"
