/**
 * CLASS SECTIONS API - Quản lý lớp học phần
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');
    const curriculumCourseId = searchParams.get('curriculumCourseId');
    const facultyId = searchParams.get('facultyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (termId) where.termId = termId;
    if (curriculumCourseId) where.curriculumCourseId = curriculumCourseId;
    if (facultyId) where.facultyId = facultyId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, classSections] = await Promise.all([
      prisma.classSection.count({ where }),
      prisma.classSection.findMany({
        where,
        include: {
          term: { select: { id: true, code: true, name: true } },
          curriculumCourse: { select: { id: true, subjectCode: true, subjectName: true, credits: true } },
          faculty: {
            select: { id: true, userId: true, academicRank: true, academicDegree: true, user: { select: { name: true } } }
          },
          room: { select: { id: true, code: true, name: true, building: true } },
          _count: { select: { enrollments: true, sessions: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ code: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      data: classSections,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('GET /api/education/class-sections error:', error);
    return NextResponse.json({ error: 'Failed to fetch class sections', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { 
      code, name, curriculumCourseId, termId, facultyId, roomId,
      maxStudents, schedule, dayOfWeek, startPeriod, endPeriod, startDate, endDate
    } = body;

    if (!code || !name || !termId) {
      return NextResponse.json({ error: 'Missing required fields: code, name, termId' }, { status: 400 });
    }

    const existing = await prisma.classSection.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Class section ${code} already exists` }, { status: 409 });

    const classSection = await prisma.classSection.create({
      data: {
        code, name,
        curriculumCourseId: curriculumCourseId || null,
        termId,
        facultyId: facultyId || null,
        roomId: roomId || null,
        maxStudents: maxStudents || 50,
        schedule: schedule || null,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : null,
        startPeriod: startPeriod ? parseInt(startPeriod) : null,
        endPeriod: endPeriod ? parseInt(endPeriod) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'OPEN',
      },
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.CREATE_CLASS_SECTION,
      action: 'CREATE', resourceType: 'CLASS_SECTION', resourceId: classSection.id,
      newValue: { code, name }, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(classSection, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/class-sections error:', error);
    return NextResponse.json({ error: 'Failed to create class section', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.classSection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Class section not found' }, { status: 404 });

    const classSection = await prisma.classSection.update({
      where: { id },
      data: {
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.curriculumCourseId !== undefined && { curriculumCourseId: updateData.curriculumCourseId }),
        ...(updateData.facultyId !== undefined && { facultyId: updateData.facultyId }),
        ...(updateData.roomId !== undefined && { roomId: updateData.roomId }),
        ...(updateData.maxStudents !== undefined && { maxStudents: updateData.maxStudents }),
        ...(updateData.schedule !== undefined && { schedule: updateData.schedule }),
        ...(updateData.dayOfWeek !== undefined && { dayOfWeek: updateData.dayOfWeek }),
        ...(updateData.startPeriod !== undefined && { startPeriod: updateData.startPeriod }),
        ...(updateData.endPeriod !== undefined && { endPeriod: updateData.endPeriod }),
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
        ...(updateData.status && { status: updateData.status }),
        ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
      },
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.UPDATE_CLASS_SECTION,
      action: 'UPDATE', resourceType: 'CLASS_SECTION', resourceId: id,
      oldValue: existing, newValue: classSection, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(classSection);
  } catch (error: any) {
    console.error('PUT /api/education/class-sections error:', error);
    return NextResponse.json({ error: 'Failed to update class section', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.DELETE_CLASS_SECTION);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.classSection.findUnique({ 
      where: { id }, include: { _count: { select: { enrollments: true, sessions: true } } } 
    });
    if (!existing) return NextResponse.json({ error: 'Class section not found' }, { status: 404 });

    if (existing._count.enrollments > 0 || existing._count.sessions > 0) {
      await prisma.classSection.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.classSection.delete({ where: { id } });
    }

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.DELETE_CLASS_SECTION,
      action: 'DELETE', resourceType: 'CLASS_SECTION', resourceId: id,
      oldValue: existing, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/class-sections error:', error);
    return NextResponse.json({ error: 'Failed to delete class section', details: error.message }, { status: 500 });
  }
}
