/**
 * Seed M12 Infrastructure - Full demo data
 * Covers: BigDataService, ServiceAlert, PipelineDefinition+Run,
 *         DataQualityRule+Result, WarehouseSyncJob, StorageBucketConfig,
 *         BackupJob, RestoreJob, DisasterRecoveryPlan+Exercise,
 *         MetricThresholdPolicy
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdminUser() {
  const user = await prisma.user.findFirst({
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true },
  });
  if (!user) throw new Error('Không tìm thấy user QUAN_TRI_HE_THONG');
  return user.id;
}

// ─── 1. MetricThresholdPolicy ─────────────────────────────────────────────────

async function seedThresholds() {
  const policies = [
    {
      metricName: 'pg_connection_pct',
      displayName: 'PostgreSQL Connections (%)',
      description: 'Tỷ lệ kết nối PG đang dùng / max_connections',
      warningThreshold: 70,
      criticalThreshold: 90,
      unit: '%',
      autoAction: 'Gửi cảnh báo Slack + tắt pool connection dự phòng',
    },
    {
      metricName: 'redis_memory_pct',
      displayName: 'Redis Memory Usage (%)',
      description: 'Tỷ lệ bộ nhớ Redis đang dùng / maxmemory',
      warningThreshold: 75,
      criticalThreshold: 92,
      unit: '%',
      autoAction: 'Flush keys có TTL ngắn, cảnh báo team backend',
    },
    {
      metricName: 'backup_age_minutes',
      displayName: 'Backup Age (PG Full)',
      description: 'Số phút kể từ lần backup PostgreSQL Full cuối thành công',
      warningThreshold: 90,
      criticalThreshold: 180,
      unit: 'min',
      autoAction: 'Trigger backup job khẩn cấp + cảnh báo DBA',
    },
    {
      metricName: 'minio_disk_pct',
      displayName: 'MinIO Disk Usage (%)',
      description: 'Tỷ lệ dung lượng MinIO cluster đang sử dụng',
      warningThreshold: 75,
      criticalThreshold: 90,
      unit: '%',
      autoAction: 'Chuyển objects cold sang ARCHIVE tier, cảnh báo infra team',
    },
    {
      metricName: 'pipeline_fail_rate',
      displayName: 'Pipeline Fail Rate (%)',
      description: 'Tỷ lệ pipeline run FAILED trong 24h gần nhất',
      warningThreshold: 10,
      criticalThreshold: 25,
      unit: '%',
      autoAction: 'Dừng scheduler, gửi incident report',
    },
  ];

  for (const p of policies) {
    await prisma.metricThresholdPolicy.upsert({
      where: { metricName: p.metricName },
      update: {},
      create: { ...p },
    });
  }
  console.log(`✅ Seeded ${policies.length} threshold policies`);
}

// ─── 2. BigDataService + ServiceAlert ────────────────────────────────────────

async function seedServicesAndAlerts() {
  const services = [
    {
      id: 'svc-postgresql-main',
      name: 'PostgreSQL Main DB',
      type: 'POSTGRESQL' as const,
      status: 'HEALTHY' as const,
      host: '192.168.1.10',
      port: 5432,
      url: 'postgresql://192.168.1.10:5432/hvhc_bigdata_89',
      uptime: 99.97,
      version: '16.2',
      description: 'Database chính của hệ thống HVHC BigData',
      isActive: true,
    },
    {
      id: 'svc-minio-main',
      name: 'MinIO Object Storage',
      type: 'MINIO' as const,
      status: 'HEALTHY' as const,
      host: '192.168.1.20',
      port: 9000,
      url: 'http://192.168.1.20:9000',
      uptime: 99.95,
      version: 'RELEASE.2024-01-18',
      description: 'Object storage cho tài liệu, file xuất, backup config',
      isActive: true,
    },
    {
      id: 'svc-clickhouse-01',
      name: 'ClickHouse Analytics',
      type: 'CLICKHOUSE' as const,
      status: 'HEALTHY' as const,
      host: '192.168.1.30',
      port: 8123,
      url: 'http://192.168.1.30:8123',
      uptime: 99.80,
      version: '24.1.5.6',
      description: 'OLAP database phục vụ báo cáo và analytics',
      isActive: true,
    },
    {
      id: 'svc-airflow-01',
      name: 'Apache Airflow Scheduler',
      type: 'AIRFLOW' as const,
      status: 'DEGRADED' as const,
      host: '192.168.1.40',
      port: 8080,
      url: 'http://192.168.1.40:8080',
      uptime: 98.50,
      version: '2.8.1',
      description: 'Workflow scheduler cho pipeline ETL và AI refresh',
      isActive: true,
    },
    {
      id: 'svc-redis-cache',
      name: 'Redis Cache Cluster',
      type: 'PROMETHEUS' as const,
      status: 'HEALTHY' as const,
      host: '192.168.1.50',
      port: 6379,
      uptime: 99.99,
      version: '7.2.4',
      description: 'Cache layer cho session, rate-limit, queue',
      isActive: true,
    },
    {
      id: 'svc-grafana-monitoring',
      name: 'Grafana Monitoring',
      type: 'GRAFANA' as const,
      status: 'HEALTHY' as const,
      host: '192.168.1.60',
      port: 3000,
      url: 'http://192.168.1.60:3000',
      uptime: 99.90,
      version: '10.3.1',
      description: 'Dashboard và observability cho toàn hệ thống',
      isActive: true,
    },
  ];

  for (const svc of services) {
    await prisma.bigDataService.upsert({
      where: { id: svc.id },
      update: { status: svc.status, uptime: svc.uptime },
      create: svc,
    });
  }

  // ServiceAlert – 6 alerts với trạng thái khác nhau
  const alertsData = [
    {
      serviceId: 'svc-airflow-01',
      title: 'Airflow Scheduler Connection Pool Exhausted',
      message: 'Pool kết nối scheduler đã đầy (48/50). Các task mới đang xếp hàng chờ. Kiểm tra DAG bị treo.',
      severity: 'ERROR' as const,
      status: 'ACTIVE' as const,
      triggeredAt: new Date(Date.now() - 35 * 60 * 1000),
    },
    {
      serviceId: 'svc-postgresql-main',
      title: 'PostgreSQL Connection Count Elevated',
      message: 'Số kết nối hiện tại 67% max_connections. Cần theo dõi thêm trong 30 phút tới.',
      severity: 'WARNING' as const,
      status: 'ACKNOWLEDGED' as const,
      triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledgedAt: new Date(Date.now() - 90 * 60 * 1000),
      acknowledgedBy: 'Trần Văn Hệ Thống',
    },
    {
      serviceId: 'svc-minio-main',
      title: 'MinIO Bucket hvhc-exports Sắp Đầy',
      message: 'Bucket hvhc-exports đã dùng 78GB / 100GB (78%). Cần chuyển sang COLD tier các file cũ hơn 90 ngày.',
      severity: 'WARNING' as const,
      status: 'ACTIVE' as const,
      triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      serviceId: 'svc-clickhouse-01',
      title: 'ClickHouse Merge Tree Slow Query',
      message: 'Phát hiện 3 query analytics > 30s trong giờ cao điểm. Xem xét thêm index materialized view.',
      severity: 'INFO' as const,
      status: 'RESOLVED' as const,
      triggeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      resolvedBy: 'Nguyễn Văn DBA',
    },
    {
      serviceId: 'svc-airflow-01',
      title: 'DAG sync_personnel_to_clickhouse Failed 3 lần liên tiếp',
      message: 'Pipeline ETL nhân sự sang ClickHouse thất bại 3 lần. Nguyên nhân: schema mismatch ở column rank_code. Cần fix migration.',
      severity: 'CRITICAL' as const,
      status: 'ACTIVE' as const,
      triggeredAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      serviceId: 'svc-grafana-monitoring',
      title: 'Grafana Alert Rule Evaluation Delay',
      message: 'Alert evaluation delay 12s > ngưỡng 5s. Có thể do Prometheus scrape interval dài. Không ảnh hưởng nghiêm trọng.',
      severity: 'INFO' as const,
      status: 'ACKNOWLEDGED' as const,
      triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      acknowledgedBy: 'Nguyễn Ops Team',
    },
  ];

  for (const alert of alertsData) {
    await prisma.serviceAlert.create({ data: alert });
  }

  console.log(`✅ Seeded ${services.length} BigDataServices + ${alertsData.length} ServiceAlerts`);
}

// ─── 3. PipelineDefinition + PipelineRun ──────────────────────────────────────

async function seedPipelines(adminId: string) {
  const pipelines = [
    {
      id: 'pipe-etl-personnel',
      name: 'ETL Nhân sự → ClickHouse',
      description: 'Đồng bộ dữ liệu nhân sự (M02) từ PostgreSQL sang ClickHouse để phục vụ báo cáo analytics',
      pipelineType: 'ETL_PG_TO_CLICKHOUSE' as const,
      sourceDataset: 'personnel_profiles',
      targetDataset: 'ch_personnel_dim',
      scheduleCron: '0 2 * * *',
      isActive: true,
      steps: [
        { name: 'Extract từ PG', type: 'EXTRACT', config: { table: 'personnel_profiles', mode: 'INCREMENTAL' } },
        { name: 'Transform + enrich', type: 'TRANSFORM', config: { cleanNulls: true, lookupUnit: true } },
        { name: 'Load vào ClickHouse', type: 'LOAD', config: { dataset: 'ch_personnel_dim', strategy: 'UPSERT' } },
      ],
      lastRunAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      lastRunStatus: 'FAILED' as const,
      createdById: adminId,
    },
    {
      id: 'pipe-etl-education',
      name: 'ETL Đào tạo → ClickHouse',
      description: 'Sync dữ liệu học viên, điểm, tốt nghiệp (M10) sang ClickHouse',
      pipelineType: 'ETL_PG_TO_CLICKHOUSE' as const,
      sourceDataset: 'education_scores',
      targetDataset: 'ch_education_fact',
      scheduleCron: '30 2 * * *',
      isActive: true,
      steps: [
        { name: 'Extract điểm học viên', type: 'EXTRACT', config: { tables: ['ket_qua_hoc_tap', 'class_enrollments'] } },
        { name: 'Join với program version', type: 'TRANSFORM', config: { joinKey: 'programVersionId' } },
        { name: 'Load fact table', type: 'LOAD', config: { dataset: 'ch_education_fact', strategy: 'APPEND' } },
      ],
      lastRunAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
      lastRunStatus: 'COMPLETED' as const,
      createdById: adminId,
    },
    {
      id: 'pipe-dq-personnel',
      name: 'Data Quality Check – Nhân sự',
      description: 'Kiểm tra toàn bộ data quality rules cho module nhân sự M02',
      pipelineType: 'DATA_QUALITY' as const,
      sourceDataset: 'personnel_profiles',
      targetDataset: null,
      scheduleCron: '0 6 * * *',
      isActive: true,
      steps: [
        { name: 'Run completeness checks', type: 'DQ_CHECK', config: { ruleType: 'COMPLETENESS' } },
        { name: 'Run uniqueness checks', type: 'DQ_CHECK', config: { ruleType: 'UNIQUENESS' } },
        { name: 'Run FK integrity checks', type: 'DQ_CHECK', config: { ruleType: 'FK_INTEGRITY' } },
        { name: 'Aggregate results', type: 'AGGREGATE', config: {} },
      ],
      lastRunAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      lastRunStatus: 'COMPLETED' as const,
      createdById: adminId,
    },
    {
      id: 'pipe-backup-daily',
      name: 'Daily PostgreSQL Backup',
      description: 'Backup full PostgreSQL hàng ngày lúc 3h sáng, lưu vào MinIO backup bucket',
      pipelineType: 'BACKUP' as const,
      sourceDataset: 'hvhc_bigdata_89',
      targetDataset: 'minio://hvhc-backups/pg-full/',
      scheduleCron: '0 3 * * *',
      isActive: true,
      steps: [
        { name: 'pg_dump full', type: 'DUMP', config: { format: 'custom', compress: true } },
        { name: 'Upload to MinIO', type: 'UPLOAD', config: { bucket: 'hvhc-backups', prefix: 'pg-full' } },
        { name: 'Verify checksum', type: 'VERIFY', config: { algorithm: 'sha256' } },
        { name: 'Cleanup old backups', type: 'CLEANUP', config: { retainDays: 30 } },
      ],
      lastRunAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastRunStatus: 'COMPLETED' as const,
      createdById: adminId,
    },
    {
      id: 'pipe-ai-refresh',
      name: 'AI Model Refresh – Duplicate Check',
      description: 'Refresh embedding model cho tính năng kiểm tra trùng lặp hồ sơ khoa học M20',
      pipelineType: 'AI_REFRESH' as const,
      sourceDataset: 'science_projects',
      targetDataset: 'vector_store_science',
      scheduleCron: '0 1 * * 0',
      isActive: true,
      steps: [
        { name: 'Extract abstracts mới', type: 'EXTRACT', config: { since: 'lastRunAt' } },
        { name: 'Generate embeddings', type: 'EMBED', config: { model: 'bge-m3', batchSize: 64 } },
        { name: 'Upsert vector store', type: 'UPSERT', config: { store: 'pgvector', table: 'science_embeddings' } },
      ],
      lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastRunStatus: 'COMPLETED' as const,
      createdById: adminId,
    },
    {
      id: 'pipe-etl-policy',
      name: 'ETL Chính sách → ClickHouse',
      description: 'Sync dữ liệu chính sách, khen thưởng, kỷ luật (M05) sang ClickHouse',
      pipelineType: 'ETL_PG_TO_CLICKHOUSE' as const,
      sourceDataset: 'policy_records',
      targetDataset: 'ch_policy_fact',
      scheduleCron: '0 4 * * *',
      isActive: false,
      steps: [
        { name: 'Extract policy records', type: 'EXTRACT', config: { table: 'policy_records' } },
        { name: 'Transform & validate', type: 'TRANSFORM', config: { validateEnums: true } },
        { name: 'Load to ClickHouse', type: 'LOAD', config: { dataset: 'ch_policy_fact' } },
      ],
      lastRunAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      lastRunStatus: 'COMPLETED' as const,
      createdById: adminId,
    },
  ];

  for (const p of pipelines) {
    await prisma.pipelineDefinition.upsert({
      where: { id: p.id },
      update: { lastRunAt: p.lastRunAt, lastRunStatus: p.lastRunStatus },
      create: p,
    });
  }

  // PipelineRun records
  const runs = [
    // ETL Nhân sự – FAILED run mới nhất
    {
      definitionId: 'pipe-etl-personnel',
      triggeredBy: 'SCHEDULED' as const,
      status: 'FAILED' as const,
      startedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 22 * 60 * 60 * 1000 + 3 * 60 * 1000),
      durationMs: 185_000,
      recordsRead: 1247,
      recordsWritten: 0,
      recordsSkipped: 0,
      errorCount: 1,
      errorMessage: 'Schema mismatch: column rank_code không tồn tại trong ch_personnel_dim. Cần chạy migration ClickHouse trước.',
    },
    // ETL Nhân sự – COMPLETED run trước
    {
      definitionId: 'pipe-etl-personnel',
      triggeredBy: 'SCHEDULED' as const,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 46 * 60 * 60 * 1000 + 4.5 * 60 * 1000),
      durationMs: 272_000,
      recordsRead: 1234,
      recordsWritten: 1234,
      recordsSkipped: 0,
      errorCount: 0,
    },
    // ETL Đào tạo – COMPLETED
    {
      definitionId: 'pipe-etl-education',
      triggeredBy: 'SCHEDULED' as const,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 21 * 60 * 60 * 1000 + 6 * 60 * 1000),
      durationMs: 361_000,
      recordsRead: 8432,
      recordsWritten: 8421,
      recordsSkipped: 11,
      errorCount: 0,
    },
    // DQ Check – COMPLETED
    {
      definitionId: 'pipe-dq-personnel',
      triggeredBy: 'SCHEDULED' as const,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 18 * 60 * 60 * 1000 + 90 * 1000),
      durationMs: 90_000,
      recordsRead: 1247,
      recordsWritten: null,
      recordsSkipped: null,
      errorCount: 0,
    },
    // Backup – COMPLETED
    {
      definitionId: 'pipe-backup-daily',
      triggeredBy: 'SCHEDULED' as const,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 18 * 60 * 1000),
      durationMs: 1_082_000,
      recordsRead: null,
      recordsWritten: null,
      recordsSkipped: null,
      errorCount: 0,
    },
    // AI Refresh – COMPLETED manual
    {
      definitionId: 'pipe-ai-refresh',
      triggeredBy: 'MANUAL' as const,
      triggeredById: adminId,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
      durationMs: 2_100_000,
      recordsRead: 3210,
      recordsWritten: 3210,
      recordsSkipped: 0,
      errorCount: 0,
    },
  ];

  for (const run of runs) {
    await prisma.pipelineRun.create({ data: run });
  }

  console.log(`✅ Seeded ${pipelines.length} pipelines + ${runs.length} runs`);
}

// ─── 4. DataQualityRule + DataQualityResult ───────────────────────────────────

async function seedDataQuality() {
  const rules = [
    {
      ruleCode: 'DQ_PERSONNEL_NULL_NAME',
      name: 'Nhân sự – Không được null fullName',
      description: 'Kiểm tra tất cả cán bộ phải có họ tên đầy đủ',
      ruleType: 'COMPLETENESS' as const,
      targetTable: 'personnel_profiles',
      targetColumn: 'fullName',
      ruleConfig: { nullCheck: true, minLength: 2 },
      severity: 'CRITICAL' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_PERSONNEL_UNIQUE_MILITARYID',
      name: 'Nhân sự – Mã quân nhân phải unique',
      description: 'Kiểm tra không có 2 cán bộ cùng mã quân nhân',
      ruleType: 'UNIQUENESS' as const,
      targetTable: 'personnel_profiles',
      targetColumn: 'militaryId',
      ruleConfig: { uniqueCheck: true, ignoreNull: false },
      severity: 'CRITICAL' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_SCORE_RANGE_CHECK',
      name: 'Điểm – Phải nằm trong khoảng 0–10',
      description: 'Kiểm tra tất cả điểm số hợp lệ trong khoảng [0, 10]',
      ruleType: 'VALID_RANGE' as const,
      targetTable: 'ket_qua_hoc_tap',
      targetColumn: 'diem',
      ruleConfig: { min: 0, max: 10 },
      severity: 'ERROR' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_PERSONNEL_UNIT_FK',
      name: 'Nhân sự – unitId phải tồn tại trong units',
      description: 'Kiểm tra FK integrity: mọi personnel phải thuộc unit hợp lệ',
      ruleType: 'FK_INTEGRITY' as const,
      targetTable: 'personnel_profiles',
      targetColumn: 'unitId',
      ruleConfig: { referencedTable: 'units', referencedColumn: 'id' },
      severity: 'ERROR' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_PERSONNEL_UPDATED_TIMELINESS',
      name: 'Nhân sự – Hồ sơ không cũ hơn 1 năm',
      description: 'Cảnh báo nếu có cán bộ chưa cập nhật hồ sơ > 365 ngày',
      ruleType: 'TIMELINESS' as const,
      targetTable: 'personnel_profiles',
      targetColumn: 'updatedAt',
      ruleConfig: { maxDaysStale: 365 },
      severity: 'WARNING' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_STUDENT_NULL_RANK',
      name: 'Học viên – Cấp bậc không được trống',
      description: 'Mọi học viên phải có cấp bậc được khai báo',
      ruleType: 'COMPLETENESS' as const,
      targetTable: 'hoc_viens',
      targetColumn: 'capBac',
      ruleConfig: { nullCheck: true },
      severity: 'WARNING' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_POLICY_STATUS_CONSISTENCY',
      name: 'Chính sách – Status phải nhất quán với workflowStatus',
      description: 'Record APPROVED phải có workflowStatus APPROVED, không được mâu thuẫn',
      ruleType: 'CONSISTENCY' as const,
      targetTable: 'policy_records',
      targetColumn: 'status',
      ruleConfig: { consistencyCheck: { field1: 'status', field2: 'workflowStatus', rule: 'APPROVED_SYNC' } },
      severity: 'ERROR' as const,
      isActive: true,
    },
    {
      ruleCode: 'DQ_BACKUP_JOB_TIMELINESS',
      name: 'Backup – Phải chạy trong 24h',
      description: 'Cảnh báo nếu không có backup COMPLETED nào trong 24h gần nhất',
      ruleType: 'TIMELINESS' as const,
      targetTable: 'backup_jobs',
      targetColumn: 'completedAt',
      ruleConfig: { maxHoursStale: 24, filter: { status: 'COMPLETED' } },
      severity: 'CRITICAL' as const,
      isActive: true,
    },
  ];

  const createdRules: { id: string; ruleCode: string; targetTable: string }[] = [];
  for (const rule of rules) {
    const created = await prisma.dataQualityRule.upsert({
      where: { ruleCode: rule.ruleCode },
      update: {},
      create: rule,
    });
    createdRules.push({ id: created.id, ruleCode: rule.ruleCode, targetTable: rule.targetTable });
  }

  // DataQualityResult – mỗi rule có 1–2 kết quả gần đây
  const results = [
    // Completeness – PASS
    { ruleCode: 'DQ_PERSONNEL_NULL_NAME',    passed: true,  totalChecked: 1247, failedRows: 0,   failRate: 0,    severity: 'CRITICAL' as const },
    // Uniqueness – PASS
    { ruleCode: 'DQ_PERSONNEL_UNIQUE_MILITARYID', passed: true, totalChecked: 1247, failedRows: 0, failRate: 0, severity: 'CRITICAL' as const },
    // Score range – FAIL (3 rows lỗi)
    { ruleCode: 'DQ_SCORE_RANGE_CHECK',      passed: false, totalChecked: 8432, failedRows: 3,   failRate: 0.036, severity: 'ERROR' as const, note: '3 dòng có điểm âm (-1) từ import cũ, cần clean' },
    // FK integrity – PASS
    { ruleCode: 'DQ_PERSONNEL_UNIT_FK',      passed: true,  totalChecked: 1247, failedRows: 0,   failRate: 0,    severity: 'ERROR' as const },
    // Timeliness – FAIL (47 hồ sơ cũ)
    { ruleCode: 'DQ_PERSONNEL_UPDATED_TIMELINESS', passed: false, totalChecked: 1247, failedRows: 47, failRate: 3.77, severity: 'WARNING' as const, note: '47 cán bộ chưa cập nhật hồ sơ > 365 ngày' },
    // Student rank – FAIL (12 học viên)
    { ruleCode: 'DQ_STUDENT_NULL_RANK',      passed: false, totalChecked: 856,  failedRows: 12,  failRate: 1.40, severity: 'WARNING' as const, note: '12 học viên nhập học mới chưa cập nhật cấp bậc' },
    // Policy consistency – PASS
    { ruleCode: 'DQ_POLICY_STATUS_CONSISTENCY', passed: true, totalChecked: 342, failedRows: 0,  failRate: 0,    severity: 'ERROR' as const },
    // Backup timeliness – PASS
    { ruleCode: 'DQ_BACKUP_JOB_TIMELINESS',  passed: true,  totalChecked: 5,    failedRows: 0,   failRate: 0,    severity: 'CRITICAL' as const },
  ];

  const checkedAt = new Date(Date.now() - 18 * 60 * 60 * 1000);
  for (const result of results) {
    const rule = createdRules.find((r) => r.ruleCode === result.ruleCode);
    if (!rule) continue;
    const { ruleCode: _, ...resultData } = result;
    await prisma.dataQualityResult.create({
      data: { ...resultData, ruleId: rule.id, checkedAt },
    });
  }

  console.log(`✅ Seeded ${rules.length} DQ rules + ${results.length} DQ results`);
}

// ─── 5. WarehouseSyncJob ──────────────────────────────────────────────────────

async function seedWarehouseJobs() {
  const jobs = [
    {
      sourceTable: 'personnel_profiles',
      targetDataset: 'ch_personnel_dim',
      syncMode: 'INCREMENTAL' as const,
      status: 'FAILED' as const,
      lastSyncAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      lastSyncRowCount: 0,
      lastSyncDurationMs: 185_000,
      watermarkField: 'updatedAt',
      watermarkValue: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      errorMessage: 'Schema mismatch: rank_code column missing in ClickHouse target',
      isActive: true,
    },
    {
      sourceTable: 'ket_qua_hoc_tap',
      targetDataset: 'ch_education_fact',
      syncMode: 'INCREMENTAL' as const,
      status: 'COMPLETED' as const,
      lastSyncAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
      lastSyncRowCount: 8421,
      lastSyncDurationMs: 361_000,
      watermarkField: 'createdAt',
      watermarkValue: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      sourceTable: 'policy_records',
      targetDataset: 'ch_policy_fact',
      syncMode: 'INCREMENTAL' as const,
      status: 'IDLE' as const,
      lastSyncAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      lastSyncRowCount: 342,
      lastSyncDurationMs: 42_000,
      watermarkField: 'updatedAt',
      isActive: false,
    },
    {
      sourceTable: 'science_projects',
      targetDataset: 'ch_science_dim',
      syncMode: 'FULL' as const,
      status: 'IDLE' as const,
      lastSyncAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastSyncRowCount: 486,
      lastSyncDurationMs: 95_000,
      isActive: true,
    },
    {
      sourceTable: 'class_enrollments',
      targetDataset: 'ch_enrollment_fact',
      syncMode: 'INCREMENTAL' as const,
      status: 'COMPLETED' as const,
      lastSyncAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      lastSyncRowCount: 2156,
      lastSyncDurationMs: 128_000,
      watermarkField: 'enrolledAt',
      isActive: true,
    },
    {
      sourceTable: 'party_member_profiles',
      targetDataset: 'ch_party_dim',
      syncMode: 'FULL' as const,
      status: 'RUNNING' as const,
      lastSyncAt: new Date(Date.now() - 5 * 60 * 1000),
      lastSyncRowCount: null,
      lastSyncDurationMs: null,
      isActive: true,
    },
    {
      sourceTable: 'award_workflow_requests',
      targetDataset: 'ch_awards_fact',
      syncMode: 'INCREMENTAL' as const,
      status: 'IDLE' as const,
      lastSyncAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      lastSyncRowCount: 89,
      lastSyncDurationMs: 15_000,
      watermarkField: 'updatedAt',
      isActive: true,
    },
  ];

  for (const job of jobs) {
    await prisma.warehouseSyncJob.create({ data: job });
  }

  console.log(`✅ Seeded ${jobs.length} warehouse sync jobs`);
}

// ─── 6. StorageBucketConfig ───────────────────────────────────────────────────

async function seedStorageBuckets() {
  const buckets = [
    {
      bucketName: 'hvhc-personnel-docs',
      moduleDomain: 'M02_PERSONNEL',
      description: 'Hồ sơ cán bộ: ảnh, văn bằng, quyết định bổ nhiệm, lý lịch',
      retentionDays: null,
      accessTier: 'HOT' as const,
      maxSizeGb: 500,
      isActive: true,
    },
    {
      bucketName: 'hvhc-education-materials',
      moduleDomain: 'M10_EDUCATION',
      description: 'Tài liệu đào tạo: giáo trình, bài giảng, đề thi, bảng điểm scan',
      retentionDays: 3650,
      accessTier: 'HOT' as const,
      maxSizeGb: 1000,
      isActive: true,
    },
    {
      bucketName: 'hvhc-exports',
      moduleDomain: 'M18_EXPORT',
      description: 'File xuất từ M18: báo cáo PDF/Excel đã render, tạm thời',
      retentionDays: 90,
      accessTier: 'HOT' as const,
      maxSizeGb: 100,
      isActive: true,
    },
    {
      bucketName: 'hvhc-backups',
      moduleDomain: 'M12_INFRA',
      description: 'Backup PostgreSQL full và incremental, Airflow DAGs, Grafana dashboards',
      retentionDays: 365,
      accessTier: 'COLD' as const,
      maxSizeGb: 5000,
      isActive: true,
    },
    {
      bucketName: 'hvhc-science-works',
      moduleDomain: 'M25_SCIENCE_LIBRARY',
      description: 'Công trình khoa học: báo cáo, luận văn, bài báo PDF gốc',
      retentionDays: null,
      accessTier: 'HOT' as const,
      maxSizeGb: 2000,
      isActive: true,
    },
    {
      bucketName: 'hvhc-party-docs',
      moduleDomain: 'M03_PARTY',
      description: 'Tài liệu đảng viên: quyết định kết nạp, lý lịch đảng viên',
      retentionDays: null,
      accessTier: 'COLD' as const,
      maxSizeGb: 200,
      isActive: true,
    },
    {
      bucketName: 'hvhc-archive-2020',
      moduleDomain: 'ARCHIVE',
      description: 'Lưu trữ dữ liệu cũ trước năm 2020, truy cập rất ít',
      retentionDays: null,
      accessTier: 'ARCHIVE' as const,
      maxSizeGb: 3000,
      isActive: true,
    },
    {
      bucketName: 'hvhc-ai-models',
      moduleDomain: 'M26_SCIENCE_AI',
      description: 'Model weights, embeddings, vector index cho AI features M26',
      retentionDays: 180,
      accessTier: 'COLD' as const,
      maxSizeGb: 800,
      isActive: true,
    },
  ];

  for (const b of buckets) {
    await prisma.storageBucketConfig.upsert({
      where: { bucketName: b.bucketName },
      update: {},
      create: b,
    });
  }

  console.log(`✅ Seeded ${buckets.length} storage buckets`);
}

// ─── 7. BackupJob + RestoreJob ────────────────────────────────────────────────

async function seedBackups(adminId: string) {
  const backupJobs = [
    // Backup thành công hôm nay
    {
      id: 'bkjob-pg-full-today',
      backupType: 'POSTGRESQL_FULL' as const,
      status: 'COMPLETED' as const,
      targetPath: 'hvhc-backups/pg-full/2026-04-30_030000.dump',
      triggeredBy: 'SCHEDULED' as const,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 18 * 60 * 1000),
      durationMs: 18 * 60 * 1000,
      sizeBytes: BigInt(8_589_934_592),
    },
    // Incremental backup hôm nay
    {
      id: 'bkjob-pg-incr-today',
      backupType: 'POSTGRESQL_INCREMENTAL' as const,
      status: 'COMPLETED' as const,
      targetPath: 'hvhc-backups/pg-incr/2026-04-30_090000.dump',
      triggeredBy: 'SCHEDULED' as const,
      startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 2 * 60 * 1000),
      durationMs: 2 * 60 * 1000,
      sizeBytes: BigInt(524_288_000),
    },
    // Backup thành công hôm qua
    {
      id: 'bkjob-pg-full-yesterday',
      backupType: 'POSTGRESQL_FULL' as const,
      status: 'COMPLETED' as const,
      targetPath: 'hvhc-backups/pg-full/2026-04-29_030000.dump',
      triggeredBy: 'SCHEDULED' as const,
      startedAt: new Date(Date.now() - 27 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 27 * 60 * 60 * 1000 + 16 * 60 * 1000),
      durationMs: 16 * 60 * 1000,
      sizeBytes: BigInt(8_456_000_000),
    },
    // Airflow DAGs backup
    {
      id: 'bkjob-airflow-dags',
      backupType: 'AIRFLOW_DAGS' as const,
      status: 'COMPLETED' as const,
      targetPath: 'hvhc-backups/airflow-dags/2026-04-30.tar.gz',
      triggeredBy: 'SCHEDULED' as const,
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000),
      durationMs: 2 * 60 * 1000,
      sizeBytes: BigInt(45_678_901),
    },
    // MinIO config backup
    {
      id: 'bkjob-minio-config',
      backupType: 'MINIO_CONFIG' as const,
      status: 'FAILED' as const,
      targetPath: 'hvhc-backups/minio-config/2026-04-30.json',
      triggeredBy: 'SCHEDULED' as const,
      startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 30 * 1000),
      durationMs: 30 * 1000,
      errorMessage: 'MinIO admin API timeout sau 30s. Network issue giữa backup server và MinIO.',
    },
    // Grafana backup
    {
      id: 'bkjob-grafana',
      backupType: 'GRAFANA' as const,
      status: 'COMPLETED' as const,
      targetPath: 'hvhc-backups/grafana/2026-04-30.tar.gz',
      triggeredBy: 'MANUAL' as const,
      requestedById: adminId,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 3 * 60 * 1000),
      durationMs: 3 * 60 * 1000,
      sizeBytes: BigInt(12_345_678),
    },
  ];

  for (const job of backupJobs) {
    await prisma.backupJob.upsert({
      where: { id: job.id },
      update: {},
      create: job,
    });
  }

  // RestoreJob – 2 jobs restore gần đây
  const restoreJobs = [
    {
      backupJobId: 'bkjob-pg-full-yesterday',
      targetEnvironment: 'STAGING',
      requestedById: adminId,
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
      verificationStatus: 'VERIFIED_OK' as const,
      verificationNote: 'Restore thành công lên staging. Đã verify record count và checksum.',
      notes: 'Restore để test migration script M20 trên staging trước khi lên prod',
    },
    {
      backupJobId: 'bkjob-pg-full-today',
      targetEnvironment: 'DR_SITE',
      requestedById: adminId,
      status: 'IN_PROGRESS' as const,
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
      verificationStatus: 'NOT_VERIFIED' as const,
      notes: 'Restore định kỳ vào DR site theo kế hoạch tháng 4',
    },
  ];

  for (const job of restoreJobs) {
    await prisma.restoreJob.create({ data: job });
  }

  console.log(`✅ Seeded ${backupJobs.length} backup jobs + ${restoreJobs.length} restore jobs`);
}

// ─── 8. DisasterRecoveryPlan + Exercise ───────────────────────────────────────

async function seedDR(adminId: string) {
  const plan1 = await prisma.disasterRecoveryPlan.upsert({
    where: { id: 'dr-plan-pg-main' },
    update: {},
    create: {
      id: 'dr-plan-pg-main',
      name: 'DR Plan – PostgreSQL Primary Failure',
      description: 'Quy trình xử lý khi database PostgreSQL chính bị down hoàn toàn. Promote replica hoặc restore từ backup lên DR site.',
      rtoTargetMin: 60,
      rpoTargetMin: 30,
      runbookPath: 'hvhc-docs/runbooks/dr-postgresql-failure-v2.pdf',
      isActive: true,
      createdById: adminId,
    },
  });

  const plan2 = await prisma.disasterRecoveryPlan.upsert({
    where: { id: 'dr-plan-minio-loss' },
    update: {},
    create: {
      id: 'dr-plan-minio-loss',
      name: 'DR Plan – MinIO Storage Loss',
      description: 'Quy trình khi MinIO cluster mất dữ liệu hoặc không thể truy cập. Restore từ backup NAS offsite.',
      rtoTargetMin: 120,
      rpoTargetMin: 60,
      runbookPath: 'hvhc-docs/runbooks/dr-minio-storage-loss-v1.pdf',
      isActive: true,
      createdById: adminId,
    },
  });

  // Exercises
  const exercises = [
    // Plan 1 – diễn tập tháng 1, PASS
    {
      planId: plan1.id,
      exercisedAt: new Date('2026-01-15T09:00:00'),
      conductedById: adminId,
      outcome: 'PASS' as const,
      rtoAchievedMin: 42,
      rpoAchievedMin: 18,
      findings: 'Restore từ backup thành công trong 42 phút. RTO đạt mục tiêu 60 phút. Cần cải thiện: script promote replica bị lỗi lần đầu do thiếu permission, cần fix pre-check.',
      nextReviewDate: new Date('2026-07-15'),
    },
    // Plan 1 – diễn tập tháng 10 năm ngoái, PARTIAL
    {
      planId: plan1.id,
      exercisedAt: new Date('2025-10-20T14:00:00'),
      conductedById: adminId,
      outcome: 'PARTIAL' as const,
      rtoAchievedMin: 78,
      rpoAchievedMin: 25,
      findings: 'RTO vượt mục tiêu 18 phút do bước verify data sau restore mất thêm thời gian. RPO đạt. Đã cập nhật runbook để tự động hóa bước verify.',
      nextReviewDate: new Date('2026-01-15'),
    },
    // Plan 2 – diễn tập lần đầu, PASS
    {
      planId: plan2.id,
      exercisedAt: new Date('2026-03-05T10:00:00'),
      conductedById: adminId,
      outcome: 'PASS' as const,
      rtoAchievedMin: 95,
      rpoAchievedMin: 45,
      findings: 'Restore từ NAS offsite thành công. Cả RTO (95 phút < 120 phút) và RPO (45 phút < 60 phút) đều đạt. Điểm cần cải thiện: bước sync lại config MinIO cần thêm automation.',
      nextReviewDate: new Date('2026-09-05'),
    },
  ];

  for (const ex of exercises) {
    await prisma.disasterRecoveryExercise.create({ data: ex });
  }

  console.log(`✅ Seeded 2 DR plans + ${exercises.length} exercises`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Starting M12 Infrastructure full seed...\n');

  const adminId = await findAdminUser();

  await seedThresholds();
  await seedServicesAndAlerts();
  await seedPipelines(adminId);
  await seedDataQuality();
  await seedWarehouseJobs();
  await seedStorageBuckets();
  await seedBackups(adminId);
  await seedDR(adminId);

  console.log('\n✅ M12 Infrastructure seed hoàn thành!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
