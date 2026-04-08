/**
 * TRAINING GRADES API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

function calculateGrade(midterm?: number, final?: number, assignment?: number, attendance?: number) {
  const m = midterm || 0, f = final || 0, a = assignment || 0, att = attendance || 0;
  const totalScore = m * 0.3 + f * 0.5 + a * 0.1 + att * 0.1;

  let letterGrade = 'F';
  if (totalScore >= 9.0) letterGrade = 'A';
  else if (totalScore >= 8.5) letterGrade = 'A-';
  else if (totalScore >= 8.0) letterGrade = 'B+';
  else if (totalScore >= 7.0) letterGrade = 'B';
  else if (totalScore >= 6.5) letterGrade = 'B-';
  else if (totalScore >= 6.0) letterGrade = 'C+';
  else if (totalScore >= 5.5) letterGrade = 'C';
  else if (totalScore >= 5.0) letterGrade = 'C-';
  else if (totalScore >= 4.0) letterGrade = 'D';

  return { totalScore: parseFloat(totalScore.toFixed(2)), letterGrade };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.VIEW_GRADE);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get('registrationId');
    const courseId = searchParams.get('courseId');
    const hocVienId = searchParams.get('hocVienId');

    const where: any = {};
    if (registrationId) where.registrationId = registrationId;

    if (!registrationId && (courseId || hocVienId)) {
      const regWhere: any = {};
      if (courseId) regWhere.courseId = courseId;
      if (hocVienId) regWhere.hocVienId = hocVienId;
      const registrations = await prisma.registration.findMany({ where: regWhere, select: { id: true } });
      where.registrationId = { in: registrations.map(r => r.id) };
    }

    const grades = await prisma.gradeRecord.findMany({
      where,
      include: {
        registration: {
          include: {
            course: { select: { code: true, name: true, credits: true, semester: true, year: true } },
            hocVien: { select: { maHocVien: true, hoTen: true, lop: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(grades);
  } catch (error: any) {
    console.error('GET /api/training/grades error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.CREATE_GRADE_DRAFT);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { registrationId, midtermScore, finalScore, assignmentScore, attendanceScore, notes } = body;

    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

    const { totalScore, letterGrade } = calculateGrade(midtermScore, finalScore, assignmentScore, attendanceScore);
    const existing = await prisma.gradeRecord.findUnique({ where: { registrationId } });

    let grade;
    if (existing) {
      grade = await prisma.gradeRecord.update({
        where: { registrationId },
        data: {
          midtermScore: midtermScore || null, finalScore: finalScore || null,
          assignmentScore: assignmentScore || null, attendanceScore: attendanceScore || null,
          totalScore, letterGrade, status: 'GRADED',
          gradedBy: user!.id, gradedAt: new Date(), notes: notes || null,
        },
        include: { registration: { include: { course: { select: { code: true, name: true } }, hocVien: { select: { maHocVien: true, hoTen: true } } } } },
      });
    } else {
      grade = await prisma.gradeRecord.create({
        data: {
          registrationId, midtermScore: midtermScore || null, finalScore: finalScore || null,
          assignmentScore: assignmentScore || null, attendanceScore: attendanceScore || null,
          totalScore, letterGrade, status: 'GRADED',
          gradedBy: user!.id, gradedAt: new Date(), notes: notes || null,
        },
        include: { registration: { include: { course: { select: { code: true, name: true } }, hocVien: { select: { maHocVien: true, hoTen: true } } } } },
      });
    }

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.CREATE_GRADE_DRAFT,
      action: existing ? 'UPDATE' : 'CREATE',
      resourceType: 'GRADE_RECORD',
      resourceId: grade.id,
      newValue: { studentId: grade.registration.hocVien.maHocVien, courseCode: grade.registration.course.code, totalScore, letterGrade },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(grade, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error('POST /api/training/grades error:', error);
    return NextResponse.json({ error: 'Failed to save grade', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.APPROVE_GRADE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: 'ids (array) and status required' }, { status: 400 });
    }

    const result = await prisma.gradeRecord.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.APPROVE_GRADE,
      action: 'APPROVE',
      resourceType: 'GRADE_RECORD',
      newValue: { gradeIds: ids, newStatus: status, count: result.count },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('PUT /api/training/grades error:', error);
    return NextResponse.json({ error: 'Failed to publish grades', details: error.message }, { status: 500 });
  }
}
