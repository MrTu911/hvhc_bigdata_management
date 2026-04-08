/**
 * API Phân công giảng dạy
 * - Lấy danh sách lớp học phần theo bộ môn
 * - Phân công giảng viên cho lớp/buổi học
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Time slots theo quy định:
// - 1 cặp tiết = 2 tiết x 45 phút = 90 phút
// - Giữa các cặp nghỉ 5 phút
// - Sáng: 6 tiết (3 cặp), Chiều: 2 tiết (1 cặp)
const TIME_SLOTS = [
  { pair: 1, label: 'Tiết 1-2 (Sáng)', startTime: '07:00', endTime: '08:30', periods: [1, 2], shift: 'morning' },
  { pair: 2, label: 'Tiết 3-4 (Sáng)', startTime: '08:35', endTime: '10:05', periods: [3, 4], shift: 'morning' },
  { pair: 3, label: 'Tiết 5-6 (Sáng)', startTime: '10:10', endTime: '11:40', periods: [5, 6], shift: 'morning' },
  { pair: 4, label: 'Tiết 7-8 (Chiều)', startTime: '13:30', endTime: '15:00', periods: [7, 8], shift: 'afternoon' },
  { pair: 5, label: 'Tối (ĐB)', startTime: '18:00', endTime: '21:00', periods: [9, 10, 11], shift: 'evening' },
];

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.VIEW_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');
    const unitId = searchParams.get('unitId');
    const facultyId = searchParams.get('facultyId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    // Build where clause
    const where: any = {};
    if (termId) where.termId = termId;
    if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek);
    if (facultyId) where.facultyId = facultyId;

    // Nếu có unitId, lấy các giảng viên của unit đó
    if (unitId) {
      const facultyInUnit = await prisma.facultyProfile.findMany({
        where: { unitId },
        select: { id: true },
      });
      where.facultyId = { in: facultyInUnit.map(f => f.id) };
    }

    // Lấy danh sách lớp học phần
    const classSections = await prisma.classSection.findMany({
      where,
      include: {
        term: { select: { id: true, name: true, termNumber: true } },
        faculty: {
          select: {
            id: true,
            academicRank: true,
            academicDegree: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        room: { select: { id: true, name: true, code: true, building: true } },
        curriculumCourse: true,
        sessions: {
          orderBy: { sessionNumber: 'asc' },
          include: {
            faculty: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
            room: { select: { id: true, name: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startPeriod: 'asc' }],
    });

    // Lấy danh sách giảng viên có thể phân công
    const facultyWhere: any = { isActive: true };
    if (unitId) facultyWhere.unitId = unitId;

    const availableFaculty = await prisma.facultyProfile.findMany({
      where: facultyWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true, code: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    // Lấy danh sách terms hiện có
    const terms = await prisma.term.findMany({
      orderBy: [{ termNumber: 'desc' }],
      take: 10,
      include: { academicYear: true },
    });

    // Lấy danh sách phòng
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ building: 'asc' }, { name: 'asc' }],
    });

    // Lấy danh sách bộ môn (units)
    const units = await prisma.unit.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      classSections,
      availableFaculty,
      terms,
      rooms,
      units,
      timeSlots: TIME_SLOTS,
    });
  } catch (error: any) {
    console.error('GET /api/education/teaching-assignment error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu phân công', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Phân công giảng viên
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.UPDATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { classSectionId, facultyId, roomId, dayOfWeek, startPeriod, endPeriod, assignType } = body;

    if (!classSectionId) {
      return NextResponse.json({ error: 'Thiếu ID lớp học phần' }, { status: 400 });
    }

    // Kiểm tra lớp tồn tại
    const existing = await prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: { sessions: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học phần' }, { status: 404 });
    }

    // Kiểm tra trùng lịch giảng viên
    if (facultyId && dayOfWeek && startPeriod) {
      const conflict = await prisma.classSection.findFirst({
        where: {
          id: { not: classSectionId },
          facultyId,
          dayOfWeek: parseInt(dayOfWeek),
          termId: existing.termId,
          OR: [
            { startPeriod: { lte: parseInt(startPeriod) }, endPeriod: { gte: parseInt(startPeriod) } },
            { startPeriod: { lte: parseInt(endPeriod) }, endPeriod: { gte: parseInt(endPeriod) } },
          ],
        },
      });

      if (conflict) {
        return NextResponse.json({ error: 'Giảng viên đã có lịch dạy trong thời gian này' }, { status: 400 });
      }
    }

    // Cập nhật lớp học phần
    const updateData: any = {};
    if (facultyId !== undefined) updateData.facultyId = facultyId || null;
    if (roomId !== undefined) updateData.roomId = roomId || null;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = parseInt(dayOfWeek);
    if (startPeriod !== undefined) updateData.startPeriod = parseInt(startPeriod);
    if (endPeriod !== undefined) updateData.endPeriod = parseInt(endPeriod);

    const updated = await prisma.classSection.update({
      where: { id: classSectionId },
      data: updateData,
      include: {
        faculty: { select: { user: { select: { name: true } } } },
        room: { select: { name: true } },
      },
    });

    // Nếu assignType === 'all_sessions', cập nhật tất cả các buổi học
    if (assignType === 'all_sessions' && existing.sessions.length > 0) {
      await prisma.trainingSession.updateMany({
        where: { classSectionId },
        data: {
          ...(facultyId !== undefined && { facultyId: facultyId || null }),
          ...(roomId !== undefined && { roomId: roomId || null }),
        },
      });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'TEACHING_ASSIGNMENT',
      resourceId: classSectionId,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      message: 'Phân công thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('POST /api/education/teaching-assignment error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi phân công giảng viên', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật phân công cho buổi học cụ thể
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.UPDATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { sessionId, facultyId, roomId, startTime, endTime, topic, status } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Thiếu ID buổi học' }, { status: 400 });
    }

    const existing = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy buổi học' }, { status: 404 });
    }

    const updateData: any = {};
    if (facultyId !== undefined) updateData.facultyId = facultyId || null;
    if (roomId !== undefined) updateData.roomId = roomId || null;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (topic !== undefined) updateData.topic = topic;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        faculty: { select: { user: { select: { name: true } } } },
        room: { select: { name: true } },
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'TRAINING_SESSION',
      resourceId: sessionId,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Cập nhật thành công', data: updated });
  } catch (error: any) {
    console.error('PUT /api/education/teaching-assignment error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật', details: error.message },
      { status: 500 }
    );
  }
}
