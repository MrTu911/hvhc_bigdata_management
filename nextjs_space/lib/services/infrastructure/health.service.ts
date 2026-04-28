/**
 * M12 – Health & Metrics Service
 *
 * Probe trực tiếp PostgreSQL, Redis, MinIO để lấy metric thực.
 * So sánh với MetricThresholdPolicy để xác định severity.
 * Không ghi metric vào DB trong request path — chỉ trả kết quả realtime.
 *
 * Mỗi probe có timeout riêng và trả về null nếu service không trả lời,
 * tránh block cả health endpoint khi một service down.
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

// ─── Individual probes ────────────────────────────────────────────────────────

async function probePostgresConnections(): Promise<number | null> {
  try {
    // pg_stat_activity trả số connection đang active so với max_connections
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

  // Dùng ioredis trực tiếp — RedisCache wrapper không expose INFO
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout:       3000,
    lazyConnect:          true,
    enableOfflineQueue:   false,
  });

  try {
    await client.connect();
    const info     = await client.info('memory');
    const usedMatch = info.match(/used_memory:(\d+)/);
    const maxMatch  = info.match(/maxmemory:(\d+)/);

    if (!usedMatch) return null;
    const used = parseInt(usedMatch[1]);
    const max  = maxMatch ? parseInt(maxMatch[1]) : 0;

    // Nếu maxmemory = 0 (unlimited), không tính được %
    if (!max) return null;
    return Math.round((used / max) * 100 * 10) / 10;
  } catch {
    return null;
  } finally {
    client.disconnect();
  }
}

async function probeMinioConnectivity(): Promise<{ reachable: boolean; diskPct: number | null }> {
  // MinIO không expose disk usage qua S3 API — chỉ có thể kiểm tra connectivity
  // bằng cách list buckets. Disk usage cần admin API hoặc node exporter.
  try {
    await Promise.race([
      minioClient.listBuckets(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return { reachable: true, diskPct: null };
  } catch {
    return { reachable: false, diskPct: null };
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

// ─── Aggregated health snapshot ───────────────────────────────────────────────

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [thresholds, pgPct, redisPct, minioInfo, backupAge] = await Promise.all([
    loadThresholds(),
    probePostgresConnections(),
    probeRedisMemory(),
    probeMinioConnectivity(),
    probeBackupFreshness(),
  ]);

  const readings: MetricReading[] = [];

  // — PostgreSQL connections —
  const pgThr = thresholds.get('pg_connection_pct') ?? null;
  readings.push({
    metricName:  'pg_connection_pct',
    displayName: 'PostgreSQL Connections',
    value:       pgPct,
    unit:        pgThr?.unit ?? '%',
    level:       classifyLevel(pgPct, pgThr),
    threshold:   pgThr,
  });

  // — Redis memory —
  const redisThr = thresholds.get('redis_memory_pct') ?? null;
  readings.push({
    metricName:  'redis_memory_pct',
    displayName: 'Redis Memory',
    value:       redisPct,
    unit:        redisThr?.unit ?? '%',
    // null có nghĩa maxmemory unlimited hoặc Redis unreachable — treat as UNKNOWN
    level:       redisPct === null ? 'UNKNOWN' : classifyLevel(redisPct, redisThr),
    threshold:   redisThr,
  });

  // — MinIO connectivity (không có disk % từ S3 API) —
  readings.push({
    metricName:  'minio_connectivity',
    displayName: 'MinIO Connectivity',
    value:       minioInfo.reachable ? 1 : 0,
    unit:        null,
    level:       minioInfo.reachable ? 'OK' : 'CRITICAL',
    threshold:   null,
  });

  // — Backup age —
  const backupThr = thresholds.get('backup_age_minutes') ?? null;
  readings.push({
    metricName:  'backup_age_minutes',
    displayName: 'Backup Age (PG Full)',
    value:       backupAge,
    unit:        backupThr?.unit ?? 'min',
    level:       classifyLevel(backupAge, backupThr),
    threshold:   backupThr,
  });

  const levels    = readings.map((r) => r.level);
  const overall: HealthLevel =
    levels.includes('CRITICAL') ? 'CRITICAL' :
    levels.includes('WARNING')  ? 'WARNING'  :
    levels.every((l) => l === 'OK') ? 'OK' : 'UNKNOWN';

  return { checkedAt: new Date().toISOString(), overall, metrics: readings };
}
