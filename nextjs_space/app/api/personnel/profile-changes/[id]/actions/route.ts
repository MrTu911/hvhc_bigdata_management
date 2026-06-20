/**
 * Reviewer: duyệt/trả lại/từ chối 1 đề nghị cập nhật hồ sơ theo cấp.
 * POST /api/personnel/profile-changes/[id]/actions  body { tier:1|2, action, note? }
 *
 * tier=1 → gate APPROVE_UNIT_PROFILE_CHANGE (Chỉ huy đơn vị)
 * tier=2 → gate APPROVE_ORGAN_PROFILE_CHANGE (Ban cán bộ/Quân lực) → commit vào CSDL
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { profileChangeActionSchema } from '@/lib/validators/profile-change.schema';
import { actOnRequest, ProfileChangeError } from '@/lib/services/personnel/profile-change-request.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }
  const parsed = profileChangeActionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { tier, action, note } = parsed.data;

  const code = tier === 1 ? PROFILE_CHANGE.APPROVE_UNIT : PROFILE_CHANGE.APPROVE_ORGAN;
  const { user, scope, response } = await requireScopedFunction(request, code);
  if (!user) return response!;

  try {
    const result = await actOnRequest({
      requestId: params.id,
      tier,
      action,
      note,
      actor: toAuthUser(user),
      scope: (scope || 'UNIT') as FunctionScope,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const status = err instanceof ProfileChangeError ? err.status : 500;
    return NextResponse.json({ success: false, error: (err as Error).message }, { status });
  }
}
