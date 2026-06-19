/**
 * GET   /api/personnel/[id]/profile-extended  — đọc trường scalar mở rộng (mẫu 99 trường)
 * PATCH /api/personnel/[id]/profile-extended  — cập nhật trường scalar trên User + Đoàn (1:1)
 *
 * [id] = User.id hoặc Personnel.id. Gate: VIEW_DETAIL (đọc) / UPDATE (ghi).
 * Trường nhạy cảm (lương) cần VIEW_SENSITIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { CadreExtendedProfileService } from '@/lib/services/personnel/cadre-profile-section.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const canSensitive = (await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {})).allowed;

  const result = await CadreExtendedProfileService.get(authUser, (scope || 'SELF') as FunctionScope, params.id, canSensitive);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, data: result.data, meta: { includeSensitive: canSensitive } });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const canSensitive = (await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {})).allowed;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const result = await CadreExtendedProfileService.update(
    authUser,
    (scope || 'SELF') as FunctionScope,
    params.id,
    body,
    canSensitive,
  );
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONNEL.UPDATE,
    action: 'UPDATE',
    resourceType: 'CADRE_PROFILE_EXTENDED',
    resourceId: params.id,
    result: 'SUCCESS',
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true, data: result.data });
}
