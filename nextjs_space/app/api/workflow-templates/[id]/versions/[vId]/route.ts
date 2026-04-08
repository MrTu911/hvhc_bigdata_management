/**
 * M13 – Workflow Template Version Detail
 * GET /api/workflow-templates/:id/versions/:vId  – chi tiết version (steps + transitions)
 * PUT /api/workflow-templates/:id/versions/:vId  – lưu toàn bộ steps + transitions (DRAFT only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowTemplateService, UpsertVersionStepsInput } from '@/lib/services/workflow/workflow-template.service';
import { WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; vId: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const version = await prisma.workflowTemplateVersion.findUnique({
      where: { id: params.vId },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        transitions: { orderBy: [{ fromStepCode: 'asc' }, { priority: 'asc' }] },
      },
    });

    if (!version || version.templateId !== params.id) {
      return NextResponse.json({ success: false, error: 'Version không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: version });
  } catch (err) {
    console.error('[GET /api/workflow-templates/:id/versions/:vId]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải version' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; vId: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.DESIGN);
  if (!auth.allowed) return auth.response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const { steps, transitions } = body as Partial<UpsertVersionStepsInput>;

  if (!Array.isArray(steps) || !Array.isArray(transitions)) {
    return NextResponse.json(
      { success: false, error: 'steps và transitions phải là array' },
      { status: 400 }
    );
  }

  // Validate từng step có đủ field tối thiểu
  for (const step of steps) {
    if (!step.code?.trim() || !step.name?.trim() || !step.stepType) {
      return NextResponse.json(
        { success: false, error: 'Mỗi step phải có code, name, stepType' },
        { status: 400 }
      );
    }
  }

  // Validate từng transition có đủ field tối thiểu
  for (const t of transitions) {
    if (!t.fromStepCode?.trim() || !t.toStepCode?.trim() || !t.actionCode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mỗi transition phải có fromStepCode, toStepCode, actionCode' },
        { status: 400 }
      );
    }
  }

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const updated = await WorkflowTemplateService.saveVersionDefinition(
      params.vId,
      { steps, transitions },
      actor
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403
        : err.code === 'NOT_FOUND' ? 404
        : 422;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[PUT /api/workflow-templates/:id/versions/:vId]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu definition' }, { status: 500 });
  }
}
