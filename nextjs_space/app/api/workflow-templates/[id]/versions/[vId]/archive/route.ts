/**
 * M13 – Archive template version
 * POST /api/workflow-templates/:id/versions/:vId/archive
 *
 * Yêu cầu WF.OVERRIDE.
 * Không archive nếu còn workflow instance đang chạy dùng version này.
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
  const auth = await requireFunction(request, WORKFLOW.OVERRIDE);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const archived = await WorkflowTemplateService.archiveVersion(params.vId, actor);

    return NextResponse.json({ success: true, data: archived });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403
        : err.code === 'NOT_FOUND' ? 404
        : 409;  // INVALID_STATE = còn instance đang chạy
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflow-templates/:id/versions/:vId/archive]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi archive version' }, { status: 500 });
  }
}
