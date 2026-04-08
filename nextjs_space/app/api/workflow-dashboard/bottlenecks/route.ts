/**
 * M13 – Bottleneck Steps Dashboard
 * GET /api/workflow-dashboard/bottlenecks
 *
 * Top N bước xử lý hay bị EXPIRED nhất trong phạm vi scope.
 * Query params:
 *  - topN: số bước trả về (default 10, max 20)
 *  - scope: SELF | UNIT | DEPARTMENT | ACADEMY
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowDashboardService } from '@/lib/services/workflow/workflow-dashboard.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FunctionScope } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.DASHBOARD);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const topN = Math.min(20, Math.max(1, parseInt(searchParams.get('topN') ?? '10')));
  const scopeParam = searchParams.get('scope') as FunctionScope | null;
  const scope: FunctionScope = scopeParam ?? auth.authResult?.scope ?? 'UNIT';

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const bottlenecks = await WorkflowDashboardService.getBottlenecks(actor, scope, topN);

    return NextResponse.json({
      success: true,
      data: {
        bottlenecks,
        meta: {
          scope,
          topN,
          note: 'avgDurationHours available in Phase 2 with summary tables',
        },
      },
    });
  } catch (err) {
    console.error('[GET /api/workflow-dashboard/bottlenecks]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải bottleneck data' }, { status: 500 });
  }
}
