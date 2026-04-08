import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.EDUCATION.VIEW_TERM);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const search = searchParams.get('search') || '';
    const lop = searchParams.get('lop') || '';
    const khoaHoc = searchParams.get('khoaHoc') || '';

    // Build where clause
    const where: any = {};
    
    if (facultyId) {
      where.giangVienHuongDanId = facultyId;
    }
    
    if (search) {
      where.OR = [
        { hoTen: { contains: search, mode: 'insensitive' } },
        { maHocVien: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (lop) {
      where.lop = lop;
    }
    
    if (khoaHoc) {
      where.khoaHoc = khoaHoc;
    }

    // Get students with guidance
    const students = await prisma.hocVien.findMany({
      where,
      include: {
        giangVienHuongDan: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        ketQuaHocTap: {
          select: {
            monHoc: true,
            diemTongKet: true,
            xepLoai: true
          }
        }
      },
      orderBy: { hoTen: 'asc' }
    });

    // Get available filters
    const [classes, courses] = await Promise.all([
      prisma.hocVien.findMany({
        distinct: ['lop'],
        select: { lop: true },
        where: { lop: { not: null } }
      }),
      prisma.hocVien.findMany({
        distinct: ['khoaHoc'],
        select: { khoaHoc: true },
        where: { khoaHoc: { not: null } }
      })
    ]);

    // Get faculty list for assignment
    const facultyList = await prisma.facultyProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { user: { name: 'asc' } }
    });

    // Calculate stats
    const studentsWithGrade = students.map(s => {
      const grades = s.ketQuaHocTap.filter(k => k.diemTongKet !== null);
      const avgGrade = grades.length > 0
        ? grades.reduce((sum, k) => sum + (k.diemTongKet || 0), 0) / grades.length
        : null;
      return {
        ...s,
        avgGrade,
        totalSubjects: grades.length
      };
    });

    return NextResponse.json({
      students: studentsWithGrade,
      filters: {
        classes: classes.map(c => c.lop).filter(Boolean),
        courses: courses.map(c => c.khoaHoc).filter(Boolean)
      },
      facultyList: facultyList.map(f => ({
        id: f.id,
        name: f.user.name,
        email: f.user.email,
        academicDegree: f.academicDegree,
        academicRank: f.academicRank
      }))
    });
  } catch (error) {
    console.error('Error fetching student guidance:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.EDUCATION.MANAGE_TERM);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { studentId, facultyId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Thiếu mã học viên' },
        { status: 400 }
      );
    }

    const updated = await prisma.hocVien.update({
      where: { id: studentId },
      data: {
        giangVienHuongDanId: facultyId || null
      },
      include: {
        giangVienHuongDan: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      student: updated
    });
  } catch (error) {
    console.error('Error updating student guidance:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật' },
      { status: 500 }
    );
  }
}
