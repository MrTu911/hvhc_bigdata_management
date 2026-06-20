/**
 * Self-service cadre section record API.
 *
 * Sửa/xóa bản ghi danh sách HSCB chỉ cho ghi TRỰC TIẾP khi cán bộ còn ở giai đoạn
 * khai báo lần đầu (User.profileDeclaredAt = null). Sau khi đã chốt khai báo → 409,
 * phải gửi đề nghị 2 cấp (POST /api/profile/change-requests, item SECTION_UPDATE/DELETE).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { CadreProfileSectionService, getCadreSection } from '@/lib/services/personnel/cadre-profile-section.service';
import { assertDeclaring, DeclarationError } from '@/lib/services/personnel/profile-declaration.service';
import type { AuthUser } from '@/lib/rbac/types';

type Params = { params: { resource: string; recordId: string } };

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

export async function PATCH(request: NextRequest, { params }: Params) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

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

  const authUser = toAuthUser(user);
  const result = await CadreProfileSectionService.update(authUser, 'SELF', params.recordId, section, body, true);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DECLARE_SECTION_UPDATE',
    resourceType: 'CADRE_SECTION',
    resourceId: params.recordId,
    newValue: JSON.stringify({ section: section.slug }),
    result: 'SUCCESS',
  });
  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

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

  const authUser = toAuthUser(user);
  const result = await CadreProfileSectionService.softDelete(authUser, 'SELF', params.recordId, section);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DECLARE_SECTION_DELETE',
    resourceType: 'CADRE_SECTION',
    resourceId: params.recordId,
    newValue: JSON.stringify({ section: section.slug }),
    result: 'SUCCESS',
  });
  return NextResponse.json({ success: true, data: result.data });
}
