/**
 * GET /api/faculty/dashboard/workload-alerts
 * M07 – Tóm tắt cảnh báo tải giảng cho dashboard
 *
 * Khác với /api/faculty/workload/alerts (danh sách chi tiết có pagination),
 * endpoint này trả thống kê + recent alerts để hiển thị trên dashboard widget.
 *
 * Query params:
 *   unitId        – lọc theo đơn vị (optional)
 *   academicYear  – lọc theo năm học (optional)
 *   semesterCode  – HK1 | HK2 | HK3 (optional)
 *   recentLimit   – số cảnh báo gần nhất (mặc định 10, tối đa 50)
 *
 * RBAC: FACULTY.WORKLOAD_VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { getWorkloadAlertSummary } from '@/lib/services/dashboard/faculty-dashboard.service';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const authResult = await requireFunction(req, FACULTY.WORKLOAD_VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    // ── 2. Parse params ───────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId') ?? undefined;
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;
    const recentLimit = Math.min(50, Math.max(1, parseInt(searchParams.get('recentLimit') ?? '10', 10)));

    if (semesterCode && !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    // ── 3. Build alert summary ────────────────────────────────────────────────
    const summary = await getWorkloadAlertSummary({
      unitId,
      academicYear,
      semesterCode,
      recentLimit,
    });

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.WORKLOAD_VIEW,
      action: 'VIEW',
      resourceType: 'FACULTY_WORKLOAD_ALERT_SUMMARY',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[M07] GET /faculty/dashboard/workload-alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
