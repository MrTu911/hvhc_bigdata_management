#!/usr/bin/env bash
set -Eeuo pipefail

########################################
# DEFAULT CONFIG
########################################
PROJECT_DIR="${PROJECT_DIR:-/home/kelinton/hvhc_bigdata_management/nextjs_space}"

DEFAULT_DB_NAME="hvhc_bigdata_89"
DEFAULT_DB_USER="ductuking"
DEFAULT_DB_HOST="localhost"
DEFAULT_BACKUP_DIR="$HOME/hvhc_backups"
DEFAULT_LOG_DIR="$PROJECT_DIR/logs"
DEFAULT_SCHEMA_PATH="$PROJECT_DIR/prisma/schema.prisma"

DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"
DB_USER="${DB_USER:-$DEFAULT_DB_USER}"
DB_HOST="${DB_HOST:-$DEFAULT_DB_HOST}"
BACKUP_DIR="${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}"
LOG_DIR="${LOG_DIR:-$DEFAULT_LOG_DIR}"
SCHEMA_PATH="${SCHEMA_PATH:-$DEFAULT_SCHEMA_PATH}"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@demo.hvhc.edu.vn}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Demo@2025}"

POST_ACTION="${POST_ACTION:-none}"               # none | studio | dev
INTERACTIVE="${INTERACTIVE:-1}"                  # 1=yes, 0=no
WITH_BACKUP="${WITH_BACKUP:-1}"                  # 1=yes, 0=no
RESET_DB="${RESET_DB:-1}"                        # 1=yes, 0=no
RESET_MODE="${RESET_MODE:-dropdb}"               # dropdb | prisma
RUN_PRISMA_VALIDATE="${RUN_PRISMA_VALIDATE:-1}"
RUN_PRISMA_GENERATE="${RUN_PRISMA_GENERATE:-1}"
RUN_PRISMA_PUSH="${RUN_PRISMA_PUSH:-1}"          # dùng khi reset bằng dropdb
RUN_PRISMA_MIGRATE_RESET="${RUN_PRISMA_MIGRATE_RESET:-0}"
CLEAN_EOF_ARTIFACTS="${CLEAN_EOF_ARTIFACTS:-0}"  # mặc định tắt để tránh watcher reload
SKIP_OPTIONAL_SEEDS="${SKIP_OPTIONAL_SEEDS:-1}"  # 1=skip missing files
RUN_NPM_INSTALL="${RUN_NPM_INSTALL:-0}"          # 1=npm install trước khi chạy
STRICT_MODE="${STRICT_MODE:-1}"                  # 1=seed lỗi thì dừng, 0=lỗi thì tiếp tục
TERMINATE_LOCAL_PROCESSES="${TERMINATE_LOCAL_PROCESSES:-1}"
KILL_NEXT_DEV="${KILL_NEXT_DEV:-1}"
KILL_PRISMA_STUDIO="${KILL_PRISMA_STUDIO:-1}"

TSX_BIN="${TSX_BIN:-npx tsx}"
DOTENV_REQUIRE="${DOTENV_REQUIRE:---require dotenv/config}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_before_reset_${TIMESTAMP}.dump"
LOG_FILE="$LOG_DIR/reset_and_seed_${TIMESTAMP}.log"

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

########################################
# COLORS
########################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

########################################
# STATS
########################################
SEED_RUN_COUNT=0
SEED_SKIP_COUNT=0
SEED_FAIL_COUNT=0
declare -a FAILED_SEEDS=()
declare -a SKIPPED_SEEDS=()
declare -A SEEN_SEEDS=()

########################################
# LOG HELPERS
########################################
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

section() {
  echo | tee -a "$LOG_FILE"
  log "${BOLD}${CYAN}==================================================${NC}"
  log "${BOLD}${CYAN}$1${NC}"
  log "${BOLD}${CYAN}==================================================${NC}"
}

success() {
  log "${GREEN}✅ $1${NC}"
}

warn() {
  log "${YELLOW}⚠️  $1${NC}"
}

error() {
  log "${RED}❌ $1${NC}"
}

info() {
  log "${BLUE}ℹ️  $1${NC}"
}

########################################
# ERROR HANDLER
########################################
CURRENT_STEP="unknown"

on_error() {
  local exit_code=$?
  local line_no="${1:-unknown}"
  error "Script failed at line $line_no with exit code $exit_code"
  error "Current step: $CURRENT_STEP"
  error "Xem log tại: $LOG_FILE"
  exit "$exit_code"
}
trap 'on_error $LINENO' ERR

########################################
# UTIL FUNCTIONS
########################################
require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    error "Thiếu command: $cmd"
    exit 1
  }
}

ask_input() {
  local prompt="$1"
  local default_value="${2:-}"
  local result

  if [[ "$INTERACTIVE" != "1" ]]; then
    echo "$default_value"
    return 0
  fi

  if [[ -n "$default_value" ]]; then
    read -r -p "$prompt [$default_value]: " result
    echo "${result:-$default_value}"
  else
    read -r -p "$prompt: " result
    echo "$result"
  fi
}

ask_yes_no() {
  local prompt="$1"
  local default_value="${2:-y}"
  local answer

  if [[ "$INTERACTIVE" != "1" ]]; then
    [[ "$default_value" =~ ^[Yy]$ ]]
    return
  fi

  read -r -p "$prompt [y/n] (default: $default_value): " answer
  answer="${answer:-$default_value}"
  [[ "$answer" =~ ^[Yy]$ ]]
}

run_cmd() {
  local title="$1"
  shift
  CURRENT_STEP="$title"
  info "$title"
  echo "\$ $*" >> "$LOG_FILE"
  "$@" 2>&1 | tee -a "$LOG_FILE"
}

run_shell_cmd() {
  local title="$1"
  local cmd="$2"
  CURRENT_STEP="$title"
  info "$title"
  echo "\$ bash -lc \"$cmd\"" >> "$LOG_FILE"
  bash -lc "$cmd" 2>&1 | tee -a "$LOG_FILE"
}

safe_cd_project() {
  if [[ ! -d "$PROJECT_DIR" ]]; then
    error "PROJECT_DIR không tồn tại: $PROJECT_DIR"
    exit 1
  fi
  cd "$PROJECT_DIR"
}

########################################
# PROCESS MANAGEMENT
########################################
terminate_local_processes() {
  if [[ "$TERMINATE_LOCAL_PROCESSES" != "1" ]]; then
    warn "Bỏ qua terminate local processes"
    return 0
  fi

  CURRENT_STEP="Terminate local processes"
  section "TERMINATE LOCAL PROCESSES"
  info "Đang đóng các tiến trình local có thể giữ kết nối DB..."

  # FIX: dùng --pgroup để chỉ kill process con, không kill terminal/session hiện tại
  # pkill -f "npm run dev" có thể match cả bash đang chạy script này => crash terminal
  # Giải pháp: lọc ra PID của script hiện tại và các tổ tiên trước khi kill

  local my_pid=$$
  local my_sid
  my_sid="$(ps -o sid= -p $my_pid | tr -d ' ')"

  safe_pkill() {
    local pattern="$1"
    local pid sid

    # Dùng process substitution + || true để pgrep exit 1 không trigger set -e
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      sid="$(ps -o sid= -p "$pid" 2>/dev/null | tr -d ' ')" || true
      [[ -z "$sid" ]] && continue
      if [[ "$sid" != "$my_sid" ]]; then
        kill -TERM "$pid" 2>/dev/null || true
        info "Đã gửi SIGTERM tới PID $pid (pattern: $pattern)"
      fi
    done < <(pgrep -f "$pattern" 2>/dev/null || true)
  }

  if [[ "$KILL_NEXT_DEV" == "1" ]]; then
    safe_pkill "next dev"
    safe_pkill "next-server"
    # Không dùng pkill -f "npm run dev" vì match quá rộng
  fi

  if [[ "$KILL_PRISMA_STUDIO" == "1" ]]; then
    safe_pkill "prisma studio"
  fi

  safe_pkill "tsx.*seed"
  safe_pkill "node.*seed"

  sleep 1
  success "Đã xử lý tiến trình local"
}

terminate_db_connections() {
  section "TERMINATE DB CONNECTIONS"
  info "Đang đóng các session đang kết nối tới database $DB_NAME ..."

  psql -h "$DB_HOST" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = '$DB_NAME'
       AND pid <> pg_backend_pid();" 2>&1 | tee -a "$LOG_FILE" || true

  success "Đã xử lý session DB"
}

########################################
# FILE CLEANUP
########################################
cleanup_eof_artifacts() {
  if [[ "$CLEAN_EOF_ARTIFACTS" != "1" ]]; then
    warn "Bỏ qua cleanup EOF artifacts"
    return 0
  fi

  section "CLEANUP EOF ARTIFACTS"

  local targets=()
  [[ -d "prisma/seed" ]] && targets+=("prisma/seed")
  [[ -d "prisma/seeds" ]] && targets+=("prisma/seeds")

  if [[ "${#targets[@]}" -eq 0 ]]; then
    warn "Không tìm thấy thư mục prisma/seed hoặc prisma/seeds"
    return 0
  fi

  local target_str
  target_str="$(printf "%q " "${targets[@]}")"

  run_shell_cmd \
    "Xóa các dòng EOF thừa trong seed files" \
    "find $target_str -type f \\( -name '*.ts' -o -name '*.js' \\) -exec sed -i '/^EOF$/d' {} \\; 2>/dev/null || true"

  success "Hoàn tất cleanup EOF artifacts"
}

########################################
# SEED FILE RESOLUTION
########################################
resolve_seed_file() {
  local file="$1"

  if [[ -f "$file" ]]; then
    echo "$file"
    return 0
  fi

  local alt=""
  if [[ "$file" == prisma/seed/* ]]; then
    alt="${file/prisma\/seed\//prisma\/seeds\/}"
  elif [[ "$file" == prisma/seeds/* ]]; then
    alt="${file/prisma\/seeds\//prisma\/seed\/}"
  fi

  if [[ -n "$alt" && -f "$alt" ]]; then
    echo "$alt"
    return 0
  fi

  return 1
}

mark_seed_seen() {
  local file="$1"
  SEEN_SEEDS["$file"]=1
}

has_seed_seen() {
  local file="$1"
  [[ -n "${SEEN_SEEDS[$file]:-}" ]]
}

########################################
# SEED EXECUTION
########################################
run_seed() {
  local requested_file="$1"
  local actual_file=""

  if ! actual_file="$(resolve_seed_file "$requested_file")"; then
    if [[ "$SKIP_OPTIONAL_SEEDS" == "1" ]]; then
      warn "SKIP missing seed: $requested_file"
      SKIPPED_SEEDS+=("$requested_file")
      SEED_SKIP_COUNT=$((SEED_SKIP_COUNT + 1))
      return 0
    else
      error "Thiếu seed file: $requested_file"
      FAILED_SEEDS+=("$requested_file")
      SEED_FAIL_COUNT=$((SEED_FAIL_COUNT + 1))
      [[ "$STRICT_MODE" == "1" ]] && return 1 || return 0
    fi
  fi

  if has_seed_seen "$actual_file"; then
    warn "SKIP duplicate seed already executed: $actual_file"
    SKIPPED_SEEDS+=("$actual_file (duplicate)")
    SEED_SKIP_COUNT=$((SEED_SKIP_COUNT + 1))
    return 0
  fi

  section "RUN SEED: $actual_file"
  CURRENT_STEP="Seed $actual_file"
  echo "\$ ADMIN_EMAIL=\"$ADMIN_EMAIL\" ADMIN_PASSWORD=\"******\" $TSX_BIN $DOTENV_REQUIRE \"$actual_file\"" >> "$LOG_FILE"

  if ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    bash -lc "$TSX_BIN $DOTENV_REQUIRE \"$actual_file\"" 2>&1 | tee -a "$LOG_FILE"; then
    mark_seed_seen "$actual_file"
    SEED_RUN_COUNT=$((SEED_RUN_COUNT + 1))
    success "DONE: $actual_file"
    return 0
  else
    FAILED_SEEDS+=("$actual_file")
    SEED_FAIL_COUNT=$((SEED_FAIL_COUNT + 1))
    error "FAILED: $actual_file"

    if [[ "$STRICT_MODE" == "1" ]]; then
      return 1
    else
      warn "STRICT_MODE=0 => tiếp tục chạy các seed còn lại"
      return 0
    fi
  fi
}

run_seed_group() {
  local group_name="$1"
  shift
  local files=("$@")

  section "SEED GROUP: $group_name"

  if ask_yes_no "Chạy nhóm seed: $group_name?" "y"; then
    local f
    for f in "${files[@]}"; do
      run_seed "$f"
    done
  else
    warn "Bỏ qua nhóm: $group_name"
  fi
}

########################################
# POST ACTION
########################################
post_action() {
  case "$POST_ACTION" in
    studio)
      section "POST ACTION: PRISMA STUDIO"
      info "Đang mở Prisma Studio..."
      nohup npx prisma studio --schema="$SCHEMA_PATH" >> "$LOG_FILE" 2>&1 &
      success "Prisma Studio đang chạy nền"
      ;;
    dev)
      section "POST ACTION: NPM RUN DEV"
      warn "Bạn đã bật POST_ACTION=dev. Dev server có thể tự reload/restart khi file thay đổi."
      info "Đang chạy app dev server..."
      npm run dev 2>&1 | tee -a "$LOG_FILE"
      ;;
    none|"")
      info "Không chạy post action"
      ;;
    *)
      warn "POST_ACTION không hợp lệ: $POST_ACTION"
      warn "Giá trị hợp lệ: none | studio | dev"
      ;;
  esac
}

########################################
# CONFIG COLLECTION
########################################
collect_config() {
  section "KHAI BÁO THÔNG SỐ"

  DB_NAME="$(ask_input "Tên database" "$DB_NAME")"
  DB_USER="$(ask_input "User database" "$DB_USER")"
  DB_HOST="$(ask_input "Host database" "$DB_HOST")"
  ADMIN_EMAIL="$(ask_input "Email admin để cấp full quyền / tự tạo nếu chưa có" "$ADMIN_EMAIL")"
  ADMIN_PASSWORD="$(ask_input "Mật khẩu admin mặc định nếu phải tự tạo" "$ADMIN_PASSWORD")"
  BACKUP_DIR="$(ask_input "Thư mục backup" "$BACKUP_DIR")"
  LOG_DIR="$(ask_input "Thư mục log" "$LOG_DIR")"
  SCHEMA_PATH="$(ask_input "Đường dẫn schema.prisma" "$SCHEMA_PATH")"

  mkdir -p "$BACKUP_DIR" "$LOG_DIR"
  BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_before_reset_${TIMESTAMP}.dump"
  LOG_FILE="$LOG_DIR/reset_and_seed_${TIMESTAMP}.log"

  if ask_yes_no "Backup database trước khi reset?" "y"; then
    WITH_BACKUP="1"
  else
    WITH_BACKUP="0"
  fi

  if ask_yes_no "Reset database?" "y"; then
    RESET_DB="1"
  else
    RESET_DB="0"
  fi

  if ask_yes_no "Dùng prisma migrate reset thay cho dropdb/createdb?" "n"; then
    RESET_MODE="prisma"
    RUN_PRISMA_MIGRATE_RESET="1"
    RUN_PRISMA_PUSH="0"
  else
    RESET_MODE="dropdb"
  fi

  if ask_yes_no "Chạy Prisma validate?" "y"; then
    RUN_PRISMA_VALIDATE="1"
  else
    RUN_PRISMA_VALIDATE="0"
  fi

  if ask_yes_no "Chạy Prisma generate?" "y"; then
    RUN_PRISMA_GENERATE="1"
  else
    RUN_PRISMA_GENERATE="0"
  fi

  if [[ "$RESET_MODE" == "dropdb" ]]; then
    if ask_yes_no "Chạy Prisma db push?" "y"; then
      RUN_PRISMA_PUSH="1"
    else
      RUN_PRISMA_PUSH="0"
    fi
  fi

  if ask_yes_no "Cleanup EOF artifacts trong các file seed?" "n"; then
    CLEAN_EOF_ARTIFACTS="1"
  else
    CLEAN_EOF_ARTIFACTS="0"
  fi

  if ask_yes_no "Strict mode? Seed lỗi sẽ dừng toàn bộ?" "y"; then
    STRICT_MODE="1"
  else
    STRICT_MODE="0"
  fi

  if ask_yes_no "Sau khi seed xong có mở Prisma Studio không?" "n"; then
    POST_ACTION="studio"
  elif ask_yes_no "Sau khi seed xong có chạy npm run dev không?" "n"; then
    POST_ACTION="dev"
  else
    POST_ACTION="none"
  fi
}

########################################
# SUMMARY
########################################
print_summary() {
  section "TỔNG KẾT"
  success "Hoàn tất quy trình"
  info "Project        : $PROJECT_DIR"
  info "Schema         : $SCHEMA_PATH"
  info "Database       : $DB_NAME"
  info "DB User        : $DB_USER"
  info "DB Host        : $DB_HOST"
  info "Admin Email    : $ADMIN_EMAIL"
  info "Backup         : $BACKUP_FILE"
  info "Log file       : $LOG_FILE"
  info "Post Action    : $POST_ACTION"
  info "Seeds ran      : $SEED_RUN_COUNT"
  info "Seeds skipped  : $SEED_SKIP_COUNT"
  info "Seeds failed   : $SEED_FAIL_COUNT"

  echo | tee -a "$LOG_FILE"
  log "${BOLD}Luồng dữ liệu đã seed:${NC}"
  log "1. Units / Users / RBAC / Positions / Commanders"
  log "2. Admin full access"
  log "3. Master data / Administrative / Policy / Insurance"
  log "4. Personnel / Faculty / Teaching"
  log "5. Party organizations / members / histories / activities"
  log "6. Scientific / Demo mở rộng / Backfill"
  log "7. Policy Records (thi đua / khen thưởng / kỷ luật)"

  if [[ "${#SKIPPED_SEEDS[@]}" -gt 0 ]]; then
    echo | tee -a "$LOG_FILE"
    warn "Danh sách seed đã skip:"
    local s
    for s in "${SKIPPED_SEEDS[@]}"; do
      log "  - $s"
    done
  fi

  if [[ "${#FAILED_SEEDS[@]}" -gt 0 ]]; then
    echo | tee -a "$LOG_FILE"
    error "Danh sách seed lỗi:"
    local f
    for f in "${FAILED_SEEDS[@]}"; do
      log "  - $f"
    done
  fi
}

########################################
# MAIN
########################################
safe_cd_project

section "HVHC RESET + SEED FULL DEMO v6"

if [[ "$INTERACTIVE" == "1" ]]; then
  collect_config
else
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"
fi

section "CHECK REQUIRED COMMANDS"
require_cmd node
require_cmd npm
require_cmd npx
require_cmd psql
require_cmd pg_dump
require_cmd bash
success "Đã kiểm tra đủ command cần thiết"

if [[ ! -f "$SCHEMA_PATH" ]]; then
  error "Không tìm thấy schema Prisma: $SCHEMA_PATH"
  exit 1
fi

if [[ "$RESET_DB" == "1" && "$RESET_MODE" == "dropdb" ]]; then
  require_cmd dropdb
  require_cmd createdb
fi

if [[ "$RUN_NPM_INSTALL" == "1" ]]; then
  section "NPM INSTALL"
  run_cmd "npm install" npm install --legacy-peer-deps
fi

cleanup_eof_artifacts

if [[ "$WITH_BACKUP" == "1" ]]; then
  section "BACKUP DATABASE"
  CURRENT_STEP="Backup database"
  if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -Fc -f "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    success "Backup xong: $BACKUP_FILE"
  else
    warn "Backup thất bại hoặc DB chưa tồn tại. Tiếp tục..."
  fi
else
  warn "Bỏ qua backup database"
fi

if [[ "$RESET_DB" == "1" ]]; then
  section "RESET DATABASE"

  terminate_local_processes

  if [[ "$RESET_MODE" == "prisma" ]]; then
    run_cmd "Prisma migrate reset" npx prisma migrate reset --schema="$SCHEMA_PATH" --force
    success "Database reset bằng prisma migrate reset"
  else
    terminate_db_connections
    run_cmd "Drop DB nếu tồn tại" dropdb --if-exists -h "$DB_HOST" -U "$DB_USER" "$DB_NAME"
    run_cmd "Create lại DB" createdb -h "$DB_HOST" -U "$DB_USER" "$DB_NAME"
    success "Database đã được tạo lại bằng dropdb/createdb"
  fi
else
  warn "Bỏ qua reset database"
fi

if [[ "$RUN_PRISMA_VALIDATE" == "1" ]]; then
  section "PRISMA VALIDATE"
  run_cmd "Prisma validate" npx prisma validate --schema="$SCHEMA_PATH"
else
  warn "Bỏ qua Prisma validate"
fi

if [[ "$RUN_PRISMA_GENERATE" == "1" ]]; then
  section "PRISMA GENERATE"
  run_cmd "Prisma generate" npx prisma generate --schema="$SCHEMA_PATH"
else
  warn "Bỏ qua Prisma generate"
fi

if [[ "$RESET_MODE" == "dropdb" && "$RUN_PRISMA_PUSH" == "1" ]]; then
  section "PRISMA DB PUSH"
  run_cmd "Prisma db push" npx prisma db push --schema="$SCHEMA_PATH"
else
  warn "Bỏ qua Prisma db push"
fi

run_seed_group \
  "Lõi hệ thống (units / users / rbac / positions / commanders)" \
  "prisma/seed/seed_units.ts" \
  "prisma/seed/seed_users.ts" \
  "prisma/seed/seed_rbac.ts" \
  "prisma/seed/seed_positions_rbac.ts" \
  "prisma/seed/assign_commanders.ts"

run_seed_group \
  "Admin full access" \
  "prisma/seed/seed_admin_full_access.ts"

run_seed_group \
  "Master data / administrative / danh mục" \
  "prisma/seed/seed_master_data.ts" \
  "prisma/seed/seed_administrative_units.ts" \
  "prisma/seed/seed_party_insurance_perms.ts"

run_seed_group \
  "Personnel demo + personnel profiles + faculty profiles" \
  "prisma/seed/seed_personnel_demo_full.ts" \
  "prisma/seed/seed_personnel_profiles_demo_v2.ts" \
  "prisma/seed/seed_faculty_profiles.ts"

run_seed_group \
  "Education + teaching" \
  "prisma/seed/seed_education.ts" \
  "prisma/seed/seed_teaching_data.ts"

run_seed_group \
  "Party data" \
  "prisma/seed/seed_party_organizations.ts" \
  "prisma/seed/seed_party_members.ts" \
  "prisma/seed/seed_party_history.ts" \
  "prisma/seed/seed_party_histories.ts" \
  "prisma/seed/seed_party_activities.ts"

run_seed_group \
  "Policy / thi đua / khen thưởng / kỷ luật" \
  "prisma/seed/seed_policy_insurance.ts" \
  "prisma/seed/seed_policy_full.ts" \
  "prisma/seed/seed_thi_dua_khen_thuong.ts" \
  "prisma/seed/seed_discipline.ts" \
  "prisma/seed/seed_policy_records.ts" \
  "prisma/seeds/seed_policy_records.ts"

run_seed_group \
  "Insurance / BHXH / BHYT" \
  "prisma/seed/seed_insurance.ts" \
  "prisma/seed/seed_insurance_data.ts" \
  "prisma/seed/seed_insurance_full.ts"

run_seed_group \
  "Scientific / publications / research" \
  "prisma/seed/seed_scientific.ts" \
  "prisma/seed/seed_scientific_publications.ts"

run_seed_group \
  "Demo mở rộng / sync" \
  "prisma/seed/seed_demo_data_v8.ts" \
  "prisma/seed/seed_sync_data.ts"

run_seed_group \
  "Backfill cuối" \
  "prisma/seed/backfill_fk_references.ts" \
  "prisma/seed/backfill-personnel.ts"

print_summary
post_action