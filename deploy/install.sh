#!/usr/bin/env bash
# =============================================================================
# HVHC BigData Management System — Ubuntu Server Installer
# =============================================================================
# Hỗ trợ 2 kịch bản:
#   1. GitHub  — tải source trực tiếp từ GitHub (cần Internet)
#   2. USB     — cài từ USB/archive đã đóng gói sẵn (offline)
#
# Tương thích: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS
# Yêu cầu: chạy với quyền sudo hoặc root
#
# Cách dùng:
#   sudo bash install.sh            # chế độ tương tác (hỏi kịch bản)
#   sudo bash install.sh github     # kịch bản GitHub
#   sudo bash install.sh usb /path/to/hvhc_bigdata_management
# =============================================================================

set -euo pipefail

# ─── Màu sắc ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ─── Cấu hình mặc định ────────────────────────────────────────────────────────
APP_NAME="hvhc_bigdata_management"
APP_DIR="/opt/${APP_NAME}"
APP_USER="hvhc"
APP_GROUP="hvhc"
NODE_VERSION="20"
PG_VERSION="16"
PG_DB="hvhc_bigdata_89"
PG_USER="ductuking"
NEXTJS_DIR="${APP_DIR}/nextjs_space"
LOG_FILE="/var/log/hvhc_install.log"
GITHUB_REPO="https://github.com/YOUR_ORG/hvhc_bigdata_management.git"  # ← đổi trước khi dùng

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $*" | tee -a "$LOG_FILE"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $*" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}" | tee -a "$LOG_FILE"; }
ask()     { echo -e "${YELLOW}[?]${NC} $*"; }

require_root() {
  [[ $EUID -eq 0 ]] || error "Script phải chạy với quyền root: sudo bash $0"
}

check_ubuntu() {
  local ver
  ver=$(lsb_release -rs 2>/dev/null | cut -d. -f1)
  [[ "$ver" -ge 20 ]] || error "Yêu cầu Ubuntu 20.04 trở lên (hiện tại: $(lsb_release -ds))"
}

print_banner() {
  echo -e "${BOLD}${CYAN}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║      HVHC BigData Management — Ubuntu Server Installer   ║"
  echo "║      Học viện Hậu cần — Hệ thống Quản lý Dữ liệu lớn   ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  info "Log file: $LOG_FILE"
  info "Bắt đầu: $(date '+%Y-%m-%d %H:%M:%S')"
}

# ─── Cài đặt phụ thuộc hệ thống ───────────────────────────────────────────────
install_system_deps() {
  section "Cài đặt gói hệ thống"
  apt-get update -qq | tee -a "$LOG_FILE"
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl wget git build-essential software-properties-common \
    ufw fail2ban htop vim nano unzip lsb-release gnupg2 \
    ca-certificates apt-transport-https \
    openssl pwgen jq rsync pv \
    | tee -a "$LOG_FILE"
  ok "Gói hệ thống đã cài xong"
}

# ─── Node.js ──────────────────────────────────────────────────────────────────
install_nodejs() {
  section "Cài đặt Node.js ${NODE_VERSION}.x"
  if command -v node &>/dev/null; then
    local installed
    installed=$(node -v | sed 's/v//' | cut -d. -f1)
    if [[ "$installed" -ge "$NODE_VERSION" ]]; then
      ok "Node.js $(node -v) đã cài sẵn"
      return
    fi
    warn "Node.js cũ ($(node -v)), tiến hành nâng cấp..."
  fi
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - >> "$LOG_FILE" 2>&1
  apt-get install -y -qq nodejs | tee -a "$LOG_FILE"
  npm install -g npm@latest pm2 >> "$LOG_FILE" 2>&1
  ok "Node.js $(node -v) và PM2 $(pm2 -v) đã cài xong"
}

# Offline: giải nén Node từ archive trên USB
install_nodejs_offline() {
  local usb_dir="$1"
  local archive
  archive=$(find "$usb_dir/offline-pkgs" -name "node-v${NODE_VERSION}*.tar.xz" 2>/dev/null | head -1)
  if [[ -n "$archive" ]]; then
    section "Cài Node.js từ archive offline: $(basename "$archive")"
    tar -xf "$archive" -C /usr/local --strip-components=1 >> "$LOG_FILE" 2>&1
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    ok "Node.js $(node -v) đã cài xong (offline)"
  else
    warn "Không tìm thấy Node.js archive trong $usb_dir/offline-pkgs — thử cài online..."
    install_nodejs
  fi
}

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
install_postgresql() {
  section "Cài đặt PostgreSQL ${PG_VERSION}"
  if command -v psql &>/dev/null; then
    ok "PostgreSQL đã cài sẵn: $(psql --version)"
    return
  fi
  # Thêm repo chính thức của PostgreSQL
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/postgresql.gpg] \
https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor > /usr/share/keyrings/postgresql.gpg
  apt-get update -qq >> "$LOG_FILE" 2>&1
  apt-get install -y -qq postgresql-${PG_VERSION} postgresql-contrib-${PG_VERSION} \
    | tee -a "$LOG_FILE"
  systemctl enable postgresql
  systemctl start postgresql
  ok "PostgreSQL ${PG_VERSION} đã cài và khởi động"
}

configure_postgresql() {
  section "Cấu hình PostgreSQL"
  local pg_pass

  # Sinh mật khẩu ngẫu nhiên nếu chưa có trong .env
  if [[ -f "${NEXTJS_DIR}/.env" ]]; then
    pg_pass=$(grep DATABASE_URL "${NEXTJS_DIR}/.env" | grep -oP '(?<=:)[^@%]*(?=%40|@)' | head -1 || true)
  fi
  pg_pass=${pg_pass:-$(pwgen -s 24 1)}

  # Tạo user + database
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" \
    | grep -q 1 || sudo -u postgres psql -c "CREATE USER ${PG_USER} WITH PASSWORD '${pg_pass}';"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" \
    | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};"

  # Ghi lại thông tin kết nối để dùng khi cấu hình .env
  DB_PASS="$pg_pass"
  DATABASE_URL="postgresql://${PG_USER}:${pg_pass}@localhost:5432/${PG_DB}?schema=public"
  ok "PostgreSQL database '${PG_DB}' và user '${PG_USER}' đã sẵn sàng"
}

# ─── Redis ────────────────────────────────────────────────────────────────────
install_redis() {
  section "Cài đặt Redis"
  if command -v redis-server &>/dev/null; then
    ok "Redis đã cài sẵn: $(redis-server --version | head -1)"
    return
  fi
  apt-get install -y -qq redis-server | tee -a "$LOG_FILE"
  local redis_pass
  redis_pass=$(pwgen -s 32 1)
  REDIS_PASS="$redis_pass"
  # Cấu hình Redis: bind localhost + requirepass
  sed -i "s/^# bind 127.0.0.1.*/bind 127.0.0.1/" /etc/redis/redis.conf
  sed -i "s/^# requirepass .*/requirepass ${redis_pass}/" /etc/redis/redis.conf
  sed -i "s/^requirepass .*/requirepass ${redis_pass}/" /etc/redis/redis.conf
  systemctl enable redis-server
  systemctl restart redis-server
  ok "Redis đã cài và khởi động (password set)"
}

# ─── MinIO ────────────────────────────────────────────────────────────────────
install_minio() {
  section "Cài đặt MinIO"
  if command -v minio &>/dev/null; then
    ok "MinIO đã cài sẵn"
    return
  fi
  local usb_dir="${1:-}"
  local minio_bin="${usb_dir}/offline-pkgs/minio"
  if [[ -n "$usb_dir" && -f "$minio_bin" ]]; then
    install -m 755 "$minio_bin" /usr/local/bin/minio
  else
    wget -q "https://dl.min.io/server/minio/release/linux-amd64/minio" \
      -O /usr/local/bin/minio >> "$LOG_FILE" 2>&1
    chmod +x /usr/local/bin/minio
  fi

  local minio_pass
  minio_pass=$(pwgen -s 24 1)
  MINIO_ACCESS_KEY="hvhc_minio_admin"
  MINIO_SECRET_KEY="$minio_pass"

  useradd -r -s /sbin/nologin minio-user 2>/dev/null || true
  mkdir -p /var/lib/minio/data
  chown -R minio-user:minio-user /var/lib/minio

  cat > /etc/default/minio <<EOF
MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
MINIO_VOLUMES=/var/lib/minio/data
MINIO_OPTS="--console-address :9001"
EOF

  # Systemd service
  cat > /etc/systemd/system/minio.service <<'UNIT'
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

  systemctl daemon-reload
  systemctl enable minio
  systemctl start minio
  ok "MinIO đã cài và khởi động (port 9000/9001)"
}

# ─── Tạo app user ─────────────────────────────────────────────────────────────
create_app_user() {
  section "Tạo user ứng dụng: ${APP_USER}"
  if id "${APP_USER}" &>/dev/null; then
    ok "User '${APP_USER}' đã tồn tại"
    return
  fi
  useradd -m -s /bin/bash -G sudo "${APP_USER}"
  ok "User '${APP_USER}' đã tạo"
}

# ─── Kịch bản 1: Clone từ GitHub ──────────────────────────────────────────────
deploy_from_github() {
  section "Kịch bản 1 — Clone từ GitHub"
  [[ -n "$GITHUB_REPO" ]] || error "Chưa cấu hình GITHUB_REPO trong script"

  if [[ -d "${APP_DIR}/.git" ]]; then
    warn "Repo đã tồn tại, thực hiện git pull..."
    git -C "${APP_DIR}" pull --ff-only >> "$LOG_FILE" 2>&1
  else
    info "Clone repo vào ${APP_DIR}..."
    git clone --depth=1 "${GITHUB_REPO}" "${APP_DIR}" >> "$LOG_FILE" 2>&1
  fi
  chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
  ok "Source code đã sẵn sàng tại ${APP_DIR}"
}

# ─── Kịch bản 2: Cài từ USB/archive ──────────────────────────────────────────
deploy_from_usb() {
  local usb_src="$1"
  section "Kịch bản 2 — Cài từ USB: ${usb_src}"

  [[ -d "$usb_src" ]] || error "Không tìm thấy thư mục nguồn: ${usb_src}"

  # Tìm archive hoặc thư mục source trực tiếp
  local archive
  archive=$(find "$usb_src" -maxdepth 2 -name "${APP_NAME}*.tar.gz" -o -name "source.tar.gz" 2>/dev/null | head -1 || true)

  if [[ -n "$archive" ]]; then
    info "Giải nén archive: $(basename "$archive")..."
    mkdir -p "${APP_DIR}"
    pv "$archive" | tar -xz --strip-components=1 -C "${APP_DIR}" 2>> "$LOG_FILE"
  elif [[ -f "${usb_src}/nextjs_space/package.json" ]]; then
    info "Copy source trực tiếp từ ${usb_src}..."
    rsync -a --info=progress2 \
      --exclude='node_modules' \
      --exclude='.next' \
      --exclude='*.log' \
      "${usb_src}/" "${APP_DIR}/" 2>> "$LOG_FILE"
  else
    error "Không tìm thấy archive hoặc source hợp lệ trong: ${usb_src}"
  fi

  chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
  ok "Source code đã copy vào ${APP_DIR}"
}

# ─── Khôi phục DB từ USB (nếu có) ────────────────────────────────────────────
restore_db_from_usb() {
  local usb_src="$1"
  local dump
  dump=$(find "$usb_src" -maxdepth 3 \
    \( -name "*.dump" -o -name "*.sql.gz" -o -name "*.sql" \) \
    -not -path "*/node_modules/*" \
    2>/dev/null | sort -r | head -1 || true)

  [[ -n "$dump" ]] || { warn "Không tìm thấy backup DB trong USB — bỏ qua restore"; return; }

  section "Khôi phục Database từ: $(basename "$dump")"
  case "$dump" in
    *.dump)
      sudo -u postgres pg_restore -d "${PG_DB}" -j4 --no-owner "$dump" >> "$LOG_FILE" 2>&1 || warn "pg_restore có cảnh báo (có thể bỏ qua)"
      ;;
    *.sql.gz)
      zcat "$dump" | sudo -u postgres psql "${PG_DB}" >> "$LOG_FILE" 2>&1
      ;;
    *.sql)
      sudo -u postgres psql "${PG_DB}" < "$dump" >> "$LOG_FILE" 2>&1
      ;;
  esac
  ok "Database đã khôi phục từ $(basename "$dump")"
}

# ─── Cài npm dependencies ─────────────────────────────────────────────────────
install_app_deps() {
  section "Cài đặt Node dependencies"
  [[ -d "${NEXTJS_DIR}" ]] || error "Không tìm thấy nextjs_space tại ${NEXTJS_DIR}"
  cd "${NEXTJS_DIR}"

  # Thử node_modules offline từ USB trước
  if [[ -d "${NEXTJS_DIR}/.npm-offline-cache" ]]; then
    info "Cài từ offline npm cache..."
    sudo -u "${APP_USER}" npm install \
      --prefer-offline --cache .npm-offline-cache \
      --legacy-peer-deps >> "$LOG_FILE" 2>&1
  else
    sudo -u "${APP_USER}" npm ci --legacy-peer-deps >> "$LOG_FILE" 2>&1
  fi
  ok "Dependencies đã cài xong"
}

# ─── Tạo file .env ────────────────────────────────────────────────────────────
create_env_file() {
  section "Cấu hình biến môi trường"
  local env_file="${NEXTJS_DIR}/.env"

  if [[ -f "${env_file}" ]]; then
    warn ".env đã tồn tại — giữ nguyên. Kiểm tra lại thủ công nếu cần."
    return
  fi

  local nextauth_secret
  nextauth_secret=$(openssl rand -base64 48)

  cat > "${env_file}" <<EOF
# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL="${DATABASE_URL}"

# ── NextAuth ────────────────────────────────────────────────────────────────
NEXTAUTH_URL="http://$(hostname -I | awk '{print $1}'):3000"
NEXTAUTH_SECRET="${nextauth_secret}"

# ── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL="redis://:${REDIS_PASS:-changeme}@localhost:6379"

# ── MinIO ────────────────────────────────────────────────────────────────────
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-hvhc_minio_admin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-changeme}"
MINIO_BUCKET_NAME="hvhc-prod"

# ── App ──────────────────────────────────────────────────────────────────────
NODE_ENV="production"
PORT="3000"

# ── AI (tùy chọn — để trống nếu không dùng) ─────────────────────────────────
OPENAI_API_KEY=""
SCIENCE_AI_MODEL="gpt-4o"
EOF

  chown "${APP_USER}:${APP_GROUP}" "${env_file}"
  chmod 600 "${env_file}"
  ok ".env đã tạo tại ${env_file}"
  warn "Kiểm tra lại .env và điền API keys trước khi khởi động"
}

# ─── Prisma migrate + build ───────────────────────────────────────────────────
run_prisma_and_build() {
  section "Prisma db push + Build ứng dụng"
  cd "${NEXTJS_DIR}"
  # Nếu chưa restore DB từ USB thì push schema
  sudo -u "${APP_USER}" npx prisma generate >> "$LOG_FILE" 2>&1
  sudo -u "${APP_USER}" npx prisma db push --accept-data-loss >> "$LOG_FILE" 2>&1
  ok "Prisma schema đã sync"

  info "Build Next.js (có thể mất 3–5 phút)..."
  sudo -u "${APP_USER}" npm run build >> "$LOG_FILE" 2>&1
  ok "Build thành công"
}

# ─── PM2 ─────────────────────────────────────────────────────────────────────
setup_pm2() {
  section "Cấu hình PM2 process manager"
  cat > "${APP_DIR}/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: 'hvhc-app',
    cwd: '${NEXTJS_DIR}',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: { NODE_ENV: 'production', PORT: 3000 },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/var/log/hvhc_pm2_error.log',
    out_file: '/var/log/hvhc_pm2_out.log',
    time: true,
    restart_delay: 3000,
  }]
}
EOF
  sudo -u "${APP_USER}" pm2 start "${APP_DIR}/ecosystem.config.js" 2>> "$LOG_FILE" || true
  sudo -u "${APP_USER}" pm2 save >> "$LOG_FILE" 2>&1
  pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" | tail -1 | bash >> "$LOG_FILE" 2>&1 || true
  ok "PM2 đã cấu hình và khởi động"
}

# ─── UFW firewall ─────────────────────────────────────────────────────────────
configure_firewall() {
  section "Cấu hình UFW Firewall"
  ufw --force reset >> "$LOG_FILE" 2>&1
  ufw default deny incoming >> "$LOG_FILE" 2>&1
  ufw default allow outgoing >> "$LOG_FILE" 2>&1
  ufw allow ssh >> "$LOG_FILE" 2>&1
  ufw allow 3000/tcp comment 'HVHC App' >> "$LOG_FILE" 2>&1
  # MinIO console — chỉ mở nội bộ
  ufw allow from 10.0.0.0/8 to any port 9001 comment 'MinIO Console internal' >> "$LOG_FILE" 2>&1
  ufw --force enable >> "$LOG_FILE" 2>&1
  ok "UFW đã bật (SSH + port 3000 mở)"
}

# ─── Cron backup tự động ─────────────────────────────────────────────────────
setup_cron_backup() {
  section "Cài cron backup tự động"
  local backup_script="${APP_DIR}/deploy/backup-db.sh"
  [[ -f "$backup_script" ]] || backup_script="${APP_DIR}/deploy/backup-db.sh"

  if [[ -f "$backup_script" ]]; then
    # Backup lúc 2:00 AM hàng ngày
    echo "0 2 * * * root bash ${backup_script} >> /var/log/hvhc_backup.log 2>&1" \
      > /etc/cron.d/hvhc-backup
    chmod 644 /etc/cron.d/hvhc-backup
    ok "Cron backup đã thiết lập (2:00 AM hàng ngày)"
  else
    warn "Không tìm thấy backup-db.sh — bỏ qua cron setup"
  fi
}

# ─── Tóm tắt sau cài đặt ─────────────────────────────────────────────────────
print_summary() {
  local server_ip
  server_ip=$(hostname -I | awk '{print $1}')
  echo -e "\n${BOLD}${GREEN}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              ✅  CÀI ĐẶT HOÀN THÀNH                     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${BOLD}Ứng dụng:${NC}   http://${server_ip}:3000"
  echo -e "  ${BOLD}MinIO:${NC}      http://${server_ip}:9001"
  echo -e "  ${BOLD}DB:${NC}         ${PG_DB}@localhost:5432"
  echo -e "  ${BOLD}App dir:${NC}    ${APP_DIR}"
  echo -e "  ${BOLD}Log file:${NC}   ${LOG_FILE}"
  echo ""
  echo -e "  ${YELLOW}Bước tiếp theo:${NC}"
  echo "  1. Kiểm tra .env: nano ${NEXTJS_DIR}/.env"
  echo "  2. Điền OPENAI_API_KEY nếu dùng tính năng AI"
  echo "  3. Chạy seed dữ liệu (lần đầu):"
  echo "     cd ${NEXTJS_DIR}"
  echo "     sudo -u ${APP_USER} npx tsx --require dotenv/config prisma/seed/seed_users.ts"
  echo "     sudo -u ${APP_USER} npx tsx --require dotenv/config prisma/seed/seed_units.ts"
  echo "  4. Kiểm tra status: sudo -u ${APP_USER} pm2 status"
  echo "  5. Xem log: sudo -u ${APP_USER} pm2 logs hvhc-app"
  echo ""
}

# ─── Entry point ─────────────────────────────────────────────────────────────
main() {
  print_banner
  require_root
  check_ubuntu

  local mode="${1:-interactive}"
  local usb_src="${2:-}"

  # Chế độ tương tác
  if [[ "$mode" == "interactive" ]]; then
    echo ""
    echo "  Chọn kịch bản cài đặt:"
    echo "  [1] GitHub  — tải source từ GitHub (cần Internet)"
    echo "  [2] USB     — cài từ USB/archive đã có (offline)"
    echo ""
    ask "Nhập lựa chọn [1/2]:"
    read -r choice
    case "$choice" in
      1) mode="github" ;;
      2)
        mode="usb"
        ask "Nhập đường dẫn tới thư mục USB (vd: /media/usb):"
        read -r usb_src
        ;;
      *) error "Lựa chọn không hợp lệ" ;;
    esac
  fi

  # Bước chung cho cả 2 kịch bản
  install_system_deps
  create_app_user

  case "$mode" in
    github)
      install_nodejs
      install_postgresql
      configure_postgresql
      install_redis
      install_minio
      deploy_from_github
      install_app_deps
      create_env_file
      run_prisma_and_build
      ;;
    usb)
      [[ -n "$usb_src" ]] || { ask "Nhập đường dẫn USB:"; read -r usb_src; }
      [[ -d "$usb_src" ]] || error "Không tìm thấy: $usb_src"
      install_nodejs_offline "$usb_src"
      install_postgresql
      configure_postgresql
      install_redis
      install_minio "$usb_src"
      deploy_from_usb "$usb_src"
      restore_db_from_usb "$usb_src"
      install_app_deps
      create_env_file
      run_prisma_and_build
      ;;
    *)
      error "Mode không hợp lệ: $mode (dùng github hoặc usb)"
      ;;
  esac

  setup_pm2
  configure_firewall
  setup_cron_backup
  print_summary
}

main "$@"
