/**
 * CSDL Học viên - Student Detail API
 * Chi tiết và cập nhật học viên
 * 
 * RBAC Migration: Legacy role checks → Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy thông tin chi tiết học viên
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: VIEW_STUDENT_DETAIL
    const authResult = await requireFunction(request, STUDENT.VIEW_DETAIL, {
      resourceId: params.id,
    });
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const student = await prisma.hocVien.findUnique({
      where: { id: params.id },
      include: {
        giangVienHuongDan: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        cohort: true,
        studentClass: true,
        major: true,
        ketQuaHocTap: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            ketQuaHocTap: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.VIEW_DETAIL,
      action: 'VIEW',
      resourceType: 'STUDENT',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(student);
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật thông tin học viên
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: UPDATE_STUDENT
    const authResult = await requireFunction(request, STUDENT.UPDATE, {
      resourceId: params.id,
    });
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();

    // Check if student exists
    const existing = await prisma.hocVien.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // If updating maHocVien, check it's not taken
    if (data.maHocVien && data.maHocVien !== existing.maHocVien) {
      const duplicate = await prisma.hocVien.findUnique({
        where: { maHocVien: data.maHocVien },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Mã học viên đã tồn tại' },
          { status: 400 }
        );
      }
    }

    // Lookup FK values for cohort, class, major
    let cohortText = data.khoaHoc;
    let classText = data.lop;
    let majorText = data.nganh;
    
    // If cohortId is provided, get the cohort code
    if (data.cohortId) {
      const cohort = await prisma.cohort.findUnique({ where: { id: data.cohortId } });
      if (cohort) cohortText = cohort.code;
    }
    
    // If classId is provided, get the class code
    if (data.classId) {
      const studentClass = await prisma.studentClass.findUnique({ where: { id: data.classId } });
      if (studentClass) classText = studentClass.code;
    }
    
    // If majorId is provided, get the major name
    if (data.majorId) {
      const major = await prisma.specializationCatalog.findUnique({ where: { id: data.majorId } });
      if (major) majorText = major.name;
    }

    const student = await prisma.hocVien.update({
      where: { id: params.id },
      data: {
        maHocVien: data.maHocVien,
        hoTen: data.hoTen,
        ngaySinh: data.ngaySinh ? new Date(data.ngaySinh) : null,
        gioiTinh: data.gioiTinh,
        // Legacy text fields
        lop: classText,
        khoaHoc: cohortText,
        nganh: majorText,
        // FK references
        cohortId: data.cohortId || null,
        classId: data.classId || null,
        majorId: data.majorId || null,
        giangVienHuongDanId: data.giangVienHuongDanId || null,
        email: data.email,
        dienThoai: data.dienThoai,
        diaChi: data.diaChi,
        trangThai: data.trangThai,
      },
      include: {
        giangVienHuongDan: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        cohort: true,
        studentClass: true,
        major: true,
      },
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.UPDATE,
      action: 'UPDATE',
      resourceType: 'STUDENT',
      resourceId: params.id,
      oldValue: { maHocVien: existing.maHocVien, hoTen: existing.hoTen },
      newValue: { maHocVien: student.maHocVien, hoTen: student.hoTen },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(student);
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa học viên
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: DELETE_STUDENT
    const authResult = await requireFunction(request, STUDENT.DELETE, {
      resourceId: params.id,
    });
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Check if student exists
    const existing = await prisma.hocVien.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Delete student (will cascade delete results)
    await prisma.hocVien.delete({
      where: { id: params.id },
    });

    // Audit log with oldValue
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.DELETE,
      action: 'DELETE',
      resourceType: 'STUDENT',
      resourceId: params.id,
      oldValue: { maHocVien: existing.maHocVien, hoTen: existing.hoTen },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ message: 'Xóa học viên thành công' });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student', details: error.message },
      { status: 500 }
    );
  }
}
