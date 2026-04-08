import 'server-only';
import db from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface PartyAwardCreateInput {
  partyMemberId: string;
  title: string;
  decisionNo?: string;
  decisionDate?: Date;
  issuer?: string;
  note?: string;
  attachmentUrl?: string;
}

export interface PartyAwardUpdateInput {
  title?: string;
  decisionNo?: string;
  decisionDate?: Date;
  issuer?: string;
  note?: string;
  attachmentUrl?: string;
}

export interface PartyAwardFindManyInput {
  partyMemberId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

const MEMBER_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      partyCardNumber: true,
      partyCell: true,
      currentPosition: true,
      user: {
        select: {
          id: true,
          name: true,
          militaryId: true,
          rank: true,
          unitRelation: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
} as const;

export const PartyAwardRepo = {
  async findMany(input: PartyAwardFindManyInput) {
    const { partyMemberId, search, dateFrom, dateTo, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyAwardWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...((dateFrom || dateTo) && {
        decisionDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { decisionNo: { contains: search, mode: 'insensitive' } },
          { issuer: { contains: search, mode: 'insensitive' } },
          { partyMember: { user: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      db.partyAward.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: { decisionDate: 'desc' },
        skip,
        take: limit,
      }),
      db.partyAward.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyAward.findUnique({
      where: { id },
      include: MEMBER_INCLUDE,
    });
  },

  async create(input: PartyAwardCreateInput) {
    return db.partyAward.create({
      data: input,
      include: MEMBER_INCLUDE,
    });
  },

  async update(id: string, input: PartyAwardUpdateInput) {
    return db.partyAward.update({
      where: { id },
      data: input,
      include: MEMBER_INCLUDE,
    });
  },

  async delete(id: string) {
    return db.partyAward.delete({
      where: { id },
    });
  },
};
