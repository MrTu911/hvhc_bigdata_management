/**
 * TRAINING COURSES API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/training/courses
 * Lấy danh sách học phần
 */
export async function GET(req: NextRequest) {
  try {
    // Function-based RBAC: VIEW_COURSE
    const auth = await requireFunction(req, TRAINING.VIEW_COURSE);
    if (!auth.allowed) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const semester = searchParams.get('semester') || '';
    const year = searchParams.get('year') || '';
    const facultyId = searchParams.get('facultyId') || '';
    const departmentId = searchParams.get('departmentId') || '';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (semester) where.semester = semester;
    if (year) where.year = parseInt(year);
    if (facultyId) where.facultyId = facultyId;
    if (departmentId) where.departmentId = departmentId;
    where.isActive = true;

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        include: {
          faculty: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true, email: true } },
              academicRank: true,
              academicDegree: true,
            },
          },
          room: { select: { id: true, code: true, name: true, capacity: true } },
          _count: { select: { registrations: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ year: 'desc' }, { semester: 'desc' }, { code: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      data: courses,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/training/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training/courses
 * Tạo học phần mới
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.CREATE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { code, name, credits, departmentId, facultyId, semester, year, roomId, maxStudents, description, syllabus } = body;

    if (!code || !name || !credits || !semester || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, credits, semester, year' },
        { status: 400 }
      );
    }

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Course with code ${code} already exists` }, { status: 409 });
    }

    const course = await prisma.course.create({
      data: {
        code, name, credits: parseInt(credits), departmentId: departmentId || null,
        facultyId: facultyId || null, semester, year: parseInt(year),
        roomId: roomId || null, maxStudents: maxStudents ? parseInt(maxStudents) : 50,
        description: description || null, syllabus: syllabus || null,
      },
      include: {
        faculty: { select: { user: { select: { name: true } }, academicRank: true } },
        room: { select: { code: true, name: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.CREATE_COURSE,
      action: 'CREATE',
      resourceType: 'COURSE',
      resourceId: course.id,
      newValue: { code, name, credits },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/training/courses error:', error);
    return NextResponse.json({ error: 'Failed to create course', details: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/training/courses
 * Cập nhật học phần
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.UPDATE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

    const oldCourse = await prisma.course.findUnique({ where: { id } });

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        faculty: { select: { user: { select: { name: true } } } },
        room: { select: { code: true, name: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'COURSE',
      resourceId: id,
      oldValue: oldCourse,
      newValue: updateData,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('PUT /api/training/courses error:', error);
    return NextResponse.json({ error: 'Failed to update course', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/training/courses
 * Xóa học phần (Admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.DELETE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

    const courseToDelete = await prisma.course.findUnique({ where: { id } });
    if (!courseToDelete) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const course = await prisma.course.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.DELETE_COURSE,
      action: 'DELETE',
      resourceType: 'COURSE',
      resourceId: id,
      oldValue: courseToDelete,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error('DELETE /api/training/courses error:', error);
    return NextResponse.json({ error: 'Failed to delete course', details: error.message }, { status: 500 });
  }
}
