/**
 * API: Faculty Teaching Subjects
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy danh sách môn giảng của giảng viên
export async function GET(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xem giảng viên
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
    }

    const subjects = await prisma.teachingSubject.findMany({
      where: { facultyId },
      orderBy: { createdAt: 'desc' }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.VIEW,
      action: 'VIEW',
      resourceType: 'TEACHING_SUBJECT',
      resourceId: facultyId,
      result: 'SUCCESS',
    });

    return NextResponse.json({ subjects });
  } catch (error: any) {
    console.error('Error fetching teaching subjects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Thêm môn giảng mới
export async function POST(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền cập nhật giảng viên
    const authResult = await requireFunction(req, FACULTY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const {
      facultyId,
      subjectName,
      subjectCode,
      credits,
      semester,
      academicYear,
      department,
      description,
      syllabus,
      studentCount
    } = body;

    if (!facultyId || !subjectName) {
      return NextResponse.json(
        { error: 'Faculty ID and subject name are required' },
        { status: 400 }
      );
    }

    // Verify faculty profile exists
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { id: facultyId }
    });

    if (!facultyProfile) {
      return NextResponse.json(
        { error: 'Faculty profile not found' },
        { status: 404 }
      );
    }

    const subject = await prisma.teachingSubject.create({
      data: {
        facultyId,
        subjectName,
        subjectCode,
        credits: credits || 0,
        semester,
        academicYear,
        department,
        description,
        syllabus,
        studentCount: studentCount || 0
      }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.UPDATE,
      action: 'CREATE',
      resourceType: 'TEACHING_SUBJECT',
      resourceId: subject.id,
      newValue: subject,
      result: 'SUCCESS',
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating teaching subject:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật môn giảng
export async function PUT(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền cập nhật giảng viên
    const authResult = await requireFunction(req, FACULTY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Get old value for audit
    const oldSubject = await prisma.teachingSubject.findUnique({ where: { id } });

    const subject = await prisma.teachingSubject.update({
      where: { id },
      data: updateData
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'TEACHING_SUBJECT',
      resourceId: id,
      oldValue: oldSubject,
      newValue: subject,
      result: 'SUCCESS',
    });

    return NextResponse.json({ subject });
  } catch (error: any) {
    console.error('Error updating teaching subject:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa môn giảng
export async function DELETE(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xóa giảng viên
    const authResult = await requireFunction(req, FACULTY.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Get old value for audit
    const oldSubject = await prisma.teachingSubject.findUnique({ where: { id } });

    await prisma.teachingSubject.delete({
      where: { id }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'TEACHING_SUBJECT',
      resourceId: id,
      oldValue: oldSubject,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting teaching subject:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
