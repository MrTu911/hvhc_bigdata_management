/**
 * M10 – UC-51: Chi tiết & cập nhật hồ sơ người học
 * GET    /api/education/students/[id]
 * PATCH  /api/education/students/[id]
 * DELETE /api/education/students/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  getStudentById,
  updateStudent,
  softDeleteStudent,
  ServiceValidationError,
  ServiceNotFoundError,
  type UpdateStudentData,
} from '@/lib/services/education/student-profile.service';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_STUDENT);
    if (!auth.allowed) return auth.response!;

    const hocVien = await getStudentById(params.id);
    return NextResponse.json({ success: true, data: hocVien });
  } catch (error: any) {
    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('GET /api/education/students/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();

    // Whitelist updatable fields — không cho phép sửa maHocVien hoặc userId
    const allowedFields = [
      'hoTen', 'ngaySinh', 'gioiTinh', 'lop', 'khoaHoc', 'nganh',
      'studyMode', 'heDaoTao', 'khoaQuanLy', 'trungDoi', 'daiDoi',
      'trainingSystemUnitId', 'battalionUnitId',
      'currentStatus', 'currentProgramVersionId',
      'giangVienHuongDanId', 'email', 'dienThoai', 'diaChi',
      'cohortId', 'classId', 'majorId',
      'xepLoaiHocLuc', 'tongTinChi', 'tinChiTichLuy',
      'ngayNhapHoc', 'ngayTotNghiep', 'lyDoNghiHoc',
    ] as const;

    const data: UpdateStudentData = {};
    for (const field of allowedFields) {
      if (field in body) {
        (data as any)[field] = body[field];
      }
    }

    const { existing, updated } = await updateStudent(params.id, data);

    await logAudit({
      userId:       user!.id,
      functionCode: EDUCATION.UPDATE_STUDENT,
      action:       'UPDATE',
      resourceType: 'HOC_VIEN',
      resourceId:   params.id,
      oldValue:     existing,
      newValue:     updated,
      result:       'SUCCESS',
      ipAddress:    req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof ServiceValidationError || error instanceof ServiceNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('PATCH /api/education/students/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const deleted = await softDeleteStudent(params.id);

    await logAudit({
      userId:       user!.id,
      functionCode: EDUCATION.UPDATE_STUDENT,
      action:       'DELETE',
      resourceType: 'HOC_VIEN',
      resourceId:   params.id,
      oldValue:     { maHocVien: deleted.maHocVien, hoTen: deleted.hoTen },
      result:       'SUCCESS',
      ipAddress:    req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, message: `Đã xóa học viên ${deleted.maHocVien}` });
  } catch (error: any) {
    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('DELETE /api/education/students/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete student' }, { status: 500 });
  }
}
