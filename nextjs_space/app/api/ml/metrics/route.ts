/**
 * ML Training Metrics API
 * Get training metrics for visualization
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { mlTrainingLogger } from '@/lib/ml/training-logger';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/ml/metrics - Get training metrics
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    const metricNamesParam = searchParams.get('metricNames');

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing required parameter: runId' },
        { status: 400 }
      );
    }

    const metricNames = metricNamesParam ? metricNamesParam.split(',') : undefined;
    const metrics = await mlTrainingLogger.getTrainingMetrics(runId, metricNames);

    // Transform for charting
    const chartData = transformMetricsForChart(metrics);

    return NextResponse.json({
      success: true,
      data: metrics,
      chartData,
      total: metrics.length
    });
  } catch (error: any) {
    console.error('Error fetching training metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/metrics - Record a training metric
 * RBAC: ML.MANAGE_MODELS
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { jobId, runId, epoch, step, metricName, metricValue } = body;

    if (!jobId || !runId || epoch === undefined || !metricName || metricValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await mlTrainingLogger.recordMetric(
      jobId,
      runId,
      epoch,
      step || 0,
      metricName,
      metricValue
    );

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'CREATE',
      resourceType: 'ML_METRIC',
      resourceId: runId,
      result: 'SUCCESS',
      metadata: { metricName, metricValue, epoch, step }
    });

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully'
    });
  } catch (error: any) {
    console.error('Error recording metric:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Transform metrics for chart visualization
 */
function transformMetricsForChart(metrics: any[]): any {
  const metricsByName: { [key: string]: any[] } = {};

  metrics.forEach(metric => {
    if (!metricsByName[metric.metric_name]) {
      metricsByName[metric.metric_name] = [];
    }

    metricsByName[metric.metric_name].push({
      epoch: metric.epoch,
      step: metric.step,
      value: parseFloat(metric.metric_value),
      timestamp: metric.timestamp
    });
  });

  return metricsByName;
}
