/**
 * API Route: ETL Scheduler Management
 * GET /api/etl/scheduler - Get scheduler status
 * POST /api/etl/scheduler/schedule - Schedule a workflow
 * DELETE /api/etl/scheduler/[workflowId] - Unschedule a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { ETL } from '@/lib/rbac/function-codes';
import { etlScheduler } from '@/lib/etl/scheduler';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'status') {
      const status = etlScheduler.getStatus();
      return NextResponse.json({ 
        success: true, 
        status 
      });
    }

    // Get scheduled workflows
    const scheduledWorkflows = await etlScheduler.getScheduledWorkflows();
    
    return NextResponse.json({
      success: true,
      scheduledWorkflows,
      totalCount: scheduledWorkflows.length
    });

  } catch (error: any) {
    console.error('Get ETL scheduler error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler info', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ETL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { workflowId, cronExpression, action } = body;

    if (action === 'schedule') {
      if (!workflowId || !cronExpression) {
        return NextResponse.json(
          { error: 'workflowId and cronExpression are required' },
          { status: 400 }
        );
      }

      await etlScheduler.scheduleWorkflow(workflowId, cronExpression);
      
      return NextResponse.json({
        success: true,
        message: `Workflow ${workflowId} scheduled successfully`
      });
    }

    if (action === 'unschedule') {
      if (!workflowId) {
        return NextResponse.json(
          { error: 'workflowId is required' },
          { status: 400 }
        );
      }

      etlScheduler.unscheduleWorkflow(workflowId);
      
      return NextResponse.json({
        success: true,
        message: `Workflow ${workflowId} unscheduled successfully`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "schedule" or "unschedule"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('ETL scheduler action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform scheduler action', details: error.message },
      { status: 500 }
    );
  }
}
