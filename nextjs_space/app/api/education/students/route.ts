/**
 * M10 – UC-51: Hồ sơ người học toàn trình
 * GET  /api/education/students  – danh sách học viên
 * POST /api/education/students  – tạo hồ sơ học viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getItemByCode } from '@/lib/master-data-cache';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user, authResult } = auth;

    const { searchParams } = new URL(req.url);
    const search       = searchParams.get('search') || '';
    const currentStatus = searchParams.get('currentStatus');
    const lop          = searchParams.get('lop');
    const khoaHoc      = searchParams.get('khoaHoc');
    const nganh        = searchParams.get('nganh');
    const studyMode    = searchParams.get('studyMode');
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit        = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { hoTen: { contains: search, mode: 'insensitive' } },
        { maHocVien: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (currentStatus) where.currentStatus = currentStatus;
    if (lop) where.lop = lop;
    if (khoaHoc) where.khoaHoc = khoaHoc;
    if (nganh) where.nganh = nganh;
    if (studyMode) where.studyMode = studyMode;

    // Scope SELF: giảng viên chỉ xem học viên mình cố vấn (giangVienHuongDanId)
    // Scope UNIT/DEPARTMENT/ACADEMY: không lọc thêm (function-code guard đã đủ)
    const scope = authResult?.scope ?? 'SELF';
    if (scope === 'SELF' && user) {
      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (facultyProfile) {
        where.giangVienHuongDanId = facultyProfile.id;
      }
      // Không có FacultyProfile (cán bộ phi giảng viên): không lọc thêm
    }

    const [data, total] = await Promise.all([
      prisma.hocVien.findMany({
        where,
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          ngaySinh: true,
          gioiTinh: true,
          lop: true,
          khoaHoc: true,
          nganh: true,
          currentStatus: true,
          studyMode: true,
          heDaoTao: true,
          diemTrungBinh: true,
          tinChiTichLuy: true,
          ngayNhapHoc: true,
          createdAt: true,
          currentProgramVersion: {
            select: { id: true, versionCode: true, effectiveFromCohort: true },
          },
          giangVienHuongDan: {
            select: { id: true, user: { select: { name: true } } },
          },
        },
        orderBy: { maHocVien: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hocVien.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/students error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const {
      maHocVien, hoTen, ngaySinh, gioiTinh,
      lop, khoaHoc, nganh,
      studyMode, heDaoTao,
      khoaQuanLy, trungDoi, daiDoi,
      currentProgramVersionId,
      giangVienHuongDanId,
      email, dienThoai, diaChi,
      cohortId, classId, majorId, userId,
      ngayNhapHoc,
    } = body;

    if (!maHocVien || !hoTen) {
      return NextResponse.json(
        { success: false, error: 'maHocVien và hoTen là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate studyMode theo M19 lookup MD_STUDY_MODE
    if (studyMode) {
      const validItem = await getItemByCode('MD_STUDY_MODE', studyMode);
      if (!validItem) {
        const validItems = await import('@/lib/master-data-cache').then(m =>
          m.getItemsByCategory('MD_STUDY_MODE', true)
        );
        const validCodes = validItems.map((i: any) => i.code).join(', ');
        return NextResponse.json(
          { success: false, error: `studyMode '${studyMode}' không hợp lệ. Giá trị cho phép: ${validCodes}` },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.hocVien.findUnique({ where: { maHocVien } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Học viên ${maHocVien} đã tồn tại` },
        { status: 409 }
      );
    }

    const hocVien = await prisma.hocVien.create({
      data: {
        maHocVien,
        hoTen,
        ngaySinh: ngaySinh ? new Date(ngaySinh) : null,
        gioiTinh,
        lop,
        khoaHoc,
        nganh,
        studyMode: studyMode || null,
        heDaoTao: heDaoTao || null,
        khoaQuanLy: khoaQuanLy || null,
        trungDoi: trungDoi || null,
        daiDoi: daiDoi || null,
        currentStatus: 'ACTIVE',
        currentProgramVersionId: currentProgramVersionId || null,
        giangVienHuongDanId: giangVienHuongDanId || null,
        email: email || null,
        dienThoai: dienThoai || null,
        diaChi: diaChi || null,
        cohortId: cohortId || null,
        classId: classId || null,
        majorId: majorId || null,
        userId: userId || null,
        ngayNhapHoc: ngayNhapHoc ? new Date(ngayNhapHoc) : null,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.CREATE_STUDENT,
      action: 'CREATE',
      resourceType: 'HOC_VIEN',
      resourceId: hocVien.id,
      newValue: { maHocVien, hoTen },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: hocVien }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/students error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create student' }, { status: 500 });
  }
}
