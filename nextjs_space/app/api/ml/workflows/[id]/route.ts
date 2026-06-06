import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// GET - Lấy chi tiết workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;

    const workflows = await db.$queryRawUnsafe(`
      SELECT * FROM ml_workflows WHERE id = $1
    `, workflowId);

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Lấy execution history
    const executions = await db.$queryRawUnsafe(`
      SELECT * FROM workflow_executions
      WHERE workflow_id = $1
      ORDER BY started_at DESC
      LIMIT 20
    `, workflowId);

    return NextResponse.json({
      workflow: workflows[0],
      executions: executions || []
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const workflowId = params.id;
    const body = await request.json();
    const { name, description, steps, schedule, parameters, status } = body;

    // Build parameterized SET clause: column names are code-controlled, values are bound.
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    if (name) { queryParams.push(name); updateFields.push(`name = $${queryParams.length}`); }
    if (description) { queryParams.push(description); updateFields.push(`description = $${queryParams.length}`); }
    if (steps) { queryParams.push(JSON.stringify(steps)); updateFields.push(`steps = $${queryParams.length}`); }
    if (schedule) { queryParams.push(JSON.stringify(schedule)); updateFields.push(`schedule = $${queryParams.length}`); }
    if (parameters) { queryParams.push(JSON.stringify(parameters)); updateFields.push(`parameters = $${queryParams.length}`); }
    if (status) { queryParams.push(status); updateFields.push(`status = $${queryParams.length}`); }

    if (updateFields.length > 0) {
      queryParams.push(workflowId);
      await db.$executeRawUnsafe(`
        UPDATE ml_workflows
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${queryParams.length}
      `, ...queryParams);
    }

    return NextResponse.json({ message: 'Workflow updated successfully' });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const workflowId = params.id;

    // Xóa executions trước
    await db.$executeRawUnsafe(`
      DELETE FROM workflow_executions WHERE workflow_id = $1
    `, workflowId);

    // Xóa workflow
    await db.$executeRawUnsafe(`
      DELETE FROM ml_workflows WHERE id = $1
    `, workflowId);

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
