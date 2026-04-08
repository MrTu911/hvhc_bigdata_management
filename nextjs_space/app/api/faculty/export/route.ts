/**
 * API: Export Faculty List
 * RBAC v8.8: Migrated to function-based RBAC + Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Export faculty list to Excel or CSV
export async function GET(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xuất dữ liệu giảng viên (auto rate limiting)
    const authResult = await requireFunction(req, FACULTY.EXPORT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx'; // xlsx or csv
    const departmentId = searchParams.get('departmentId');
    const academicRank = searchParams.get('academicRank');
    const academicDegree = searchParams.get('academicDegree');

    // Build where clause
    const where: any = {
      role: {
        in: ['GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'CHU_NHIEM_BO_MON']
      }
    };

    // Get faculty list with filters
    const faculty = await prisma.user.findMany({
      where,
      include: {
        facultyProfile: {
          where: {
            ...(departmentId && { departmentId }),
            ...(academicRank && { academicRank }),
            ...(academicDegree && { academicDegree })
          },
          include: {
            unit: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Filter out users without profiles if filters are applied
    const filteredFaculty = (departmentId || academicRank || academicDegree)
      ? faculty.filter(f => f.facultyProfile !== null)
      : faculty;

    // Prepare data for export
    const exportData = filteredFaculty.map((member) => ({
      'Họ tên': member.name,
      'Email': member.email,
      'Mã số': member.militaryId || 'N/A',
      'Vai trò': member.role,
      'Khoa/Phòng': member.facultyProfile?.unit?.name || 'N/A',
      'Học hàm': member.facultyProfile?.academicRank || 'N/A',
      'Học vị': member.facultyProfile?.academicDegree || 'N/A',
      'Chuyên ngành': member.facultyProfile?.specialization || 'N/A',
      'Số đề tài NC': member.facultyProfile?.researchProjects || 0,
      'Số công bố': member.facultyProfile?.publications || 0,
      'Số trích dẫn': member.facultyProfile?.citations || 0,
      'Kinh nghiệm giảng dạy (năm)': member.facultyProfile?.teachingExperience || 0,
      'Kinh nghiệm thực tiễn (năm)': member.facultyProfile?.industryExperience || 0,
      'Trạng thái': member.facultyProfile?.isActive ? 'Hoạt động' : 'Không hoạt động'
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Giảng viên');

    // Generate file
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      buffer = Buffer.from(csv, 'utf-8');
      contentType = 'text/csv';
      filename = `danh-sach-giang-vien-${Date.now()}.csv`;
    } else {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `danh-sach-giang-vien-${Date.now()}.xlsx`;
    }

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.EXPORT,
      action: 'EXPORT',
      resourceType: 'FACULTY_LIST',
      result: 'SUCCESS',
      newValue: {
        format,
        count: filteredFaculty.length,
        filters: { departmentId, academicRank, academicDegree }
      }
    });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error('Error exporting faculty list:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
