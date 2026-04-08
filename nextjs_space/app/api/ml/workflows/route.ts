/**
 * ML Workflows API
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * GET - Lấy danh sách training workflows
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const workflows = await db.$queryRawUnsafe(`
      SELECT * FROM ml_workflows 
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo training workflow mới
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
      name, 
      description, 
      modelId, 
      steps,
      schedule,
      parameters 
    } = body;

    if (!name || !modelId || !steps) {
      return NextResponse.json(
        { error: 'Name, modelId, and steps are required' },
        { status: 400 }
      );
    }

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.$executeRawUnsafe(`
      INSERT INTO ml_workflows (
        id, name, description, model_id, steps, 
        schedule, parameters, status, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'draft', $8, NOW()
      )
    `, workflowId, name, description || '', modelId, 
       JSON.stringify(steps), JSON.stringify(schedule || {}), 
       JSON.stringify(parameters || {}), user.id);

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'CREATE',
      resourceType: 'ML_WORKFLOW',
      resourceId: workflowId,
      result: 'SUCCESS',
      newValue: JSON.stringify({ name, modelId, steps })
    });

    return NextResponse.json({ 
      workflowId,
      message: 'Workflow created successfully' 
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
