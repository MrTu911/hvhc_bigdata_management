/**
 * GET /api/profile/cadre-import/template — tải file Excel mẫu nhập hồ sơ 99 trường.
 *
 * ?prefill=1 (mặc định): điền sẵn trường đơn hiện có của chính cán bộ để sửa & nhập lại.
 * Gate: MANAGE_MY_PROFILE. Luôn SELF scope (user.id). Trường nhạy cảm không prefill.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { CadreExtendedProfileService } from '@/lib/services/personnel/cadre-profile-section.service';
import { buildImportTemplateWorkbook } from '@/lib/services/personnel/cadre-import.service';
import type { AuthUser } from '@/lib/rbac/types';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền tải mẫu nhập hồ sơ' }, { status: 403 });
  }

  const prefill = request.nextUrl.searchParams.get('prefill') !== '0';
  let extended: Record<string, unknown> = {};
  if (prefill) {
    const current = await CadreExtendedProfileService.get(toAuthUser(user), 'SELF', user.id, false);
    if (current.success) extended = current.data;
  }

  const buffer = await buildImportTemplateWorkbook({ extended });
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mau_ho_so_can_bo_99_truong.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
