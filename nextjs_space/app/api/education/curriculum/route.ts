/**
 * CURRICULUM API - Quản lý khung chương trình và môn học
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách khung CTĐT hoặc môn học trong khung
export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CURRICULUM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'plan'; // 'plan' or 'courses'
    const curriculumPlanId = searchParams.get('curriculumPlanId');
    const programId = searchParams.get('programId');
    const programVersionId = searchParams.get('programVersionId'); // M10
    const status = searchParams.get('status');
    const cohort = searchParams.get('cohort');

    if (type === 'courses' && curriculumPlanId) {
      // Get courses in a curriculum plan
      const courses = await prisma.curriculumCourse.findMany({
        where: { curriculumPlanId, isActive: true },
        include: { _count: { select: { classSections: true } } },
        orderBy: [{ semester: 'asc' }, { sortOrder: 'asc' }],
      });
      return NextResponse.json(courses);
    }

    // Get curriculum plans
    const where: any = { isActive: true };
    if (programId) where.programId = programId;
    if (programVersionId) where.programVersionId = programVersionId; // M10
    if (status) where.status = status;
    if (cohort) where.cohort = cohort;

    const plans = await prisma.curriculumPlan.findMany({
      where,
      include: {
        program: { select: { id: true, code: true, name: true, programType: true } },
        programVersion: { select: { id: true, versionCode: true, effectiveFromCohort: true } }, // M10
        academicYear: { select: { id: true, code: true, name: true } },
        _count: { select: { courses: true } }
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('GET /api/education/curriculum error:', error);
    return NextResponse.json({ error: 'Failed to fetch curriculum', details: error.message }, { status: 500 });
  }
}

// POST - Tạo khung CTĐT mới hoặc thêm môn học vào khung
export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_CURRICULUM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { type } = body;

    if (type === 'course') {
      // Add course to curriculum plan
      const { curriculumPlanId, subjectCode, subjectName, credits, theoryHours, practiceHours, labHours, semester, courseType, prerequisiteIds, description, learningOutcomes, assessmentMethod, sortOrder } = body;

      if (!curriculumPlanId || !subjectCode || !subjectName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const course = await prisma.curriculumCourse.create({
        data: {
          curriculumPlanId, subjectCode, subjectName,
          credits: credits || 3,
          theoryHours: theoryHours || 30,
          practiceHours: practiceHours || 15,
          labHours: labHours || 0,
          semester: semester || 1,
          courseType: courseType || 'REQUIRED',
          prerequisiteIds: prerequisiteIds || [],
          description, learningOutcomes, assessmentMethod,
          sortOrder: sortOrder || 0,
        },
      });

      // Update total credits in plan
      const allCourses = await prisma.curriculumCourse.findMany({ where: { curriculumPlanId, isActive: true } });
      const totalCredits = allCourses.reduce((sum, c) => sum + c.credits, 0);
      await prisma.curriculumPlan.update({ where: { id: curriculumPlanId }, data: { totalCredits } });

      await logAudit({
        userId: user!.id, functionCode: EDUCATION.CREATE_CURRICULUM,
        action: 'CREATE', resourceType: 'CURRICULUM_COURSE', resourceId: course.id,
        newValue: { subjectCode, subjectName }, result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(course, { status: 201 });
    }

    // Create curriculum plan
    const { code, name, programId, programVersionId, academicYearId, cohort, totalCredits, version, notes } = body;

    if (!code || !name || !programId) {
      return NextResponse.json({ error: 'Missing required fields: code, name, programId' }, { status: 400 });
    }

    const existing = await prisma.curriculumPlan.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Curriculum plan ${code} already exists` }, { status: 409 });

    const plan = await prisma.curriculumPlan.create({
      data: {
        code, name, programId,
        programVersionId: programVersionId || null, // M10
        academicYearId: academicYearId || null,
        cohort: cohort || null,
        totalCredits: totalCredits || 120,
        version: version || '1.0',
        status: 'DRAFT',
        notes,
        createdBy: user!.id,
      },
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.CREATE_CURRICULUM,
      action: 'CREATE', resourceType: 'CURRICULUM_PLAN', resourceId: plan.id,
      newValue: { code, name }, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/curriculum error:', error);
    return NextResponse.json({ error: 'Failed to create curriculum', details: error.message }, { status: 500 });
  }
}

// PUT - Cập nhật khung CTĐT hoặc môn học
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_CURRICULUM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { type, id, action, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    if (type === 'course') {
      const existing = await prisma.curriculumCourse.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      const course = await prisma.curriculumCourse.update({
        where: { id },
        data: {
          ...(updateData.subjectCode && { subjectCode: updateData.subjectCode }),
          ...(updateData.subjectName && { subjectName: updateData.subjectName }),
          ...(updateData.credits !== undefined && { credits: updateData.credits }),
          ...(updateData.theoryHours !== undefined && { theoryHours: updateData.theoryHours }),
          ...(updateData.practiceHours !== undefined && { practiceHours: updateData.practiceHours }),
          ...(updateData.labHours !== undefined && { labHours: updateData.labHours }),
          ...(updateData.semester !== undefined && { semester: updateData.semester }),
          ...(updateData.courseType && { courseType: updateData.courseType }),
          ...(updateData.prerequisiteIds && { prerequisiteIds: updateData.prerequisiteIds }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
          ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
        },
      });

      return NextResponse.json(course);
    }

    // Update curriculum plan
    const existing = await prisma.curriculumPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Curriculum plan not found' }, { status: 404 });

    // Handle workflow actions
    if (action === 'approve') {
      const plan = await prisma.curriculumPlan.update({
        where: { id },
        data: { status: 'ACTIVE', approvedBy: user!.id, approvedAt: new Date() },
      });
      return NextResponse.json(plan);
    }

    const plan = await prisma.curriculumPlan.update({
      where: { id },
      data: {
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.cohort !== undefined && { cohort: updateData.cohort }),
        ...(updateData.version && { version: updateData.version }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
      },
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.UPDATE_CURRICULUM,
      action: 'UPDATE', resourceType: 'CURRICULUM_PLAN', resourceId: id,
      oldValue: existing, newValue: plan, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('PUT /api/education/curriculum error:', error);
    return NextResponse.json({ error: 'Failed to update curriculum', details: error.message }, { status: 500 });
  }
}

// DELETE - Xóa khung CTĐT hoặc môn học
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.DELETE_CURRICULUM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'plan';

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    if (type === 'course') {
      const existing = await prisma.curriculumCourse.findUnique({ 
        where: { id }, include: { _count: { select: { classSections: true } } } 
      });
      if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      if (existing._count.classSections > 0) {
        await prisma.curriculumCourse.update({ where: { id }, data: { isActive: false } });
      } else {
        await prisma.curriculumCourse.delete({ where: { id } });
      }
      return NextResponse.json({ success: true });
    }

    const existing = await prisma.curriculumPlan.findUnique({ 
      where: { id }, include: { _count: { select: { courses: true } } } 
    });
    if (!existing) return NextResponse.json({ error: 'Curriculum plan not found' }, { status: 404 });
    
    if (existing._count.courses > 0) {
      await prisma.curriculumPlan.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.curriculumPlan.delete({ where: { id } });
    }

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.DELETE_CURRICULUM,
      action: 'DELETE', resourceType: 'CURRICULUM_PLAN', resourceId: id,
      oldValue: existing, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/curriculum error:', error);
    return NextResponse.json({ error: 'Failed to delete curriculum', details: error.message }, { status: 500 });
  }
}
