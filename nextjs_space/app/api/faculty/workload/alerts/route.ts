/**
 * GET /api/faculty/workload/alerts
 * M07 – Danh sách cảnh báo tải giảng đang OPEN.
 *
 * Query params:
 *   academicYear  – VD: "2025-2026"
 *   semesterCode  – HK1 | HK2 | HK3
 *   unitId        – lọc theo đơn vị
 *   page          – mặc định 1
 *   pageSize      – mặc định 20
 *
 * RBAC: FACULTY.WORKLOAD_VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { listOpenWorkloadAlerts } from '@/lib/services/faculty/faculty-workload.service';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.WORKLOAD_VIEW);
    if (!authResult.allowed) return authResult.response!;

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;
    const unitId = searchParams.get('unitId') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    const { alerts, total } = await listOpenWorkloadAlerts({
      academicYear,
      semesterCode,
      unitId,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: alerts.map((a) => ({
          id: a.id,
          alertType: a.alertType,
          status: a.status,
          message: a.message,
          createdAt: a.createdAt,
          faculty: {
            id: a.snapshot.facultyProfile.id,
            name: a.snapshot.facultyProfile.user.name,
            militaryId: a.snapshot.facultyProfile.user.militaryId,
            unit: a.snapshot.facultyProfile.unit,
          },
          snapshot: {
            academicYear: a.snapshot.academicYear,
            semesterCode: a.snapshot.semesterCode,
            totalHoursWeekly: a.snapshot.totalHoursWeekly,
            weeklyHoursLimit: a.snapshot.weeklyHoursLimit,
          },
        })),
        total,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    console.error('[M07] GET /faculty/workload/alerts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
