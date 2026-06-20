/**
 * POST /api/profile/cadre-import/confirm — đã ĐÓNG ghi trực tiếp cho self-service.
 *
 * Nhập hồ sơ cá nhân (kể cả từ Excel) phải qua quy trình duyệt 2 cấp (Chỉ huy đơn
 * vị → Ban cán bộ/Quân lực). Bước /analyze (xem trước) vẫn dùng được; sau khi xem
 * trước, tạo đề nghị qua POST /api/profile/change-requests (kèm minh chứng).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  return NextResponse.json(
    {
      success: false,
      code: 'REQUIRES_APPROVAL',
      error: 'Nhập hồ sơ cá nhân phải gửi đề nghị duyệt. Vui lòng dùng POST /api/profile/change-requests.',
    },
    { status: 409 },
  );
}
