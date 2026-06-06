import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// POST - Thực thi workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const workflowId = params.id;
    const body = await request.json();
    const { parameters } = body;

    // Kiểm tra workflow tồn tại
    const workflows = await db.$queryRawUnsafe(`
      SELECT * FROM ml_workflows WHERE id = $1
    `, workflowId);

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Tạo execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.$executeRawUnsafe(`
      INSERT INTO workflow_executions (
        id, workflow_id, status, parameters,
        started_at, started_by
      ) VALUES (
        $1, $2, 'running', $3, NOW(), $4
      )
    `, executionId, workflowId, JSON.stringify(parameters || {}), user!.id);

    // Thực thi workflow (async)
    executeWorkflow(executionId, workflowId, workflows[0], parameters).catch(error => {
      console.error('Workflow execution error:', error);
    });

    return NextResponse.json({ 
      executionId,
      message: 'Workflow execution started' 
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}

async function executeWorkflow(
  executionId: string,
  workflowId: string,
  workflow: any,
  parameters: any
) {
  try {
    const steps = JSON.parse(workflow.steps || '[]');
    const results: any[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Cập nhật progress
      await db.$executeRawUnsafe(`
        UPDATE workflow_executions
        SET current_step = $1,
            progress = $2,
            updated_at = NOW()
        WHERE id = $3
      `, i + 1, Math.round((i + 1) / steps.length * 100), executionId);

      // Thực hiện step (giả lập)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      results.push({
        step: step.name,
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    }

    // Cập nhật kết quả
    await db.$executeRawUnsafe(`
      UPDATE workflow_executions
      SET status = 'completed',
          results = $1,
          completed_at = NOW(),
          progress = 100
      WHERE id = $2
    `, JSON.stringify(results), executionId);
  } catch (error) {
    console.error('Workflow execution failed:', error);
    await db.$executeRawUnsafe(`
      UPDATE workflow_executions
      SET status = 'failed',
          error = $1,
          completed_at = NOW()
      WHERE id = $2
    `, String(error), executionId);
  }
}
