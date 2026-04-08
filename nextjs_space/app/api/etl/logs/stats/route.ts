/**
 * ETL Logs Statistics API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ETL } from '@/lib/rbac/function-codes';
import { ETLLogger } from '@/lib/etl/logger';

/**
 * GET /api/etl/logs/stats - Get ETL logs statistics
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ETL.VIEW_LOGS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const hours = parseInt(searchParams.get('hours') || '24');

    const stats = await ETLLogger.getLogStats(
      workflowId ? parseInt(workflowId) : undefined,
      hours
    );

    return NextResponse.json({
      success: true,
      data: stats,
      period_hours: hours
    });
  } catch (error: any) {
    console.error('Error fetching ETL log stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
