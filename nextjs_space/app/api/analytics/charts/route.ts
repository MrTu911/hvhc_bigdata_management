import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { prisma as db } from '@/lib/db';

// GET - Lấy dữ liệu cho các charts nâng cao
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const chartType = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '7d';

    let data;

    switch (chartType) {
      case 'model-performance':
        data = await getModelPerformanceData(timeRange);
        break;
      case 'experiment-metrics':
        data = await getExperimentMetricsData(timeRange);
        break;
      case 'data-quality':
        data = await getDataQualityData(timeRange);
        break;
      case 'resource-utilization':
        data = await getResourceUtilizationData(timeRange);
        break;
      case 'user-activity':
        data = await getUserActivityData(timeRange);
        break;
      default:
        data = await getDashboardData(timeRange);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// Map UI time-range tokens → cutoff Date. Tránh nội suy input người dùng vào SQL.
function resolveSince(timeRange: string): Date {
  const daysByToken: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = daysByToken[timeRange] ?? 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function getModelPerformanceData(timeRange: string) {
  const models = await db.$queryRawUnsafe(`
    SELECT 
      m.id, m.name, m.type,
      v.version_number, v.metrics,
      v.created_at
    FROM ml_models m
    LEFT JOIN model_versions v ON m.id = v.model_id
    WHERE v.stage = 'production'
    ORDER BY v.created_at DESC
    LIMIT 10
  `);

  return models;
}

async function getExperimentMetricsData(timeRange: string) {
  const since = resolveSince(timeRange);
  const experiments = await db.$queryRawUnsafe(`
    SELECT
      e.id, e.name, e.model_id,
      em.metric_name, em.metric_value, em.timestamp
    FROM ml_experiments e
    JOIN experiment_metrics em ON e.id = em.experiment_id
    WHERE e.created_at >= $1
    ORDER BY em.timestamp ASC
  `, since);

  return experiments;
}

async function getDataQualityData(timeRange: string) {
  // Mock data - thay thế bằng query thực tế
  return {
    completeness: 95.5,
    accuracy: 98.2,
    consistency: 96.8,
    timeliness: 94.3,
    validity: 97.6
  };
}

async function getResourceUtilizationData(timeRange: string) {
  // Mock data - thay thế bằng query thực tế từ Prometheus
  return {
    cpu: [
      { timestamp: new Date().toISOString(), value: 65 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 72 },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), value: 68 }
    ],
    memory: [
      { timestamp: new Date().toISOString(), value: 78 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 75 },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), value: 80 }
    ],
    storage: [
      { timestamp: new Date().toISOString(), value: 82 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 81 },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), value: 79 }
    ]
  };
}

async function getUserActivityData(timeRange: string) {
  const since = resolveSince(timeRange);
  // audit_logs là Prisma model (@@map) nhưng cột không @map → tên cột thật là camelCase "createdAt".
  const activities = await db.$queryRawUnsafe(`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM audit_logs
    WHERE "createdAt" >= $1
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `, since);

  return activities;
}

async function getDashboardData(timeRange: string) {
  return {
    models: await getModelPerformanceData(timeRange),
    experiments: await getExperimentMetricsData(timeRange),
    quality: await getDataQualityData(timeRange),
    resources: await getResourceUtilizationData(timeRange)
  };
}
