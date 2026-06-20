/**
 * POST /api/personnel/[id]/cadre-import/confirm — ghi dữ liệu đã xem trước vào hồ sơ 1 cán bộ.
 *
 * [id] = User.id hoặc Personnel.id. Gate: PERSONNEL.UPDATE (scope enforced ở service).
 * Body: { extended?, sections?, mode?: 'append' | 'replace' }. Trường nhạy cảm cần VIEW_SENSITIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { applyCadreImport, type CadreImportPayload } from '@/lib/services/personnel/cadre-import.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const effectiveScope = (scope || 'SELF') as FunctionScope;
  const canSensitive = (await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {})).allowed;

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
  const result = await applyCadreImport(authUser, effectiveScope, params.id, body, canSensitive, mode);

  const totalCreated = result.sections.reduce((sum, s) => sum + s.created, 0);
  const totalDeleted = result.sections.reduce((sum, s) => sum + s.deleted, 0);
  await logAudit({
    userId: user.id,
    functionCode: PERSONNEL.UPDATE,
    action: 'IMPORT',
    resourceType: 'CADRE_PROFILE',
    resourceId: params.id,
    result: result.errors.length > 0 ? 'FAIL' : 'SUCCESS',
    metadata: {
      mode,
      extendedUpdated: result.extendedUpdated,
      sectionsCreated: totalCreated,
      sectionsDeleted: totalDeleted,
      errorCount: result.errors.length,
    },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
    endpoint: `/api/personnel/${params.id}/cadre-import/confirm`,
    httpMethod: 'POST',
  });

  return NextResponse.json({ success: true, data: result });
}
