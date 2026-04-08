/**
 * M13 – Validate template version trước khi publish
 * POST /api/workflow-templates/:id/versions/:vId/validate
 *
 * Trả về danh sách lỗi nếu definition không hợp lệ.
 * Không thay đổi dữ liệu — safe to call nhiều lần.
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
  const auth = await requireFunction(request, WORKFLOW.DESIGN);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const result = await WorkflowTemplateService.validateVersion(params.vId, actor);

    return NextResponse.json({
      success: true,
      data: {
        valid: result.valid,
        errors: result.errors,
        // Cho phép FE biết ngay có thể publish được không
        canPublish: result.valid,
      },
    });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403 : err.code === 'NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflow-templates/:id/versions/:vId/validate]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi validate version' }, { status: 500 });
  }
}
