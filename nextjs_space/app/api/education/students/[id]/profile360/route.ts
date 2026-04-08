/**
 * M10 – UC-51: Hồ sơ 360° học viên toàn trình
 * GET /api/education/students/[id]/profile360
 *
 * Shell hiện tại tổng hợp các nguồn dữ liệu đã có.
 * Integration với thesis/graduation/warning sẽ bổ sung ở Phase 4.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_STUDENT_PROFILE360);
    if (!auth.allowed) return auth.response!;

    const { id } = params;

    // Hồ sơ gốc
    const hocVien = await prisma.hocVien.findFirst({
      where: { id, deletedAt: null },
      include: {
        currentProgramVersion: {
          include: { program: { select: { id: true, code: true, name: true, degreeLevel: true } } },
        },
        giangVienHuongDan: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        cohort: { select: { id: true, name: true, code: true } },
        studentClass: { select: { id: true, name: true, code: true } },
        major: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Kết quả học tập (tối đa 100 bản ghi gần nhất)
    const ketQuaHocTap = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId: id },
      orderBy: [{ namHoc: 'desc' }, { hocKy: 'desc' }],
      take: 100,
      select: {
        id: true,
        monHoc: true,
        maMon: true,
        diem: true,
        diemTongKet: true,
        hocKy: true,
        namHoc: true,
        ketQua: true,
        xepLoai: true,
        soTinChi: true,
        workflowStatus: true,
      },
    });

    // Điểm rèn luyện
    const conductRecords = await prisma.studentConductRecord.findMany({
      where: { hocVienId: id },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    });

    // Đăng ký lớp học phần
    const classEnrollments = await prisma.classEnrollment.findMany({
      where: { hocVienId: id },
      include: {
        classSection: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            term: { select: { id: true, code: true, name: true } },
            curriculumCourse: { select: { subjectCode: true, subjectName: true, credits: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 50,
    });

    // Tổng hợp thống kê cơ bản
    const totalCreditsEarned = ketQuaHocTap
      .filter(k => k.ketQua && !['Yếu', 'Kém'].includes(k.ketQua))
      .reduce((sum, k) => sum + (k.soTinChi || 0), 0);

    const latestConduct = conductRecords[0] ?? null;

    // Placeholder cho các section chờ Phase 4
    const pendingIntegrations = {
      academicWarnings: '// TODO: Phase 4 – UC-57 AcademicWarning',
      thesis: '// TODO: Phase 4 – UC-59 ThesisProject',
      graduation: '// TODO: Phase 4 – UC-60 GraduationAudit',
      diplomas: '// TODO: Phase 4 – UC-60 DiplomaRecord',
    };

    return NextResponse.json({
      success: true,
      data: {
        profile: hocVien,
        summary: {
          totalCreditsEarned,
          currentGPA: hocVien.diemTrungBinh,
          conductGrade: latestConduct?.conductGrade ?? null,
          conductScore: latestConduct?.conductScore ?? null,
          enrollmentCount: classEnrollments.length,
          subjectCount: ketQuaHocTap.length,
        },
        ketQuaHocTap,
        conductRecords,
        classEnrollments,
        _pendingIntegrations: pendingIntegrations,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/students/[id]/profile360 error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile360' }, { status: 500 });
  }
}
