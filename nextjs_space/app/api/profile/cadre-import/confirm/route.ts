/**
 * POST /api/profile/cadre-import/confirm — ghi dữ liệu đã xem trước vào hồ sơ.
 *
 * Body JSON: { extended?: {...}, sections?: { slug: [...] } } (lấy từ kết quả analyze).
 * Gate: MANAGE_MY_PROFILE. SELF scope. canSensitive=false (tự phục vụ không ghi trường nhạy cảm).
 * Field allow-list + coercion + scope nằm ở write-path service → body tự do vẫn an toàn.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { applyCadreImport, type CadreImportPayload } from '@/lib/services/personnel/cadre-import.service';
import type { AuthUser } from '@/lib/rbac/types';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền nhập hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  let body: CadreImportPayload;
  try {
    body = (await request.json()) as CadreImportPayload;
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const hasExtended = body.extended && Object.keys(body.extended).length > 0;
  const hasSections = body.sections && Object.values(body.sections).some((r) => Array.isArray(r) && r.length > 0);
  if (!hasExtended && !hasSections) {
    return NextResponse.json({ success: false, error: 'Không có dữ liệu để nhập' }, { status: 400 });
  }

  const mode = body.mode === 'replace' ? 'replace' : 'append';
  const result = await applyCadreImport(toAuthUser(user), 'SELF', user.id, body, false, mode);

  const totalCreated = result.sections.reduce((sum, s) => sum + s.created, 0);
  const totalDeleted = result.sections.reduce((sum, s) => sum + s.deleted, 0);
  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'IMPORT',
    resourceType: 'CADRE_PROFILE',
    resourceId: user.id,
    result: result.errors.length > 0 ? 'FAIL' : 'SUCCESS',
    metadata: {
      mode,
      extendedUpdated: result.extendedUpdated,
      sectionsCreated: totalCreated,
      sectionsDeleted: totalDeleted,
      errorCount: result.errors.length,
    },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
    endpoint: '/api/profile/cadre-import/confirm',
    httpMethod: 'POST',
  });

  return NextResponse.json({ success: true, data: result });
}
