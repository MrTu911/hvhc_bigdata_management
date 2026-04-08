/**
 * API: Export Student List
 * RBAC v8.8: Migrated to function-based RBAC + Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Xuất danh sách học viên ra Excel/CSV
export async function GET(request: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xuất dữ liệu học viên (auto rate limiting)
    const authResult = await requireFunction(request, STUDENT.EXPORT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx'; // xlsx or csv
    const khoaHoc = searchParams.get('khoaHoc') || '';
    const lop = searchParams.get('lop') || '';
    const nganh = searchParams.get('nganh') || '';
    const trangThai = searchParams.get('trangThai') || '';

    // Build where clause
    const where: any = {};
    if (khoaHoc) where.khoaHoc = khoaHoc;
    if (lop) where.lop = lop;
    if (nganh) where.nganh = nganh;
    if (trangThai) where.trangThai = trangThai;

    // Get students
    const students = await prisma.hocVien.findMany({
      where,
      include: {
        giangVienHuongDan: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            ketQuaHocTap: true,
          },
        },
      },
      orderBy: {
        maHocVien: 'asc',
      },
    });

    // Prepare data for export
    const exportData = students.map((student, index) => ({
      STT: index + 1,
      'Mã học viên': student.maHocVien,
      'Họ tên': student.hoTen,
      'Ngày sinh': student.ngaySinh ? new Date(student.ngaySinh).toLocaleDateString('vi-VN') : '',
      'Giới tính': student.gioiTinh || '',
      'Lớp': student.lop || '',
      'Khóa học': student.khoaHoc || '',
      'Ngành': student.nganh || '',
      'Email': student.email || '',
      'Điện thoại': student.dienThoai || '',
      'Điểm TB': student.diemTrungBinh.toFixed(2),
      'Trạng thái': student.trangThai,
      'GVHD': student.giangVienHuongDan?.user.name || '',
      'Số môn học': student._count.ketQuaHocTap,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 15 }, // Mã
      { wch: 25 }, // Họ tên
      { wch: 12 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 10 }, // Lớp
      { wch: 10 }, // Khóa
      { wch: 20 }, // Ngành
      { wch: 25 }, // Email
      { wch: 12 }, // Điện thoại
      { wch: 10 }, // Điểm TB
      { wch: 12 }, // Trạng thái
      { wch: 20 }, // GVHD
      { wch: 10 }, // Số môn
    ];

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: STUDENT.EXPORT,
      action: 'EXPORT',
      resourceType: 'STUDENT_LIST',
      result: 'SUCCESS',
      newValue: {
        format,
        count: students.length,
        filters: { khoaHoc, lop, nganh, trangThai }
      }
    });

    if (format === 'csv') {
      // Export as CSV
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="students_${Date.now()}.csv"`,
        },
      });
    } else {
      // Export as Excel
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học viên');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="students_${Date.now()}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting students:', error);
    return NextResponse.json(
      { error: 'Failed to export students', details: error.message },
      { status: 500 }
    );
  }
}
