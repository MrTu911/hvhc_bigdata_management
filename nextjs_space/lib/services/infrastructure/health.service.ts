/**
 * M12 – Health & Metrics Service
 *
 * Probe trực tiếp PostgreSQL, Redis, MinIO để lấy metric thực.
 * So sánh với MetricThresholdPolicy để xác định severity.
 * Không ghi metric vào DB trong request path — chỉ trả kết quả realtime.
 *
 * Mỗi probe có timeout riêng và trả về null nếu service không trả lời,
 * tránh block cả health endpoint khi một service down.
 *
 * runHealthCheckWithAlerts() — dùng cho cron job — probe + auto-raise/resolve alert.
 */

import prisma from '@/lib/db';
import { minioClient } from '@/lib/minio-client';
import Redis from 'ioredis';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface MetricReading {
  metricName:  string;
  displayName: string;
  value:       number | null;
  unit:        string | null;
  level:       HealthLevel;
  threshold:   { warning: number; critical: number } | null;
}

export interface HealthSnapshot {
  checkedAt:  string;
  overall:    HealthLevel;
  metrics:    MetricReading[];
}

export interface AlertAction {
  metricName: string;
  action:     'raised' | 'resolved' | 'skipped';
  alertId?:   string;
}

// ─── Service ID lookup ────────────────────────────────────────────────────────

// Tra serviceId theo type — ưu tiên record có status != UNKNOWN (seed mới nhất).
// Fallback về bất kỳ record nào cùng type nếu không tìm được record tốt hơn.
async function resolveServiceId(
  type: 'POSTGRESQL' | 'MINIO' | 'PROMETHEUS',
): Promise<string | null> {
  const preferred = await prisma.bigDataService.findFirst({
    where:   { type, status: { not: 'UNKNOWN' } },
    orderBy: { createdAt: 'asc' },
    select:  { id: true },
  });
  if (preferred) return preferred.id;

  const fallback = await prisma.bigDataService.findFirst({
    where:   { type },
    orderBy: { createdAt: 'asc' },
    select:  { id: true },
  });
  return fallback?.id ?? null;
}

// ─── Threshold lookup ─────────────────────────────────────────────────────────

async function loadThresholds(): Promise<Map<string, { warning: number; critical: number; unit: string | null }>> {
  const policies = await prisma.metricThresholdPolicy.findMany({ where: { isActive: true } });
  return new Map(policies.map((p) => [p.metricName, {
    warning:  p.warningThreshold,
    critical: p.criticalThreshold,
    unit:     p.unit,
  }]));
}

function classifyLevel(
  value: number | null,
  threshold: { warning: number; critical: number } | null,
): HealthLevel {
  if (value === null) return 'UNKNOWN';
  if (!threshold)     return 'OK';
  if (value >= threshold.critical) return 'CRITICAL';
  if (value >= threshold.warning)  return 'WARNING';
  return 'OK';
}

function levelToSeverity(level: HealthLevel): 'WARNING' | 'CRITICAL' | 'ERROR' | null {
  if (level === 'CRITICAL') return 'CRITICAL';
  if (level === 'WARNING')  return 'WARNING';
  return null;
}

// ─── Individual probes ────────────────────────────────────────────────────────

async function probePostgresConnections(): Promise<number | null> {
  try {
    const result = await prisma.$queryRaw<{ pct: number }[]>`
      SELECT ROUND(
        COUNT(*)::numeric / current_setting('max_connections')::numeric * 100,
        1
      ) AS pct
      FROM pg_stat_activity
      WHERE state IS NOT NULL
    `;
    return result[0]?.pct ?? null;
  } catch {
    return null;
  }
}

async function probeRedisMemory(): Promise<number | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout:       3000,
    lazyConnect:          true,
    enableOfflineQueue:   false,
  });

  try {
    await client.connect();
    const info      = await client.info('memory');
    const usedMatch = info.match(/used_memory:(\d+)/);
    const maxMatch  = info.match(/maxmemory:(\d+)/);

    if (!usedMatch) return null;
    const used = parseInt(usedMatch[1]);
    const max  = maxMatch ? parseInt(maxMatch[1]) : 0;

    // maxmemory=0 berarti unlimited — tidak bisa hitung %
    if (!max) return null;
    return Math.round((used / max) * 100 * 10) / 10;
  } catch {
    return null;
  } finally {
    client.disconnect();
  }
}

async function probeMinioConnectivity(): Promise<{ reachable: boolean }> {
  try {
    await Promise.race([
      minioClient.listBuckets(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return { reachable: true };
  } catch {
    return { reachable: false };
  }
}

/**
 * Ước tính tổng dung lượng đã dùng trong MinIO dưới dạng GB.
 * Dùng StorageBucketConfig để biết danh sách bucket cần kiểm tra.
 * Trả null nếu không kết nối được hoặc không có bucket nào.
 *
 * Lưu ý: MinIO OSS không có disk-usage API — phải list objects và cộng size.
 * Để tránh timeout với bucket lớn, giới hạn 5000 objects/bucket.
 */
async function probeMinioStorageGb(): Promise<number | null> {
  try {
    const bucketConfigs = await prisma.storageBucketConfig.findMany({
      where:   { isActive: true },
      select:  { bucketName: true },
      take:    20,
    });

    if (bucketConfigs.length === 0) return null;

    const bucketNames = [...new Set(bucketConfigs.map((c) => c.bucketName))];
    let totalBytes = 0;

    await Promise.allSettled(
      bucketNames.map(async (bucket) => {
        let count = 0;
        const stream = minioClient.listObjects(bucket, '', true);
        await new Promise<void>((resolve, reject) => {
          stream.on('data', (obj) => {
            if (obj.size) totalBytes += obj.size;
            count++;
            if (count >= 5000) stream.destroy();
          });
          stream.on('end',     resolve);
          stream.on('close',   resolve);
          stream.on('error',   reject);
        });
      }),
    );

    return Math.round((totalBytes / (1024 ** 3)) * 100) / 100; // GB, 2 decimal
  } catch {
    return null;
  }
}

async function probeBackupFreshness(): Promise<number | null> {
  try {
    const last = await prisma.backupJob.findFirst({
      where:   { status: 'COMPLETED', backupType: 'POSTGRESQL_FULL' },
      orderBy: { completedAt: 'desc' },
    });
    if (!last?.completedAt) return null;
    return Math.round((Date.now() - last.completedAt.getTime()) / 60_000);
  } catch {
    return null;
  }
}

// ─── Alert management ─────────────────────────────────────────────────────────

/**
 * Raise alert nếu level WARNING/CRITICAL và chưa có alert ACTIVE cùng title.
 * Resolve alert ACTIVE nếu level trở về OK.
 * Dùng title cố định theo metricName để dedup và auto-resolve chính xác.
 */
async function syncAlertForMetric(
  serviceId: string,
  metricName: string,
  displayName: string,
  level: HealthLevel,
  value: number | null,
  unit: string | null,
): Promise<AlertAction> {
  const alertTitle = `[AUTO] ${displayName} vượt ngưỡng`;
  const severity   = levelToSeverity(level);

  const existing = await prisma.serviceAlert.findFirst({
    where:  { serviceId, title: alertTitle, status: { in: ['ACTIVE', 'ACKNOWLEDGED'] } },
    select: { id: true, status: true },
  });

  // Level OK hoặc UNKNOWN → resolve alert đang active nếu có
  if (!severity) {
    if (existing) {
      await prisma.serviceAlert.update({
        where: { id: existing.id },
        data:  { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: 'system:health-cron' },
      });
      return { metricName, action: 'resolved', alertId: existing.id };
    }
    return { metricName, action: 'skipped' };
  }

  // Level WARNING/CRITICAL → raise nếu chưa có alert active
  if (existing) {
    return { metricName, action: 'skipped', alertId: existing.id };
  }

  const valueStr = value !== null ? `${value}${unit ?? ''}` : 'không đo được';
  const alert = await prisma.serviceAlert.create({
    data: {
      serviceId,
      title:       alertTitle,
      message:     `Metric "${displayName}" đang ở mức ${level}: ${valueStr}. Kiểm tra và xử lý theo runbook.`,
      severity,
      status:      'ACTIVE',
      triggeredAt: new Date(),
      metadata:    { metricName, value, unit, level, source: 'health-cron' },
    },
  });
  return { metricName, action: 'raised', alertId: alert.id };
}

// ─── BigDataService status sync ───────────────────────────────────────────────

async function syncServiceStatus(
  serviceId: string,
  level: HealthLevel,
): Promise<void> {
  const statusMap: Record<HealthLevel, 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'> = {
    OK:       'HEALTHY',
    WARNING:  'DEGRADED',
    CRITICAL: 'DOWN',
    UNKNOWN:  'UNKNOWN',
  };
  await prisma.bigDataService.update({
    where: { id: serviceId },
    data:  { status: statusMap[level], lastChecked: new Date() },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Chỉ trả snapshot — không ghi DB, không raise alert.
 * Dùng cho GET /api/infrastructure/metrics/health (realtime read).
 */
export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [thresholds, pgPct, redisPct, minioInfo, minioStorageGb, backupAge] = await Promise.all([
    loadThresholds(),
    probePostgresConnections(),
    probeRedisMemory(),
    probeMinioConnectivity(),
    probeMinioStorageGb(),
    probeBackupFreshness(),
  ]);

  const readings: MetricReading[] = [];

  const pgThr = thresholds.get('pg_connection_pct') ?? null;
  readings.push({
    metricName:  'pg_connection_pct',
    displayName: 'PostgreSQL Connections',
    value:       pgPct,
    unit:        pgThr?.unit ?? '%',
    level:       classifyLevel(pgPct, pgThr),
    threshold:   pgThr,
  });

  const redisThr = thresholds.get('redis_memory_pct') ?? null;
  readings.push({
    metricName:  'redis_memory_pct',
    displayName: 'Redis Memory',
    value:       redisPct,
    unit:        redisThr?.unit ?? '%',
    level:       redisPct === null ? 'UNKNOWN' : classifyLevel(redisPct, redisThr),
    threshold:   redisThr,
  });

  readings.push({
    metricName:  'minio_connectivity',
    displayName: 'MinIO Connectivity',
    value:       minioInfo.reachable ? 1 : 0,
    unit:        null,
    level:       minioInfo.reachable ? 'OK' : 'CRITICAL',
    threshold:   null,
  });

  const minioStorageThr = thresholds.get('minio_storage_gb') ?? null;
  readings.push({
    metricName:  'minio_storage_gb',
    displayName: 'MinIO Storage Used',
    value:       minioStorageGb,
    unit:        minioStorageThr?.unit ?? 'GB',
    level:       minioInfo.reachable
                   ? classifyLevel(minioStorageGb, minioStorageThr)
                   : 'UNKNOWN',
    threshold:   minioStorageThr,
  });

  const backupThr = thresholds.get('backup_age_minutes') ?? null;
  readings.push({
    metricName:  'backup_age_minutes',
    displayName: 'Backup Age (PG Full)',
    value:       backupAge,
    unit:        backupThr?.unit ?? 'min',
    level:       classifyLevel(backupAge, backupThr),
    threshold:   backupThr,
  });

  const levels   = readings.map((r) => r.level);
  const overall: HealthLevel =
    levels.includes('CRITICAL') ? 'CRITICAL' :
    levels.includes('WARNING')  ? 'WARNING'  :
    levels.every((l) => l === 'OK') ? 'OK' : 'UNKNOWN';

  return { checkedAt: new Date().toISOString(), overall, metrics: readings };
}

/**
 * Probe + tự động raise/resolve ServiceAlert theo kết quả.
 * Cập nhật BigDataService.status từ probe.
 * Dùng cho cron job — không gọi trong request path.
 *
 * Returns: snapshot + danh sách alert actions đã thực hiện.
 */
export async function runHealthCheckWithAlerts(): Promise<{
  snapshot:      HealthSnapshot;
  alertActions:  AlertAction[];
  serviceUpdates: string[];
}> {
  const snapshot      = await getHealthSnapshot();
  const alertActions: AlertAction[] = [];
  const serviceUpdates: string[]    = [];

  // Resolve serviceIds một lần — tránh N query trong vòng lặp
  const [pgServiceId, minioServiceId] = await Promise.all([
    resolveServiceId('POSTGRESQL'),
    resolveServiceId('MINIO'),
  ]);

  for (const metric of snapshot.metrics) {
    // Xác định service nào chịu trách nhiệm cho metric này
    let serviceId: string | null = null;

    if (metric.metricName === 'pg_connection_pct')  serviceId = pgServiceId;
    if (metric.metricName === 'backup_age_minutes') serviceId = pgServiceId;
    if (metric.metricName === 'minio_connectivity') serviceId = minioServiceId;
    if (metric.metricName === 'minio_storage_gb')   serviceId = minioServiceId;
    if (metric.metricName === 'redis_memory_pct')   serviceId = pgServiceId; // fallback nếu chưa có Redis service

    if (!serviceId) continue;

    const action = await syncAlertForMetric(
      serviceId,
      metric.metricName,
      metric.displayName,
      metric.level,
      metric.value,
      metric.unit,
    );
    alertActions.push(action);
  }

  // Cập nhật status BigDataService từ probe
  if (pgServiceId) {
    const pgMetric = snapshot.metrics.find((m) => m.metricName === 'pg_connection_pct');
    if (pgMetric) {
      await syncServiceStatus(pgServiceId, pgMetric.level);
      serviceUpdates.push(`postgresql:${pgMetric.level}`);
    }
  }

  if (minioServiceId) {
    const minioMetric = snapshot.metrics.find((m) => m.metricName === 'minio_connectivity');
    if (minioMetric) {
      await syncServiceStatus(minioServiceId, minioMetric.level);
      serviceUpdates.push(`minio:${minioMetric.level}`);
    }
  }

  return { snapshot, alertActions, serviceUpdates };
}
