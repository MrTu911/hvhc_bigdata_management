/**
 * M13 – Workflow Template Versions
 * GET  /api/workflow-templates/:id/versions      – danh sách versions của template
 * POST /api/workflow-templates/:id/versions      – tạo DRAFT version mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowTemplateService } from '@/lib/services/workflow/workflow-template.service';
import { WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const versions = await prisma.workflowTemplateVersion.findMany({
      where: { templateId: params.id },
      orderBy: { versionNo: 'desc' },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        transitions: { orderBy: { priority: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (err) {
    console.error('[GET /api/workflow-templates/:id/versions]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải versions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.DESIGN);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const version = await WorkflowTemplateService.createVersion(params.id, actor);
    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403 : err.code === 'NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflow-templates/:id/versions]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo version' }, { status: 500 });
  }
}
