/**
 * GET /api/personnel/[id]/cadre-import/template — tải mẫu Excel nhập hồ sơ 99 trường cho 1 cán bộ.
 *
 * [id] = User.id hoặc Personnel.id. Gate: PERSONNEL.VIEW_DETAIL (scope enforced).
 * ?prefill=1 (mặc định): điền sẵn dữ liệu của cán bộ đó. Trường nhạy cảm chỉ điền khi VIEW_SENSITIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { CadreExtendedProfileService } from '@/lib/services/personnel/cadre-profile-section.service';
import { buildImportTemplateWorkbook } from '@/lib/services/personnel/cadre-import.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const effectiveScope = (scope || 'SELF') as FunctionScope;
  const canSensitive = (await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {})).allowed;

  const prefill = request.nextUrl.searchParams.get('prefill') !== '0';
  let extended: Record<string, unknown> = {};
  if (prefill) {
    const current = await CadreExtendedProfileService.get(authUser, effectiveScope, params.id, canSensitive);
    if (!current.success) {
      return NextResponse.json({ success: false, error: current.error }, { status: current.status });
    }
    extended = current.data;
  }

  const buffer = await buildImportTemplateWorkbook({ extended }, canSensitive);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mau_ho_so_can_bo_99_truong.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
