/**
 * PATCH  /api/personnel/[id]/profile/[resource]/[recordId]  — cập nhật 1 bản ghi
 * DELETE /api/personnel/[id]/profile/[resource]/[recordId]  — xóa mềm 1 bản ghi
 *
 * Gate: UPDATE. Quyền truy cập bản ghi xác định theo account User của bản ghi.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { CadreProfileSectionService, getCadreSection } from '@/lib/services/personnel/cadre-profile-section.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; resource: string; recordId: string } },
) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

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

  const result = await CadreProfileSectionService.update(
    authUser,
    (scope || 'SELF') as FunctionScope,
    params.recordId,
    section,
    body,
    canSensitive,
  );
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONNEL.UPDATE,
    action: 'UPDATE',
    resourceType: `CADRE_${section.model}`,
    resourceId: params.recordId,
    result: 'SUCCESS',
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; resource: string; recordId: string } },
) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
  if (!user) return response!;
  const authUser = toAuthUser(user);

  const result = await CadreProfileSectionService.softDelete(
    authUser,
    (scope || 'SELF') as FunctionScope,
    params.recordId,
    section,
  );
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONNEL.UPDATE,
    action: 'DELETE',
    resourceType: `CADRE_${section.model}`,
    resourceId: params.recordId,
    result: 'SUCCESS',
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true, data: result.data });
}
