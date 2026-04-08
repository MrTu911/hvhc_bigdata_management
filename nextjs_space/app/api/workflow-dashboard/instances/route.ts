/**
 * M13 – Danh sách workflow instances (manager/monitor view)
 * GET /api/workflow-dashboard/instances
 *
 * Query params:
 *  - page, pageSize
 *  - keyword: tìm theo title
 *  - status: WorkflowInstanceStatus filter
 *  - entityType
 *
 * Scope:
 *  - WF.VIEW_ALL_INSTANCES hoặc WF.MONITOR → xem tất cả instances trong scope
 *  - Scope filter: lấy unit ids của actor, rồi filter theo initiator's unitId
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { FunctionScope } from '@prisma/client';
import prisma from '@/lib/db';
import { WorkflowInstanceStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set(Object.values(WorkflowInstanceStatus));

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.VIEW_ALL_INSTANCES);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  const keyword  = searchParams.get('keyword')?.trim() ?? '';
  const statusParam = searchParams.get('status') ?? '';
  const entityType  = searchParams.get('entityType')?.trim() ?? '';

  const statusFilter = statusParam && VALID_STATUSES.has(statusParam as WorkflowInstanceStatus)
    ? (statusParam as WorkflowInstanceStatus)
    : undefined;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    // Resolve accessible unit IDs — mặc định DEPARTMENT scope cho manager view
    const scopeParam = (searchParams.get('scope') ?? 'DEPARTMENT') as FunctionScope;
    const validScopes: FunctionScope[] = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];
    const resolvedScope: FunctionScope = validScopes.includes(scopeParam) ? scopeParam : 'DEPARTMENT';

    const unitIds = await getAccessibleUnitIds(actor, resolvedScope);

    // Find users in those units
    const usersInScope = unitIds.length > 0
      ? await prisma.user.findMany({
          where: { unitId: { in: unitIds } },
          select: { id: true },
        })
      : [{ id: actor.id }]; // fallback: chỉ xem của mình
    const userIdSet = usersInScope.map((u) => u.id);

    // Build where clause
    const where: Parameters<typeof prisma.workflowInstance.findMany>[0]['where'] = {
      initiatorId: { in: userIdSet },
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(entityType ? { entityType } : {}),
      ...(keyword ? { title: { contains: keyword, mode: 'insensitive' } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.workflowInstance.count({ where }),
      prisma.workflowInstance.findMany({
        where,
        select: {
          id: true,
          title: true,
          entityType: true,
          status: true,
          currentStepCode: true,
          priority: true,
          initiatorId: true,
          currentAssigneeId: true,
          startedAt: true,
          dueAt: true,
          completedAt: true,
        },
        orderBy: [
          { priority: 'desc' },
          { startedAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize },
    });
  } catch (err) {
    console.error('[GET /api/workflow-dashboard/instances]', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách quy trình' },
      { status: 500 }
    );
  }
}
