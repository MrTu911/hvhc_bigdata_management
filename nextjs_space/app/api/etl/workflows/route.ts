import { NextRequest, NextResponse } from 'next/server';
import { ETLWorkflowEngine } from '@/lib/etl/workflow-engine';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';

/**
 * GET /api/etl/workflows - Get all ETL workflows
 * RBAC: DATA.VIEW
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const workflows = await ETLWorkflowEngine.getActiveWorkflows();
    
    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error: any) {
    console.error('Error fetching ETL workflows:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/etl/workflows - Create new ETL workflow
 * RBAC: DATA.CREATE
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.CREATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    
    const workflowId = await ETLWorkflowEngine.createWorkflow({
      name: body.name,
      description: body.description,
      workflow_type: body.workflow_type,
      source_config: body.source_config,
      destination_config: body.destination_config,
      transformation_rules: body.transformation_rules,
      schedule_cron: body.schedule_cron,
      is_active: body.is_active ?? true,
      priority: body.priority ?? 5
    });
    
    return NextResponse.json({
      success: true,
      data: { id: workflowId },
      message: 'ETL workflow created successfully'
    });
  } catch (error: any) {
    console.error('Error creating ETL workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
