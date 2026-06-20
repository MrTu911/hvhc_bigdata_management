/**
 * Reviewer: xem trạng thái khai báo hồ sơ của 1 cán bộ.
 * GET /api/personnel/profile-declaration/[userId]  (userId = User.id hoặc Personnel.id)
 *
 * Gate: VIEW_ORGAN_PROFILE_CHANGES (Ban cán bộ/Quân lực hoặc admin có grant).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { getDeclarationStateForReviewer, DeclarationError } from '@/lib/services/personnel/profile-declaration.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, PROFILE_CHANGE.VIEW_ORGAN);
  if (!user) return response!;

  try {
    const state = await getDeclarationStateForReviewer(
      params.userId,
      toAuthUser(user),
      (scope || 'ACADEMY') as FunctionScope,
    );
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    const status = error instanceof DeclarationError ? error.status : 500;
    return NextResponse.json({ success: false, error: (error as Error).message }, { status });
  }
}
