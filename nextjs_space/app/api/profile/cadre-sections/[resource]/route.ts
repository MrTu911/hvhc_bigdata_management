/**
 * Self-service cadre section list API
 * GET  /api/profile/cadre-sections/[resource]  — list own records
 * POST /api/profile/cadre-sections/[resource]  — create record
 *
 * Gate: VIEW_MY_CADRE_PROFILE (read) / MANAGE_MY_PROFILE (write)
 * Always scoped to current session user.
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

export async function GET(request: NextRequest, { params }: { params: { resource: string } }) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  const authUser = toAuthUser(user);
  const result = await CadreProfileSectionService.list(authUser, 'SELF', user.id, section, false);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST — thêm bản ghi danh sách HSCB.
 * Chỉ cho ghi TRỰC TIẾP khi cán bộ còn ở giai đoạn khai báo lần đầu
 * (User.profileDeclaredAt = null). Sau khi đã chốt khai báo → 409, phải gửi đề nghị
 * 2 cấp (POST /api/profile/change-requests, item SECTION_CREATE).
 */
export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
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
  const result = await CadreProfileSectionService.create(authUser, 'SELF', user.id, section, body, true);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DECLARE_SECTION_CREATE',
    resourceType: 'CADRE_SECTION',
    resourceId: (result.data as { id?: string } | null)?.id,
    newValue: JSON.stringify({ section: section.slug }),
    result: 'SUCCESS',
  });
  return NextResponse.json({ success: true, data: result.data });
}
