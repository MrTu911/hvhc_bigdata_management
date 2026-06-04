#!/usr/bin/env bash
# =============================================================================
# HVHC BigData — Database Backup Script
# =============================================================================
# Backup toàn bộ: PostgreSQL (full dump + schema-only) + Redis + MinIO
# Hỗ trợ nén, mã hóa tùy chọn, kiểm tra tính toàn vẹn, và tự động xoá cũ.
#
# Cách dùng:
#   bash backup-db.sh                    # backup đầy đủ (auto)
#   bash backup-db.sh --db-only          # chỉ backup PostgreSQL
#   bash backup-db.sh --dest /mnt/nas    # chỉ định thư mục đích
#   bash backup-db.sh --export-usb /media/usb  # copy backup sang USB
#   bash backup-db.sh --restore <file>   # khôi phục từ file .dump
#
# Cron hàng ngày (2:00 AM):
#   0 2 * * * root bash /opt/hvhc_bigdata_management/deploy/backup-db.sh >> /var/log/hvhc_backup.log 2>&1
# =============================================================================

set -euo pipefail

# ─── Cấu hình ────────────────────────────────────────────────────────────────
BACKUP_BASE="/var/backups/hvhc"
APP_DIR="/opt/hvhc_bigdata_management"
NEXTJS_DIR="${APP_DIR}/nextjs_space"

PG_DB="hvhc_bigdata_89"
PG_USER="ductuking"
PG_HOST="localhost"
PG_PORT="5432"

RETENTION_DAILY=7      # giữ 7 bản backup hàng ngày
RETENTION_WEEKLY=4     # giữ 4 bản backup hàng tuần (Chủ nhật)
RETENTION_MONTHLY=3    # giữ 3 bản backup hàng tháng (ngày 1)

LOG_FILE="/var/log/hvhc_backup.log"
ENCRYPT=0              # Đặt thành 1 để mã hóa bằng GPG (cần cấu hình ENCRYPT_KEY)
ENCRYPT_KEY=""         # GPG key ID hoặc email (khi ENCRYPT=1)

# ─── Màu sắc ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u")   # 7 = Chủ nhật
DAY_OF_MONTH=$(date +"%d")

info()    { echo -e "[$(date '+%H:%M:%S')] ${CYAN}[INFO]${NC}  $*" | tee -a "$LOG_FILE"; }
ok()      { echo -e "[$(date '+%H:%M:%S')] ${GREEN}[OK]${NC}    $*" | tee -a "$LOG_FILE"; }
warn()    { echo -e "[$(date '+%H:%M:%S')] ${YELLOW}[WARN]${NC}  $*" | tee -a "$LOG_FILE"; }
error()   { echo -e "[$(date '+%H:%M:%S')] ${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"; exit 1; }
section() { echo -e "\n[$(date '+%H:%M:%S')] ${BOLD}${CYAN}━━━ $* ━━━${NC}" | tee -a "$LOG_FILE"; }
hr()      { echo "─────────────────────────────────────────────────────" | tee -a "$LOG_FILE"; }

# Đọc mật khẩu DB từ .env nếu có
load_db_creds() {
  local env_file="${NEXTJS_DIR}/.env"
  if [[ -f "$env_file" ]]; then
    local db_url
    db_url=$(grep "^DATABASE_URL=" "$env_file" | cut -d'"' -f2 | head -1 || true)
    if [[ -n "$db_url" ]]; then
      # Parse: postgresql://user:pass@host:port/db
      PG_USER=$(echo "$db_url" | grep -oP '(?<=://).+(?=:)' | head -1 || echo "$PG_USER")
      local raw_pass
      raw_pass=$(echo "$db_url" | grep -oP '(?<=:)[^@%]*(?=%40|@)' | head -1 || true)
      # URL-decode %40 → @
      PG_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('${raw_pass}'))" 2>/dev/null || echo "$raw_pass")
      PG_DB=$(echo "$db_url" | grep -oP '(?<=/)\w+(?=\?)' | head -1 || echo "$PG_DB")
    fi
  fi
  PG_PASS=${PG_PASS:-""}
  export PGPASSWORD="$PG_PASS"
}

# ─── Kiểm tra phụ thuộc ───────────────────────────────────────────────────────
check_deps() {
  local missing=()
  for cmd in pg_dump pg_restore gzip sha256sum; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  [[ ${#missing[@]} -eq 0 ]] || error "Thiếu lệnh: ${missing[*]} — cài: apt install postgresql-client"
}

# ─── Xác định loại backup (daily/weekly/monthly) ──────────────────────────────
get_backup_type() {
  if [[ "$DAY_OF_MONTH" == "01" ]]; then echo "monthly"
  elif [[ "$DAY_OF_WEEK" == "7" ]]; then echo "weekly"
  else echo "daily"
  fi
}

# ─── Tạo thư mục backup ───────────────────────────────────────────────────────
init_backup_dir() {
  local backup_type="$1"
  BACKUP_DIR="${BACKUP_BASE}/${backup_type}/${TIMESTAMP}"
  mkdir -p "$BACKUP_DIR"
  info "Thư mục backup: ${BACKUP_DIR}"
}

# ─── Backup PostgreSQL ────────────────────────────────────────────────────────
backup_postgresql() {
  section "PostgreSQL — ${PG_DB}"

  local dump_file="${BACKUP_DIR}/postgres_${PG_DB}_${TIMESTAMP}.dump"
  local schema_file="${BACKUP_DIR}/postgres_schema_${TIMESTAMP}.sql"
  local sql_gz_file="${BACKUP_DIR}/postgres_${PG_DB}_${TIMESTAMP}.sql.gz"

  # 1. Kiểm tra kết nối
  pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t 10 \
    || error "Không kết nối được PostgreSQL tại ${PG_HOST}:${PG_PORT}"

  # 2. Custom format dump (tốt nhất cho pg_restore -j)
  info "Dump custom format (phục hồi song song)..."
  pg_dump \
    -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -F c -b -v -Z 6 \
    -f "$dump_file" 2>> "$LOG_FILE"
  local dump_size
  dump_size=$(du -sh "$dump_file" | cut -f1)
  ok "Custom dump: ${dump_file} (${dump_size})"

  # 3. Plain SQL gzip (dễ đọc / di chuyển)
  info "Dump plain SQL (nén gzip)..."
  pg_dump \
    -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -F p --clean --if-exists \
    2>> "$LOG_FILE" | gzip -6 > "$sql_gz_file"
  ok "SQL dump: ${sql_gz_file} ($(du -sh "$sql_gz_file" | cut -f1))"

  # 4. Schema-only (siêu nhanh, dùng để debug)
  info "Dump schema-only..."
  pg_dump \
    -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -s -f "$schema_file" 2>> "$LOG_FILE"
  ok "Schema dump: ${schema_file}"

  # 5. Thống kê bảng
  info "Thống kê số bản ghi..."
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -t -A -F',' \
    -c "SELECT schemaname||'.'||tablename, n_live_tup
        FROM pg_stat_user_tables
        WHERE n_live_tup > 0
        ORDER BY n_live_tup DESC LIMIT 30;" \
    2>/dev/null > "${BACKUP_DIR}/table_stats.csv" || true

  # 6. Kiểm tra tính toàn vẹn dump
  info "Kiểm tra tính toàn vẹn custom dump..."
  pg_restore --list "$dump_file" >> /dev/null 2>&1 \
    && ok "Dump hợp lệ — pg_restore --list OK" \
    || warn "pg_restore --list có cảnh báo — kiểm tra thủ công"
}

# ─── Backup Redis ─────────────────────────────────────────────────────────────
backup_redis() {
  section "Redis"
  command -v redis-cli &>/dev/null || { warn "redis-cli không tìm thấy — bỏ qua Redis backup"; return; }

  # Trigger BGSAVE và đợi hoàn thành
  info "Trigger BGSAVE..."
  redis-cli BGSAVE > /dev/null 2>&1 || true
  local t=0
  while [[ "$(redis-cli LASTSAVE 2>/dev/null)" == "" ]] && [[ $t -lt 30 ]]; do
    sleep 1; ((t++))
  done
  sleep 2

  # Copy RDB file
  local rdb_src
  rdb_src=$(redis-cli CONFIG GET dir 2>/dev/null | tail -1 || echo "/var/lib/redis")
  local rdb_file="${rdb_src}/dump.rdb"

  if [[ -f "$rdb_file" ]]; then
    gzip -c "$rdb_file" > "${BACKUP_DIR}/redis_dump_${TIMESTAMP}.rdb.gz"
    ok "Redis dump: redis_dump_${TIMESTAMP}.rdb.gz ($(du -sh "${BACKUP_DIR}/redis_dump_${TIMESTAMP}.rdb.gz" | cut -f1))"
  else
    warn "Không tìm thấy Redis dump.rdb tại ${rdb_file}"
  fi
}

# ─── Backup MinIO metadata ────────────────────────────────────────────────────
backup_minio_meta() {
  section "MinIO metadata"
  if [[ -d "/var/lib/minio" ]]; then
    tar -czf "${BACKUP_DIR}/minio_data_${TIMESTAMP}.tar.gz" \
      -C /var/lib/minio . 2>> "$LOG_FILE" \
      && ok "MinIO data: minio_data_${TIMESTAMP}.tar.gz" \
      || warn "MinIO backup có lỗi — kiểm tra /var/lib/minio"
  else
    warn "Thư mục MinIO /var/lib/minio không tồn tại — bỏ qua"
  fi
}

# ─── Backup .env + ecosystem.config ──────────────────────────────────────────
backup_config() {
  section "Cấu hình ứng dụng"
  local conf_dir="${BACKUP_DIR}/config"
  mkdir -p "$conf_dir"

  for f in \
    "${NEXTJS_DIR}/.env" \
    "${APP_DIR}/ecosystem.config.js" \
    "/etc/default/minio" \
    "/etc/nginx/sites-available/hvhc" \
    "/etc/redis/redis.conf"; do
    if [[ -f "$f" ]]; then
      cp "$f" "${conf_dir}/$(basename "$f").bak"
      info "Đã backup: $f"
    fi
  done
  ok "Config files đã backup vào ${conf_dir}"
}

# ─── Tạo SHA-256 checksum cho tất cả file ─────────────────────────────────────
generate_checksums() {
  section "Sinh SHA-256 checksums"
  cd "$BACKUP_DIR"
  sha256sum ./* > "CHECKSUMS_SHA256.txt" 2>/dev/null || true
  ok "Checksums: ${BACKUP_DIR}/CHECKSUMS_SHA256.txt"
}

# ─── Tạo MANIFEST ─────────────────────────────────────────────────────────────
create_manifest() {
  section "Tạo MANIFEST"
  local manifest="${BACKUP_DIR}/MANIFEST.txt"
  cat > "$manifest" <<EOF
HVHC BigData Management — Database Backup Manifest
════════════════════════════════════════════════════
Timestamp  : ${TIMESTAMP}
Date       : $(date '+%Y-%m-%d %H:%M:%S %Z')
Host       : $(hostname -f)
OS         : $(lsb_release -ds 2>/dev/null || uname -a)
Backup Type: $(get_backup_type)

── Files ───────────────────────────────────────────
$(ls -lh "$BACKUP_DIR" | tail -n +2)

── PostgreSQL ──────────────────────────────────────
Database   : ${PG_DB}
Host       : ${PG_HOST}:${PG_PORT}
User       : ${PG_USER}
PG Version : $(psql --version 2>/dev/null | head -1 || echo "N/A")

── Table Record Counts (top 20) ────────────────────
$(cat "${BACKUP_DIR}/table_stats.csv" 2>/dev/null | head -20 || echo "N/A")

── Total Backup Size ───────────────────────────────
$(du -sh "$BACKUP_DIR" | cut -f1)

── Restore Commands ────────────────────────────────
# Restore custom dump (parallel, fastest):
#   PGPASSWORD='<pass>' pg_restore -h ${PG_HOST} -U ${PG_USER} -d ${PG_DB} \\
#     -j 4 --no-owner --no-acl \\
#     postgres_${PG_DB}_${TIMESTAMP}.dump

# Restore SQL dump:
#   zcat postgres_${PG_DB}_${TIMESTAMP}.sql.gz | \\
#     PGPASSWORD='<pass>' psql -h ${PG_HOST} -U ${PG_USER} -d ${PG_DB}

# Verify checksums:
#   sha256sum -c CHECKSUMS_SHA256.txt
EOF
  ok "MANIFEST: ${manifest}"
}

# ─── Mã hóa GPG (tùy chọn) ────────────────────────────────────────────────────
encrypt_backup() {
  [[ "$ENCRYPT" -eq 1 && -n "$ENCRYPT_KEY" ]] || return
  section "Mã hóa GPG: ${ENCRYPT_KEY}"
  local dump_file
  dump_file=$(find "$BACKUP_DIR" -name "*.dump" | head -1)
  if [[ -f "$dump_file" ]]; then
    gpg --recipient "$ENCRYPT_KEY" --encrypt "$dump_file" 2>> "$LOG_FILE" \
      && rm "$dump_file" \
      && ok "Đã mã hóa: ${dump_file}.gpg"
  fi
}

# ─── Xoá backup cũ ────────────────────────────────────────────────────────────
rotate_backups() {
  section "Xoá backup cũ"
  for btype in daily weekly monthly; do
    local retain
    case "$btype" in
      daily)   retain=$RETENTION_DAILY ;;
      weekly)  retain=$RETENTION_WEEKLY ;;
      monthly) retain=$RETENTION_MONTHLY ;;
    esac
    local bdir="${BACKUP_BASE}/${btype}"
    if [[ -d "$bdir" ]]; then
      # Giữ $retain bản gần nhất, xoá phần còn lại
      local count
      count=$(ls -d "${bdir}"/20* 2>/dev/null | wc -l)
      if [[ "$count" -gt "$retain" ]]; then
        ls -dt "${bdir}"/20* | tail -n "+$((retain + 1))" | xargs rm -rf
        ok "${btype}: đã xoá $((count - retain)) bản cũ (giữ ${retain})"
      else
        info "${btype}: ${count}/${retain} bản — chưa cần xoá"
      fi
    fi
  done
}

# ─── Copy sang USB ────────────────────────────────────────────────────────────
export_to_usb() {
  local usb_dest="$1"
  section "Copy backup sang USB: ${usb_dest}"
  [[ -d "$usb_dest" ]] || error "USB dest không tồn tại: ${usb_dest}"
  local usb_backup_dir="${usb_dest}/hvhc_backup_${TIMESTAMP}"
  mkdir -p "$usb_backup_dir"
  rsync -a --info=progress2 "${BACKUP_DIR}/" "${usb_backup_dir}/" 2>> "$LOG_FILE"
  local usb_size
  usb_size=$(du -sh "$usb_backup_dir" | cut -f1)
  ok "Đã copy ${usb_size} vào ${usb_backup_dir}"
  sync
}

# ─── Khôi phục từ file ────────────────────────────────────────────────────────
restore_from_file() {
  local restore_file="$1"
  [[ -f "$restore_file" ]] || error "File không tồn tại: ${restore_file}"

  section "KHÔI PHỤC Database từ: $(basename "$restore_file")"
  warn "Thao tác này sẽ GHI ĐÈ dữ liệu trong ${PG_DB}!"
  echo -n "  Nhập 'YES' để tiếp tục: "
  read -r confirm
  [[ "$confirm" == "YES" ]] || { info "Hủy bởi người dùng"; exit 0; }

  case "$restore_file" in
    *.dump)
      info "pg_restore (parallel -j4)..."
      pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        -j 4 --no-owner --no-acl --clean --if-exists \
        "$restore_file" 2>> "$LOG_FILE" \
        && ok "pg_restore hoàn thành" \
        || warn "pg_restore có cảnh báo (thường bỏ qua được)"
      ;;
    *.sql.gz)
      info "zcat | psql..."
      zcat "$restore_file" | psql \
        -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        >> "$LOG_FILE" 2>&1
      ok "SQL restore hoàn thành"
      ;;
    *.sql)
      info "psql restore..."
      psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        < "$restore_file" >> "$LOG_FILE" 2>&1
      ok "SQL restore hoàn thành"
      ;;
    *.dump.gpg)
      info "Giải mã GPG trước..."
      gpg --decrypt "$restore_file" 2>/dev/null \
        | pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
          -j 4 --no-owner --no-acl --clean --if-exists >> "$LOG_FILE" 2>&1
      ok "Restore từ GPG dump hoàn thành"
      ;;
    *)
      error "Định dạng file không hỗ trợ: ${restore_file}"
      ;;
  esac

  # Chạy lại Prisma generate sau restore
  if [[ -d "${NEXTJS_DIR}" ]]; then
    info "Chạy prisma generate sau restore..."
    cd "${NEXTJS_DIR}" && npx prisma generate >> "$LOG_FILE" 2>&1 || true
  fi
  ok "Khôi phục hoàn thành!"
}

# ─── Print summary ────────────────────────────────────────────────────────────
print_summary() {
  local total_size
  total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
  hr
  echo -e "${BOLD}${GREEN}✅ Backup hoàn thành!${NC}"
  echo "   Vị trí  : ${BACKUP_DIR}"
  echo "   Kích thước: ${total_size}"
  echo "   Log     : ${LOG_FILE}"
  echo "   Giữ lại : daily=${RETENTION_DAILY} weekly=${RETENTION_WEEKLY} monthly=${RETENTION_MONTHLY}"
  hr
}

# ─── Entry point ─────────────────────────────────────────────────────────────
main() {
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "" >> "$LOG_FILE"
  section "HVHC Backup — $(date '+%Y-%m-%d %H:%M:%S')"

  # Parse tham số
  local db_only=0
  local dest_override=""
  local usb_export=""
  local restore_file=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --db-only)        db_only=1; shift ;;
      --dest)           dest_override="$2"; shift 2 ;;
      --export-usb)     usb_export="$2"; shift 2 ;;
      --restore)        restore_file="$2"; shift 2 ;;
      *) error "Tham số không hợp lệ: $1" ;;
    esac
  done

  # Chế độ restore
  if [[ -n "$restore_file" ]]; then
    load_db_creds
    restore_from_file "$restore_file"
    return
  fi

  check_deps
  load_db_creds

  if [[ -n "$dest_override" ]]; then
    BACKUP_BASE="$dest_override"
  fi

  local backup_type
  backup_type=$(get_backup_type)
  init_backup_dir "$backup_type"

  backup_postgresql
  [[ "$db_only" -eq 0 ]] && backup_redis || true
  [[ "$db_only" -eq 0 ]] && backup_minio_meta || true
  [[ "$db_only" -eq 0 ]] && backup_config || true

  generate_checksums
  create_manifest
  encrypt_backup
  rotate_backups
  [[ -n "$usb_export" ]] && export_to_usb "$usb_export" || true
  print_summary
}

main "$@"
