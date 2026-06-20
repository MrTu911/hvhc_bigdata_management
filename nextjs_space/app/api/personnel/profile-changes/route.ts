/**
 * Reviewer inbox: đề nghị cập nhật hồ sơ chờ duyệt theo phân cấp.
 * GET /api/personnel/profile-changes?tier=1|2&status=&keyword=&page=&limit=
 *
 * tier=1 → chờ Chỉ huy đơn vị (gate VIEW_UNIT_PROFILE_CHANGES, scope đơn vị)
 * tier=2 → chờ Ban cán bộ/Quân lực (gate VIEW_ORGAN_PROFILE_CHANGES)
 * Kèm KPI thống kê theo trạng thái trong phạm vi người duyệt.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { listForReviewer, getReviewerStats } from '@/lib/services/personnel/profile-change-request.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') === '2' ? 2 : 1;
  const code = tier === 1 ? PROFILE_CHANGE.VIEW_UNIT : PROFILE_CHANGE.VIEW_ORGAN;

  const { user, scope, response } = await requireScopedFunction(request, code);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const fnScope = (scope || 'UNIT') as FunctionScope;

  const result = await listForReviewer(authUser, fnScope, tier as 1 | 2, {
    keyword: searchParams.get('keyword') ?? undefined,
    page: Number(searchParams.get('page') ?? '1'),
    limit: Number(searchParams.get('limit') ?? '20'),
  });
  const stats = await getReviewerStats(authUser, fnScope);

  return NextResponse.json({
    success: true,
    data: result.data,
    meta: { total: result.total, page: result.page, limit: result.limit, tier, stats },
  });
}
