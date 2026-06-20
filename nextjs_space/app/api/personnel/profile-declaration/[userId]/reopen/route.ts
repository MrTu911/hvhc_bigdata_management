/**
 * Reviewer: mở lại khai báo hồ sơ cho 1 cán bộ (un-lock) để khai lại.
 * POST /api/personnel/profile-declaration/[userId]/reopen  body { reason }
 *
 * Gate: APPROVE_ORGAN_PROFILE_CHANGE (Ban cán bộ/Quân lực tier-2 hoặc admin có grant).
 * Có kiểm phạm vi đơn vị ở service + audit kèm lý do.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { reopenDeclaration, DeclarationError } from '@/lib/services/personnel/profile-declaration.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  let raw: { reason?: string };
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { user, scope, response } = await requireScopedFunction(request, PROFILE_CHANGE.APPROVE_ORGAN);
  if (!user) return response!;

  try {
    const state = await reopenDeclaration(
      params.userId,
      toAuthUser(user),
      (scope || 'ACADEMY') as FunctionScope,
      raw.reason ?? '',
    );
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    const status = error instanceof DeclarationError ? error.status : 500;
    return NextResponse.json({ success: false, error: (error as Error).message }, { status });
  }
}
