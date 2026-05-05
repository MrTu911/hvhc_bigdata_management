#!/usr/bin/env bash
# =============================================================================
# HVHC BigData — USB Packaging Script
# =============================================================================
# Đóng gói toàn bộ source + database dump vào USB/thư mục để cài offline.
# Chạy trên MÁY NGUỒN (máy đang có source), sau đó mang USB đến SERVER.
#
# Cách dùng:
#   bash prepare-usb.sh /media/usb       # đóng gói vào USB
#   bash prepare-usb.sh /tmp/hvhc_pkg    # đóng gói vào thư mục tạm
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
section() { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}"; }

USB_DEST="${1:?Cần truyền đường dẫn đích: bash prepare-usb.sh /media/usb}"
APP_SRC="$(cd "$(dirname "$0")/.." && pwd)"
NEXTJS_SRC="${APP_SRC}/nextjs_space"
PKG_DIR="${USB_DEST}/hvhc_package"
OFFLINE_DIR="${PKG_DIR}/offline-pkgs"
NODE_VERSION="20"

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      HVHC BigData — Chuẩn bị USB Cài Offline            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
info "Nguồn  : ${APP_SRC}"
info "USB    : ${PKG_DIR}"

mkdir -p "${PKG_DIR}" "${OFFLINE_DIR}"

# ─── 1. Copy source code (bỏ node_modules, .next) ────────────────────────────
section "Copy source code"
rsync -a --info=progress2 \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='__pycache__' \
  --exclude='.env' \
  "${APP_SRC}/" "${PKG_DIR}/source/" 2>/dev/null
ok "Source đã copy (không có node_modules)"

# ─── 2. Backup database ───────────────────────────────────────────────────────
section "Backup PostgreSQL"
PG_DB="hvhc_bigdata_89"
PG_USER="ductuking"
DUMP_FILE="${PKG_DIR}/db_dump_$(date +%Y%m%d_%H%M%S).dump"

# Đọc pass từ .env
PG_PASS=$(grep "^DATABASE_URL=" "${NEXTJS_SRC}/.env" 2>/dev/null \
  | grep -oP '(?<=:)[^@%]*(?=%40|@)' | head -1 || echo "")
PG_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('${PG_PASS}'))" 2>/dev/null || echo "$PG_PASS")

if PGPASSWORD="$PG_PASS" pg_isready -h localhost -U "$PG_USER" -d "$PG_DB" -t 5 &>/dev/null; then
  PGPASSWORD="$PG_PASS" pg_dump \
    -h localhost -U "$PG_USER" -d "$PG_DB" \
    -F c -b -Z 6 -f "$DUMP_FILE" 2>/dev/null
  ok "Database dump: $(basename "$DUMP_FILE") ($(du -sh "$DUMP_FILE" | cut -f1))"
else
  warn "Không kết nối được PostgreSQL — bỏ qua DB dump"
fi

# ─── 3. Tạo npm offline cache ─────────────────────────────────────────────────
section "Tạo npm offline cache"
NPM_CACHE_DIR="${PKG_DIR}/source/nextjs_space/.npm-offline-cache"
mkdir -p "$NPM_CACHE_DIR"
if [[ -f "${NEXTJS_SRC}/package-lock.json" ]]; then
  # Pack tất cả deps vào cache
  cd "${NEXTJS_SRC}"
  npm install --cache "$NPM_CACHE_DIR" --prefer-offline 2>/dev/null || true
  ok "npm offline cache: ${NPM_CACHE_DIR}"
else
  warn "Không có package-lock.json — bỏ qua npm cache"
fi

# ─── 4. Download Node.js binary (Linux x64) ───────────────────────────────────
section "Download Node.js ${NODE_VERSION} binary"
NODE_URL="https://nodejs.org/dist/latest-v${NODE_VERSION}.x/"
# Lấy tên file mới nhất
NODE_TARBALL=$(curl -s "$NODE_URL" \
  | grep -oP "node-v${NODE_VERSION}\.[0-9.]+-linux-x64\.tar\.xz" \
  | head -1 || true)

if [[ -n "$NODE_TARBALL" && ! -f "${OFFLINE_DIR}/${NODE_TARBALL}" ]]; then
  info "Download: ${NODE_TARBALL}..."
  wget -q "${NODE_URL}${NODE_TARBALL}" -O "${OFFLINE_DIR}/${NODE_TARBALL}" \
    && ok "Node.js binary: ${NODE_TARBALL}" \
    || warn "Tải Node.js thất bại — sẽ cài online khi deploy"
else
  ok "Node.js binary đã có hoặc không tải được URL"
fi

# ─── 5. Download MinIO binary ─────────────────────────────────────────────────
section "Download MinIO binary"
if [[ ! -f "${OFFLINE_DIR}/minio" ]]; then
  wget -q "https://dl.min.io/server/minio/release/linux-amd64/minio" \
    -O "${OFFLINE_DIR}/minio" 2>/dev/null \
    && chmod +x "${OFFLINE_DIR}/minio" \
    && ok "MinIO binary: $(du -sh "${OFFLINE_DIR}/minio" | cut -f1)" \
    || warn "Tải MinIO thất bại — sẽ cài online khi deploy"
else
  ok "MinIO binary đã có"
fi

# ─── 6. Copy deploy scripts ───────────────────────────────────────────────────
section "Copy deploy scripts"
cp "${APP_SRC}/deploy/install.sh" "${PKG_DIR}/"
cp "${APP_SRC}/deploy/backup-db.sh" "${PKG_DIR}/"
chmod +x "${PKG_DIR}/install.sh" "${PKG_DIR}/backup-db.sh"
ok "Scripts: install.sh, backup-db.sh"

# ─── 7. Tạo README cài đặt trên USB ──────────────────────────────────────────
section "Tạo README.txt"
cat > "${PKG_DIR}/README.txt" <<'README'
HVHC BigData Management — Gói Cài Đặt USB
==========================================

Nội dung:
  source/          — Source code ứng dụng
  offline-pkgs/    — Node.js binary, MinIO binary
  db_dump_*.dump   — Database backup (nếu có)
  install.sh       — Script cài đặt chính
  backup-db.sh     — Script backup database

Cách cài:
  1. Gắn USB vào server Ubuntu 20.04/22.04/24.04
  2. Mount USB (nếu chưa tự động):
       sudo mount /dev/sdb1 /media/usb
  3. Chạy installer:
       sudo bash /media/usb/hvhc_package/install.sh usb /media/usb/hvhc_package
  4. Sau khi cài xong, xem output để biết thông tin truy cập

Sau khi cài lần đầu:
  - Kiểm tra .env:   sudo nano /opt/hvhc_bigdata_management/nextjs_space/.env
  - Xem log PM2:     sudo -u hvhc pm2 logs hvhc-app
  - Backup thủ công: sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh

README

ok "README.txt đã tạo"

# ─── 8. Tạo checksum toàn bộ package ─────────────────────────────────────────
section "Sinh checksums"
cd "${PKG_DIR}"
find . -type f -not -name "CHECKSUMS.txt" \
  | sort | xargs sha256sum > "${PKG_DIR}/CHECKSUMS.txt" 2>/dev/null || true
ok "CHECKSUMS.txt đã tạo"

# ─── Tóm tắt ─────────────────────────────────────────────────────────────────
TOTAL=$(du -sh "${PKG_DIR}" | cut -f1)
echo ""
echo -e "${BOLD}${GREEN}✅ USB package hoàn thành!${NC}"
echo "   Vị trí   : ${PKG_DIR}"
echo "   Kích thước: ${TOTAL}"
echo ""
echo "   Cài lên server:"
echo "     sudo bash ${PKG_DIR}/install.sh usb ${PKG_DIR}"
echo ""
