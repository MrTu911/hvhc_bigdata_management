/**
 * API Route: Log ML Metrics
 * POST /api/ml/tracking/[runId]/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { runId } = params;
    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'metrics array is required' }, { status: 400 });
    }

    // Insert all metrics
    for (const metric of metrics) {
      const { key, value, timestamp, step = 0 } = metric;
      
      await db.$executeRaw`
        INSERT INTO run_metrics (run_id, metric_key, metric_value, timestamp, step)
        VALUES (${runId}, ${key}, ${value}, ${timestamp || Date.now()}, ${step})
      `;
    }

    return NextResponse.json({
      success: true,
      message: `${metrics.length} metrics logged`,
    });
  } catch (error: any) {
    console.error('Log metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to log metrics', details: error.message },
      { status: 500 }
    );
  }
}
