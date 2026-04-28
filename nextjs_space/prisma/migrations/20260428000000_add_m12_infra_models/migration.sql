-- Module M12 – Data Management & Infrastructure
-- Migration: add_m12_infra_models
-- Created: 2026-04-28

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE "PipelineDefType" AS ENUM (
  'ETL_PG_TO_CLICKHOUSE',
  'DATA_QUALITY',
  'BACKUP',
  'AI_REFRESH',
  'CUSTOM'
);

CREATE TYPE "PipelineRunStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "PipelineTrigger" AS ENUM (
  'MANUAL',
  'SCHEDULED',
  'API',
  'EVENT'
);

CREATE TYPE "DataQualityRuleType" AS ENUM (
  'COMPLETENESS',
  'UNIQUENESS',
  'FK_INTEGRITY',
  'VALID_RANGE',
  'TIMELINESS',
  'CONSISTENCY'
);

CREATE TYPE "DQSeverity" AS ENUM (
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL'
);

CREATE TYPE "WarehouseSyncMode" AS ENUM (
  'FULL',
  'INCREMENTAL'
);

CREATE TYPE "WarehoueSyncStatus" AS ENUM (
  'IDLE',
  'RUNNING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "StorageAccessTier" AS ENUM (
  'HOT',
  'COLD',
  'ARCHIVE'
);

CREATE TYPE "BackupType" AS ENUM (
  'POSTGRESQL_FULL',
  'POSTGRESQL_INCREMENTAL',
  'MINIO_CONFIG',
  'AIRFLOW_DAGS',
  'GRAFANA'
);

CREATE TYPE "BackupJobStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "RestoreJobStatus" AS ENUM (
  'REQUESTED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "RestoreVerifyStatus" AS ENUM (
  'NOT_VERIFIED',
  'VERIFIED_OK',
  'VERIFIED_FAILED'
);

CREATE TYPE "DRExerciseOutcome" AS ENUM (
  'PASS',
  'PARTIAL',
  'FAIL'
);

-- ============================================================
-- TABLE: pipeline_definitions
-- Định nghĩa pipeline tái sử dụng, tách khỏi run record
-- ============================================================

CREATE TABLE "pipeline_definitions" (
  "id"             TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "pipelineType"   "PipelineDefType" NOT NULL,
  "sourceDataset"  TEXT NOT NULL,
  "targetDataset"  TEXT,
  "scheduleCron"   TEXT,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "steps"          JSONB NOT NULL,
  "parameters"     JSONB,
  "lastRunAt"      TIMESTAMP(3),
  "lastRunStatus"  "PipelineRunStatus",
  "createdById"    TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pipeline_definitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pipeline_definitions_pipelineType_idx" ON "pipeline_definitions"("pipelineType");
CREATE INDEX "pipeline_definitions_isActive_idx" ON "pipeline_definitions"("isActive");
CREATE INDEX "pipeline_definitions_lastRunAt_idx" ON "pipeline_definitions"("lastRunAt");

-- ============================================================
-- TABLE: pipeline_runs
-- Kết quả mỗi lần chạy một pipeline definition
-- ============================================================

CREATE TABLE "pipeline_runs" (
  "id"             TEXT NOT NULL,
  "definitionId"   TEXT NOT NULL,
  "triggeredBy"    "PipelineTrigger" NOT NULL,
  "triggeredById"  TEXT,
  "status"         "PipelineRunStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt"      TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "durationMs"     INTEGER,
  "recordsRead"    INTEGER,
  "recordsWritten" INTEGER,
  "recordsSkipped" INTEGER,
  "errorCount"     INTEGER DEFAULT 0,
  "errorMessage"   TEXT,
  "logPath"        TEXT,
  "metadata"       JSONB,

  CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pipeline_runs_definitionId_idx" ON "pipeline_runs"("definitionId");
CREATE INDEX "pipeline_runs_status_idx" ON "pipeline_runs"("status");
CREATE INDEX "pipeline_runs_startedAt_idx" ON "pipeline_runs"("startedAt");
CREATE INDEX "pipeline_runs_triggeredBy_idx" ON "pipeline_runs"("triggeredBy");

ALTER TABLE "pipeline_runs"
  ADD CONSTRAINT "pipeline_runs_definitionId_fkey"
  FOREIGN KEY ("definitionId") REFERENCES "pipeline_definitions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- TABLE: data_quality_rules
-- Định nghĩa quy tắc kiểm tra chất lượng dữ liệu
-- ============================================================

CREATE TABLE "data_quality_rules" (
  "id"           TEXT NOT NULL,
  "ruleCode"     TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "ruleType"     "DataQualityRuleType" NOT NULL,
  "targetTable"  TEXT NOT NULL,
  "targetColumn" TEXT,
  "ruleConfig"   JSONB NOT NULL,
  "severity"     "DQSeverity" NOT NULL,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "data_quality_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "data_quality_rules_ruleCode_key" ON "data_quality_rules"("ruleCode");
CREATE INDEX "data_quality_rules_ruleType_idx" ON "data_quality_rules"("ruleType");
CREATE INDEX "data_quality_rules_targetTable_idx" ON "data_quality_rules"("targetTable");
CREATE INDEX "data_quality_rules_severity_idx" ON "data_quality_rules"("severity");
CREATE INDEX "data_quality_rules_isActive_idx" ON "data_quality_rules"("isActive");

-- ============================================================
-- TABLE: data_quality_results
-- Kết quả mỗi lần chạy kiểm tra chất lượng
-- ============================================================

CREATE TABLE "data_quality_results" (
  "id"            TEXT NOT NULL,
  "ruleId"        TEXT NOT NULL,
  "pipelineRunId" TEXT,
  "checkedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "passed"        BOOLEAN NOT NULL,
  "totalChecked"  INTEGER NOT NULL,
  "failedRows"    INTEGER NOT NULL DEFAULT 0,
  "failRate"      DOUBLE PRECISION,
  "severity"      "DQSeverity" NOT NULL,
  "sampleData"    JSONB,
  "note"          TEXT,

  CONSTRAINT "data_quality_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_quality_results_ruleId_idx" ON "data_quality_results"("ruleId");
CREATE INDEX "data_quality_results_checkedAt_idx" ON "data_quality_results"("checkedAt");
CREATE INDEX "data_quality_results_passed_idx" ON "data_quality_results"("passed");
CREATE INDEX "data_quality_results_pipelineRunId_idx" ON "data_quality_results"("pipelineRunId");

ALTER TABLE "data_quality_results"
  ADD CONSTRAINT "data_quality_results_ruleId_fkey"
  FOREIGN KEY ("ruleId") REFERENCES "data_quality_rules"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "data_quality_results"
  ADD CONSTRAINT "data_quality_results_pipelineRunId_fkey"
  FOREIGN KEY ("pipelineRunId") REFERENCES "pipeline_runs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- TABLE: warehouse_sync_jobs
-- Theo dõi trạng thái đồng bộ PG → ClickHouse
-- ============================================================

CREATE TABLE "warehouse_sync_jobs" (
  "id"                   TEXT NOT NULL,
  "sourceTable"          TEXT NOT NULL,
  "targetDataset"        TEXT NOT NULL,
  "syncMode"             "WarehouseSyncMode" NOT NULL,
  "status"               "WarehoueSyncStatus" NOT NULL DEFAULT 'IDLE',
  "lastSyncAt"           TIMESTAMP(3),
  "lastSyncRowCount"     INTEGER,
  "lastSyncDurationMs"   INTEGER,
  "watermarkField"       TEXT,
  "watermarkValue"       TEXT,
  "errorMessage"         TEXT,
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,

  CONSTRAINT "warehouse_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "warehouse_sync_jobs_sourceTable_idx" ON "warehouse_sync_jobs"("sourceTable");
CREATE INDEX "warehouse_sync_jobs_status_idx" ON "warehouse_sync_jobs"("status");
CREATE INDEX "warehouse_sync_jobs_lastSyncAt_idx" ON "warehouse_sync_jobs"("lastSyncAt");

-- ============================================================
-- TABLE: storage_bucket_configs
-- Chiến lược bucket MinIO theo module/domain
-- ============================================================

CREATE TABLE "storage_bucket_configs" (
  "id"              TEXT NOT NULL,
  "bucketName"      TEXT NOT NULL,
  "moduleDomain"    TEXT NOT NULL,
  "description"     TEXT,
  "retentionDays"   INTEGER,
  "accessTier"      "StorageAccessTier" NOT NULL,
  "lifecyclePolicy" JSONB,
  "maxSizeGb"       INTEGER,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "storage_bucket_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "storage_bucket_configs_bucketName_key" ON "storage_bucket_configs"("bucketName");
CREATE INDEX "storage_bucket_configs_moduleDomain_idx" ON "storage_bucket_configs"("moduleDomain");
CREATE INDEX "storage_bucket_configs_accessTier_idx" ON "storage_bucket_configs"("accessTier");

-- ============================================================
-- TABLE: backup_jobs
-- Ghi nhận mỗi lần chạy backup
-- ============================================================

CREATE TABLE "backup_jobs" (
  "id"            TEXT NOT NULL,
  "backupType"    "BackupType" NOT NULL,
  "status"        "BackupJobStatus" NOT NULL DEFAULT 'PENDING',
  "targetPath"    TEXT NOT NULL,
  "triggeredBy"   "PipelineTrigger" NOT NULL,
  "requestedById" TEXT,
  "startedAt"     TIMESTAMP(3),
  "completedAt"   TIMESTAMP(3),
  "durationMs"    INTEGER,
  "sizeBytes"     BIGINT,
  "errorMessage"  TEXT,

  CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backup_jobs_backupType_idx" ON "backup_jobs"("backupType");
CREATE INDEX "backup_jobs_status_idx" ON "backup_jobs"("status");
CREATE INDEX "backup_jobs_startedAt_idx" ON "backup_jobs"("startedAt");
CREATE INDEX "backup_jobs_triggeredBy_idx" ON "backup_jobs"("triggeredBy");

-- ============================================================
-- TABLE: backup_artifacts
-- File vật lý của backup job trên MinIO
-- ============================================================

CREATE TABLE "backup_artifacts" (
  "id"             TEXT NOT NULL,
  "jobId"          TEXT NOT NULL,
  "storagePath"    TEXT NOT NULL,
  "sizeBytes"      BIGINT NOT NULL,
  "checksumHash"   TEXT,
  "isVerified"     BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt"     TIMESTAMP(3),
  "retentionUntil" TIMESTAMP(3),
  "metadata"       JSONB,

  CONSTRAINT "backup_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backup_artifacts_jobId_idx" ON "backup_artifacts"("jobId");
CREATE INDEX "backup_artifacts_retentionUntil_idx" ON "backup_artifacts"("retentionUntil");

ALTER TABLE "backup_artifacts"
  ADD CONSTRAINT "backup_artifacts_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "backup_jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- TABLE: restore_jobs
-- Yêu cầu và kết quả restore từ backup
-- ============================================================

CREATE TABLE "restore_jobs" (
  "id"                 TEXT NOT NULL,
  "backupJobId"        TEXT NOT NULL,
  "targetEnvironment"  TEXT NOT NULL,
  "requestedById"      TEXT NOT NULL,
  "status"             "RestoreJobStatus" NOT NULL DEFAULT 'REQUESTED',
  "startedAt"          TIMESTAMP(3),
  "completedAt"        TIMESTAMP(3),
  "verificationStatus" "RestoreVerifyStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
  "verificationNote"   TEXT,
  "errorMessage"       TEXT,
  "notes"              TEXT,

  CONSTRAINT "restore_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "restore_jobs_backupJobId_idx" ON "restore_jobs"("backupJobId");
CREATE INDEX "restore_jobs_status_idx" ON "restore_jobs"("status");
CREATE INDEX "restore_jobs_requestedById_idx" ON "restore_jobs"("requestedById");
CREATE INDEX "restore_jobs_startedAt_idx" ON "restore_jobs"("startedAt");

ALTER TABLE "restore_jobs"
  ADD CONSTRAINT "restore_jobs_backupJobId_fkey"
  FOREIGN KEY ("backupJobId") REFERENCES "backup_jobs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- TABLE: disaster_recovery_plans
-- Runbook DR với RTO/RPO target
-- ============================================================

CREATE TABLE "disaster_recovery_plans" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "rtoTargetMin" INTEGER NOT NULL,
  "rpoTargetMin" INTEGER NOT NULL,
  "runbookPath"  TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdById"  TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "disaster_recovery_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "disaster_recovery_plans_isActive_idx" ON "disaster_recovery_plans"("isActive");

-- ============================================================
-- TABLE: disaster_recovery_exercises
-- Kết quả từng lần diễn tập DR
-- ============================================================

CREATE TABLE "disaster_recovery_exercises" (
  "id"             TEXT NOT NULL,
  "planId"         TEXT NOT NULL,
  "exercisedAt"    TIMESTAMP(3) NOT NULL,
  "conductedById"  TEXT NOT NULL,
  "outcome"        "DRExerciseOutcome" NOT NULL,
  "rtoAchievedMin" INTEGER,
  "rpoAchievedMin" INTEGER,
  "findings"       TEXT,
  "nextReviewDate" TIMESTAMP(3),

  CONSTRAINT "disaster_recovery_exercises_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "disaster_recovery_exercises_planId_idx" ON "disaster_recovery_exercises"("planId");
CREATE INDEX "disaster_recovery_exercises_exercisedAt_idx" ON "disaster_recovery_exercises"("exercisedAt");
CREATE INDEX "disaster_recovery_exercises_outcome_idx" ON "disaster_recovery_exercises"("outcome");

ALTER TABLE "disaster_recovery_exercises"
  ADD CONSTRAINT "disaster_recovery_exercises_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "disaster_recovery_plans"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- TABLE: metric_threshold_policies
-- Ngưỡng cảnh báo cấu hình được theo metric name
-- ============================================================

CREATE TABLE "metric_threshold_policies" (
  "id"                TEXT NOT NULL,
  "metricName"        TEXT NOT NULL,
  "displayName"       TEXT NOT NULL,
  "description"       TEXT,
  "warningThreshold"  DOUBLE PRECISION NOT NULL,
  "criticalThreshold" DOUBLE PRECISION NOT NULL,
  "unit"              TEXT,
  "autoAction"        TEXT,
  "isActive"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "metric_threshold_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "metric_threshold_policies_metricName_key" ON "metric_threshold_policies"("metricName");
CREATE INDEX "metric_threshold_policies_isActive_idx" ON "metric_threshold_policies"("isActive");

-- ============================================================
-- SEED: MetricThresholdPolicy – ngưỡng chuẩn từ design docs
-- ============================================================

INSERT INTO "metric_threshold_policies" (
  "id", "metricName", "displayName", "description",
  "warningThreshold", "criticalThreshold", "unit", "autoAction",
  "isActive", "createdAt", "updatedAt"
) VALUES
  (gen_random_uuid()::text, 'pg_connection_pct', 'PostgreSQL Connections %',
   'Phần trăm số connection so với max_connections',
   75, 90, '%', 'Scale connection pool', true, NOW(), NOW()),

  (gen_random_uuid()::text, 'minio_disk_pct', 'MinIO Disk Usage %',
   'Phần trăm dung lượng đĩa MinIO đã dùng',
   70, 85, '%', 'Trigger archive job', true, NOW(), NOW()),

  (gen_random_uuid()::text, 'api_p95_ms', 'API Response Time p95',
   'Thời gian phản hồi API ở percentile 95',
   2000, 3000, 'ms', 'Trigger cache warm-up', true, NOW(), NOW()),

  (gen_random_uuid()::text, 'redis_memory_pct', 'Redis Memory Usage %',
   'Phần trăm bộ nhớ Redis đã dùng',
   80, 90, '%', 'LRU eviction', true, NOW(), NOW()),

  (gen_random_uuid()::text, 'backup_age_minutes', 'Backup Age (phút)',
   'Số phút kể từ lần backup thành công gần nhất',
   60, 90, 'minutes', 'Critical alert, escalate on-call', true, NOW(), NOW()),

  (gen_random_uuid()::text, 'airflow_dag_failure_count', 'Airflow DAG Failures',
   'Số DAG thất bại trong vòng 1 giờ',
   1, 3, 'count', 'Retry 2 lần, alert admin', true, NOW(), NOW());

-- ============================================================
-- SEED: StorageBucketConfig – bucket strategy theo module
-- ============================================================

INSERT INTO "storage_bucket_configs" (
  "id", "bucketName", "moduleDomain", "description",
  "retentionDays", "accessTier", "isActive", "createdAt", "updatedAt"
) VALUES
  (gen_random_uuid()::text, 'hvhc-personnel',     'M02_PERSONNEL',   'Hồ sơ nhân sự, ảnh, scan',         3650, 'HOT',     true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-education',     'M10_EDUCATION',   'Luận văn, bằng tốt nghiệp, scan',   3650, 'HOT',     true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-policy',        'M05_POLICY',      'Quyết định khen thưởng, kỷ luật',   3650, 'COLD',    true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-research',      'M09_RESEARCH',    'Công trình NCKH, báo cáo khoa học', 3650, 'HOT',     true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-export',        'M18_EXPORT',      'File export tạm thời theo job',     30,   'HOT',     true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-backups',       'M12_BACKUP',      'PostgreSQL dump và config backup',  90,   'COLD',    true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-archive',       'M12_ARCHIVE',     'Audit logs và hồ sơ lưu trữ dài hạn', 2555, 'ARCHIVE', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hvhc-party',         'M03_PARTY',       'Hồ sơ đảng viên — nhạy cảm cao',   3650, 'COLD',    true, NOW(), NOW());
