import 'server-only';
import db from '@/lib/db';
import { TransferType, Prisma } from '@prisma/client';

export interface PartyTransferCreateInput {
  partyMemberId: string;
  transferType: TransferType;
  fromPartyOrgId: string;
  toPartyOrgId: string;
  transferDate: Date;
  introductionLetterNo?: string;
  note?: string;
}

export interface PartyTransferFindManyInput {
  partyMemberId?: string;
  fromPartyOrgId?: string;
  toPartyOrgId?: string;
  transferType?: TransferType;
  confirmStatus?: string;
  page: number;
  limit: number;
}

const LIST_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      user: {
        select: { id: true, name: true, militaryId: true },
      },
    },
  },
  fromPartyOrg: {
    select: { id: true, name: true },
  },
  toPartyOrg: {
    select: { id: true, name: true },
  },
} as const;

const DETAIL_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      partyRole: true,
      partyCardNumber: true,
      currentPosition: true,
      status: true,
      user: {
        select: { id: true, name: true, militaryId: true },
      },
    },
  },
  fromPartyOrg: {
    select: { id: true, code: true, name: true, orgLevel: true },
  },
  toPartyOrg: {
    select: { id: true, code: true, name: true, orgLevel: true },
  },
} as const;

export const PartyTransferRepo = {
  async findMany(input: PartyTransferFindManyInput) {
    const { partyMemberId, fromPartyOrgId, toPartyOrgId, transferType, confirmStatus, page, limit } =
      input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyTransferWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...(fromPartyOrgId && { fromPartyOrgId }),
      ...(toPartyOrgId && { toPartyOrgId }),
      ...(transferType && { transferType }),
      ...(confirmStatus && { confirmStatus }),
    };

    const [items, total] = await Promise.all([
      db.partyTransfer.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { transferDate: 'desc' },
        skip,
        take: limit,
      }),
      db.partyTransfer.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyTransfer.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
  },

  async create(input: PartyTransferCreateInput) {
    return db.partyTransfer.create({
      data: {
        partyMemberId: input.partyMemberId,
        transferType: input.transferType,
        fromPartyOrgId: input.fromPartyOrgId,
        toPartyOrgId: input.toPartyOrgId,
        transferDate: input.transferDate,
        introductionLetterNo: input.introductionLetterNo,
        note: input.note,
        confirmStatus: 'PENDING',
      },
      include: LIST_INCLUDE,
    });
  },

  async confirm(id: string, confirmDate: Date) {
    return db.partyTransfer.update({
      where: { id },
      data: {
        confirmStatus: 'CONFIRMED',
        confirmDate,
      },
      include: LIST_INCLUDE,
    });
  },
};
