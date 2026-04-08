/**
 * M10 – UC-54: Kiểm tra xung đột lịch học phần
 * POST /api/education/class-sections/conflict-check
 *
 * Gọi trước khi tạo hoặc cập nhật lớp học phần có lịch.
 * Không ghi dữ liệu, chỉ đọc và trả kết quả kiểm tra.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { checkConflicts, ConflictCheckInput } from '@/lib/services/education/conflict-check.service';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;

    const body = await req.json();
    const { termId, dayOfWeek, startPeriod, endPeriod, facultyId, roomId, excludeSectionId } = body;

    // Validate inputs
    if (!termId || dayOfWeek === undefined || startPeriod === undefined || endPeriod === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'termId, dayOfWeek, startPeriod, endPeriod là bắt buộc',
        },
        { status: 400 }
      );
    }

    if (
      typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 7 ||
      typeof startPeriod !== 'number' || startPeriod < 1 ||
      typeof endPeriod !== 'number' || endPeriod < 1
    ) {
      return NextResponse.json(
        { success: false, error: 'dayOfWeek (0–7), startPeriod (≥1), endPeriod (≥1) phải là số hợp lệ' },
        { status: 400 }
      );
    }

    const input: ConflictCheckInput = {
      termId,
      dayOfWeek,
      startPeriod,
      endPeriod,
      facultyId: facultyId ?? null,
      roomId: roomId ?? null,
      excludeSectionId: excludeSectionId ?? undefined,
    };

    const result = await checkConflicts(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('POST /api/education/class-sections/conflict-check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check conflicts' }, { status: 500 });
  }
}
