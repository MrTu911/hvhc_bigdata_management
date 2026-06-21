/**
 * GET /api/personal/overview
 * Tổng quan "Trung tâm cá nhân" cho người dùng phiên (scope SELF).
 *
 * Chỉ yêu cầu đăng nhập; từng phần dữ liệu được lọc theo function-code bên trong service.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { PersonalOverviewService } from '@/lib/services/personnel/personal-overview.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  try {
    const data = await PersonalOverviewService.getOverview(user);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error('[GET /api/personal/overview]', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi khi tải tổng quan cá nhân' },
      { status: 500 },
    );
  }
}
