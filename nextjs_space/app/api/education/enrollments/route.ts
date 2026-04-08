/**
 * ENROLLMENTS API - Quản lý ghi danh lớp học phần
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_ENROLLMENT);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const classSectionId = searchParams.get('classSectionId');
    const hocVienId = searchParams.get('hocVienId');
    const status = searchParams.get('status');

    const where: any = {};
    if (classSectionId) where.classSectionId = classSectionId;
    if (hocVienId) where.hocVienId = hocVienId;
    if (status) where.status = status;

    const enrollments = await prisma.classEnrollment.findMany({
      where,
      include: {
        classSection: {
          select: { id: true, code: true, name: true, curriculumCourse: { select: { subjectCode: true, subjectName: true, credits: true } } }
        },
        hocVien: { select: { id: true, maHocVien: true, hoTen: true, lop: true, khoaHoc: true } },
        _count: { select: { attendances: true } }
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json(enrollments);
  } catch (error: any) {
    console.error('GET /api/education/enrollments error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_ENROLLMENT);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { action, classSectionId, hocVienIds } = body;

    // Batch enroll
    if (action === 'batch' && hocVienIds && hocVienIds.length > 0) {
      const classSection = await prisma.classSection.findUnique({ where: { id: classSectionId } });
      if (!classSection) return NextResponse.json({ error: 'Class section not found' }, { status: 404 });

      const currentCount = await prisma.classEnrollment.count({ where: { classSectionId, status: 'ENROLLED' as const } });
      const availableSlots = classSection.maxStudents - currentCount;

      if (hocVienIds.length > availableSlots) {
        return NextResponse.json({ error: `Only ${availableSlots} slots available` }, { status: 400 });
      }

      const enrollments = [];
      for (const hocVienId of hocVienIds) {
        const existing = await prisma.classEnrollment.findUnique({
          where: { classSectionId_hocVienId: { classSectionId, hocVienId } }
        });
        if (!existing) {
          enrollments.push({ classSectionId, hocVienId, status: 'ENROLLED' as const });
        }
      }

      if (enrollments.length > 0) {
        await prisma.classEnrollment.createMany({ data: enrollments });
        await prisma.classSection.update({
          where: { id: classSectionId },
          data: { currentStudents: currentCount + enrollments.length }
        });
      }

      return NextResponse.json({ enrolled: enrollments.length }, { status: 201 });
    }

    // Single enroll
    const { hocVienId } = body;
    if (!classSectionId || !hocVienId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.classEnrollment.findUnique({
      where: { classSectionId_hocVienId: { classSectionId, hocVienId } }
    });
    if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });

    const classSection = await prisma.classSection.findUnique({ where: { id: classSectionId } });
    if (!classSection) return NextResponse.json({ error: 'Class section not found' }, { status: 404 });
    if (classSection.currentStudents >= classSection.maxStudents) {
      return NextResponse.json({ error: 'Class section is full' }, { status: 400 });
    }

    const enrollment = await prisma.classEnrollment.create({
      data: { classSectionId, hocVienId, status: 'ENROLLED' as const },
    });

    await prisma.classSection.update({
      where: { id: classSectionId },
      data: { currentStudents: { increment: 1 } }
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.MANAGE_ENROLLMENT,
      action: 'CREATE', resourceType: 'CLASS_ENROLLMENT', resourceId: enrollment.id,
      newValue: { classSectionId, hocVienId }, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/enrollments error:', error);
    return NextResponse.json({ error: 'Failed to enroll', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_ENROLLMENT);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, action, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.classEnrollment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

    // Withdraw
    if (action === 'withdraw') {
      const enrollment = await prisma.classEnrollment.update({
        where: { id },
        data: { status: 'WITHDRAWN', withdrawnAt: new Date(), withdrawReason: updateData.withdrawReason },
      });
      await prisma.classSection.update({
        where: { id: existing.classSectionId },
        data: { currentStudents: { decrement: 1 } }
      });
      return NextResponse.json(enrollment);
    }

    // Update grades
    if (action === 'grade') {
      const { midtermScore, finalScore, totalScore, letterGrade } = updateData;
      const enrollment = await prisma.classEnrollment.update({
        where: { id },
        data: {
          ...(midtermScore !== undefined && { midtermScore: parseFloat(midtermScore) }),
          ...(finalScore !== undefined && { finalScore: parseFloat(finalScore) }),
          ...(totalScore !== undefined && { totalScore: parseFloat(totalScore) }),
          ...(letterGrade && { letterGrade }),
          gradeStatus: 'GRADED',
          gradedBy: user!.id,
          gradedAt: new Date(),
        },
      });
      return NextResponse.json(enrollment);
    }

    // Regular update
    const enrollment = await prisma.classEnrollment.update({
      where: { id },
      data: {
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
    });

    return NextResponse.json(enrollment);
  } catch (error: any) {
    console.error('PUT /api/education/enrollments error:', error);
    return NextResponse.json({ error: 'Failed to update enrollment', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_ENROLLMENT);
    if (!auth.allowed) return auth.response!;
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.classEnrollment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

    await prisma.classEnrollment.delete({ where: { id } });
    await prisma.classSection.update({
      where: { id: existing.classSectionId },
      data: { currentStudents: { decrement: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/enrollments error:', error);
    return NextResponse.json({ error: 'Failed to delete enrollment', details: error.message }, { status: 500 });
  }
}
