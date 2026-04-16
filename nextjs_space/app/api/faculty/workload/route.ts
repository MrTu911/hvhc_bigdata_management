/**
 * GET /api/faculty/workload
 * M07 – Summary snapshot tải giảng cho một hoặc nhiều giảng viên.
 *
 * Query params:
 *   facultyProfileId  – optional, nếu có thì lấy của 1 GV
 *   academicYear      – VD: "2025-2026"
 *   semesterCode      – HK1 | HK2 | HK3
 *   unitId            – lọc theo đơn vị (khi không có facultyProfileId)
 *   page              – mặc định 1
 *   pageSize          – mặc định 20
 *
 * RBAC: FACULTY.WORKLOAD_VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.WORKLOAD_VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const facultyProfileId = searchParams.get('facultyProfileId') ?? undefined;
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;
    const unitId = searchParams.get('unitId') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    const where: any = {};
    if (facultyProfileId) where.facultyProfileId = facultyProfileId;
    if (academicYear) where.academicYear = academicYear;
    if (semesterCode) where.semesterCode = semesterCode;
    if (unitId) where.facultyProfile = { unitId };

    const [snapshots, total] = await Promise.all([
      db.facultyWorkloadSnapshot.findMany({
        where,
        include: {
          facultyProfile: {
            select: {
              id: true,
              weeklyHoursLimit: true,
              user: { select: { name: true, militaryId: true } },
              unit: { select: { id: true, name: true, code: true } },
            },
          },
          alerts: {
            where: { status: 'OPEN' },
            select: { alertType: true, message: true },
          },
        },
        orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.facultyWorkloadSnapshot.count({ where }),
    ]);

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.WORKLOAD_VIEW,
      action: 'VIEW',
      resourceType: 'FACULTY_WORKLOAD',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        items: snapshots,
        total,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    console.error('[M07] GET /faculty/workload error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
