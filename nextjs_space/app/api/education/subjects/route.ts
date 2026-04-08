/**
 * API Quản lý môn học - Education Subjects
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING, EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách môn học
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.VIEW_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const curriculumPlanId = searchParams.get('curriculumPlanId');
    const courseType = searchParams.get('courseType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { subjectCode: { contains: search, mode: 'insensitive' } },
        { subjectName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (curriculumPlanId && curriculumPlanId !== 'all') where.curriculumPlanId = curriculumPlanId;
    if (courseType && courseType !== 'all') where.courseType = courseType;

    const [subjects, total] = await Promise.all([
      prisma.curriculumCourse.findMany({
        where,
        include: {
          curriculumPlan: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ subjectCode: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.curriculumCourse.count({ where }),
    ]);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.VIEW_COURSE,
      action: 'VIEW',
      resourceType: 'SUBJECT',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      data: subjects,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách môn học', details: error.message }, { status: 500 });
  }
}

// POST - Thêm môn học mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.CREATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { subjectCode, subjectName, credits, courseType, curriculumPlanId, description, semester } = body;

    if (!subjectCode || !subjectName || !curriculumPlanId) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (mã, tên, khung CTĐT)' }, { status: 400 });
    }

    // Kiểm tra mã môn học đã tồn tại trong khung CTĐT
    const existing = await prisma.curriculumCourse.findFirst({ 
      where: { subjectCode, curriculumPlanId } 
    });
    if (existing) {
      return NextResponse.json({ error: 'Mã môn học đã tồn tại trong khung CTĐT này' }, { status: 400 });
    }

    const subject = await prisma.curriculumCourse.create({
      data: {
        subjectCode,
        subjectName,
        credits: credits || 3,
        courseType: courseType || 'REQUIRED',
        curriculumPlanId,
        description,
        semester: semester || 1,
        isActive: true,
      },
      include: { curriculumPlan: { select: { id: true, code: true, name: true } } },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.CREATE_COURSE,
      action: 'CREATE',
      resourceType: 'SUBJECT',
      resourceId: subject.id,
      newValue: subject,
      result: 'SUCCESS',
    });

    return NextResponse.json({ data: subject, message: 'Thêm môn học thành công' }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm môn học', details: error.message }, { status: 500 });
  }
}

// PUT - Cập nhật môn học
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.UPDATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID môn học' }, { status: 400 });
    }

    const existing = await prisma.curriculumCourse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 });
    }

    const subject = await prisma.curriculumCourse.update({
      where: { id },
      data: updateData,
      include: { curriculumPlan: { select: { id: true, code: true, name: true } } },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'SUBJECT',
      resourceId: id,
      oldValue: existing,
      newValue: subject,
      result: 'SUCCESS',
    });

    return NextResponse.json({ data: subject, message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error('PUT /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật', details: error.message }, { status: 500 });
  }
}

// DELETE - Xóa môn học
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.DELETE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID môn học' }, { status: 400 });
    }

    const existing = await prisma.curriculumCourse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 });
    }

    // Soft delete
    await prisma.curriculumCourse.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.DELETE_COURSE,
      action: 'DELETE',
      resourceType: 'SUBJECT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    console.error('DELETE /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa', details: error.message }, { status: 500 });
  }
}
