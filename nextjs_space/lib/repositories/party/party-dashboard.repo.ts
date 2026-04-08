import 'server-only';
import db from '@/lib/db';

export interface DashboardFilter {
  orgId?: string;
  year: number;
}

function yearRange(year: number) {
  return {
    gte: new Date(`${year}-01-01`),
    lt: new Date(`${year + 1}-01-01`),
  };
}

export const PartyDashboardRepo = {
  async getMembersByStatus(orgId?: string) {
    return db.partyMember.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        ...(orgId && { organizationId: orgId }),
      },
      _count: { id: true },
    });
  },

  async getTotalMembers(orgId?: string) {
    return db.partyMember.count({
      where: {
        deletedAt: null,
        ...(orgId && { organizationId: orgId }),
      },
    });
  },

  async getNewlyAdmitted(year: number, orgId?: string) {
    return db.partyMember.count({
      where: {
        deletedAt: null,
        joinDate: yearRange(year),
        ...(orgId && { organizationId: orgId }),
      },
    });
  },

  async getAttendanceStats(year: number, orgId?: string) {
    return db.partyMeetingAttendance.groupBy({
      by: ['attendanceStatus'],
      where: {
        meeting: {
          meetingDate: yearRange(year),
          ...(orgId && { partyOrgId: orgId }),
        },
      },
      _count: { id: true },
    });
  },

  async getFeeSummary(year: number, orgId?: string) {
    const where = {
      paymentMonth: { startsWith: String(year) },
      ...(orgId && {
        partyMember: { organizationId: orgId },
      }),
    };

    return db.partyFeePayment.aggregate({
      where,
      _sum: {
        expectedAmount: true,
        actualAmount: true,
        debtAmount: true,
      },
    });
  },

  async getFeeDebtCount(year: number, orgId?: string) {
    return db.partyFeePayment.count({
      where: {
        debtAmount: { gt: 0 },
        paymentMonth: { startsWith: String(year) },
        ...(orgId && {
          partyMember: { organizationId: orgId },
        }),
      },
    });
  },

  async getReviewDistribution(year: number, orgId?: string) {
    return db.partyAnnualReview.groupBy({
      by: ['grade'],
      where: {
        reviewYear: year,
        ...(orgId && {
          partyMember: { organizationId: orgId },
        }),
      },
      _count: { id: true },
    });
  },

  async getDisciplineCount(year: number, orgId?: string) {
    return db.partyDiscipline.count({
      where: {
        decisionDate: yearRange(year),
        ...(orgId && {
          partyMember: { organizationId: orgId },
        }),
      },
    });
  },

  async getInspectionCount(year: number, orgId?: string) {
    return db.partyInspectionTarget.count({
      where: {
        openedAt: yearRange(year),
        ...(orgId && { partyOrgId: orgId }),
      },
    });
  },

  async getInspectionByType(year: number, orgId?: string) {
    return db.partyInspectionTarget.groupBy({
      by: ['inspectionType'],
      where: {
        openedAt: yearRange(year),
        ...(orgId && { partyOrgId: orgId }),
      },
      _count: { id: true },
    });
  },
};
