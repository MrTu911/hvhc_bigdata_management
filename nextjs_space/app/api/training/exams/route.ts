/**
 * TRAINING EXAMS API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.VIEW);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const examType = searchParams.get('examType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (examType) where.examType = examType;
    if (fromDate) where.examDate = { ...where.examDate, gte: new Date(fromDate) };
    if (toDate) where.examDate = { ...where.examDate, lte: new Date(toDate) };

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: { select: { code: true, name: true, credits: true, semester: true, year: true } },
        room: { select: { code: true, name: true, building: true, capacity: true } },
        invigilator: { select: { user: { select: { name: true, email: true } }, academicRank: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    return NextResponse.json(exams);
  } catch (error: any) {
    console.error('GET /api/training/exams error:', error);
    return NextResponse.json({ error: 'Failed to fetch exams', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.CREATE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { courseId, examType, examDate, duration, roomId, invigilatorId, maxStudents, instructions } = body;

    if (!courseId || !examType || !examDate) {
      return NextResponse.json({ error: 'Missing required fields: courseId, examType, examDate' }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        courseId, examType, examDate: new Date(examDate),
        duration: duration ? parseInt(duration) : 90, roomId: roomId || null,
        invigilatorId: invigilatorId || null, maxStudents: maxStudents ? parseInt(maxStudents) : 50,
        instructions: instructions || null,
      },
      include: { course: { select: { code: true, name: true } }, room: { select: { code: true, name: true } } },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.CREATE_COURSE,
      action: 'CREATE',
      resourceType: 'EXAM',
      resourceId: exam.id,
      newValue: { courseCode: exam.course.code, examType, examDate },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/training/exams error:', error);
    return NextResponse.json({ error: 'Failed to create exam', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.UPDATE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });
    if (updateData.examDate) updateData.examDate = new Date(updateData.examDate);

    const oldExam = await prisma.exam.findUnique({ where: { id } });
    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: { course: { select: { code: true, name: true } } },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'EXAM',
      resourceId: id,
      oldValue: oldExam,
      newValue: updateData,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(exam);
  } catch (error: any) {
    console.error('PUT /api/training/exams error:', error);
    return NextResponse.json({ error: 'Failed to update exam', details: error.message }, { status: 500 });
  }
}
