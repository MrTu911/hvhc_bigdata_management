#!/usr/bin/env bash
# M12 – PostgreSQL Backup Script
#
# Chạy pg_dump, upload dump lên MinIO, báo kết quả về app qua internal callback.
# Được gọi bởi cron hoặc Airflow (không gọi trực tiếp từ trong app).
#
# Dependencies: pg_dump, mc (MinIO Client), curl, sha256sum
#
# Crontab (mỗi ngày 2 giờ sáng):
#   0 2 * * * /opt/hvhc/scripts/backup-pg.sh >> /var/log/hvhc-backup.log 2>&1
#
# Environment variables (load từ .env hoặc set trước khi chạy):
#   DATABASE_URL         postgresql://user:pass@host:5432/dbname
#   MINIO_ALIAS          mc alias (default: hvhc)
#   MINIO_BUCKET         bucket đích (default: backups)
#   APP_INTERNAL_URL     URL nội bộ app (default: http://localhost:3000)
#   CRON_SECRET          Bearer token để gọi internal API
#   BACKUP_RETENTION_DAYS số ngày giữ artifact (default: 30)

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env nếu tồn tại
if [[ -f "${SCRIPT_DIR}/../nextjs_space/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/../nextjs_space/.env"
  set +a
fi

MINIO_ALIAS="${MINIO_ALIAS:-hvhc}"
MINIO_BUCKET="${MINIO_BUCKET:-backups}"
APP_INTERNAL_URL="${APP_INTERNAL_URL:-http://localhost:3000}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
CALLBACK_URL="${APP_INTERNAL_URL}/api/internal/backup/report"
BACKUP_TYPE="POSTGRESQL_FULL"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILENAME="pg_full_${TIMESTAMP}.dump"
TMP_DIR="/tmp/hvhc_backup"
DUMP_PATH="${TMP_DIR}/${DUMP_FILENAME}"
MINIO_OBJECT_PATH="postgresql/full/${DUMP_FILENAME}"
JOB_ID=""

# ─── Helpers ──────────────────────────────────────────────────────────────────

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [backup-pg] $*"; }

die() {
  log "ERROR: $*"
  # Báo failed nếu đã có job ID
  if [[ -n "${JOB_ID}" ]]; then
    report_failed "$*"
  fi
  exit 1
}

require_env() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: ${var}" >&2
    exit 1
  fi
}

# ─── Callback helpers ─────────────────────────────────────────────────────────

call_callback() {
  local payload="$1"
  local response
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${CALLBACK_URL}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    --max-time 30)

  local http_code
  http_code=$(echo "${response}" | tail -1)
  local body
  body=$(echo "${response}" | head -n -1)

  if [[ "${http_code}" != "200" ]]; then
    log "Callback HTTP ${http_code}: ${body}"
    return 1
  fi
  echo "${body}"
}

report_started() {
  local payload
  payload=$(printf '{"event":"started","backupType":"%s","targetPath":"%s"}' \
    "${BACKUP_TYPE}" "minio://${MINIO_BUCKET}/${MINIO_OBJECT_PATH}")

  local resp
  resp=$(call_callback "${payload}") || die "Failed to call started callback"
  JOB_ID=$(echo "${resp}" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

  if [[ -z "${JOB_ID}" ]]; then
    die "No jobId returned from started callback: ${resp}"
  fi
  log "Job registered: ${JOB_ID}"
}

report_completed() {
  local size_bytes="$1"
  local checksum="$2"
  local payload
  payload=$(printf \
    '{"event":"completed","jobId":"%s","sizeBytes":%d,"checksumHash":"%s","storagePath":"minio://%s/%s","retentionDays":%d}' \
    "${JOB_ID}" "${size_bytes}" "${checksum}" \
    "${MINIO_BUCKET}" "${MINIO_OBJECT_PATH}" "${BACKUP_RETENTION_DAYS}")

  call_callback "${payload}" > /dev/null || log "WARN: completed callback failed (backup still OK)"
  log "Completed callback sent"
}

report_failed() {
  local error_msg="$1"
  # Escape double quotes for JSON
  local escaped_msg="${error_msg//\"/\\\"}"
  local payload
  payload=$(printf '{"event":"failed","jobId":"%s","errorMessage":"%s"}' \
    "${JOB_ID}" "${escaped_msg}")

  call_callback "${payload}" > /dev/null || log "WARN: failed callback itself failed"
  log "Failed callback sent"
}

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
  require_env DATABASE_URL
  require_env CRON_SECRET

  mkdir -p "${TMP_DIR}"
  log "Starting PostgreSQL full backup → ${DUMP_FILENAME}"

  # 1. Báo started trước khi chạy dump
  report_started

  # 2. pg_dump
  log "Running pg_dump..."
  if ! pg_dump --format=custom --compress=9 --file="${DUMP_PATH}" "${DATABASE_URL}"; then
    die "pg_dump exited with error"
  fi

  if [[ ! -f "${DUMP_PATH}" ]]; then
    die "Dump file not found after pg_dump: ${DUMP_PATH}"
  fi

  local size_bytes
  size_bytes=$(stat -c%s "${DUMP_PATH}")
  log "Dump size: ${size_bytes} bytes"

  # 3. Checksum
  local checksum
  checksum=$(sha256sum "${DUMP_PATH}" | awk '{print $1}')
  log "SHA256: ${checksum}"

  # 4. Upload lên MinIO
  if command -v mc &> /dev/null; then
    log "Uploading to MinIO: ${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_OBJECT_PATH}"
    if ! mc cp "${DUMP_PATH}" "${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_OBJECT_PATH}"; then
      die "MinIO upload failed"
    fi
    log "Upload completed"
  else
    log "WARN: mc not found — skipping MinIO upload (local dump kept at ${DUMP_PATH})"
  fi

  # 5. Báo completed
  report_completed "${size_bytes}" "${checksum}"

  # 6. Cleanup tmp
  rm -f "${DUMP_PATH}"
  log "Backup finished successfully: ${JOB_ID}"
}

main "$@"
