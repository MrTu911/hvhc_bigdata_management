/**
 * M10 – UC-54: Chi tiết & cập nhật lớp học phần
 * GET   /api/education/class-sections/[id]
 * PATCH /api/education/class-sections/[id]
 *
 * Các trường không được thay đổi sau khi tạo: code, termId, curriculumCourseId
 * (thay đổi những trường này ảnh hưởng đến conflict-check và enrollment đã tồn tại).
 *
 * Status transitions hợp lệ:
 *   OPEN   → CLOSED   : đóng lớp (còn enrollment vẫn cho phép)
 *   CLOSED → OPEN     : mở lại lớp
 *   *      → CANCELLED: chỉ khi chưa có enrollment nào
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

// ── Allowed status transitions ────────────────────────────────────────────────
const VALID_NEXT_STATUSES: Record<string, string[]> = {
  OPEN:      ['CLOSED', 'CANCELLED'],
  CLOSED:    ['OPEN', 'CANCELLED'],
  CANCELLED: [], // terminal state
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;

    const { id } = await params;

    const classSection = await prisma.classSection.findUnique({
      where: { id },
      include: {
        term: { select: { id: true, code: true, name: true } },
        curriculumCourse: {
          select: { id: true, subjectCode: true, subjectName: true, credits: true },
        },
        faculty: {
          select: {
            id: true,
            academicRank: true,
            academicDegree: true,
            user: { select: { name: true, email: true } },
          },
        },
        room: { select: { id: true, code: true, name: true, building: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
    });

    if (!classSection) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lớp học phần' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: classSection });
  } catch (error: any) {
    console.error('GET /api/education/class-sections/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch class section' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.classSection.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lớp học phần' },
        { status: 404 }
      );
    }

    // ── Validate status transition ────────────────────────────────────────────
    if (body.status !== undefined && body.status !== existing.status) {
      const allowed = VALID_NEXT_STATUSES[existing.status] ?? [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Không thể chuyển trạng thái từ ${existing.status} sang ${body.status}`,
          },
          { status: 400 }
        );
      }
      // CANCELLED chỉ được phép nếu chưa có enrollment
      if (body.status === 'CANCELLED' && existing._count.enrollments > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Không thể hủy lớp học phần đã có ${existing._count.enrollments} học viên đăng ký`,
          },
          { status: 409 }
        );
      }
    }

    // ── Whitelist updatable fields (code/termId/curriculumCourseId bị khóa) ──
    const updateData: Record<string, unknown> = {};

    if (body.name        !== undefined) updateData.name        = body.name;
    if (body.facultyId   !== undefined) updateData.facultyId   = body.facultyId;
    if (body.roomId      !== undefined) updateData.roomId      = body.roomId;
    if (body.maxStudents !== undefined) {
      if (typeof body.maxStudents !== 'number' || body.maxStudents < 1) {
        return NextResponse.json(
          { success: false, error: 'maxStudents phải là số nguyên >= 1' },
          { status: 400 }
        );
      }
      updateData.maxStudents = body.maxStudents;
    }
    if (body.schedule    !== undefined) updateData.schedule    = body.schedule;
    if (body.dayOfWeek   !== undefined) updateData.dayOfWeek   = body.dayOfWeek;
    if (body.startPeriod !== undefined) updateData.startPeriod = body.startPeriod;
    if (body.endPeriod   !== undefined) updateData.endPeriod   = body.endPeriod;
    if (body.startDate   !== undefined) updateData.startDate   = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate     !== undefined) updateData.endDate     = body.endDate   ? new Date(body.endDate)   : null;
    if (body.status      !== undefined) updateData.status      = body.status;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có field nào được cập nhật' },
        { status: 400 }
      );
    }

    const updated = await prisma.classSection.update({
      where: { id },
      data: updateData,
      include: {
        term: { select: { id: true, code: true, name: true } },
        curriculumCourse: { select: { id: true, subjectCode: true, subjectName: true, credits: true } },
        faculty: { select: { id: true, user: { select: { name: true } } } },
        room: { select: { id: true, code: true, name: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.UPDATE_CLASS_SECTION,
      action: 'UPDATE',
      resourceType: 'CLASS_SECTION',
      resourceId: id,
      oldValue: { status: existing.status, facultyId: existing.facultyId },
      newValue: updateData,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/education/class-sections/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update class section' }, { status: 500 });
  }
}
