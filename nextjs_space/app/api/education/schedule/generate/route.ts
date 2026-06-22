/**
 * POST /api/education/schedule/generate
 *
 * M10 – UC-54: Xem TRƯỚC kế hoạch xếp lịch huấn luyện bán tự động cho một học kỳ
 * (preview, KHÔNG ghi DB). Trả về số buổi dự kiến từng lớp + danh sách xung đột.
 *
 * Body: { termId: string, classSectionIds?: string[], sessionType?: SessionType }
 * RBAC: VIEW_SCHEDULE (chỉ đọc/tính toán). Bước ghi thật ở /schedule/commit (CREATE_SCHEDULE).
 */

import { NextRequest, NextResponse } from 'next/server';

import { EDUCATION } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { previewTermSchedule } from '@/lib/services/education/schedule-generator.service';

export const dynamic = 'force-dynamic';

const ALLOWED_SESSION_TYPES = ['THEORY', 'PRACTICE', 'LAB', 'SEMINAR', 'EXAM', 'REVIEW'];

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, EDUCATION.VIEW_SCHEDULE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const { termId, classSectionIds, sessionType } = body ?? {};

    if (!termId || typeof termId !== 'string') {
      return NextResponse.json({ success: false, data: null, error: 'Thiếu termId' }, { status: 400 });
    }
    if (classSectionIds !== undefined && !Array.isArray(classSectionIds)) {
      return NextResponse.json({ success: false, data: null, error: 'classSectionIds phải là mảng' }, { status: 400 });
    }
    if (sessionType !== undefined && !ALLOWED_SESSION_TYPES.includes(sessionType)) {
      return NextResponse.json({ success: false, data: null, error: 'sessionType không hợp lệ' }, { status: 400 });
    }

    const preview = await previewTermSchedule({ termId, classSectionIds, sessionType });
    return NextResponse.json({ success: true, data: preview, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi khi tính kế hoạch xếp lịch';
    const status = message.includes('Không tìm thấy học kỳ') ? 404 : 500;
    console.error('POST /api/education/schedule/generate error:', message);
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
