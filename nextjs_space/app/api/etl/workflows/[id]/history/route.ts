import { NextRequest, NextResponse } from 'next/server';
import { ETLWorkflowEngine } from '@/lib/etl/workflow-engine';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';

/**
 * GET /api/etl/workflows/:id/history - Get execution history
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const history = await ETLWorkflowEngine.getExecutionHistory(
      parseInt(params.id),
      limit
    );
    
    return NextResponse.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error: any) {
    console.error('Error fetching execution history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
