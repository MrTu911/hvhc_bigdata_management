import 'server-only';
import db from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface PartyFeeUpsertInput {
  partyMemberId: string;
  paymentMonth: string;
  expectedAmount: number;
  actualAmount: number;
  debtAmount: number;
  paymentDate?: Date;
  status: string;
  note?: string;
}

export interface PartyFeeFindManyInput {
  partyMemberId?: string;
  paymentYear?: number;
  status?: string;
  page: number;
  limit: number;
}

const MEMBER_INCLUDE = {
  partyMember: {
    select: {
      id: true,
      user: {
        select: { id: true, name: true, militaryId: true },
      },
    },
  },
} as const;

export const PartyFeeRepo = {
  async findMany(input: PartyFeeFindManyInput) {
    const { partyMemberId, paymentYear, status, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyFeePaymentWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...(paymentYear !== undefined && {
        paymentMonth: { startsWith: `${paymentYear}` },
      }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      db.partyFeePayment.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: [{ paymentMonth: 'desc' }],
        skip,
        take: limit,
      }),
      db.partyFeePayment.count({ where }),
    ]);

    return { items, total };
  },

  async findByMemberAndMonth(partyMemberId: string, paymentMonth: string) {
    return db.partyFeePayment.findFirst({
      where: { partyMemberId, paymentMonth },
      include: MEMBER_INCLUDE,
    });
  },

  async upsert(input: PartyFeeUpsertInput) {
    const { partyMemberId, paymentMonth, ...rest } = input;
    return db.partyFeePayment.upsert({
      where: {
        partyMemberId_paymentMonth: { partyMemberId, paymentMonth },
      },
      create: {
        partyMemberId,
        paymentMonth,
        expectedAmount: rest.expectedAmount,
        actualAmount: rest.actualAmount,
        debtAmount: rest.debtAmount,
        paymentDate: rest.paymentDate,
        status: rest.status,
        note: rest.note,
      },
      update: {
        expectedAmount: rest.expectedAmount,
        actualAmount: rest.actualAmount,
        debtAmount: rest.debtAmount,
        paymentDate: rest.paymentDate,
        status: rest.status,
        note: rest.note,
      },
      include: MEMBER_INCLUDE,
    });
  },

  async sumDebtByMemberId(partyMemberId: string) {
    const result = await db.partyFeePayment.aggregate({
      where: {
        partyMemberId,
        debtAmount: { gt: 0 },
      },
      _sum: { debtAmount: true },
    });
    return result._sum.debtAmount ?? 0;
  },

  async updateMemberDebt(partyMemberId: string, totalDebt: number) {
    return db.partyMember.update({
      where: { id: partyMemberId },
      data: { currentDebtAmount: totalDebt },
    });
  },
};
