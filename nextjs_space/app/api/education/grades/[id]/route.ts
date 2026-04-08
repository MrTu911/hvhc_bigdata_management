/**
 * M10 – UC-56: Chi tiết & cập nhật điểm học phần
 * GET   /api/education/grades/[id]
 * PATCH /api/education/grades/[id]
 *
 * [id] = ClassEnrollment.id
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  validateScorePayload,
  updateGradeWithHistory,
  type ScorePayload,
} from '@/lib/services/education/grade.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_GRADE);
    if (!auth.allowed) return auth.response!;

    const { id } = await params;

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { id },
      include: {
        hocVien: { select: { id: true, maHocVien: true, hoTen: true } },
        classSection: {
          select: {
            id: true, code: true, name: true, termId: true,
            curriculumCourse: { select: { subjectCode: true, subjectName: true, credits: true } },
          },
        },
        _count: { select: { scoreHistories: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy enrollment' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enrollment });
  } catch (error: any) {
    console.error('GET /api/education/grades/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grade' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_GRADE);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id } = await params;
    const body = await req.json();
    const payload: ScorePayload = {
      attendanceScore: body.attendanceScore,
      assignmentScore: body.assignmentScore,
      midtermScore:    body.midtermScore,
      finalScore:      body.finalScore,
      totalScore:      body.totalScore,
      passFlag:        body.passFlag,
      letterGrade:     body.letterGrade,
      gradeStatus:     body.gradeStatus,
      notes:           body.notes,
      reason:          body.reason,
    };

    const validationError = validateScorePayload(payload);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const result = await updateGradeWithHistory(id, payload, user!.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_GRADE,
      action: 'UPDATE',
      resourceType: 'CLASS_ENROLLMENT_GRADE',
      resourceId: id,
      newValue: { gradeStatus: result.data.gradeStatus },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('PATCH /api/education/grades/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update grade' }, { status: 500 });
  }
}
