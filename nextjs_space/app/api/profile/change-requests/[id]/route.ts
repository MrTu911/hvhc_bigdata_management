/**
 * Self-service: chi tiết / sửa nháp / gửi duyệt / hủy 1 đề nghị cập nhật hồ sơ.
 * GET   /api/profile/change-requests/[id]
 * PATCH /api/profile/change-requests/[id]   body { action: 'submit'|'cancel'|'update', ... }
 *
 * Gate: VIEW_OWN_PROFILE_CHANGE / CREATE_PROFILE_CHANGE. Chỉ chủ đề nghị thao tác.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { profileChangeUpdateDraftSchema } from '@/lib/validators/profile-change.schema';
import {
  getRequest,
  updateDraft,
  submitRequest,
  cancelRequest,
  ProfileChangeError,
} from '@/lib/services/personnel/profile-change-request.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PROFILE_CHANGE.VIEW_OWN, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem đề nghị' }, { status: 403 });
  }

  const found = await getRequest(params.id);
  if (!found) return NextResponse.json({ success: false, error: 'Không tìm thấy đề nghị' }, { status: 404 });
  if (found.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem đề nghị này' }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: found });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PROFILE_CHANGE.CREATE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền thao tác đề nghị' }, { status: 403 });
  }

  let raw: { action?: string } & Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  try {
    if (raw.action === 'submit') {
      const result = await submitRequest(params.id, user.id);
      return NextResponse.json({ success: true, data: result });
    }
    if (raw.action === 'cancel') {
      const result = await cancelRequest(params.id, user.id);
      return NextResponse.json({ success: true, data: result });
    }
    // default: update draft
    const parsed = profileChangeUpdateDraftSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await updateDraft(params.id, parsed.data, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const status = err instanceof ProfileChangeError ? err.status : 500;
    return NextResponse.json({ success: false, error: (err as Error).message }, { status });
  }
}
