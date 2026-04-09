/**
 * API Quản lý môn học - Education Subjects
 *
 * Page expects fields: { id, code, name, credits, courseType, unitId, unit, description, isActive }
 * DB model (CurriculumCourse) stores: { subjectCode, subjectName, curriculumPlanId }
 * Unit is resolved via: CurriculumCourse → CurriculumPlan → Program → Unit
 *
 * This route maps between the two representations on every read and write.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// ─── Response mapper ──────────────────────────────────────────────────────────

function mapSubjectToResponse(s: {
  id: string;
  subjectCode: string | null;
  subjectName: string;
  credits: number | null;
  courseType: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  curriculumPlan: {
    program: {
      unitId: string | null;
      unit: { id: string; name: string; code: string } | null;
    };
  } | null;
}) {
  return {
    id: s.id,
    code: s.subjectCode ?? '',
    name: s.subjectName,
    credits: s.credits ?? 3,
    courseType: s.courseType ?? 'REQUIRED',
    unitId: s.curriculumPlan?.program?.unitId ?? null,
    unit: s.curriculumPlan?.program?.unit ?? null,
    description: s.description,
    isActive: s.isActive,
    createdAt: s.createdAt,
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.VIEW_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const unitId = searchParams.get('unitId');
    const courseType = searchParams.get('courseType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { subjectCode: { contains: search, mode: 'insensitive' } },
        { subjectName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (courseType && courseType !== 'all') {
      where.courseType = courseType;
    }
    // Filter by unit via CurriculumPlan → Program → Unit chain
    if (unitId && unitId !== 'all') {
      where.curriculumPlan = { program: { unitId } };
    }

    const includeUnit = {
      curriculumPlan: {
        select: {
          program: {
            select: {
              unitId: true,
              unit: { select: { id: true, name: true, code: true } },
            },
          },
        },
      },
    };

    const [subjects, total] = await Promise.all([
      prisma.curriculumCourse.findMany({
        where,
        include: includeUnit,
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
      data: subjects.map(mapSubjectToResponse),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách môn học', details: msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.CREATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, name, credits, courseType, unitId, description, semester } = body;

    if (!code || !name || !unitId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (mã môn, tên môn, đơn vị)' },
        { status: 400 }
      );
    }

    // Find the default active CurriculumPlan for this unit
    const curriculumPlan = await prisma.curriculumPlan.findFirst({
      where: { isActive: true, program: { unitId } },
      orderBy: { createdAt: 'desc' },
    });

    if (!curriculumPlan) {
      return NextResponse.json(
        { error: 'Đơn vị này chưa có Khung chương trình đào tạo. Vui lòng tạo CTĐT trước.' },
        { status: 400 }
      );
    }

    // Prevent duplicate subject code within the same curriculum plan
    const existing = await prisma.curriculumCourse.findFirst({
      where: { subjectCode: code, curriculumPlanId: curriculumPlan.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Mã môn học đã tồn tại trong khung CTĐT của đơn vị này' },
        { status: 400 }
      );
    }

    const subject = await prisma.curriculumCourse.create({
      data: {
        subjectCode: code,
        subjectName: name,
        credits: credits || 3,
        courseType: courseType || 'REQUIRED',
        curriculumPlanId: curriculumPlan.id,
        description,
        semester: semester || 1,
        isActive: true,
      },
      include: {
        curriculumPlan: {
          select: {
            program: {
              select: {
                unitId: true,
                unit: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
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

    return NextResponse.json(
      { data: mapSubjectToResponse(subject), message: 'Thêm môn học thành công' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm môn học', details: msg }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.UPDATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, code, name, credits, courseType, unitId, description, semester } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID môn học' }, { status: 400 });
    }

    const existing = await prisma.curriculumCourse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 });
    }

    // Build update data — only overwrite fields that were sent
    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.subjectCode = code;
    if (name !== undefined) updateData.subjectName = name;
    if (credits !== undefined) updateData.credits = credits;
    if (courseType !== undefined) updateData.courseType = courseType;
    if (description !== undefined) updateData.description = description;
    if (semester !== undefined) updateData.semester = semester;

    // If unitId changed, resolve new CurriculumPlan
    if (unitId !== undefined) {
      const newPlan = await prisma.curriculumPlan.findFirst({
        where: { isActive: true, program: { unitId } },
        orderBy: { createdAt: 'desc' },
      });
      if (!newPlan) {
        return NextResponse.json(
          { error: 'Đơn vị mới chưa có Khung chương trình đào tạo' },
          { status: 400 }
        );
      }
      updateData.curriculumPlanId = newPlan.id;
    }

    const subject = await prisma.curriculumCourse.update({
      where: { id },
      data: updateData,
      include: {
        curriculumPlan: {
          select: {
            program: {
              select: {
                unitId: true,
                unit: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
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

    return NextResponse.json({ data: mapSubjectToResponse(subject), message: 'Cập nhật thành công' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PUT /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật', details: msg }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('DELETE /api/education/subjects error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa', details: msg }, { status: 500 });
  }
}
