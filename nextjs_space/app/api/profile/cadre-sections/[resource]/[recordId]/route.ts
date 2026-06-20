/**
 * Self-service cadre section record API — đã ĐÓNG ghi trực tiếp.
 *
 * Sửa/xóa bản ghi danh sách hồ sơ cá nhân phải qua quy trình duyệt 2 cấp
 * (Chỉ huy đơn vị → Ban cán bộ/Quân lực). Dùng POST /api/profile/change-requests
 * với item SECTION_UPDATE / SECTION_DELETE. Giữ handler để trả thông báo rõ ràng.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';

const REQUIRES_APPROVAL = {
  success: false,
  code: 'REQUIRES_APPROVAL',
  error: 'Thay đổi dữ liệu hồ sơ cá nhân phải gửi đề nghị duyệt. Vui lòng dùng POST /api/profile/change-requests.',
} as const;

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  return NextResponse.json(REQUIRES_APPROVAL, { status: 409 });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  return NextResponse.json(REQUIRES_APPROVAL, { status: 409 });
}
