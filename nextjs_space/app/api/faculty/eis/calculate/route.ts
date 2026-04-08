/**
 * POST /api/faculty/eis/calculate
 * M07 – Batch trigger tính EIS cho toàn bộ giảng viên active trong một học kỳ.
 *
 * Body: { academicYear: string, semesterCode: string }
 *
 * RBAC: FACULTY.EIS_MANAGE – fail-closed: 403 nếu thiếu quyền.
 * Chỉ dành cho quản trị đào tạo / ban giám đốc.
 *
 * Lưu ý: Batch này chạy sequential để tránh DB contention.
 * Với 50 giảng viên, thường hoàn tất trong vài giây.
 * Nếu cần async (>100 GV), chuyển sang queue / background job.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { calculateEISBatch } from '@/lib/services/faculty/faculty-eis.service';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // fail-closed: trả 403 ngay nếu không có EIS_MANAGE
    const authResult = await requireFunction(req, FACULTY.EIS_MANAGE);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const body = await req.json().catch(() => ({}));
    const { academicYear, semesterCode } = body as {
      academicYear?: string;
      semesterCode?: string;
    };

    if (!academicYear || !semesterCode) {
      return NextResponse.json(
        { success: false, error: 'academicYear và semesterCode là bắt buộc' },
        { status: 400 },
      );
    }

    // Validate format đơn giản
    if (!/^\d{4}-\d{4}$/.test(academicYear)) {
      return NextResponse.json(
        { success: false, error: 'academicYear phải theo định dạng YYYY-YYYY (VD: 2025-2026)' },
        { status: 400 },
      );
    }
    if (!['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là HK1, HK2 hoặc HK3' },
        { status: 400 },
      );
    }

    const summary = await calculateEISBatch(academicYear, semesterCode, user.id);

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.EIS_MANAGE,
      action: 'CREATE',
      resourceType: 'FACULTY_EIS_BATCH',
      newValue: { academicYear, semesterCode, ...summary },
      result: summary.failed.length === 0 ? 'SUCCESS' : 'PARTIAL',
    });

    return NextResponse.json({
      success: true,
      data: {
        academicYear,
        semesterCode,
        ...summary,
        // Chỉ trả tối đa 20 lỗi để tránh response quá lớn
        failed: summary.failed.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('[M07] POST /faculty/eis/calculate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
