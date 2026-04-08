import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// POST - Log metrics cho experiment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const experimentId = params.id;
    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Metrics array is required' },
        { status: 400 }
      );
    }

    // Log từng metric
    for (const metric of metrics) {
      const metricId = `metric_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await db.$executeRawUnsafe(`
        INSERT INTO experiment_metrics (
          id, experiment_id, metric_name, metric_value, 
          step, epoch, timestamp
        ) VALUES (
          '${metricId}', '${experimentId}', '${metric.name}', 
          ${metric.value}, ${metric.step || 0}, ${metric.epoch || 0}, NOW()
        )
      `);
    }

    return NextResponse.json({ message: 'Metrics logged successfully' });
  } catch (error) {
    console.error('Error logging metrics:', error);
    return NextResponse.json(
      { error: 'Failed to log metrics' },
      { status: 500 }
    );
  }
}
