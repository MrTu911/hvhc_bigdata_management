import 'server-only';
import db from '@/lib/db';
import { InspectionType, Prisma } from '@prisma/client';

export interface PartyInspectionCreateInput {
  partyMemberId?: string;
  partyOrgId?: string;
  inspectionType: InspectionType;
  title: string;
  openedAt: Date;
  closedAt?: Date;
  findings?: string;
  recommendation?: string;
  decisionRef?: string;
  attachmentUrl?: string;
  createdBy?: string;
}

export interface PartyInspectionUpdateInput {
  partyMemberId?: string;
  partyOrgId?: string;
  inspectionType?: InspectionType;
  title?: string;
  openedAt?: Date;
  closedAt?: Date;
  findings?: string;
  recommendation?: string;
  decisionRef?: string;
  attachmentUrl?: string;
}

export interface PartyInspectionFindManyInput {
  partyMemberId?: string;
  partyOrgId?: string;
  inspectionType?: InspectionType;
  isClosed?: boolean;
  page: number;
  limit: number;
}

const LIST_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      user: {
        select: { id: true, name: true },
      },
    },
  },
  partyOrg: {
    select: { id: true, name: true, code: true },
  },
} as const;

const DETAIL_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      partyRole: true,
      currentPosition: true,
      status: true,
      user: {
        select: { id: true, name: true, militaryId: true },
      },
    },
  },
  partyOrg: {
    select: { id: true, code: true, name: true, orgLevel: true },
  },
  creator: {
    select: { id: true, name: true },
  },
} as const;

export const PartyInspectionRepo = {
  async findMany(input: PartyInspectionFindManyInput) {
    const { partyMemberId, partyOrgId, inspectionType, isClosed, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyInspectionTargetWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...(partyOrgId && { partyOrgId }),
      ...(inspectionType && { inspectionType }),
      ...(isClosed === true && { closedAt: { not: null } }),
      ...(isClosed === false && { closedAt: null }),
    };

    const [items, total] = await Promise.all([
      db.partyInspectionTarget.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.partyInspectionTarget.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyInspectionTarget.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
  },

  async create(input: PartyInspectionCreateInput) {
    return db.partyInspectionTarget.create({
      data: input,
      include: LIST_INCLUDE,
    });
  },

  async update(id: string, input: PartyInspectionUpdateInput) {
    return db.partyInspectionTarget.update({
      where: { id },
      data: input,
      include: LIST_INCLUDE,
    });
  },
};
