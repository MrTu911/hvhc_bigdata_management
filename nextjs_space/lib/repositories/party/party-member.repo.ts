import 'server-only';
import db from '@/lib/db';
import { PartyMemberStatus, Prisma } from '@prisma/client';

export interface PartyMemberRepoListInput {
  search?: string;
  status?: PartyMemberStatus;
  organizationId?: string;
  /** Scope filter: chỉ trả về member thuộc các unit này. Nếu undefined = không lọc (ACADEMY). */
  unitIds?: string[];
  page: number;
  limit: number;
}

export interface PartyMemberRepoCreateInput {
  userId: string;
  organizationId?: string | null;
  partyCardNumber?: string | null;
  partyRole?: string | null;
  joinDate?: Date | null;
  officialDate?: Date | null;
  recommender1?: string | null;
  recommender2?: string | null;
  currentReviewGrade?: string | null;
  currentDebtAmount?: number | null;
  confidentialNote?: string | null;
  status: PartyMemberStatus;
  statusChangeDate?: Date | null;
}

export interface PartyMemberRepoUpdateInput {
  organizationId?: string | null;
  partyCardNumber?: string | null;
  partyRole?: string | null;
  joinDate?: Date | null;
  officialDate?: Date | null;
  recommender1?: string | null;
  recommender2?: string | null;
  currentReviewGrade?: string | null;
  currentDebtAmount?: number | null;
  confidentialNote?: string | null;
  status?: PartyMemberStatus;
  statusChangeDate?: Date | null;
  statusChangeReason?: string | null;
}

const LIST_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      militaryId: true,
      rank: true,
      position: true,
      unitId: true,
      unitRelation: {
        select: { id: true, code: true, name: true },
      },
    },
  },
  organization: {
    select: { id: true, code: true, name: true },
  },
} as const;

const DETAIL_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      militaryId: true,
      rank: true,
      position: true,
      phone: true,
      dateOfBirth: true,
      personnelProfile: {
        select: {
          id: true,
          personnelCode: true,
          fullName: true,
          category: true,
          status: true,
          unitId: true,
        },
      },
      unitRelation: { select: { id: true, code: true, name: true } },
    },
  },
  organization: {
    select: { id: true, code: true, name: true },
  },
  activities: {
    where: { deletedAt: null },
    orderBy: { activityDate: 'desc' },
    take: 20,
  },
} as const;

export const PartyMemberRepo = {
  async findMany(input: PartyMemberRepoListInput) {
    const where: Prisma.PartyMemberWhereInput = { deletedAt: null };

    if (input.status) {
      where.status = input.status;
    }

    if (input.organizationId) {
      where.organizationId = input.organizationId;
    }

    const userFilter: Prisma.UserWhereInput = {};

    if (input.search) {
      userFilter.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { militaryId: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.unitIds && input.unitIds.length > 0) {
      userFilter.unitId = { in: input.unitIds };
    }

    if (Object.keys(userFilter).length > 0) {
      where.user = userFilter;
    }

    const [items, total] = await Promise.all([
      db.partyMember.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.partyMember.count({ where }),
    ]);

    return { items, total };
  },

  async findDetailById(id: string) {
    return db.partyMember.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    });
  },

  async findById(id: string) {
    return db.partyMember.findFirst({ where: { id, deletedAt: null } });
  },

  async findUserById(userId: string) {
    return db.user.findUnique({ where: { id: userId } });
  },

  async findByUserId(userId: string) {
    return db.partyMember.findUnique({ where: { userId } });
  },

  async create(input: PartyMemberRepoCreateInput) {
    const data: Prisma.PartyMemberCreateInput = {
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      partyCardNumber: input.partyCardNumber ?? null,
      partyRole: input.partyRole ?? null,
      joinDate: input.joinDate ?? null,
      officialDate: input.officialDate ?? null,
      recommender1: input.recommender1 ?? null,
      recommender2: input.recommender2 ?? null,
      currentReviewGrade: input.currentReviewGrade ?? null,
      currentDebtAmount: input.currentDebtAmount ?? 0,
      confidentialNote: input.confidentialNote ?? null,
      status: input.status,
      statusChangeDate: input.statusChangeDate ?? null,
    };

    return db.partyMember.create({
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, code: true, name: true } },
      },
    });
  },

  async update(id: string, input: PartyMemberRepoUpdateInput) {
    const data: Prisma.PartyMemberUpdateInput = {
      organizationId: input.organizationId,
      partyCardNumber: input.partyCardNumber,
      partyRole: input.partyRole,
      joinDate: input.joinDate,
      officialDate: input.officialDate,
      recommender1: input.recommender1,
      recommender2: input.recommender2,
      currentReviewGrade: input.currentReviewGrade,
      currentDebtAmount: input.currentDebtAmount,
      confidentialNote: input.confidentialNote,
      status: input.status,
      statusChangeDate: input.statusChangeDate,
      statusChangeReason: input.statusChangeReason,
    };

    return db.partyMember.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, code: true, name: true } },
      },
    });
  },

  async createInTx(tx: Prisma.TransactionClient, input: PartyMemberRepoCreateInput) {
    const data: Prisma.PartyMemberCreateInput = {
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      partyCardNumber: input.partyCardNumber ?? null,
      partyRole: input.partyRole ?? null,
      joinDate: input.joinDate ?? null,
      officialDate: input.officialDate ?? null,
      recommender1: input.recommender1 ?? null,
      recommender2: input.recommender2 ?? null,
      currentReviewGrade: input.currentReviewGrade ?? null,
      currentDebtAmount: input.currentDebtAmount ?? 0,
      confidentialNote: input.confidentialNote ?? null,
      status: input.status,
      statusChangeDate: input.statusChangeDate ?? null,
    };

    return tx.partyMember.create({
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, code: true, name: true } },
      },
    });
  },

  async updateInTx(tx: Prisma.TransactionClient, id: string, input: PartyMemberRepoUpdateInput) {
    const data: Prisma.PartyMemberUpdateInput = {
      organizationId: input.organizationId,
      partyCardNumber: input.partyCardNumber,
      partyRole: input.partyRole,
      joinDate: input.joinDate,
      officialDate: input.officialDate,
      recommender1: input.recommender1,
      recommender2: input.recommender2,
      currentReviewGrade: input.currentReviewGrade,
      currentDebtAmount: input.currentDebtAmount,
      confidentialNote: input.confidentialNote,
      status: input.status,
      statusChangeDate: input.statusChangeDate,
      statusChangeReason: input.statusChangeReason,
    };

    return tx.partyMember.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, code: true, name: true } },
      },
    });
  },

  async softDelete(id: string, deletedBy: string) {
    return db.partyMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  },
};
