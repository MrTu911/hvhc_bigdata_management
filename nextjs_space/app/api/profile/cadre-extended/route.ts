/**
 * Self-service cadre extended profile API
 * GET  /api/profile/cadre-extended  — user reads own 99-field profile
 * PATCH /api/profile/cadre-extended — user updates own 99-field profile
 *
 * Gate: VIEW_MY_CADRE_PROFILE (read) / MANAGE_MY_PROFILE (write)
 * Always scoped to the current session user — no [id] param.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { CadreExtendedProfileService } from '@/lib/services/personnel/cadre-profile-section.service';
import { assertDeclaring, DeclarationError } from '@/lib/services/personnel/profile-declaration.service';
import { DECLARATION_LOCKED_EXTENDED_FIELDS } from '@/lib/constants/profile-declaration';
import type { AuthUser } from '@/lib/rbac/types';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

/** DeclarationError → response; giữ code REQUIRES_APPROVAL ở 409 cho UI cũ. */
function declarationErrorResponse(error: unknown): NextResponse {
  if (error instanceof DeclarationError) {
    return NextResponse.json(
      { success: false, code: error.status === 409 ? 'REQUIRES_APPROVAL' : undefined, error: error.message },
      { status: error.status },
    );
  }
  throw error;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  const authUser = toAuthUser(user);
  const result = await CadreExtendedProfileService.get(authUser, 'SELF', user.id, false);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PATCH — cập nhật trường mở rộng HSCB.
 * Chỉ cho ghi TRỰC TIẾP khi cán bộ còn ở giai đoạn khai báo lần đầu
 * (User.profileDeclaredAt = null). Trường do chỉ huy/M02 quản lý
 * (DECLARATION_LOCKED_EXTENDED_FIELDS) bị loại. Sau khi đã chốt khai báo → 409.
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền cập nhật hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  try {
    await assertDeclaring(user.id);
  } catch (error) {
    return declarationErrorResponse(error);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  // Loại trường do chỉ huy/M02 quản lý — không cho tự khai trực tiếp kể cả lúc khai báo.
  const skippedFields: string[] = [];
  for (const field of DECLARATION_LOCKED_EXTENDED_FIELDS) {
    if (field in body) {
      delete body[field];
      skippedFields.push(field);
    }
  }

  const authUser = toAuthUser(user);
  const result = await CadreExtendedProfileService.update(authUser, 'SELF', user.id, body, true);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DECLARE_EXTENDED_UPDATE',
    resourceType: 'CADRE_EXTENDED',
    resourceId: user.id,
    newValue: JSON.stringify({ fields: Object.keys(body), skippedFields }),
    result: 'SUCCESS',
  });
  return NextResponse.json({
    success: true,
    data: result.data,
    ...(skippedFields.length ? { meta: { skippedFields } } : {}),
  });
}
