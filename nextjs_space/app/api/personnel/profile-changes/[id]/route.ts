/**
 * Reviewer: chi tiết 1 đề nghị cập nhật hồ sơ (diff + minh chứng).
 * GET /api/personnel/profile-changes/[id]
 *
 * Cho phép người có VIEW_ORGAN (tier-2) hoặc VIEW_UNIT (tier-1); kiểm scope theo
 * đơn vị của cán bộ ở service.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { getRequestForReviewer, ProfileChangeError } from '@/lib/services/personnel/profile-change-request.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Ưu tiên VIEW_ORGAN (phạm vi rộng hơn); fallback VIEW_UNIT cho chỉ huy đơn vị.
  let auth = await requireScopedFunction(request, PROFILE_CHANGE.VIEW_ORGAN);
  if (!auth.user) auth = await requireScopedFunction(request, PROFILE_CHANGE.VIEW_UNIT);
  if (!auth.user) return auth.response!;

  try {
    const data = await getRequestForReviewer(
      toAuthUser(auth.user),
      (auth.scope || 'UNIT') as FunctionScope,
      params.id,
    );
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const status = err instanceof ProfileChangeError ? err.status : 500;
    return NextResponse.json({ success: false, error: (err as Error).message }, { status });
  }
}
