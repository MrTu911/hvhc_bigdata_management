/**
 * M13 – Việc đang chờ người dùng hiện tại xử lý
 * GET /api/workflows/me/tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowEngineService } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const result = await WorkflowEngineService.listMyTasks(actor, { page, pageSize });
    return NextResponse.json({ success: true, data: result.data, meta: { total: result.total, page, pageSize } });
  } catch (err) {
    console.error('[GET /api/workflows/me/tasks]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải danh sách việc cần xử lý' }, { status: 500 });
  }
}
