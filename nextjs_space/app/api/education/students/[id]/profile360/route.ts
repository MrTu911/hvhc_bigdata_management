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

    // ── M10 source of truth: ClassEnrollment (ghi điểm từ đây về sau) ──────
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

    // ── Legacy LAN data: KetQuaHocTap (chỉ đọc, không ghi mới vào đây) ────
    // Học viên nhập học trước M10 sẽ có dữ liệu ở đây.
    // Học viên mới hoàn toàn sẽ có dữ liệu ở ClassEnrollment.
    const legacyGrades = await prisma.ketQuaHocTap.findMany({
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

    // ── Rèn luyện ──────────────────────────────────────────────────────────
    const conductRecords = await prisma.studentConductRecord.findMany({
      where: { hocVienId: id },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    });

    // ── Summary stats ───────────────────────────────────────────────────────
    // totalCreditsEarned: dùng hocVien.tinChiTichLuy (field canonical, cùng nguồn graduation engine).
    // Không tái tính từ KetQuaHocTap để tránh dual source of truth.
    const totalCreditsEarned = hocVien.tinChiTichLuy ?? 0;

    const latestConduct = conductRecords[0] ?? null;

    const m10SubjectCount = classEnrollments.length;
    const legacySubjectCount = legacyGrades.length;
    // Tổng số môn: ưu tiên M10 nếu có, fallback sang legacy
    const totalSubjectCount = m10SubjectCount > 0 ? m10SubjectCount : legacySubjectCount;

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
          totalCreditsEarned,           // canonical: hocVien.tinChiTichLuy
          currentGPA: hocVien.diemTrungBinh,
          conductGrade: latestConduct?.conductGrade ?? null,
          conductScore: latestConduct?.conductScore ?? null,
          enrollmentCount: totalSubjectCount,
          m10SubjectCount,
          legacySubjectCount,
        },
        // M10 backbone – write path chính thức
        classEnrollments,
        // Legacy LAN import – read-only, chỉ hiển thị nếu có
        legacyGrades: legacyGrades.length > 0 ? legacyGrades : undefined,
        conductRecords,
        _pendingIntegrations: pendingIntegrations,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/students/[id]/profile360 error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile360' }, { status: 500 });
  }
}
