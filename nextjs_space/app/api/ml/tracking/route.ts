/**
 * API Route: ML Tracking (MLflow-compatible)
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

function generateRunId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * POST - Create new ML run
 * RBAC: ML.MANAGE_MODELS
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { 
      experimentId, 
      runName, 
      sourceType = 'LOCAL',
      sourceName,
      tags = {}
    } = body;

    if (!experimentId) {
      return NextResponse.json({ error: 'experimentId is required' }, { status: 400 });
    }

    const runId = generateRunId();
    const startTime = Date.now();

    await db.$executeRaw`
      INSERT INTO ml_runs (
        run_id, experiment_id, run_name, source_type, source_name,
        user_id, status, start_time, artifact_uri, tags
      ) VALUES (
        ${runId}, ${experimentId}, ${runName || `run_${runId.slice(0, 8)}`},
        ${sourceType}, ${sourceName || 'manual'},
        ${user.id}, 'RUNNING', ${startTime},
        ${`/artifacts/${runId}`}, ${JSON.stringify(tags)}::jsonb
      )
    `;

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'CREATE',
      resourceType: 'ML_RUN',
      resourceId: runId,
      result: 'SUCCESS',
      newValue: JSON.stringify({ experimentId, runName, sourceType })
    });

    return NextResponse.json({
      success: true,
      runId,
      startTime,
    });
  } catch (error: any) {
    console.error('Create ML run error:', error);
    return NextResponse.json(
      { error: 'Failed to create ML run', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Get ML runs
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const experimentId = searchParams.get('experimentId');
    const runId = searchParams.get('runId');

    if (runId) {
      // Get specific run details with metrics and params
      const run = await db.$queryRaw`
        SELECT * FROM ml_runs WHERE run_id = ${runId}
      `;

      const metrics = await db.$queryRaw`
        SELECT metric_key, metric_value, timestamp, step
        FROM run_metrics
        WHERE run_id = ${runId}
        ORDER BY timestamp ASC
      `;

      const params = await db.$queryRaw`
        SELECT param_key, param_value
        FROM run_parameters
        WHERE run_id = ${runId}
      `;

      return NextResponse.json({
        success: true,
        run: Array.isArray(run) ? run[0] : run,
        metrics,
        params,
      });
    }

    // Get all runs for experiment - use parameterized query
    let runs;
    if (experimentId) {
      runs = await db.$queryRaw`
        SELECT r.*, e.name as experiment_name
        FROM ml_runs r
        LEFT JOIN ml_experiments e ON r.experiment_id = e.id
        WHERE r.experiment_id = ${experimentId}
        ORDER BY r.start_time DESC
        LIMIT 100
      `;
    } else {
      runs = await db.$queryRaw`
        SELECT r.*, e.name as experiment_name
        FROM ml_runs r
        LEFT JOIN ml_experiments e ON r.experiment_id = e.id
        ORDER BY r.start_time DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({
      success: true,
      runs,
    });
  } catch (error: any) {
    console.error('Get ML runs error:', error);
    return NextResponse.json(
      { error: 'Failed to get ML runs', details: error.message },
      { status: 500 }
    );
  }
}
