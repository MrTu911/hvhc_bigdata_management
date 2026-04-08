/**
 * M10 – UC-55: Điểm danh và chuyên cần
 * GET  /api/education/attendance  – danh sách điểm danh theo session/enrollment
 * POST /api/education/attendance  – batch upsert điểm danh
 *
 * Mapping: AttendanceRecord (design) → SessionAttendance (codebase)
 * Unique constraint: (sessionId, enrollmentId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_ATTENDANCE);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const sessionId      = searchParams.get('sessionId');
    const classSectionId = searchParams.get('classSectionId');
    const hocVienId      = searchParams.get('hocVienId');

    if (!sessionId && !classSectionId && !hocVienId) {
      return NextResponse.json(
        { success: false, error: 'Cần ít nhất một trong: sessionId, classSectionId, hocVienId' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (sessionId) {
      where.sessionId = sessionId;
    }
    if (classSectionId) {
      where.session = { classSectionId };
    }
    if (hocVienId) {
      where.enrollment = { hocVienId };
    }

    const records = await prisma.sessionAttendance.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            sessionDate: true,
            sessionType: true,
            classSectionId: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            hocVienId: true,
            hocVien: { select: { id: true, maHocVien: true, hoTen: true } },
          },
        },
      },
      orderBy: [{ session: { sessionDate: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('GET /api/education/attendance error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

/**
 * POST /api/education/attendance
 * Body: { records: Array<{ sessionId, enrollmentId, attendanceType, notes? }> }
 *
 * Upsert by (sessionId, enrollmentId). Idempotent — gọi lại không tạo duplicate.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_ATTENDANCE);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const { records } = body as {
      records: Array<{
        sessionId: string;
        enrollmentId: string;
        attendanceType: string;
        notes?: string;
      }>;
    };

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'records phải là mảng không rỗng' },
        { status: 400 }
      );
    }

    const VALID_TYPES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    for (const r of records) {
      if (!r.sessionId || !r.enrollmentId) {
        return NextResponse.json(
          { success: false, error: 'Mỗi record phải có sessionId và enrollmentId' },
          { status: 400 }
        );
      }
      if (!VALID_TYPES.includes(r.attendanceType)) {
        return NextResponse.json(
          { success: false, error: `attendanceType không hợp lệ: ${r.attendanceType}` },
          { status: 400 }
        );
      }
    }

    // Batch upsert
    const upserted = await prisma.$transaction(
      records.map((r) =>
        prisma.sessionAttendance.upsert({
          where: { sessionId_enrollmentId: { sessionId: r.sessionId, enrollmentId: r.enrollmentId } },
          create: {
            sessionId: r.sessionId,
            enrollmentId: r.enrollmentId,
            attendanceType: r.attendanceType as any,
            isPresent: r.attendanceType === 'PRESENT',
            notes: r.notes,
          },
          update: {
            attendanceType: r.attendanceType as any,
            isPresent: r.attendanceType === 'PRESENT',
            notes: r.notes ?? undefined,
          },
        })
      )
    );

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_ATTENDANCE,
      action: 'CREATE',
      resourceType: 'SESSION_ATTENDANCE',
      resourceId: records[0]?.sessionId ?? 'batch',
      newValue: { count: records.length },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: { upserted: upserted.length },
    });
  } catch (error: any) {
    console.error('POST /api/education/attendance error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save attendance' }, { status: 500 });
  }
}
