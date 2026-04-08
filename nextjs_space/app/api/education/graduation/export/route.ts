/**
 * M10 – UC-60: Xuất danh sách tốt nghiệp / văn bằng → M18 Export Engine
 * POST /api/education/graduation/export
 *
 * Body:
 * - auditIds: string[]   – danh sách graduation audit ids cần xuất
 * - format: 'XLSX' | 'PDF'
 * - templateId?: string  – M18 template id (nếu có)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.EXPORT_GRADUATION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const { auditIds, format = 'XLSX' } = body;

    if (!auditIds || !Array.isArray(auditIds) || auditIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'auditIds là bắt buộc và phải là mảng không rỗng' },
        { status: 400 }
      );
    }

    const audits = await prisma.graduationAudit.findMany({
      where: { id: { in: auditIds } },
      include: {
        hocVien: {
          select: {
            maHocVien: true, hoTen: true, ngaySinh: true,
            lop: true, khoaHoc: true, nganh: true,
            currentProgramVersion: {
              include: { program: { select: { name: true, degreeLevel: true } } },
            },
          },
        },
        diplomaRecord: {
          select: { diplomaNo: true, diplomaType: true, classification: true, graduationDate: true },
        },
      },
      orderBy: { hocVien: { maHocVien: 'asc' } },
    });

    if (format === 'XLSX') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'HVHC BigData – M10';
      wb.created = new Date();

      const ws = wb.addWorksheet('Danh sách tốt nghiệp');

      // Header
      ws.columns = [
        { header: 'STT',           key: 'stt',          width: 6  },
        { header: 'Mã học viên',   key: 'maHocVien',    width: 14 },
        { header: 'Họ tên',        key: 'hoTen',        width: 24 },
        { header: 'Ngày sinh',     key: 'ngaySinh',     width: 12 },
        { header: 'Lớp',           key: 'lop',          width: 10 },
        { header: 'Khóa',          key: 'khoaHoc',      width: 8  },
        { header: 'Chương trình',  key: 'program',      width: 28 },
        { header: 'Ngày xét TN',   key: 'auditDate',    width: 14 },
        { header: 'GPA',           key: 'gpa',          width: 8  },
        { header: 'Tín chỉ đạt',   key: 'credits',      width: 10 },
        { header: 'Đủ điều kiện',  key: 'eligible',     width: 14 },
        { header: 'Số văn bằng',   key: 'diplomaNo',    width: 16 },
        { header: 'Xếp loại TN',   key: 'classification',width: 14 },
        { header: 'Ngày TN',       key: 'graduationDate',width: 12 },
      ];

      // Style header row
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' },
      };

      audits.forEach((a, idx) => {
        ws.addRow({
          stt:            idx + 1,
          maHocVien:      a.hocVien.maHocVien,
          hoTen:          a.hocVien.hoTen,
          ngaySinh:       a.hocVien.ngaySinh
            ? new Date(a.hocVien.ngaySinh).toLocaleDateString('vi-VN')
            : '',
          lop:            a.hocVien.lop ?? '',
          khoaHoc:        a.hocVien.khoaHoc ?? '',
          program:        a.hocVien.currentProgramVersion?.program?.name ?? a.hocVien.nganh ?? '',
          auditDate:      new Date(a.auditDate).toLocaleDateString('vi-VN'),
          gpa:            a.gpa?.toFixed(2) ?? '',
          credits:        a.totalCreditsEarned ?? '',
          eligible:       a.graduationEligible ? 'Đủ điều kiện' : 'Chưa đủ',
          diplomaNo:      a.diplomaRecord?.diplomaNo ?? '',
          classification: a.diplomaRecord?.classification ?? '',
          graduationDate: a.diplomaRecord?.graduationDate
            ? new Date(a.diplomaRecord.graduationDate).toLocaleDateString('vi-VN')
            : '',
        });
      });

      const buffer = await wb.xlsx.writeBuffer();

      await logAudit({
        userId: user!.id,
        functionCode: EDUCATION.EXPORT_GRADUATION,
        action: 'EXPORT',
        resourceType: 'GRADUATION_AUDIT',
        resourceId: 'batch',
        newValue: { count: audits.length, format },
        result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="danh-sach-tot-nghiep-${Date.now()}.xlsx"`,
        },
      });
    }

    // PDF / other formats → giao M18 (TODO khi M18 hoàn thiện)
    return NextResponse.json(
      { success: false, error: `Format '${format}' chưa hỗ trợ. Dùng XLSX hoặc chờ M18 integration.` },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('POST /api/education/graduation/export error:', error);
    return NextResponse.json({ success: false, error: 'Failed to export graduation list' }, { status: 500 });
  }
}
