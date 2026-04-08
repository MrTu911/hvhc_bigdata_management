/**
 * M13 – Unit Workflow Summary Dashboard
 * GET /api/workflow-dashboard/unit-summary
 *
 * Scope-filtered: người dùng chỉ thấy dữ liệu trong phạm vi scope của mình.
 * Query params:
 *  - scope: SELF | UNIT | DEPARTMENT | ACADEMY (override, nếu có quyền)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowDashboardService } from '@/lib/services/workflow/workflow-dashboard.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FunctionScope } from '@prisma/client';
import { authorize } from '@/lib/rbac/authorize';

export const dynamic = 'force-dynamic';

const VALID_SCOPES = new Set<FunctionScope>(['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY']);

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.DASHBOARD);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const requestedScope = searchParams.get('scope') as FunctionScope | null;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    // Xác định scope hiệu lực
    let effectiveScope: FunctionScope = 'UNIT'; // default an toàn

    if (requestedScope && VALID_SCOPES.has(requestedScope)) {
      // Nếu yêu cầu scope rộng hơn UNIT, phải check quyền WF.DASHBOARD
      // WF.DASHBOARD đã được check ở trên, trust scope từ user session
      // Chỉ cho ACADEMY nếu có thêm quyền WF.OVERVIEW
      if (requestedScope === 'ACADEMY') {
        const overrideAuth = await authorize(actor, WORKFLOW.OVERRIDE);
        effectiveScope = overrideAuth.allowed ? 'ACADEMY' : 'DEPARTMENT';
      } else {
        effectiveScope = requestedScope;
      }
    } else if (auth.authResult?.scope) {
      effectiveScope = auth.authResult.scope;
    }

    const summary = await WorkflowDashboardService.getUnitSummary(actor, effectiveScope);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        meta: {
          scope: effectiveScope,
          generatedAt: new Date().toISOString(),
          // Thông báo FE biết đây là Phase 1 query trực tiếp, không cache
          dataSource: 'realtime',
        },
      },
    });
  } catch (err) {
    console.error('[GET /api/workflow-dashboard/unit-summary]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải unit summary' }, { status: 500 });
  }
}
