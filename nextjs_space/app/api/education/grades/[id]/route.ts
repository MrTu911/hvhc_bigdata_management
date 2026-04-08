/**
 * M10 – UC-56: Cập nhật điểm học phần
 * PATCH /api/education/grades/[id]
 *
 * [id] = ClassEnrollment.id
 *
 * CRITICAL: Mọi sửa điểm PHẢI ghi ScoreHistory trong cùng transaction.
 * Không được bypass rule này.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

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

    const existing = await prisma.classEnrollment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy enrollment' }, { status: 404 });
    }

    // Không cho phép sửa điểm đã FINALIZED
    if (existing.gradeStatus === 'FINALIZED') {
      return NextResponse.json(
        { success: false, error: 'Không thể sửa điểm đã FINALIZED' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      attendanceScore,
      assignmentScore,
      midtermScore,
      finalScore,
      totalScore,
      passFlag,
      letterGrade,
      gradeStatus,
      notes,
      reason, // lý do sửa (bắt buộc khi gradeStatus hiện tại đã GRADED)
    } = body;

    // Validate điểm không âm
    const scoreFields = { attendanceScore, assignmentScore, midtermScore, finalScore, totalScore };
    for (const [field, val] of Object.entries(scoreFields)) {
      if (val !== undefined && val !== null && (typeof val !== 'number' || val < 0)) {
        return NextResponse.json(
          { success: false, error: `${field} phải là số >= 0` },
          { status: 400 }
        );
      }
    }

    // Build update data (only provided fields)
    const updateData: Record<string, any> = {};
    if (attendanceScore !== undefined) updateData.attendanceScore = attendanceScore;
    if (assignmentScore  !== undefined) updateData.assignmentScore  = assignmentScore;
    if (midtermScore     !== undefined) updateData.midtermScore     = midtermScore;
    if (finalScore       !== undefined) updateData.finalScore       = finalScore;
    if (totalScore       !== undefined) updateData.totalScore       = totalScore;
    if (passFlag         !== undefined) updateData.passFlag         = passFlag;
    if (letterGrade      !== undefined) updateData.letterGrade      = letterGrade;
    if (gradeStatus      !== undefined) updateData.gradeStatus      = gradeStatus;
    if (notes            !== undefined) updateData.notes            = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Không có field nào được cập nhật' }, { status: 400 });
    }

    // Snapshot old values (chỉ score fields)
    const oldValues = {
      attendanceScore: existing.attendanceScore,
      assignmentScore: existing.assignmentScore,
      midtermScore:    existing.midtermScore,
      finalScore:      existing.finalScore,
      totalScore:      existing.totalScore,
      passFlag:        existing.passFlag,
      letterGrade:     existing.letterGrade,
      gradeStatus:     existing.gradeStatus,
    };
    const newValues = { ...oldValues, ...updateData };

    // Gradedby/gradedAt tự động khi có điểm
    const hasScoreChange = [attendanceScore, assignmentScore, midtermScore, finalScore, totalScore]
      .some(v => v !== undefined);
    if (hasScoreChange) {
      updateData.gradedBy = user!.id;
      updateData.gradedAt = new Date();
      if (!gradeStatus || gradeStatus === 'PENDING') {
        updateData.gradeStatus = 'GRADED';
      }
    }

    // Transaction: update enrollment + ghi ScoreHistory (MANDATORY)
    const [updated] = await prisma.$transaction([
      prisma.classEnrollment.update({ where: { id }, data: updateData }),
      prisma.scoreHistory.create({
        data: {
          enrollmentId: id,
          changedBy: user!.id,
          oldValues,
          newValues,
          reason: reason ?? null,
        },
      }),
    ]);

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_GRADE,
      action: 'UPDATE',
      resourceType: 'CLASS_ENROLLMENT_GRADE',
      resourceId: id,
      oldValue: oldValues,
      newValue: newValues,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/education/grades/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update grade' }, { status: 500 });
  }
}
