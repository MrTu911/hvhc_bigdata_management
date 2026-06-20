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
import { CadreExtendedProfileService } from '@/lib/services/personnel/cadre-profile-section.service';
import type { AuthUser } from '@/lib/rbac/types';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
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
 * PATCH đã ĐÓNG cho self-service: cập nhật hồ sơ cá nhân phải qua quy trình duyệt
 * 2 cấp (Chỉ huy đơn vị → Ban cán bộ/Quân lực). Dùng POST /api/profile/change-requests.
 * Giữ handler để trả thông báo rõ ràng thay vì 404, chống ghi thẳng vào CSDL.
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  return NextResponse.json(
    {
      success: false,
      code: 'REQUIRES_APPROVAL',
      error: 'Cập nhật hồ sơ cá nhân phải gửi đề nghị duyệt. Vui lòng dùng POST /api/profile/change-requests.',
    },
    { status: 409 },
  );
}
