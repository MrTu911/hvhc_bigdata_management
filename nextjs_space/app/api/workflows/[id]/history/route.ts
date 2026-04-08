/**
 * M13 – Lịch sử actions của workflow instance
 * GET /api/workflows/:id/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowEngineService, WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW_DETAIL);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const history = await WorkflowEngineService.getHistory(params.id, actor);
    return NextResponse.json({ success: true, data: history });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403 : err.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[GET /api/workflows/:id/history]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải lịch sử' }, { status: 500 });
  }
}
