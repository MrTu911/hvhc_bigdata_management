#!/usr/bin/env bash
set -Eeuo pipefail

########################################
# CONFIG – chỉnh tại đây hoặc truyền qua env
########################################
PROJECT_DIR="${PROJECT_DIR:-/home/kelinton/hvhc_bigdata_management/nextjs_space}"
DB_NAME="${DB_NAME:-hvhc_bigdata_89}"
DB_USER="${DB_USER:-ductuking}"
DB_HOST="${DB_HOST:-localhost}"
DB_PASSWORD="${DB_PASSWORD:-}"          # để trống nếu dùng .pgpass / trust auth
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@demo.hvhc.edu.vn}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Demo@2025}"
SCHEMA_PATH="${SCHEMA_PATH:-$PROJECT_DIR/prisma/schema.prisma}"
LOG_DIR="${LOG_DIR:-$PROJECT_DIR/logs}"
SKIP_OPTIONAL_SEEDS="${SKIP_OPTIONAL_SEEDS:-1}"   # 1=bỏ qua file không tồn tại
STRICT_MODE="${STRICT_MODE:-0}"                    # 0=tiếp tục dù seed lỗi

########################################
# SETUP
########################################
mkdir -p "$LOG_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$LOG_DIR/seed_${TIMESTAMP}.log"

# Export PGPASSWORD để psql/dropdb/createdb không hỏi mật khẩu
[[ -n "$DB_PASSWORD" ]] && export PGPASSWORD="$DB_PASSWORD"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()     { echo -e "$1" | tee -a "$LOG_FILE"; }
section() { log "\n${BOLD}${CYAN}══════════════════════════════════════${NC}"; log "${BOLD}${CYAN}  $1${NC}"; log "${BOLD}${CYAN}══════════════════════════════════════${NC}"; }
ok()      { log "${GREEN}✅ $1${NC}"; }
warn()    { log "${YELLOW}⚠️  $1${NC}"; }
err()     { log "${RED}❌ $1${NC}"; }
info()    { log "${BLUE}ℹ️  $1${NC}"; }

SEED_OK=0; SEED_SKIP=0; SEED_FAIL=0
declare -a FAILED_LIST=()
declare -A SEEN=()

########################################
# ERROR TRAP
########################################
STEP="init"
trap 'err "Lỗi tại bước: $STEP (line $LINENO, exit $?)"; err "Log: $LOG_FILE"' ERR

########################################
# VALIDATE SCHEMA
########################################
if [[ ! -f "$SCHEMA_PATH" ]]; then
  err "Không tìm thấy: $SCHEMA_PATH"; exit 1
fi
if ! grep -qE "^datasource|^generator|^model" "$SCHEMA_PATH"; then
  err "File $SCHEMA_PATH không phải Prisma schema hợp lệ!"
  err "3 dòng đầu:"; head -3 "$SCHEMA_PATH" >&2; exit 1
fi

########################################
# CD PROJECT
########################################
[[ ! -d "$PROJECT_DIR" ]] && { err "PROJECT_DIR không tồn tại: $PROJECT_DIR"; exit 1; }
cd "$PROJECT_DIR"

########################################
# RESET DATABASE
########################################
reset_db() {
  section "RESET DATABASE"
  STEP="terminate DB connections"

  # Đóng các connection đang mở
  psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
     WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
    >> "$LOG_FILE" 2>&1 || true

  STEP="dropdb"
  info "Drop database $DB_NAME..."
  dropdb --if-exists -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" 2>&1 | tee -a "$LOG_FILE"

  STEP="createdb"
  info "Create database $DB_NAME..."
  createdb -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" 2>&1 | tee -a "$LOG_FILE"

  ok "Database đã được tạo lại"
}

########################################
# PRISMA
########################################
run_prisma() {
  STEP="prisma generate"
  section "PRISMA GENERATE"
  npx prisma generate --schema="$SCHEMA_PATH" 2>&1 | tee -a "$LOG_FILE"
  ok "Prisma generate xong"

  STEP="prisma db push"
  section "PRISMA DB PUSH"
  npx prisma db push --schema="$SCHEMA_PATH" 2>&1 | tee -a "$LOG_FILE"
  ok "Prisma db push xong"
}

########################################
# SEED
########################################
run_seed() {
  local req="$1"
  local actual=""

  # Tìm file – thử seed/ rồi seeds/
  if [[ -f "$req" ]]; then
    actual="$req"
  elif [[ "$req" == prisma/seed/* && -f "${req/prisma\/seed\//prisma\/seeds\/}" ]]; then
    actual="${req/prisma\/seed\//prisma\/seeds\/}"
  elif [[ "$req" == prisma/seeds/* && -f "${req/prisma\/seeds\//prisma\/seed\/}" ]]; then
    actual="${req/prisma\/seeds\//prisma\/seed\/}"
  fi

  if [[ -z "$actual" ]]; then
    if [[ "$SKIP_OPTIONAL_SEEDS" == "1" ]]; then
      warn "SKIP (không tìm thấy): $req"
      SEED_SKIP=$((SEED_SKIP + 1)); return 0
    else
      err "Thiếu file: $req"
      SEED_FAIL=$((SEED_FAIL + 1)); FAILED_LIST+=("$req")
      [[ "$STRICT_MODE" == "1" ]] && return 1 || return 0
    fi
  fi

  # Bỏ qua trùng lặp
  if [[ -n "${SEEN[$actual]:-}" ]]; then
    warn "SKIP (trùng): $actual"
    SEED_SKIP=$((SEED_SKIP + 1)); return 0
  fi

  section "SEED: $actual"
  STEP="seed $actual"

  if ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
     npx tsx --require dotenv/config "$actual" 2>&1 | tee -a "$LOG_FILE"; then
    SEEN["$actual"]=1
    SEED_OK=$((SEED_OK + 1))
    ok "DONE: $actual"
  else
    SEED_FAIL=$((SEED_FAIL + 1)); FAILED_LIST+=("$actual")
    err "FAILED: $actual"
    if [[ "$STRICT_MODE" == "1" ]]; then return 1; fi
    warn "Tiếp tục (STRICT_MODE=0)..."
  fi
}

########################################
# MAIN
########################################
section "HVHC SEED v7"
info "Project : $PROJECT_DIR"
info "Database: $DB_NAME @ $DB_HOST"
info "Schema  : $SCHEMA_PATH"
info "Log     : $LOG_FILE"

reset_db
run_prisma

# ── NHÓM 1: Lõi hệ thống ──────────────────────────
section "NHÓM 1: Lõi hệ thống"
run_seed "prisma/seed/seed_units.ts"
run_seed "prisma/seed/seed_users.ts"
run_seed "prisma/seed/seed_rbac.ts"
run_seed "prisma/seed/seed_positions_rbac.ts"
run_seed "prisma/seed/assign_commanders.ts"

# ── NHÓM 2: Admin ─────────────────────────────────
section "NHÓM 2: Admin"
run_seed "prisma/seed/seed_admin_full_access.ts"

# ── NHÓM 3: Master data ───────────────────────────
section "NHÓM 3: Master data"
run_seed "prisma/seed/seed_master_data.ts"
run_seed "prisma/seed/seed_administrative_units.ts"
run_seed "prisma/seed/seed_party_insurance_perms.ts"

# ── NHÓM 4: Personnel ─────────────────────────────
section "NHÓM 4: Personnel"
run_seed "prisma/seed/seed_personnel_demo_full.ts"
run_seed "prisma/seed/seed_personnel_profiles_demo_v2.ts"
run_seed "prisma/seed/seed_faculty_profiles.ts"

# ── NHÓM 5: Education ─────────────────────────────
section "NHÓM 5: Education"
run_seed "prisma/seed/seed_education.ts"
run_seed "prisma/seed/seed_teaching_data.ts"

# ── NHÓM 6: Party ─────────────────────────────────
section "NHÓM 6: Party"
run_seed "prisma/seed/seed_party_organizations.ts"
run_seed "prisma/seed/seed_party_members.ts"
run_seed "prisma/seed/seed_party_history.ts"
run_seed "prisma/seed/seed_party_histories.ts"
run_seed "prisma/seed/seed_party_activities.ts"

# ── NHÓM 7: Policy ────────────────────────────────
section "NHÓM 7: Policy"
run_seed "prisma/seed/seed_policy_insurance.ts"
run_seed "prisma/seed/seed_policy_full.ts"
run_seed "prisma/seed/seed_thi_dua_khen_thuong.ts"
run_seed "prisma/seed/seed_discipline.ts"
run_seed "prisma/seed/seed_policy_records.ts"

# ── NHÓM 8: Insurance ─────────────────────────────
section "NHÓM 8: Insurance"
run_seed "prisma/seed/seed_insurance.ts"
run_seed "prisma/seed/seed_insurance_data.ts"
run_seed "prisma/seed/seed_insurance_full.ts"

# ── NHÓM 9: Scientific ────────────────────────────
section "NHÓM 9: Scientific"
run_seed "prisma/seed/seed_scientific.ts"
run_seed "prisma/seed/seed_scientific_publications.ts"

# ── NHÓM 10: Demo / Sync ──────────────────────────
section "NHÓM 10: Demo / Sync"
run_seed "prisma/seed/seed_demo_data_v8.ts"
run_seed "prisma/seed/seed_sync_data.ts"

# ── NHÓM 11: Backfill ─────────────────────────────
section "NHÓM 11: Backfill"
run_seed "prisma/seed/backfill_fk_references.ts"
run_seed "prisma/seed/backfill-personnel.ts"

########################################
# TỔNG KẾT
########################################
section "TỔNG KẾT"
ok  "Seeds thành công : $SEED_OK"
warn "Seeds bỏ qua    : $SEED_SKIP"
if [[ $SEED_FAIL -gt 0 ]]; then
  err "Seeds thất bại  : $SEED_FAIL"
  for f in "${FAILED_LIST[@]}"; do err "  - $f"; done
else
  ok "Seeds thất bại  : 0"
fi
info "Log đầy đủ: $LOG_FILE"