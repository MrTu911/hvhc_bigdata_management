import 'server-only';
import db from '@/lib/db';
import { DisciplineSeverity, Prisma } from '@prisma/client';

export interface PartyDisciplineCreateInput {
  partyMemberId: string;
  severity: DisciplineSeverity;
  decisionNo?: string;
  decisionDate?: Date;
  expiryDate?: Date;
  issuer?: string;
  reason?: string;
  attachmentUrl?: string;
}

export interface PartyDisciplineUpdateInput {
  severity?: DisciplineSeverity;
  decisionNo?: string;
  decisionDate?: Date;
  expiryDate?: Date;
  issuer?: string;
  reason?: string;
  attachmentUrl?: string;
}

export interface PartyDisciplineFindManyInput {
  partyMemberId?: string;
  severity?: DisciplineSeverity;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

const MEMBER_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      user: {
        select: { id: true, name: true },
      },
    },
  },
} as const;

export const PartyDisciplineRepo = {
  async findMany(input: PartyDisciplineFindManyInput) {
    const { partyMemberId, severity, dateFrom, dateTo, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyDisciplineWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...(severity && { severity }),
      ...((dateFrom || dateTo) && {
        decisionDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      db.partyDiscipline.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: { decisionDate: 'desc' },
        skip,
        take: limit,
      }),
      db.partyDiscipline.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyDiscipline.findUnique({
      where: { id },
      include: MEMBER_INCLUDE,
    });
  },

  async create(input: PartyDisciplineCreateInput) {
    return db.partyDiscipline.create({
      data: input,
      include: MEMBER_INCLUDE,
    });
  },

  async update(id: string, input: PartyDisciplineUpdateInput) {
    return db.partyDiscipline.update({
      where: { id },
      data: input,
      include: MEMBER_INCLUDE,
    });
  },
};
