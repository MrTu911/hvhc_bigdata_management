/**
 * ETL Logs API
 * Get ETL execution logs and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ETL } from '@/lib/rbac/function-codes';
import { ETLLogger } from '@/lib/etl/logger';

/**
 * GET /api/etl/logs - Get ETL logs
 * Query params:
 * - workflowId: number
 * - executionId: number
 * - level: DEBUG|INFO|WARNING|ERROR|CRITICAL
 * - limit: number
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ETL.VIEW_LOGS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const executionId = searchParams.get('executionId');
    const level = searchParams.get('level') as any;
    const limit = parseInt(searchParams.get('limit') || '100');

    let logs;

    if (executionId) {
      logs = await ETLLogger.getExecutionLogs(parseInt(executionId), level);
    } else if (workflowId) {
      logs = await ETLLogger.getWorkflowLogs(parseInt(workflowId), limit);
    } else {
      // Get recent errors by default
      logs = await ETLLogger.getRecentErrors(24, limit);
    }

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error: any) {
    console.error('Error fetching ETL logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
