/**
 * /api/personal/request-update — DEPRECATED.
 *
 * Trước đây POST tạo `PersonalUpdateRequest` (1 cấp "admin M02") cho trường nhạy cảm.
 * Luồng này TRÙNG bản chất với ProfileChangeRequest (duyệt 2 cấp) và KHÔNG có handler
 * duyệt/áp dụng (ngõ cụt). Đã hợp nhất về một đường duy nhất:
 *   - Sửa trường mô tả nhân thân  → ProfileChangeRequest (POST /api/profile/change-requests)
 *   - Trường quyết định chỉ huy (cấp bậc/đơn vị/chức vụ) → quy trình điều động/phong quân hàm
 * POST nay trả 410 Gone. GET vẫn giữ để xem lịch sử yêu cầu cũ (read-only).
 * Xem docs/design/personal-space-data-flow.md.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Chức năng này đã ngừng dùng. Vui lòng gửi đề nghị cập nhật hồ sơ tại "Đề nghị cập nhật hồ sơ" (duyệt 2 cấp).',
      redirect: '/dashboard/personal/my-profile-changes',
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.REQUEST_INFO_UPDATE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem yêu cầu cập nhật' }, { status: 403 });
  }

  try {
    const requests = await prisma.personalUpdateRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fieldName: true,
        currentValue: true,
        requestedValue: true,
        status: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/request-update]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
