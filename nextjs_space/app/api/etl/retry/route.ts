/**
 * ETL Retry Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ETL } from '@/lib/rbac/function-codes';
import { etlRetryManager } from '@/lib/etl/retry-manager';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/etl/retry - Get retry configuration or history
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ETL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const executionId = searchParams.get('executionId');
    const action = searchParams.get('action') || 'config';

    if (action === 'config' && workflowId) {
      const config = await etlRetryManager.getRetryConfig(parseInt(workflowId));
      return NextResponse.json({ success: true, data: config });
    }

    if (action === 'history' && executionId) {
      const history = await etlRetryManager.getRetryHistory(parseInt(executionId));
      return NextResponse.json({ success: true, data: history });
    }

    if (action === 'stats' && workflowId) {
      const stats = await etlRetryManager.getRetryStats(parseInt(workflowId));
      return NextResponse.json({ success: true, data: stats });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in retry GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/etl/retry - Configure retry or trigger retry
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ETL.EXECUTE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await req.json();
    const { action, workflowId, executionId, config } = body;

    if (action === 'configure' && workflowId) {
      await etlRetryManager.setRetryConfig(workflowId, config);
      
      await logAudit({
        userId: user!.id,
        functionCode: ETL.UPDATE,
        action: 'UPDATE',
        resourceType: 'ETL_RETRY_CONFIG',
        resourceId: String(workflowId),
        newValue: config,
        result: 'SUCCESS'
      });

      return NextResponse.json({
        success: true,
        message: 'Retry configuration updated'
      });
    }

    if (action === 'retry' && executionId) {
      const result = await etlRetryManager.retryExecution(executionId);
      
      await logAudit({
        userId: user!.id,
        functionCode: ETL.EXECUTE,
        action: 'EXECUTE',
        resourceType: 'ETL_EXECUTION',
        resourceId: String(executionId),
        newValue: { action: 'retry', newExecutionId: result.newExecutionId },
        result: result.success ? 'SUCCESS' : 'FAIL'
      });

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: { newExecutionId: result.newExecutionId }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in retry POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
