import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EXAM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách kế hoạch thi
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.VIEW_EXAM_PLAN);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');
    const status = searchParams.get('status');
    const examType = searchParams.get('examType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (termId) where.termId = termId;
    if (status) where.status = status;
    if (examType) where.examType = examType;

    const [examPlans, total] = await Promise.all([
      prisma.examPlan.findMany({
        where,
        include: {
          term: {
            include: { academicYear: true }
          },
          examSessions: {
            select: { id: true, status: true }
          }
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.examPlan.count({ where })
    ]);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.VIEW_EXAM_PLAN,
      action: 'VIEW',
      resourceType: 'EXAM_PLAN',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: examPlans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching exam plans:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách kế hoạch thi' }, { status: 500 });
  }
}

// POST - Tạo kế hoạch thi mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.CREATE_EXAM_PLAN);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, name, termId, examType, startDate, endDate, registrationDeadline, description, rules } = body;

    if (!code || !name || !termId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.examPlan.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã kế hoạch thi đã tồn tại' }, { status: 400 });
    }

    const examPlan = await prisma.examPlan.create({
      data: {
        code,
        name,
        termId,
        examType: examType || 'FINAL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        description,
        rules,
        status: 'DRAFT' as const,
        createdBy: authResult.user!.id
      },
      include: {
        term: { include: { academicYear: true } }
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.CREATE_EXAM_PLAN,
      action: 'CREATE',
      resourceType: 'EXAM_PLAN',
      resourceId: examPlan.id,
      newValue: examPlan,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: examPlan, message: 'Tạo kế hoạch thi thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam plan:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo kế hoạch thi' }, { status: 500 });
  }
}

// PUT - Cập nhật kế hoạch thi
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.UPDATE_EXAM_PLAN);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID kế hoạch thi' }, { status: 400 });
    }

    const existing = await prisma.examPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch thi' }, { status: 404 });
    }

    // Parse dates if provided
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.registrationDeadline) updateData.registrationDeadline = new Date(updateData.registrationDeadline);

    const examPlan = await prisma.examPlan.update({
      where: { id },
      data: updateData,
      include: { term: { include: { academicYear: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.UPDATE_EXAM_PLAN,
      action: 'UPDATE',
      resourceType: 'EXAM_PLAN',
      resourceId: id,
      oldValue: existing,
      newValue: examPlan,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: examPlan, message: 'Cập nhật kế hoạch thi thành công' });
  } catch (error) {
    console.error('Error updating exam plan:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật kế hoạch thi' }, { status: 500 });
  }
}

// DELETE - Xóa kế hoạch thi
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, EXAM.DELETE_EXAM_PLAN);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID kế hoạch thi' }, { status: 400 });
    }

    const existing = await prisma.examPlan.findUnique({
      where: { id },
      include: { examSessions: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch thi' }, { status: 404 });
    }

    if (existing.examSessions.length > 0) {
      return NextResponse.json({ error: 'Không thể xóa kế hoạch thi đã có ca thi' }, { status: 400 });
    }

    await prisma.examPlan.delete({ where: { id } });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EXAM.DELETE_EXAM_PLAN,
      action: 'DELETE',
      resourceType: 'EXAM_PLAN',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa kế hoạch thi thành công' });
  } catch (error) {
    console.error('Error deleting exam plan:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa kế hoạch thi' }, { status: 500 });
  }
}
