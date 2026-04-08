/**
 * ML Auto-Training Triggers API
 * Manage automatic training triggers
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { autoTrainingTriggers } from '@/lib/ml/auto-training-triggers';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/ml/auto-training - Get auto-training triggers
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const triggerId = searchParams.get('triggerId');
    const modelId = searchParams.get('modelId');
    const action = searchParams.get('action');

    if (triggerId) {
      const trigger = await autoTrainingTriggers.getTrigger(parseInt(triggerId));
      return NextResponse.json({ success: true, data: trigger });
    }

    if (action === 'stats') {
      const stats = await autoTrainingTriggers.getTriggerStats(
        modelId ? parseInt(modelId) : undefined
      );
      return NextResponse.json({ success: true, data: stats });
    }

    if (modelId) {
      const triggers = await autoTrainingTriggers.getModelTriggers(parseInt(modelId));
      return NextResponse.json({ success: true, data: triggers, total: triggers.length });
    }

    const triggers = await autoTrainingTriggers.getActiveTriggers();
    return NextResponse.json({ success: true, data: triggers, total: triggers.length });
  } catch (error: any) {
    console.error('Error fetching auto-training triggers:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/auto-training - Create or manage triggers
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
    const { action, ...data } = body;

    if (action === 'create') {
      const triggerId = await autoTrainingTriggers.createTrigger(data);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'CREATE',
        resourceType: 'AUTO_TRAINING_TRIGGER',
        resourceId: String(triggerId),
        result: 'SUCCESS',
        newValue: JSON.stringify({ triggerName: data.triggerName })
      });

      return NextResponse.json({
        success: true,
        message: 'Auto-training trigger created successfully',
        data: { triggerId }
      });
    }

    if (action === 'update' && data.triggerId) {
      await autoTrainingTriggers.updateTrigger(data.triggerId, data.updates);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'UPDATE',
        resourceType: 'AUTO_TRAINING_TRIGGER',
        resourceId: String(data.triggerId),
        result: 'SUCCESS'
      });

      return NextResponse.json({
        success: true,
        message: 'Auto-training trigger updated successfully'
      });
    }

    if (action === 'execute' && data.triggerId) {
      await autoTrainingTriggers.executeTrigger(data.triggerId, data.context);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'EXECUTE',
        resourceType: 'AUTO_TRAINING_TRIGGER',
        resourceId: String(data.triggerId),
        result: 'SUCCESS'
      });

      return NextResponse.json({
        success: true,
        message: 'Auto-training trigger executed successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in auto-training POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ml/auto-training - Delete trigger
 * RBAC: ML.MANAGE_MODELS
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const triggerId = searchParams.get('triggerId');

    if (!triggerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: triggerId' },
        { status: 400 }
      );
    }

    await autoTrainingTriggers.deleteTrigger(parseInt(triggerId));

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'DELETE',
      resourceType: 'AUTO_TRAINING_TRIGGER',
      resourceId: triggerId,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-training trigger deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting auto-training trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
