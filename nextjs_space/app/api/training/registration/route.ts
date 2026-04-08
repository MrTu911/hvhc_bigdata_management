/**
 * TRAINING REGISTRATION API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.REGISTER_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { courseId, hocVienId } = body;

    if (!courseId || !hocVienId) {
      return NextResponse.json({ error: 'Missing courseId or hocVienId' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!course || !course.isActive) {
      return NextResponse.json({ error: 'Course not found or inactive' }, { status: 404 });
    }

    const hocVien = await prisma.hocVien.findUnique({ where: { id: hocVienId } });
    if (!hocVien) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const existingRegistration = await prisma.registration.findUnique({
      where: { hocVienId_courseId: { hocVienId, courseId } },
    });

    if (existingRegistration) {
      return NextResponse.json({ error: 'Already registered for this course', status: existingRegistration.status }, { status: 409 });
    }

    if (course._count.registrations >= course.maxStudents) {
      return NextResponse.json({ error: 'Course is full', maxStudents: course.maxStudents }, { status: 409 });
    }

    const registration = await prisma.registration.create({
      data: { hocVienId, courseId, status: 'PENDING' },
      include: {
        course: { select: { code: true, name: true, credits: true, semester: true, year: true } },
        hocVien: { select: { maHocVien: true, hoTen: true, lop: true } },
      },
    });

    await prisma.course.update({ where: { id: courseId }, data: { currentStudents: { increment: 1 } } });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.REGISTER_COURSE,
      action: 'CREATE',
      resourceType: 'REGISTRATION',
      resourceId: registration.id,
      newValue: { studentId: hocVien.maHocVien, courseCode: course.code },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'Registration successful', registration }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/training/registration error:', error);
    return NextResponse.json({ error: 'Failed to register', details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.VIEW);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        course: { select: { code: true, name: true, credits: true, semester: true, year: true } },
        hocVien: { select: { maHocVien: true, hoTen: true, lop: true, email: true } },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return NextResponse.json(registrations);
  } catch (error: any) {
    console.error('GET /api/training/registration error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.APPROVE_GRADE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, status, rejectedReason } = body;

    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });

    const updateData: any = { status, approvedBy: user!.id, approvedAt: new Date() };
    if (status === 'REJECTED' && rejectedReason) updateData.rejectedReason = rejectedReason;

    const registration = await prisma.registration.update({
      where: { id },
      data: updateData,
      include: {
        course: { select: { code: true, name: true } },
        hocVien: { select: { maHocVien: true, hoTen: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.APPROVE_GRADE,
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      resourceType: 'REGISTRATION',
      resourceId: id,
      newValue: { studentId: registration.hocVien.maHocVien, courseCode: registration.course.code, newStatus: status },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(registration);
  } catch (error: any) {
    console.error('PUT /api/training/registration error:', error);
    return NextResponse.json({ error: 'Failed to update registration', details: error.message }, { status: 500 });
  }
}
