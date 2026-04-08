/**
 * M13 – Publish template version
 * POST /api/workflow-templates/:id/versions/:vId/publish
 *
 * Yêu cầu WF.OVERRIDE.
 * Tự động validate trước khi publish.
 * Archive version PUBLISHED cũ trong cùng transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowTemplateService } from '@/lib/services/workflow/workflow-template.service';
import { WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; vId: string } }
) {
  // Publish cần quyền cao hơn DESIGN
  const auth = await requireFunction(request, WORKFLOW.OVERRIDE);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const published = await WorkflowTemplateService.publishVersion(params.vId, actor);

    return NextResponse.json({ success: true, data: published });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403
        : err.code === 'NOT_FOUND' ? 404
        : 422;  // INVALID_STATE = definition chưa valid
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflow-templates/:id/versions/:vId/publish]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi publish version' }, { status: 500 });
  }
}
