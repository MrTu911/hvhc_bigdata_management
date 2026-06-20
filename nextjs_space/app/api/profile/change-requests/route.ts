/**
 * Self-service: Đề nghị cập nhật hồ sơ cán bộ (tạo + xem của tôi).
 * GET  /api/profile/change-requests       — danh sách đề nghị của tôi
 * POST /api/profile/change-requests       — tạo đề nghị (lưu nháp hoặc gửi duyệt)
 *
 * Gate: VIEW_OWN_PROFILE_CHANGE (đọc) / CREATE_PROFILE_CHANGE (ghi). Scope SELF.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { profileChangeCreateSchema } from '@/lib/validators/profile-change.schema';
import { createRequest, listMyRequests, ProfileChangeError } from '@/lib/services/personnel/profile-change-request.service';
import type { ProfileChangeRequestStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PROFILE_CHANGE.VIEW_OWN, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem đề nghị cập nhật' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') as ProfileChangeRequestStatus | null;
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '20');

  const result = await listMyRequests(user.id, {
    status: statusParam ?? undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    page,
    limit,
  });
  return NextResponse.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PROFILE_CHANGE.CREATE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền tạo đề nghị cập nhật' }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }
  const parsed = profileChangeCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // SELF: chỉ cho phép đề nghị cho chính mình (bỏ qua targetUserId nếu khác).
  try {
    const created = await createRequest(
      {
        ownerUserId: user.id,
        title: parsed.data.title,
        reason: parsed.data.reason,
        items: parsed.data.items,
        submit: parsed.data.submit,
      },
      user.id,
    );
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    const status = err instanceof ProfileChangeError ? err.status : 500;
    return NextResponse.json({ success: false, error: (err as Error).message }, { status });
  }
}
