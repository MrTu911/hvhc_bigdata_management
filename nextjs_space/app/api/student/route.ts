/**
 * @deprecated Dùng /api/education/students/ thay thế (M10 backbone).
 * Route này sẽ bị tắt vào 2026-10-01. Không mở rộng thêm.
 *
 * CSDL Học viên - Student API
 * Quản lý học viên với filters và pagination
 *
 * RBAC: Function-based RBAC với Scope filtering
 * M07 scope enforcement: giảng viên (SELF scope) chỉ thấy HV cố vấn/lớp đang dạy.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { StudentService, StudentFilters } from '@/lib/services';
import { logAudit } from '@/lib/audit';
import { FunctionScope, UserRole } from '@prisma/client';
import { buildStudentScopeFilter } from '@/lib/services/student/student-scope.service';

// GET: Danh sách học viên với filters và pagination
export async function GET(request: NextRequest) {
  try {
    // RBAC Check với Scope: VIEW_STUDENT
    const { user, scopedOptions, scope, response } = await requireScopedFunction(request, STUDENT.VIEW);
    if (!user) {
      return response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const khoaHoc = searchParams.get('khoaHoc') || '';
    const lop = searchParams.get('lop') || '';
    const nganh = searchParams.get('nganh') || '';
    const trangThai = searchParams.get('trangThai') || '';

    // ── M07 Scope enforcement ──────────────────────────────────────────────
    // Với scope SELF hoặc UNIT, resolve danh sách HV được phép xem.
    // ACADEMY = không restrict. DEPARTMENT = unit filter (handled by scope service).
    const effectiveScope = (scope ?? 'ACADEMY') as FunctionScope;
    let allowedHocVienIds: string[] | null = null;

    if (effectiveScope !== FunctionScope.ACADEMY) {
      const scopeFilter = await buildStudentScopeFilter(user, effectiveScope);
      // Nếu filter trả về { id: { in: [...] } } → extract danh sách ids
      const whereId = (scopeFilter.where as any).id;
      if (whereId?.in != null) {
        allowedHocVienIds = whereId.in as string[];
      } else if (scopeFilter.where.OR) {
        // DEPARTMENT / UNIT scope filter dùng OR (khoaQuanLy / classId)
        // Truy vấn DB để resolve thành id list (đảm bảo không lộ data ngoài scope)
        const hvsInScope = await prisma.hocVien.findMany({
          where: scopeFilter.where as any,
          select: { id: true },
        });
        allowedHocVienIds = hvsInScope.map((h) => h.id);
      }
      // Nếu where = {} (SELF_ADMIN fallback) → allowedHocVienIds = null (không restrict)
    }

    const filters: StudentFilters = {
      ...(search && { search }),
      ...(khoaHoc && { khoaHoc }),
      ...(lop && { lop }),
      ...(nganh && { nganh }),
      ...(trangThai && { trangThai }),
      allowedHocVienIds,
    };

    const options = scopedOptions || {
      user,
      scope: 'ACADEMY' as const,
    };

    const result = await StudentService.findMany(
      options,
      filters,
      { page, limit, sortBy: 'createdAt', sortOrder: 'desc' }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_LIST',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      students: result.data,
      pagination: result.meta,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Tạo học viên mới
export async function POST(request: NextRequest) {
  try {
    // RBAC Check với Scope: CREATE_STUDENT
    const { user, response } = await requireScopedFunction(request, STUDENT.CREATE);
    if (!user) {
      return response!;
    }

    const data = await request.json();

    // Validate required fields
    if (!data.maHocVien || !data.hoTen) {
      return NextResponse.json(
        { error: 'Mã học viên và họ tên là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if student code already exists
    const existing = await prisma.hocVien.findUnique({
      where: { maHocVien: data.maHocVien },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Mã học viên đã tồn tại' },
        { status: 400 }
      );
    }

    // Lookup FK values for cohort, class, major
    let cohortText = data.khoaHoc;
    let classText = data.lop;
    let majorText = data.nganh;
    
    // If cohortId is provided, get the cohort name
    if (data.cohortId) {
      const cohort = await prisma.cohort.findUnique({ where: { id: data.cohortId } });
      if (cohort) cohortText = cohort.code;
    }
    
    // If classId is provided, get the class name
    if (data.classId) {
      const studentClass = await prisma.studentClass.findUnique({ where: { id: data.classId } });
      if (studentClass) classText = studentClass.code;
    }
    
    // If majorId is provided, get the major name
    if (data.majorId) {
      const major = await prisma.specializationCatalog.findUnique({ where: { id: data.majorId } });
      if (major) majorText = major.name;
    }

    const student = await prisma.hocVien.create({
      data: {
        maHocVien: data.maHocVien,
        hoTen: data.hoTen,
        ngaySinh: data.ngaySinh ? new Date(data.ngaySinh) : null,
        gioiTinh: data.gioiTinh,
        // Legacy text fields (for backward compatibility)
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
        trangThai: data.trangThai || 'Đang học',
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

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.CREATE,
      action: 'CREATE',
      resourceType: 'STUDENT',
      resourceId: student.id,
      newValue: { maHocVien: data.maHocVien, hoTen: data.hoTen },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student', details: errorMessage },
      { status: 500 }
    );
  }
}
