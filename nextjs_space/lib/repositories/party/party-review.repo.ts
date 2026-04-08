import 'server-only';
import db from '@/lib/db';
import { ReviewGrade, Prisma } from '@prisma/client';

export interface PartyReviewCreateInput {
  partyMemberId: string;
  reviewYear: number;
  grade: ReviewGrade;
  comments?: string;
  approvedBy?: string;
  approvedAt?: Date;
  evidenceUrl?: string;
}

export interface PartyReviewUpdateInput {
  grade?: ReviewGrade;
  comments?: string;
  approvedBy?: string;
  approvedAt?: Date;
  evidenceUrl?: string;
}

export interface PartyReviewFindManyInput {
  partyMemberId?: string;
  reviewYear?: number;
  grade?: ReviewGrade;
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

export const PartyReviewRepo = {
  async findMany(input: PartyReviewFindManyInput) {
    const { partyMemberId, reviewYear, grade, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyAnnualReviewWhereInput = {
      ...(partyMemberId && { partyMemberId }),
      ...(reviewYear !== undefined && { reviewYear }),
      ...(grade && { grade }),
    };

    const [items, total] = await Promise.all([
      db.partyAnnualReview.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: [{ reviewYear: 'desc' }],
        skip,
        take: limit,
      }),
      db.partyAnnualReview.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyAnnualReview.findUnique({
      where: { id },
      include: MEMBER_INCLUDE,
    });
  },

  async findByMemberAndYear(partyMemberId: string, reviewYear: number) {
    return db.partyAnnualReview.findFirst({
      where: { partyMemberId, reviewYear },
      include: MEMBER_INCLUDE,
    });
  },

  async create(input: PartyReviewCreateInput) {
    return db.partyAnnualReview.create({
      data: input,
      include: MEMBER_INCLUDE,
    });
  },

  async update(id: string, input: PartyReviewUpdateInput) {
    return db.partyAnnualReview.update({
      where: { id },
      data: input,
      include: MEMBER_INCLUDE,
    });
  },
};
