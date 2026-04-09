/**
 * M10 – UC-51: Chi tiết & cập nhật hồ sơ người học
 * GET   /api/education/students/[id]
 * PATCH /api/education/students/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getItemByCode, getItemsByCategory } from '@/lib/master-data-cache';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_STUDENT);
    if (!auth.allowed) return auth.response!;

    const { id } = params;

    const hocVien = await prisma.hocVien.findFirst({
      where: { id, deletedAt: null },
      include: {
        currentProgramVersion: {
          include: { program: { select: { id: true, code: true, name: true } } },
        },
        giangVienHuongDan: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        cohort: { select: { id: true, name: true, code: true } },
        studentClass: { select: { id: true, name: true, code: true } },
        major: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            classEnrollments: true,   // M10 source of truth
            ketQuaHocTap: true,       // legacy LAN – chỉ đếm, không expand
            conductRecords: true,
          },
        },
      },
    });

    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hocVien });
  } catch (error: any) {
    console.error('GET /api/education/students/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.hocVien.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Whitelist updatable fields – không cho phép sửa maHocVien hoặc userId
    const allowedFields = [
      'hoTen', 'ngaySinh', 'gioiTinh', 'lop', 'khoaHoc', 'nganh',
      'studyMode', 'heDaoTao', 'khoaQuanLy', 'trungDoi', 'daiDoi',
      'currentStatus', 'currentProgramVersionId',
      'giangVienHuongDanId', 'email', 'dienThoai', 'diaChi',
      'cohortId', 'classId', 'majorId',
      'xepLoaiHocLuc', 'tongTinChi', 'tinChiTichLuy',
      'ngayNhapHoc', 'ngayTotNghiep', 'lyDoNghiHoc',
    ] as const;

    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        const val = body[field];
        if (['ngaySinh', 'ngayNhapHoc', 'ngayTotNghiep'].includes(field)) {
          data[field] = val ? new Date(val) : null;
        } else {
          data[field] = val;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Không có field nào được cập nhật' }, { status: 400 });
    }

    // Validate studyMode theo M19 lookup MD_STUDY_MODE
    if ('studyMode' in body && body.studyMode) {
      const validItem = await getItemByCode('MD_STUDY_MODE', body.studyMode);
      if (!validItem) {
        const validItems = await getItemsByCategory('MD_STUDY_MODE', true);
        const validCodes = validItems.map((i: any) => i.code).join(', ');
        return NextResponse.json(
          { success: false, error: `studyMode '${body.studyMode}' không hợp lệ. Giá trị cho phép: ${validCodes}` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.hocVien.update({ where: { id }, data });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.UPDATE_STUDENT,
      action: 'UPDATE',
      resourceType: 'HOC_VIEN',
      resourceId: id,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/education/students/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update student' }, { status: 500 });
  }
}
