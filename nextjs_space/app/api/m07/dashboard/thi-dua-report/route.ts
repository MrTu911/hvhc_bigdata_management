/**
 * GET /api/m07/dashboard/thi-dua-report
 * M07 UC-38 – Báo cáo thi đua tổng hợp giảng viên – học viên.
 *
 * Query params:
 *   academicYear  – bắt buộc (VD: "2025-2026")
 *   semesterCode  – bắt buộc (HK1 | HK2 | HK3)
 *   unitId        – optional: lọc theo đơn vị/khoa
 *   topN          – optional: số GV top EIS, mặc định 10
 *
 * RBAC: FACULTY.DASHBOARD_VIEW (hoặc STUDENT.DASHBOARD_VIEW – kiểm tra 1 trong 2)
 *
 * Lưu ý nghiệp vụ:
 *   - EIS ranking chỉ là công cụ hỗ trợ, không thay thế quyết định tổ chức-cán bộ.
 *   - Không dùng duy nhất totalEIS để đề xuất thi đua.
 *   - Phải cho drill-down từng thành phần khi cần.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { AcademicPerformanceStatus, WorkloadAlertStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW_STATS);
    if (!authResult.allowed) return authResult.response!;

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const semesterCode = searchParams.get('semesterCode');
    const unitId       = searchParams.get('unitId') ?? undefined;
    const topN         = Math.min(50, Math.max(1, parseInt(searchParams.get('topN') ?? '10', 10)));

    if (!academicYear || !semesterCode) {
      return NextResponse.json(
        { success: false, error: 'academicYear và semesterCode là bắt buộc' },
        { status: 400 },
      );
    }

    // ── Parallel load toàn bộ data nguồn ─────────────────────────────────────
    const [
      facultyKpis,
      eisRanking,
      workloadSummary,
      studentKpis,
      gpaDistribution,
      academicWarningStats,
      topStudents,
      atRiskStudents,
    ] = await Promise.all([
      loadFacultyKpis(academicYear, semesterCode, unitId),
      loadEisRanking(academicYear, semesterCode, unitId, topN),
      loadWorkloadSummary(academicYear, semesterCode, unitId),
      loadStudentKpis(academicYear, semesterCode),
      loadGpaDistribution(academicYear, semesterCode),
      loadAcademicWarningStats(academicYear, semesterCode),
      loadTopStudents(academicYear, semesterCode, topN),
      loadAtRiskStudents(academicYear, semesterCode, topN),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        meta: { academicYear, semesterCode, unitId: unitId ?? null, generatedAt: new Date() },
        faculty: {
          kpis: facultyKpis,
          eisRanking,
          workloadSummary,
          note: 'EIS ranking chỉ là công cụ hỗ trợ thi đua, không thay thế quyết định tổ chức-cán bộ.',
        },
        student: {
          kpis: studentKpis,
          gpaDistribution,
          academicWarningStats,
          topStudents,
          atRiskStudents,
        },
      },
    });
  } catch (error: any) {
    console.error('[M07] GET /m07/dashboard/thi-dua-report error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Faculty KPIs ─────────────────────────────────────────────────────────────

async function loadFacultyKpis(academicYear: string, semesterCode: string, unitId?: string) {
  const baseWhere = unitId ? { isActive: true, unitId } : { isActive: true };

  const [totalFaculty, withDoctorateDegree, eisAggregate] = await Promise.all([
    prisma.facultyProfile.count({ where: baseWhere }),
    prisma.facultyProfile.count({
      where: { ...baseWhere, academicDegree: { in: ['Tiến sĩ', 'Phó Giáo sư', 'Giáo sư'] } },
    }),
    prisma.facultyEISScore.aggregate({
      where: {
        academicYear,
        semesterCode,
        ...(unitId ? { facultyProfile: { unitId } } : {}),
      },
      _avg: { totalEIS: true },
      _min: { totalEIS: true },
      _max: { totalEIS: true },
      _count: { id: true },
    }),
  ]);

  // Số GV quá tải / thiếu tải
  const [overloadCount, underloadCount] = await Promise.all([
    prisma.facultyWorkloadAlert.count({
      where: {
        status: WorkloadAlertStatus.OPEN,
        alertType: 'OVERLOAD',
        snapshot: { academicYear, semesterCode, ...(unitId ? { facultyProfile: { unitId } } : {}) },
      },
    }),
    prisma.facultyWorkloadAlert.count({
      where: {
        status: WorkloadAlertStatus.OPEN,
        alertType: 'UNDERLOAD',
        snapshot: { academicYear, semesterCode, ...(unitId ? { facultyProfile: { unitId } } : {}) },
      },
    }),
  ]);

  const doctorateRate =
    totalFaculty > 0 ? parseFloat(((withDoctorateDegree / totalFaculty) * 100).toFixed(1)) : 0;

  return {
    totalFaculty,
    withDoctorateDegree,
    doctorateRate,
    eisRecordsThisSemester: eisAggregate._count.id,
    avgEIS: eisAggregate._avg.totalEIS != null ? parseFloat(eisAggregate._avg.totalEIS.toFixed(2)) : null,
    maxEIS: eisAggregate._max.totalEIS,
    minEIS: eisAggregate._min.totalEIS,
    overloadCount,
    underloadCount,
    participatingInAdvisory: await prisma.hocVien.groupBy({
      by: ['giangVienHuongDanId'],
      where: { giangVienHuongDanId: { not: null } },
      _count: true,
    }).then((r) => r.length),
  };
}

// ─── EIS Ranking ─────────────────────────────────────────────────────────────

async function loadEisRanking(
  academicYear: string,
  semesterCode: string,
  unitId: string | undefined,
  topN: number,
) {
  const records = await prisma.facultyEISScore.findMany({
    where: {
      academicYear,
      semesterCode,
      ...(unitId ? { facultyProfile: { unitId } } : {}),
    },
    orderBy: { totalEIS: 'desc' },
    take: topN,
    select: {
      totalEIS: true,
      teachingScore: true,
      researchScore: true,
      mentoringScore: true,
      serviceScore: true,
      innovationScore: true,
      developmentScore: true,
      trend: true,
      facultyProfile: {
        select: {
          id: true,
          academicDegree: true,
          academicRank: true,
          user: { select: { name: true, militaryId: true } },
          unit: { select: { name: true, code: true } },
        },
      },
    },
  });

  return records.map((r, idx) => ({
    rank: idx + 1,
    facultyProfileId: r.facultyProfile.id,
    name: r.facultyProfile.user.name,
    militaryId: r.facultyProfile.user.militaryId,
    academicDegree: r.facultyProfile.academicDegree,
    unit: r.facultyProfile.unit,
    totalEIS: r.totalEIS,
    trend: r.trend,
    dimensions: {
      T: r.teachingScore,
      R: r.researchScore,
      M: r.mentoringScore,
      S: r.serviceScore,
      I: r.innovationScore,
      D: r.developmentScore,
    },
  }));
}

// ─── Workload summary ─────────────────────────────────────────────────────────

async function loadWorkloadSummary(academicYear: string, semesterCode: string, unitId?: string) {
  const snapshots = await prisma.facultyWorkloadSnapshot.findMany({
    where: {
      academicYear,
      semesterCode,
      ...(unitId ? { facultyProfile: { unitId } } : {}),
    },
    select: { totalHoursWeekly: true, weeklyHoursLimit: true, overloadHours: true },
  });

  if (snapshots.length === 0) {
    return { snapshotsCount: 0, avgHoursWeekly: null, overloadedCount: 0, underloadedCount: 0 };
  }

  const avgHoursWeekly = parseFloat(
    (snapshots.reduce((s, r) => s + r.totalHoursWeekly, 0) / snapshots.length).toFixed(2),
  );
  const overloadedCount  = snapshots.filter((s) => s.overloadHours > 0).length;
  const underloadedCount = snapshots.filter(
    (s) => s.totalHoursWeekly < s.weeklyHoursLimit * 0.5,
  ).length;

  return { snapshotsCount: snapshots.length, avgHoursWeekly, overloadedCount, underloadedCount };
}

// ─── Student KPIs ─────────────────────────────────────────────────────────────

async function loadStudentKpis(academicYear: string, semesterCode: string) {
  const [totalStudents, gpaAggregate, warningCount, probationCount] = await Promise.all([
    prisma.hocVien.count({ where: { currentStatus: 'ACTIVE' as any, deletedAt: null } }),
    prisma.studentGpaHistory.aggregate({
      where: { academicYear, semesterCode },
      _avg: { cumulativeGpa: true, semesterGpa: true },
      _count: { id: true },
    }),
    prisma.hocVien.count({
      where: {
        academicStatus: AcademicPerformanceStatus.WARNING,
        deletedAt: null,
      },
    }),
    prisma.hocVien.count({
      where: {
        academicStatus: AcademicPerformanceStatus.PROBATION,
        deletedAt: null,
      },
    }),
  ]);

  const openWarnings = await prisma.academicWarning.count({
    where: { academicYear, semesterCode, isResolved: false },
  });

  return {
    totalStudents,
    gpaSnapshotsThisSemester: gpaAggregate._count.id,
    avgCumulativeGpa: gpaAggregate._avg.cumulativeGpa != null
      ? parseFloat(gpaAggregate._avg.cumulativeGpa.toFixed(2)) : null,
    avgSemesterGpa: gpaAggregate._avg.semesterGpa != null
      ? parseFloat(gpaAggregate._avg.semesterGpa.toFixed(2)) : null,
    warningCount,
    probationCount,
    openAcademicWarnings: openWarnings,
  };
}

// ─── GPA Distribution ─────────────────────────────────────────────────────────

async function loadGpaDistribution(academicYear: string, semesterCode: string) {
  const histories = await prisma.studentGpaHistory.findMany({
    where: { academicYear, semesterCode },
    select: { cumulativeGpa: true },
  });

  const bands = [
    { label: 'Xuất sắc (≥ 3.6)',    min: 3.6, max: 4.0 },
    { label: 'Giỏi (3.2 – 3.59)',   min: 3.2, max: 3.59 },
    { label: 'Khá (2.5 – 3.19)',    min: 2.5, max: 3.19 },
    { label: 'TB khá (2.0 – 2.49)', min: 2.0, max: 2.49 },
    { label: 'TB (1.5 – 1.99)',     min: 1.5, max: 1.99 },
    { label: 'Yếu (< 1.5)',         min: 0,   max: 1.49 },
  ];

  return bands.map((b) => ({
    label: b.label,
    count: histories.filter((h) => h.cumulativeGpa >= b.min && h.cumulativeGpa <= b.max).length,
  }));
}

// ─── Academic Warning Stats ────────────────────────────────────────────────────

async function loadAcademicWarningStats(academicYear: string, semesterCode: string) {
  const warnings = await prisma.academicWarning.groupBy({
    by: ['warningLevel'],
    where: { academicYear, semesterCode, isResolved: false },
    _count: { id: true },
  });

  return warnings.map((w) => ({ level: w.warningLevel, count: w._count.id }));
}

// ─── Top Students ─────────────────────────────────────────────────────────────

async function loadTopStudents(academicYear: string, semesterCode: string, topN: number) {
  const records = await prisma.studentGpaHistory.findMany({
    where: {
      academicYear,
      semesterCode,
      cumulativeGpa: { gt: 0 },
      academicStatus: AcademicPerformanceStatus.NORMAL,
    },
    orderBy: { cumulativeGpa: 'desc' },
    take: topN,
    select: {
      cumulativeGpa: true,
      semesterGpa: true,
      totalCreditsAccumulated: true,
      hocVien: {
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          lop: true,
          khoaHoc: true,
          nganh: true,
        },
      },
    },
  });

  return records.map((r, idx) => ({
    rank: idx + 1,
    hocVienId: r.hocVien.id,
    maHocVien: r.hocVien.maHocVien,
    hoTen: r.hocVien.hoTen,
    lop: r.hocVien.lop,
    khoaHoc: r.hocVien.khoaHoc,
    nganh: r.hocVien.nganh,
    cumulativeGpa: r.cumulativeGpa,
    semesterGpa: r.semesterGpa,
    totalCreditsAccumulated: r.totalCreditsAccumulated,
  }));
}

// ─── At-Risk Students ─────────────────────────────────────────────────────────

async function loadAtRiskStudents(academicYear: string, semesterCode: string, topN: number) {
  const records = await prisma.studentGpaHistory.findMany({
    where: {
      academicYear,
      semesterCode,
      academicStatus: { in: [AcademicPerformanceStatus.WARNING, AcademicPerformanceStatus.PROBATION] },
    },
    orderBy: { cumulativeGpa: 'asc' },
    take: topN,
    select: {
      cumulativeGpa: true,
      semesterGpa: true,
      academicStatus: true,
      hocVien: {
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          lop: true,
          khoaHoc: true,
          giangVienHuongDan: {
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  return records.map((r) => ({
    hocVienId: r.hocVien.id,
    maHocVien: r.hocVien.maHocVien,
    hoTen: r.hocVien.hoTen,
    lop: r.hocVien.lop,
    khoaHoc: r.hocVien.khoaHoc,
    advisorName: r.hocVien.giangVienHuongDan?.user.name ?? null,
    cumulativeGpa: r.cumulativeGpa,
    semesterGpa: r.semesterGpa,
    academicStatus: r.academicStatus,
  }));
}
