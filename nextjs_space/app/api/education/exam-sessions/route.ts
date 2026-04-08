import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EXAM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách ca thi
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.VIEW_EXAM_SESSION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const examPlanId = searchParams.get('examPlanId');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (examPlanId) where.examPlanId = examPlanId;
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (date) where.examDate = new Date(date);

    const [sessions, total] = await Promise.all([
      prisma.examSession.findMany({
        where,
        include: {
          examPlan: { select: { code: true, name: true } },
          room: { select: { code: true, name: true, building: true } },
          examRegistrations: { select: { id: true, status: true } }
        },
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.examSession.count({ where })
    ]);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.VIEW_EXAM_SESSION,
      action: 'VIEW',
      resourceType: 'EXAM_SESSION',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: sessions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching exam sessions:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách ca thi' }, { status: 500 });
  }
}

// POST - Tạo ca thi mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.CREATE_EXAM_SESSION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { examPlanId, code, examDate, startTime, endTime, roomId, maxStudents, supervisorId, assistantIds, notes } = body;

    if (!examPlanId || !code || !examDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const examPlan = await prisma.examPlan.findUnique({ where: { id: examPlanId } });
    if (!examPlan) {
      return NextResponse.json({ error: 'Kế hoạch thi không tồn tại' }, { status: 404 });
    }

    const existingCode = await prisma.examSession.findFirst({
      where: { code, examPlanId }
    });
    if (existingCode) {
      return NextResponse.json({ error: 'Mã ca thi đã tồn tại trong kế hoạch này' }, { status: 400 });
    }

    const session = await prisma.examSession.create({
      data: {
        examPlanId,
        code,
        examDate: new Date(examDate),
        startTime,
        endTime,
        roomId: roomId || null,
        maxStudents: maxStudents || 40,
        supervisorId: supervisorId || null,
        assistantIds: assistantIds || [],
        notes: notes || '',
        status: 'SCHEDULED'
      },
      include: {
        examPlan: { select: { code: true, name: true } },
        room: { select: { code: true, name: true } }
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.CREATE_EXAM_SESSION,
      action: 'CREATE',
      resourceType: 'EXAM_SESSION',
      resourceId: session.id,
      newValue: JSON.stringify(session),
      result: 'SUCCESS'
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating exam session:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo ca thi' }, { status: 500 });
  }
}

// PUT - Cập nhật ca thi
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.UPDATE_EXAM_SESSION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, code, examDate, startTime, endTime, roomId, maxStudents, supervisorId, assistantIds, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID ca thi' }, { status: 400 });
    }

    const existing = await prisma.examSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ca thi không tồn tại' }, { status: 404 });
    }

    const updated = await prisma.examSession.update({
      where: { id },
      data: {
        code: code || existing.code,
        examDate: examDate ? new Date(examDate) : existing.examDate,
        startTime: startTime || existing.startTime,
        endTime: endTime || existing.endTime,
        roomId: roomId !== undefined ? roomId : existing.roomId,
        maxStudents: maxStudents !== undefined ? maxStudents : existing.maxStudents,
        supervisorId: supervisorId !== undefined ? supervisorId : existing.supervisorId,
        assistantIds: assistantIds !== undefined ? assistantIds : existing.assistantIds,
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status
      },
      include: {
        examPlan: { select: { code: true, name: true } },
        room: { select: { code: true, name: true } }
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.UPDATE_EXAM_SESSION,
      action: 'UPDATE',
      resourceType: 'EXAM_SESSION',
      resourceId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      result: 'SUCCESS'
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating exam session:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật ca thi' }, { status: 500 });
  }
}

// DELETE - Xóa ca thi
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.DELETE_EXAM_SESSION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID ca thi' }, { status: 400 });
    }

    const existing = await prisma.examSession.findUnique({
      where: { id },
      include: { examRegistrations: true }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Ca thi không tồn tại' }, { status: 404 });
    }

    if (existing.examRegistrations.length > 0) {
      return NextResponse.json({ error: 'Không thể xóa ca thi đã có thí sinh đăng ký' }, { status: 400 });
    }

    await prisma.examSession.delete({ where: { id } });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.DELETE_EXAM_SESSION,
      action: 'DELETE',
      resourceType: 'EXAM_SESSION',
      resourceId: id,
      oldValue: JSON.stringify(existing),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam session:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa ca thi' }, { status: 500 });
  }
}
