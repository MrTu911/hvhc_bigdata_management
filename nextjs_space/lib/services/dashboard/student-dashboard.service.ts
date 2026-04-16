/**
 * M07 – Student Dashboard Service
 *
 * Tổng hợp KPI và dữ liệu dashboard học viên cho quản lý đào tạo/khóa/lớp.
 *
 * Nguồn dữ liệu:
 *   - HocVien                → tổng số HV, trạng thái, phân bổ
 *   - StudentGpaHistory      → GPA snapshot theo kỳ
 *   - AcademicWarning        → cảnh báo học vụ
 *   - ThesisProject          → tiến độ khóa luận
 *   - StudentConductRecord   → điểm rèn luyện
 *
 * Nguyên tắc:
 *   - Đọc từ read-model (StudentGpaHistory) khi có.
 *   - HocVien.diemTrungBinh là GPA tích lũy cuối cùng được rebuild.
 *   - AcademicWarning chỉ tính bản ghi isResolved = false.
 */

import 'server-only';
import db from '@/lib/db';
import { AcademicWarningLevel, EduStudentStatus, ThesisStatus } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentDashboardSummary {
  /** Tổng quan số lượng học viên */
  enrollment: {
    total: number;
    byStatus: { status: string; count: number }[];
    byKhoaHoc: { khoaHoc: string | null; count: number }[];
    byNganh: { nganh: string | null; count: number }[];
  };
  /** GPA stats (từ HocVien.diemTrungBinh + GPA snapshot) */
  gpaStats: {
    averageGpa: number;
    /** Phân bố xếp loại học lực */
    academicStatusBreakdown: { status: string; count: number }[];
    /** GPA trung bình theo kỳ (từ StudentGpaHistory) */
    gpaTrend: {
      academicYear: string;
      semesterCode: string;
      avgSemesterGpa: number;
      avgCumulativeGpa: number;
    }[];
  };
  /** Cảnh báo học vụ */
  warningStats: {
    totalOpenWarnings: number;
    byLevel: { level: string; count: number }[];
    /** Số HV có ít nhất 1 cảnh báo chưa giải quyết */
    studentsWithWarning: number;
    probationCount: number;
  };
  /** Tiến độ khóa luận / luận văn */
  thesisStats: {
    active: number;      // DRAFT + IN_PROGRESS
    completed: number;   // DEFENDED + ARCHIVED
  };
  /** Điểm rèn luyện trung bình (học kỳ gần nhất có dữ liệu) */
  conductAvg: number | null;
  builtAt: Date;
}

export interface StudentWithWarning {
  hocVienId: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  cumulativeGpa: number;
  academicStatus: string;
  warnings: {
    academicYear: string;
    semesterCode: string;
    warningLevel: string;
    suggestedAction: string | null;
    generatedAt: Date;
  }[];
}

// ─── Student Dashboard Summary ────────────────────────────────────────────────

export async function buildStudentDashboardSummary(opts: {
  unitId?: string;
  khoaHoc?: string;
  nganh?: string;
  academicYear?: string;
  semesterCode?: string;
}): Promise<StudentDashboardSummary> {
  const { unitId, khoaHoc, nganh, academicYear, semesterCode } = opts;

  const baseWhere = {
    deletedAt: null,
    ...(khoaHoc ? { khoaHoc } : {}),
    ...(nganh ? { nganh } : {}),
    ...(unitId ? { khoaQuanLy: unitId } : {}),
  };

  // ── Enrollment stats ───────────────────────────────────────────────────────
  const [total, byStatus, byKhoaHoc, byNganh] = await Promise.all([
    db.hocVien.count({ where: baseWhere }),

    db.hocVien.groupBy({
      by: ['currentStatus'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    db.hocVien.groupBy({
      by: ['khoaHoc'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { khoaHoc: 'asc' },
      take: 20,
    }),

    db.hocVien.groupBy({
      by: ['nganh'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);

  // ── GPA stats ──────────────────────────────────────────────────────────────
  const [gpaAgg, academicStatusBreakdown, gpaTrendRaw] = await Promise.all([
    db.hocVien.aggregate({
      where: { ...baseWhere, currentStatus: EduStudentStatus.ACTIVE },
      _avg: { diemTrungBinh: true },
    }),

    db.hocVien.groupBy({
      by: ['academicStatus'],
      where: { ...baseWhere, currentStatus: EduStudentStatus.ACTIVE },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    // GPA trend: dùng StudentGpaHistory groupBy – trung bình theo kỳ
    db.studentGpaHistory.groupBy({
      by: ['academicYear', 'semesterCode'],
      where: {
        ...(khoaHoc || nganh || unitId
          ? {
              hocVien: {
                ...(khoaHoc ? { khoaHoc } : {}),
                ...(nganh ? { nganh } : {}),
                ...(unitId ? { khoaQuanLy: unitId } : {}),
                deletedAt: null,
              },
            }
          : {}),
      },
      _avg: { semesterGpa: true, cumulativeGpa: true },
      orderBy: [{ academicYear: 'asc' }, { semesterCode: 'asc' }],
      take: 8,
    }),
  ]);

  // ── Warning stats ──────────────────────────────────────────────────────────
  const warningBaseWhere = {
    isResolved: false,
    hocVien: baseWhere,
  };

  const [totalOpenWarnings, warningByLevel, studentsWithWarning, probationCount] =
    await Promise.all([
      db.academicWarning.count({ where: warningBaseWhere }),

      db.academicWarning.groupBy({
        by: ['warningLevel'],
        where: warningBaseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Đếm số HV phân biệt có cảnh báo mở
      db.academicWarning
        .findMany({
          where: warningBaseWhere,
          select: { hocVienId: true },
          distinct: ['hocVienId'],
        })
        .then((rows) => rows.length),

      db.hocVien.count({
        where: {
          ...baseWhere,
          academicStatus: 'PROBATION',
          currentStatus: EduStudentStatus.ACTIVE,
        },
      }),
    ]);

  // ── Thesis stats ───────────────────────────────────────────────────────────
  const thesisBaseWhere = {
    hocVien: baseWhere,
  };

  const [thesisActive, thesisCompleted] = await Promise.all([
    db.thesisProject.count({
      where: {
        ...thesisBaseWhere,
        status: { in: [ThesisStatus.DRAFT, ThesisStatus.IN_PROGRESS] },
      },
    }),
    db.thesisProject.count({
      where: {
        ...thesisBaseWhere,
        status: { in: [ThesisStatus.DEFENDED, ThesisStatus.ARCHIVED] },
      },
    }),
  ]);

  // ── Conduct avg ────────────────────────────────────────────────────────────
  const conductFilter = {
    ...(academicYear ? { academicYear } : {}),
    ...(semesterCode ? { semesterCode } : {}),
    hocVien: baseWhere,
  };
  const conductAgg = await db.studentConductRecord.aggregate({
    where: Object.keys(conductFilter).length > 1 ? conductFilter : { hocVien: baseWhere },
    _avg: { conductScore: true },
  });

  return {
    enrollment: {
      total,
      byStatus: byStatus.map((r) => ({
        status: String(r.currentStatus),
        count: r._count.id,
      })),
      byKhoaHoc: byKhoaHoc.map((r) => ({
        khoaHoc: r.khoaHoc,
        count: r._count.id,
      })),
      byNganh: byNganh.map((r) => ({
        nganh: r.nganh,
        count: r._count.id,
      })),
    },
    gpaStats: {
      averageGpa: parseFloat((gpaAgg._avg.diemTrungBinh ?? 0).toFixed(2)),
      academicStatusBreakdown: academicStatusBreakdown.map((r) => ({
        status: String(r.academicStatus),
        count: r._count.id,
      })),
      gpaTrend: gpaTrendRaw.map((r) => ({
        academicYear: r.academicYear,
        semesterCode: r.semesterCode,
        avgSemesterGpa: parseFloat((r._avg.semesterGpa ?? 0).toFixed(2)),
        avgCumulativeGpa: parseFloat((r._avg.cumulativeGpa ?? 0).toFixed(2)),
      })),
    },
    warningStats: {
      totalOpenWarnings,
      byLevel: warningByLevel.map((r) => ({
        level: String(r.warningLevel),
        count: r._count.id,
      })),
      studentsWithWarning,
      probationCount,
    },
    thesisStats: {
      active: thesisActive,
      completed: thesisCompleted,
    },
    conductAvg: conductAgg._avg.conductScore !== null
      ? parseFloat((conductAgg._avg.conductScore).toFixed(2))
      : null,
    builtAt: new Date(),
  };
}

// ─── Students with Open Warnings (paginated) ─────────────────────────────────

export async function listStudentsWithWarnings(opts: {
  unitId?: string;
  khoaHoc?: string;
  academicYear?: string;
  semesterCode?: string;
  warningLevel?: AcademicWarningLevel;
  page?: number;
  pageSize?: number;
}): Promise<{ items: StudentWithWarning[]; total: number; page: number; pageSize: number }> {
  const {
    unitId,
    khoaHoc,
    academicYear,
    semesterCode,
    warningLevel,
    page = 1,
    pageSize = 20,
  } = opts;

  const warningWhere = {
    isResolved: false,
    ...(academicYear ? { academicYear } : {}),
    ...(semesterCode ? { semesterCode } : {}),
    ...(warningLevel ? { warningLevel } : {}),
    hocVien: {
      deletedAt: null,
      ...(khoaHoc ? { khoaHoc } : {}),
      ...(unitId ? { khoaQuanLy: unitId } : {}),
    },
  };

  // Tìm các hocVienId có open warning (phân trang theo HV)
  const hocVienIdsRaw = await db.academicWarning.findMany({
    where: warningWhere,
    select: { hocVienId: true },
    distinct: ['hocVienId'],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const hocVienIdTotal = await db.academicWarning.findMany({
    where: warningWhere,
    select: { hocVienId: true },
    distinct: ['hocVienId'],
  });

  const hocVienIds = hocVienIdsRaw.map((r) => r.hocVienId);
  const total = hocVienIdTotal.length;

  if (hocVienIds.length === 0) {
    return { items: [], total, page, pageSize };
  }

  const hocViens = await db.hocVien.findMany({
    where: { id: { in: hocVienIds }, deletedAt: null },
    select: {
      id: true,
      maHocVien: true,
      hoTen: true,
      lop: true,
      khoaHoc: true,
      diemTrungBinh: true,
      academicStatus: true,
      academicWarnings: {
        where: {
          isResolved: false,
          ...(academicYear ? { academicYear } : {}),
          ...(semesterCode ? { semesterCode } : {}),
          ...(warningLevel ? { warningLevel } : {}),
        },
        orderBy: { generatedAt: 'desc' },
        select: {
          academicYear: true,
          semesterCode: true,
          warningLevel: true,
          suggestedAction: true,
          generatedAt: true,
        },
      },
    },
  });

  const items: StudentWithWarning[] = hocViens.map((hv) => ({
    hocVienId: hv.id,
    maHocVien: hv.maHocVien,
    hoTen: hv.hoTen,
    lop: hv.lop,
    khoaHoc: hv.khoaHoc,
    cumulativeGpa: hv.diemTrungBinh,
    academicStatus: String(hv.academicStatus),
    warnings: hv.academicWarnings.map((w) => ({
      academicYear: w.academicYear,
      semesterCode: w.semesterCode,
      warningLevel: String(w.warningLevel),
      suggestedAction: w.suggestedAction,
      generatedAt: w.generatedAt,
    })),
  }));

  return { items, total, page, pageSize };
}
