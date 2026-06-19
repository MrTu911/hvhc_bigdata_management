/**
 * GET  /api/personnel/[id]/profile/[resource]      — danh sách bản ghi của 1 nhóm
 * POST /api/personnel/[id]/profile/[resource]      — thêm bản ghi
 *
 * [id] = User.id (trang chi tiết) hoặc Personnel.id. [resource] = slug trong
 * lib/constants/cadre-profile-sections.ts (assets, foreign-trips, honors, ...).
 * Gate: VIEW_DETAIL (đọc) / UPDATE (ghi). Trường nhạy cảm cần VIEW_SENSITIVE.
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

export async function GET(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
  const section = getCadreSection(params.resource);
  if (!section) return NextResponse.json({ success: false, error: 'Nhóm dữ liệu không hợp lệ' }, { status: 404 });

  const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL);
  if (!user) return response!;
  const authUser = toAuthUser(user);
  const canSensitive = (await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {})).allowed;

  const result = await CadreProfileSectionService.list(
    authUser,
    (scope || 'SELF') as FunctionScope,
    params.id,
    section,
    canSensitive,
  );
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, data: result.data, meta: { includeSensitive: canSensitive } });
}

export async function POST(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
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

  const result = await CadreProfileSectionService.create(
    authUser,
    (scope || 'SELF') as FunctionScope,
    params.id,
    section,
    body,
    canSensitive,
  );
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  await logAudit({
    userId: user.id,
    functionCode: PERSONNEL.UPDATE,
    action: 'CREATE',
    resourceType: `CADRE_${section.model}`,
    resourceId: (result.data as { id?: string })?.id ?? params.id,
    result: 'SUCCESS',
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
