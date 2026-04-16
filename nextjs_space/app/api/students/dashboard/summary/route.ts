/**
 * GET /api/students/dashboard/summary
 * M07 – Dashboard tổng hợp học viên
 *
 * Query params:
 *   unitId        – lọc theo đơn vị/khoa quản lý (optional)
 *   khoaHoc       – lọc theo khóa học (optional)
 *   nganh         – lọc theo ngành (optional)
 *   academicYear  – dùng cho conduct avg (optional)
 *   semesterCode  – HK1 | HK2 | HK3 (optional)
 *
 * RBAC: STUDENT.DASHBOARD_VIEW
 *
 * Phase 2: thêm export hook → POST /api/m07/reports/export với template M18
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { buildStudentDashboardSummary } from '@/lib/services/dashboard/student-dashboard.service';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const authResult = await requireFunction(req, STUDENT.DASHBOARD_VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    // ── 2. Parse params ───────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId') ?? undefined;
    const khoaHoc = searchParams.get('khoaHoc') ?? undefined;
    const nganh = searchParams.get('nganh') ?? undefined;
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;

    if (semesterCode && !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    // ── 3. Build summary ──────────────────────────────────────────────────────
    const summary = await buildStudentDashboardSummary({
      unitId,
      khoaHoc,
      nganh,
      academicYear,
      semesterCode,
    });

    // ── 4. Audit ──────────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.DASHBOARD_VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_DASHBOARD_SUMMARY',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[M07] GET /students/dashboard/summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
