import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// POST - So sánh nhiều experiments
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { experimentIds } = body;

    if (!experimentIds || !Array.isArray(experimentIds) || experimentIds.length === 0) {
      return NextResponse.json(
        { error: 'experimentIds array is required' },
        { status: 400 }
      );
    }

    // Bind each id as a parameter ($1, $2, ...) to prevent SQL injection.
    const placeholders = experimentIds.map((_, i) => `$${i + 1}`).join(',');

    // Lấy thông tin các experiments
    const experiments = await db.$queryRawUnsafe(`
      SELECT * FROM ml_experiments
      WHERE id IN (${placeholders})
    `, ...experimentIds);

    // Lấy metrics của các experiments
    const metrics = await db.$queryRawUnsafe(`
      SELECT * FROM experiment_metrics
      WHERE experiment_id IN (${placeholders})
      ORDER BY experiment_id, timestamp ASC
    `, ...experimentIds);

    // Nhóm metrics theo experiment
    const experimentMetrics: Record<string, any[]> = {};
    if (Array.isArray(metrics)) {
      for (const metric of metrics) {
        const expId = (metric as any).experiment_id;
        if (!experimentMetrics[expId]) {
          experimentMetrics[expId] = [];
        }
        experimentMetrics[expId].push(metric);
      }
    }

    // Kết hợp dữ liệu
    const comparison = Array.isArray(experiments) ? experiments.map((exp: any) => ({
      ...exp,
      metrics: experimentMetrics[exp.id] || []
    })) : [];

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error('Error comparing experiments:', error);
    return NextResponse.json(
      { error: 'Failed to compare experiments' },
      { status: 500 }
    );
  }
}
