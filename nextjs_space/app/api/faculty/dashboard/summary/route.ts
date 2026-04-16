/**
 * GET /api/faculty/dashboard/summary
 * M07 – Dashboard tổng hợp giảng viên
 *
 * Query params:
 *   unitId        – lọc theo đơn vị/bộ môn (optional)
 *   academicYear  – VD: "2025-2026" (cần cho EIS + workload stats)
 *   semesterCode  – HK1 | HK2 | HK3
 *
 * RBAC: FACULTY.VIEW_STATS
 *
 * Phase 2: thêm export hook → POST /api/m07/reports/export với template M18
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { buildFacultyDashboardSummary } from '@/lib/services/dashboard/faculty-dashboard.service';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const authResult = await requireFunction(req, FACULTY.VIEW_STATS);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    // ── 2. Parse params ───────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId') ?? undefined;
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;

    if (semesterCode && !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    // ── 3. Build summary ──────────────────────────────────────────────────────
    const summary = await buildFacultyDashboardSummary({
      unitId,
      academicYear,
      semesterCode,
    });

    // ── 4. Audit ──────────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.VIEW_STATS,
      action: 'VIEW',
      resourceType: 'FACULTY_DASHBOARD_SUMMARY',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[M07] GET /faculty/dashboard/summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
