/**
 * GET /api/faculty/dashboard/eis-ranking
 * M07 – Xếp hạng EIS giảng viên theo kỳ
 *
 * Trả về top N và bottom N giảng viên theo tổng điểm EIS trong một kỳ học.
 * Phục vụ dashboard quản lý và thi đua – KHÔNG thay thế quyết định tổ chức cán bộ.
 *
 * Query params:
 *   academicYear  – bắt buộc, VD: "2025-2026"
 *   semesterCode  – bắt buộc, HK1 | HK2 | HK3
 *   unitId        – lọc theo đơn vị (optional)
 *   topN          – số GV lấy top/bottom (mặc định 10, tối đa 50)
 *
 * RBAC: FACULTY.VIEW_STATS
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { getEISRanking } from '@/lib/services/dashboard/faculty-dashboard.service';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const authResult = await requireFunction(req, FACULTY.VIEW_STATS);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    // ── 2. Validate params ────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const semesterCode = searchParams.get('semesterCode');
    const unitId = searchParams.get('unitId') ?? undefined;
    const topN = Math.min(50, Math.max(1, parseInt(searchParams.get('topN') ?? '10', 10)));

    if (!academicYear) {
      return NextResponse.json(
        { success: false, error: 'Thiếu academicYear (VD: "2025-2026")' },
        { status: 400 },
      );
    }
    if (!semesterCode || !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    // ── 3. Get ranking ────────────────────────────────────────────────────────
    const ranking = await getEISRanking({ academicYear, semesterCode, unitId, topN });

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.VIEW_STATS,
      action: 'VIEW',
      resourceType: 'FACULTY_EIS_RANKING',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: ranking });
  } catch (error: any) {
    console.error('[M07] GET /faculty/dashboard/eis-ranking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
