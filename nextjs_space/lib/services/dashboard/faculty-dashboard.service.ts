/**
 * M07 – Faculty Dashboard Service
 *
 * Tổng hợp KPI và dữ liệu dashboard giảng viên cho quản lý khoa/học viện.
 *
 * Nguồn dữ liệu:
 *   - FacultyProfile          → tổng số GV, qualification breakdown, đơn vị
 *   - FacultyEISScore         → EIS avg, top/bottom ranking
 *   - FacultyWorkloadSnapshot → workload stats
 *   - FacultyWorkloadAlert    → alert counts
 *
 * Nguyên tắc:
 *   - Dashboard chỉ đọc từ snapshot/read-model. KHÔNG aggregate runtime từ M10 hay M09.
 *   - Kết quả phụ thuộc vào độ tươi của snapshot (rebuild batch cuối kỳ).
 *   - Phase 1: tất cả số liệu từ snapshot; Phase 2 có thể thêm live count cho KPI nhỏ.
 */

import 'server-only';
import db from '@/lib/db';
import { ThesisStatus, WorkloadAlertStatus } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacultyDashboardSummary {
  /** Tổng quan lực lượng giảng viên */
  workforce: {
    total: number;             // tổng GV (isActive = true)
    byUnit: { unitId: string; unitName: string; count: number }[];
    qualificationBreakdown: {
      degree: string | null;
      count: number;
    }[];
    rankBreakdown: {
      rank: string | null;
      count: number;
    }[];
  };
  /** EIS stats cho kỳ được chọn (null nếu chưa có snapshot) */
  eisStats: {
    academicYear: string;
    semesterCode: string;
    averageEIS: number;
    recordCount: number;         // số GV có snapshot kỳ này
    trendBreakdown: {
      IMPROVING: number;
      STABLE: number;
      DECLINING: number;
      unknown: number;
    };
  } | null;
  /** Workload stats cho kỳ được chọn */
  workloadStats: {
    academicYear: string;
    semesterCode: string;
    snapshotCount: number;       // số GV có workload snapshot
    overloadedCount: number;     // số GV quá tải (overloadHours > 0)
    underloadedCount: number;    // số GV thiếu tải (totalHoursWeekly < weeklyHoursLimit × 0.5)
    openAlertCount: number;      // tổng cảnh báo đang OPEN
    openAlertsByType: { alertType: string; count: number }[];
  } | null;
  /** Tình hình hướng dẫn học viên (tổng toàn hệ thống) */
  advisingOverview: {
    totalAdvisees: number;       // tổng HV có giangVienHuongDanId
    totalThesisActive: number;   // ThesisProject DRAFT + IN_PROGRESS
  };
  builtAt: Date;
}

export interface EISRankingItem {
  facultyProfileId: string;
  name: string;
  unitName: string | null;
  academicRank: string | null;
  academicDegree: string | null;
  totalEIS: number;
  teachingScore: number;
  researchScore: number;
  mentoringScore: number;
  trend: string | null;
  academicYear: string;
  semesterCode: string;
}

export interface EISRankingResult {
  academicYear: string;
  semesterCode: string;
  top: EISRankingItem[];
  bottom: EISRankingItem[];
  unitId: string | null;
}

export interface WorkloadAlertSummary {
  totalOpen: number;
  byType: { alertType: string; count: number }[];
  byUnit: { unitId: string | null; unitName: string | null; count: number }[];
  recentAlerts: {
    id: string;
    alertType: string;
    message: string | null;
    facultyName: string;
    unitName: string | null;
    academicYear: string;
    semesterCode: string;
    createdAt: Date;
  }[];
}

// ─── Faculty Dashboard Summary ────────────────────────────────────────────────

export async function buildFacultyDashboardSummary(opts: {
  unitId?: string;
  academicYear?: string;
  semesterCode?: string;
}): Promise<FacultyDashboardSummary> {
  const { unitId, academicYear, semesterCode } = opts;
  const facultyWhere = { isActive: true, ...(unitId ? { unitId } : {}) };

  // ── Workforce stats ────────────────────────────────────────────────────────
  const [
    totalFaculty,
    facultyByUnit,
    degreeBreakdown,
    rankBreakdown,
  ] = await Promise.all([
    db.facultyProfile.count({ where: facultyWhere }),

    db.facultyProfile.groupBy({
      by: ['unitId'],
      where: facultyWhere,
      _count: { id: true },
    }),

    db.facultyProfile.groupBy({
      by: ['academicDegree'],
      where: facultyWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    db.facultyProfile.groupBy({
      by: ['academicRank'],
      where: facultyWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  // Resolve unit names for byUnit breakdown
  const unitIds = facultyByUnit.map((r) => r.unitId).filter(Boolean) as string[];
  const units = unitIds.length
    ? await db.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, name: true },
      })
    : [];
  const unitMap = new Map(units.map((u) => [u.id, u.name]));

  const byUnit = facultyByUnit.map((r) => ({
    unitId: r.unitId ?? 'unknown',
    unitName: r.unitId ? (unitMap.get(r.unitId) ?? r.unitId) : 'Chưa phân công',
    count: r._count.id,
  }));

  // ── EIS stats ──────────────────────────────────────────────────────────────
  let eisStats: FacultyDashboardSummary['eisStats'] = null;
  if (academicYear && semesterCode) {
    const eisWhere = {
      academicYear,
      semesterCode,
      ...(unitId ? { facultyProfile: { unitId } } : {}),
    };

    const [eisAgg, eisTrends] = await Promise.all([
      db.facultyEISScore.aggregate({
        where: eisWhere,
        _avg: { totalEIS: true },
        _count: { id: true },
      }),
      db.facultyEISScore.groupBy({
        by: ['trend'],
        where: eisWhere,
        _count: { id: true },
      }),
    ]);

    const trendBreakdown = { IMPROVING: 0, STABLE: 0, DECLINING: 0, unknown: 0 };
    for (const row of eisTrends) {
      if (row.trend === 'IMPROVING') trendBreakdown.IMPROVING = row._count.id;
      else if (row.trend === 'STABLE') trendBreakdown.STABLE = row._count.id;
      else if (row.trend === 'DECLINING') trendBreakdown.DECLINING = row._count.id;
      else trendBreakdown.unknown += row._count.id;
    }

    eisStats = {
      academicYear,
      semesterCode,
      averageEIS: parseFloat((eisAgg._avg.totalEIS ?? 0).toFixed(2)),
      recordCount: eisAgg._count.id,
      trendBreakdown,
    };
  }

  // ── Workload stats ─────────────────────────────────────────────────────────
  let workloadStats: FacultyDashboardSummary['workloadStats'] = null;
  if (academicYear && semesterCode) {
    const snapshotWhere = {
      academicYear,
      semesterCode,
      ...(unitId ? { facultyProfile: { unitId } } : {}),
    };

    const [snapshotCount, overloadedCount, underloadedCount, openAlerts, alertsByType] =
      await Promise.all([
        db.facultyWorkloadSnapshot.count({ where: snapshotWhere }),

        db.facultyWorkloadSnapshot.count({
          where: { ...snapshotWhere, overloadHours: { gt: 0 } },
        }),

        // Thiếu tải: totalHoursWeekly < weeklyHoursLimit × 0.5
        // Dùng raw filter: Prisma không support column comparison trực tiếp
        // Proxy: totalHoursWeekly = 0 (chưa dạy hoặc rất ít)
        db.facultyWorkloadSnapshot.count({
          where: { ...snapshotWhere, totalHoursWeekly: { lt: 4 } },
        }),

        db.facultyWorkloadAlert.count({
          where: {
            status: WorkloadAlertStatus.OPEN,
            snapshot: snapshotWhere,
          },
        }),

        db.facultyWorkloadAlert.groupBy({
          by: ['alertType'],
          where: {
            status: WorkloadAlertStatus.OPEN,
            snapshot: snapshotWhere,
          },
          _count: { id: true },
        }),
      ]);

    workloadStats = {
      academicYear,
      semesterCode,
      snapshotCount,
      overloadedCount,
      underloadedCount,
      openAlertCount: openAlerts,
      openAlertsByType: alertsByType.map((r) => ({
        alertType: r.alertType,
        count: r._count.id,
      })),
    };
  }

  // ── Advising overview ──────────────────────────────────────────────────────
  const [totalAdvisees, totalThesisActive] = await Promise.all([
    db.hocVien.count({
      where: {
        giangVienHuongDanId: { not: null },
        deletedAt: null,
        ...(unitId
          ? { giangVienHuongDan: { unitId } }
          : {}),
      },
    }),
    db.thesisProject.count({
      where: {
        status: { in: [ThesisStatus.DRAFT, ThesisStatus.IN_PROGRESS] },
        ...(unitId
          ? { advisor: { unitId } }
          : {}),
      },
    }),
  ]);

  return {
    workforce: {
      total: totalFaculty,
      byUnit,
      qualificationBreakdown: degreeBreakdown.map((r) => ({
        degree: r.academicDegree,
        count: r._count.id,
      })),
      rankBreakdown: rankBreakdown.map((r) => ({
        rank: r.academicRank,
        count: r._count.id,
      })),
    },
    eisStats,
    workloadStats,
    advisingOverview: { totalAdvisees, totalThesisActive },
    builtAt: new Date(),
  };
}

// ─── EIS Ranking ─────────────────────────────────────────────────────────────

export async function getEISRanking(opts: {
  academicYear: string;
  semesterCode: string;
  unitId?: string;
  topN?: number;
}): Promise<EISRankingResult> {
  const { academicYear, semesterCode, unitId, topN = 10 } = opts;

  const where = {
    academicYear,
    semesterCode,
    ...(unitId ? { facultyProfile: { unitId } } : {}),
  };

  const include = {
    facultyProfile: {
      select: {
        id: true,
        academicRank: true,
        academicDegree: true,
        user: { select: { name: true } },
        unit: { select: { name: true } },
      },
    },
  };

  const [topRows, bottomRows] = await Promise.all([
    db.facultyEISScore.findMany({
      where,
      include,
      orderBy: { totalEIS: 'desc' },
      take: topN,
    }),
    db.facultyEISScore.findMany({
      where,
      include,
      orderBy: { totalEIS: 'asc' },
      take: topN,
    }),
  ]);

  const mapRow = (row: (typeof topRows)[number]): EISRankingItem => ({
    facultyProfileId: row.facultyProfileId,
    name: row.facultyProfile.user?.name ?? 'N/A',
    unitName: row.facultyProfile.unit?.name ?? null,
    academicRank: row.facultyProfile.academicRank,
    academicDegree: row.facultyProfile.academicDegree,
    totalEIS: row.totalEIS,
    teachingScore: row.teachingScore,
    researchScore: row.researchScore,
    mentoringScore: row.mentoringScore,
    trend: row.trend,
    academicYear: row.academicYear,
    semesterCode: row.semesterCode,
  });

  return {
    academicYear,
    semesterCode,
    unitId: unitId ?? null,
    top: topRows.map(mapRow),
    bottom: bottomRows.map(mapRow),
  };
}

// ─── Workload Alert Summary ───────────────────────────────────────────────────

export async function getWorkloadAlertSummary(opts: {
  unitId?: string;
  academicYear?: string;
  semesterCode?: string;
  recentLimit?: number;
}): Promise<WorkloadAlertSummary> {
  const { unitId, academicYear, semesterCode, recentLimit = 10 } = opts;

  const snapshotFilter = {
    ...(academicYear ? { academicYear } : {}),
    ...(semesterCode ? { semesterCode } : {}),
    ...(unitId ? { facultyProfile: { unitId } } : {}),
  };

  const alertWhere = {
    status: WorkloadAlertStatus.OPEN,
    snapshot: Object.keys(snapshotFilter).length ? snapshotFilter : undefined,
  };

  const [totalOpen, byType, recentAlerts] = await Promise.all([
    db.facultyWorkloadAlert.count({ where: alertWhere }),

    db.facultyWorkloadAlert.groupBy({
      by: ['alertType'],
      where: alertWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    db.facultyWorkloadAlert.findMany({
      where: alertWhere,
      orderBy: { createdAt: 'desc' },
      take: recentLimit,
      select: {
        id: true,
        alertType: true,
        message: true,
        createdAt: true,
        snapshot: {
          select: {
            academicYear: true,
            semesterCode: true,
            facultyProfile: {
              select: {
                user: { select: { name: true } },
                unit: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Group by unit from recent alerts
  const unitAlertMap = new Map<string, { unitId: string | null; unitName: string | null; count: number }>();
  for (const alert of recentAlerts) {
    const u = alert.snapshot.facultyProfile.unit;
    const key = u?.id ?? 'unknown';
    if (!unitAlertMap.has(key)) {
      unitAlertMap.set(key, { unitId: u?.id ?? null, unitName: u?.name ?? null, count: 0 });
    }
    unitAlertMap.get(key)!.count++;
  }

  return {
    totalOpen,
    byType: byType.map((r) => ({ alertType: r.alertType, count: r._count.id })),
    byUnit: Array.from(unitAlertMap.values()),
    recentAlerts: recentAlerts.map((a) => ({
      id: a.id,
      alertType: a.alertType,
      message: a.message,
      facultyName: a.snapshot.facultyProfile.user?.name ?? 'N/A',
      unitName: a.snapshot.facultyProfile.unit?.name ?? null,
      academicYear: a.snapshot.academicYear,
      semesterCode: a.snapshot.semesterCode,
      createdAt: a.createdAt,
    })),
  };
}
