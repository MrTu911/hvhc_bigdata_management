/**
 * ML Experiment Detail API
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * GET - Lấy chi tiết experiment
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const experimentId = params.id;

    const experiments = await db.$queryRaw`
      SELECT * FROM ml_experiments WHERE id = ${experimentId}
    `;

    if (!Array.isArray(experiments) || experiments.length === 0) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Lấy metrics của experiment
    const metrics = await db.$queryRaw`
      SELECT * FROM experiment_metrics 
      WHERE experiment_id = ${experimentId}
      ORDER BY timestamp ASC
    `;

    // Lấy artifacts của experiment
    const artifacts = await db.$queryRaw`
      SELECT * FROM experiment_artifacts 
      WHERE experiment_id = ${experimentId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      experiment: experiments[0],
      metrics: metrics || [],
      artifacts: artifacts || []
    });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cập nhật experiment
 * RBAC: ML.MANAGE_MODELS
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const experimentId = params.id;
    const body = await request.json();
    const { status, results, metrics } = body;

    // Use parameterized updates
    if (status === 'completed') {
      await db.$executeRaw`
        UPDATE ml_experiments 
        SET status = ${status}, end_time = NOW(), updated_at = NOW()
        WHERE id = ${experimentId}
      `;
    } else if (status) {
      await db.$executeRaw`
        UPDATE ml_experiments 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${experimentId}
      `;
    }

    if (results) {
      await db.$executeRaw`
        UPDATE ml_experiments 
        SET results = ${JSON.stringify(results)}::jsonb, updated_at = NOW()
        WHERE id = ${experimentId}
      `;
    }

    // Log metrics nếu có
    if (metrics && Array.isArray(metrics)) {
      for (const metric of metrics) {
        const metricId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await db.$executeRaw`
          INSERT INTO experiment_metrics (
            id, experiment_id, metric_name, metric_value, timestamp
          ) VALUES (
            ${metricId}, ${experimentId}, ${metric.name}, ${metric.value}, NOW()
          )
        `;
      }
    }

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'UPDATE',
      resourceType: 'ML_EXPERIMENT',
      resourceId: experimentId,
      result: 'SUCCESS',
      newValue: JSON.stringify({ status, results })
    });

    return NextResponse.json({ message: 'Experiment updated successfully' });
  } catch (error) {
    console.error('Error updating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa experiment
 * RBAC: ML.MANAGE_MODELS
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const experimentId = params.id;

    // Xóa metrics và artifacts trước
    await db.$executeRaw`
      DELETE FROM experiment_metrics WHERE experiment_id = ${experimentId}
    `;
    await db.$executeRaw`
      DELETE FROM experiment_artifacts WHERE experiment_id = ${experimentId}
    `;
    
    // Xóa experiment
    await db.$executeRaw`
      DELETE FROM ml_experiments WHERE id = ${experimentId}
    `;

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'DELETE',
      resourceType: 'ML_EXPERIMENT',
      resourceId: experimentId,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    );
  }
}
