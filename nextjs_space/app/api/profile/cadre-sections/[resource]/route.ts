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
import { CadreProfileSectionService, getCadreSection } from '@/lib/services/personnel/cadre-profile-section.service';
import type { AuthUser } from '@/lib/rbac/types';

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const authUser = toAuthUser(user);
  const result = await CadreProfileSectionService.create(authUser, 'SELF', user.id, section, body, false);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
