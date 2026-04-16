/**
 * GET /api/students/dashboard/warnings
 * M07 – Danh sách học viên đang có cảnh báo học vụ chưa giải quyết
 *
 * Phục vụ dashboard theo dõi học viên cần hỗ trợ.
 *
 * Query params:
 *   unitId        – lọc theo đơn vị/khoa quản lý (optional)
 *   khoaHoc       – lọc theo khóa học (optional)
 *   academicYear  – lọc theo năm học (optional)
 *   semesterCode  – HK1 | HK2 | HK3 (optional)
 *   warningLevel  – CRITICAL | HIGH | MEDIUM | LOW (optional)
 *   page          – mặc định 1
 *   pageSize      – mặc định 20, tối đa 100
 *
 * RBAC: STUDENT.DASHBOARD_VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { listStudentsWithWarnings } from '@/lib/services/dashboard/student-dashboard.service';
import { logAudit } from '@/lib/audit';
import { AcademicWarningLevel } from '@prisma/client';

const VALID_WARNING_LEVELS = Object.values(AcademicWarningLevel);

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
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;
    const warningLevelRaw = searchParams.get('warningLevel') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    if (semesterCode && !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    let warningLevel: AcademicWarningLevel | undefined;
    if (warningLevelRaw) {
      if (!VALID_WARNING_LEVELS.includes(warningLevelRaw as AcademicWarningLevel)) {
        return NextResponse.json(
          {
            success: false,
            error: `warningLevel phải là một trong: ${VALID_WARNING_LEVELS.join(', ')}`,
          },
          { status: 400 },
        );
      }
      warningLevel = warningLevelRaw as AcademicWarningLevel;
    }

    // ── 3. List warnings ──────────────────────────────────────────────────────
    const result = await listStudentsWithWarnings({
      unitId,
      khoaHoc,
      academicYear,
      semesterCode,
      warningLevel,
      page,
      pageSize,
    });

    await logAudit({
      userId: user.id,
      functionCode: STUDENT.DASHBOARD_VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_WARNING_LIST',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[M07] GET /students/dashboard/warnings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
