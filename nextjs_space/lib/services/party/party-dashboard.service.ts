import 'server-only';

import { PartyDashboardRepo } from '@/lib/repositories/party/party-dashboard.repo';
import db from '@/lib/db';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  totalMembers: number;
  newlyAdmitted: number;
  attendanceRate: number;
  totalFeeDebt: number;
  debtMemberCount: number;
  disciplineCount: number;
  inspectionCount: number;
}

export interface DashboardDistributions {
  membersByStatus: Record<string, number>;
  reviewGrades: Record<string, number>;
  inspectionTypes: Record<string, number>;
}

export interface DashboardFee {
  expected: number;
  actual: number;
  debt: number;
}

export interface DashboardStatsResult {
  year: number;
  orgId: string | null;
  kpis: DashboardKPIs;
  distributions: DashboardDistributions;
  fee: DashboardFee;
}

export interface DashboardAdmissionTrend {
  month: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeAttendanceRate(
  rows: Array<{ attendanceStatus: string; _count: { id: number } }>,
): number {
  let present = 0;
  let total = 0;
  for (const row of rows) {
    const count = row._count.id;
    total += count;
    if (row.attendanceStatus === 'PRESENT' || row.attendanceStatus === 'ON_TIME') {
      present += count;
    }
  }
  if (total === 0) return 0;
  return Math.round((present / total) * 100 * 100) / 100;
}

function groupByToRecord<K extends string>(
  rows: Array<Record<K, string | null> & { _count: { id: number } }>,
  key: K,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const label = row[key] ?? 'UNKNOWN';
    result[label] = (result[label] ?? 0) + row._count.id;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const PartyDashboardService = {
  async getDashboardStats(year: number, orgId?: string): Promise<DashboardStatsResult> {
    const [
      totalMembers,
      newlyAdmitted,
      attendanceStats,
      feeSummary,
      debtMemberCount,
      disciplineCount,
      inspectionCount,
      membersByStatusRaw,
      reviewGradesRaw,
      inspectionTypesRaw,
    ] = await Promise.all([
      PartyDashboardRepo.getTotalMembers(orgId),
      PartyDashboardRepo.getNewlyAdmitted(year, orgId),
      PartyDashboardRepo.getAttendanceStats(year, orgId),
      PartyDashboardRepo.getFeeSummary(year, orgId),
      PartyDashboardRepo.getFeeDebtCount(year, orgId),
      PartyDashboardRepo.getDisciplineCount(year, orgId),
      PartyDashboardRepo.getInspectionCount(year, orgId),
      PartyDashboardRepo.getMembersByStatus(orgId),
      PartyDashboardRepo.getReviewDistribution(year, orgId),
      PartyDashboardRepo.getInspectionByType(year, orgId),
    ]);

    const attendanceRate = computeAttendanceRate(attendanceStats);

    const expected = Number(feeSummary._sum.expectedAmount ?? 0);
    const actual = Number(feeSummary._sum.actualAmount ?? 0);
    const debt = Number(feeSummary._sum.debtAmount ?? 0);

    const membersByStatus = groupByToRecord(membersByStatusRaw as any, 'status');
    const reviewGrades = groupByToRecord(reviewGradesRaw as any, 'grade');
    const inspectionTypes = groupByToRecord(inspectionTypesRaw as any, 'inspectionType');

    return {
      year,
      orgId: orgId ?? null,
      kpis: {
        totalMembers,
        newlyAdmitted,
        attendanceRate,
        totalFeeDebt: debt,
        debtMemberCount,
        disciplineCount,
        inspectionCount,
      },
      distributions: {
        membersByStatus,
        reviewGrades,
        inspectionTypes,
      },
      fee: { expected, actual, debt },
    };
  },

  async getDashboardTrends(year: number, orgId?: string): Promise<DashboardAdmissionTrend[]> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const members = await db.partyMember.findMany({
      where: {
        deletedAt: null,
        joinDate: { gte: yearStart, lt: yearEnd },
        ...(orgId ? { organizationId: orgId } : {}),
      },
      select: { joinDate: true },
    });

    const countByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) countByMonth[m] = 0;
    for (const member of members) {
      if (!member.joinDate) continue;
      const month = member.joinDate.getMonth() + 1;
      countByMonth[month] = (countByMonth[month] ?? 0) + 1;
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: countByMonth[i + 1] ?? 0,
    }));
  },
};
