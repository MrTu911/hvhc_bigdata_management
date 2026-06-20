/**
 * Self-service profile declaration lifecycle.
 * GET  /api/profile/declaration  — trạng thái khai báo + độ hoàn thiện của chính mình
 * POST /api/profile/declaration  — "Xác nhận hoàn tất khai báo" (khóa, chuyển sang 2 cấp)
 *
 * Gate: VIEW_MY_CADRE_PROFILE (read) / MANAGE_MY_PROFILE (confirm). Luôn theo user phiên.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import {
  getDeclarationState,
  confirmDeclaration,
  DeclarationError,
} from '@/lib/services/personnel/profile-declaration.service';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem trạng thái khai báo' }, { status: 403 });
  }

  try {
    const state = await getDeclarationState(user.id);
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    const status = error instanceof DeclarationError ? error.status : 500;
    return NextResponse.json({ success: false, error: (error as Error).message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xác nhận khai báo' }, { status: 403 });
  }

  try {
    const state = await confirmDeclaration(user.id, user.id);
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    const status = error instanceof DeclarationError ? error.status : 500;
    return NextResponse.json({ success: false, error: (error as Error).message }, { status });
  }
}
