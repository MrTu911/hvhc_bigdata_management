import { NextRequest, NextResponse } from 'next/server';
import { ETLWorkflowEngine } from '@/lib/etl/workflow-engine';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';

/**
 * GET /api/etl/workflows/:id - Get workflow details
 * RBAC: DATA.VIEW
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, DATA.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const workflow = await ETLWorkflowEngine.getWorkflow(parseInt(params.id));
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
