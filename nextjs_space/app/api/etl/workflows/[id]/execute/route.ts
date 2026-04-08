import { NextRequest, NextResponse } from 'next/server';
import { ETLWorkflowEngine } from '@/lib/etl/workflow-engine';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';

/**
 * POST /api/etl/workflows/:id/execute - Execute workflow
 * RBAC: DATA.CREATE
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, DATA.CREATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const workflowId = parseInt(params.id);
    const result = await ETLWorkflowEngine.executeWorkflow(workflowId);
    
    return NextResponse.json({
      success: result.success,
      data: { execution_id: result.executionId },
      message: result.message
    });
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
