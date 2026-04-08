import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

const REVIEW_GRADES = ['HTXSNV', 'HTTNV', 'HTNV', 'KHNV'] as const;
type ReviewGrade = (typeof REVIEW_GRADES)[number];

function parseReviewYear(value: unknown): number {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('reviewYear không hợp lệ');
  }
  return year;
}

function parseReviewGrade(value: unknown): ReviewGrade {
  const grade = String(value || '').trim().toUpperCase() as ReviewGrade;
  if (!REVIEW_GRADES.includes(grade)) {
    throw new Error('grade không hợp lệ');
  }
  return grade;
}

export async function listPartyReviews(filters: {
  partyMemberId?: string;
  reviewYear?: string;
  grade?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const offset = (page - 1) * limit;

  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (filters.partyMemberId) conditions.push(Prisma.sql`r."partyMemberId" = ${filters.partyMemberId}`);
  if (filters.reviewYear) conditions.push(Prisma.sql`r."reviewYear" = ${parseReviewYear(filters.reviewYear)}`);
  if (filters.grade) conditions.push(Prisma.sql`r.grade = ${parseReviewGrade(filters.grade)}`);
  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        r.*,
        pm."organizationId",
        u.name AS "partyMemberName",
        u."militaryId" AS "partyMemberMilitaryId",
        u.rank AS "partyMemberRank",
        org.name AS "organizationName"
      FROM party_annual_reviews r
      JOIN party_members pm ON pm.id = r."partyMemberId"
      JOIN users u ON u.id = pm."userId"
      LEFT JOIN party_organizations org ON org.id = pm."organizationId"
      ${whereSql}
      ORDER BY r."reviewYear" DESC, r."updatedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM party_annual_reviews r
      ${whereSql}
    `),
  ]);

  const total = Number(totalRows[0]?.total || 0);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createPartyReview(payload: any) {
  if (!payload?.partyMemberId) throw new Error('partyMemberId là bắt buộc');

  const reviewYear = parseReviewYear(payload.reviewYear);
  const grade = parseReviewGrade(payload.grade);

  const [member] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_members
    WHERE id = ${payload.partyMemberId}
      AND "deletedAt" IS NULL
    LIMIT 1
  `);
  if (!member) throw new Error('Không tìm thấy đảng viên');

  const [existed] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_annual_reviews
    WHERE "partyMemberId" = ${payload.partyMemberId}
      AND "reviewYear" = ${reviewYear}
    LIMIT 1
  `);
  if (existed) {
    throw new Error(`Đảng viên đã có đánh giá năm ${reviewYear}`);
  }

  const [created] = await prisma.$queryRaw<any[]>(Prisma.sql`
    INSERT INTO party_annual_reviews (
      id, "partyMemberId", "reviewYear", grade, comments,
      "approvedBy", "approvedAt", "evidenceUrl", "createdAt", "updatedAt"
    ) VALUES (
      ${randomUUID()},
      ${payload.partyMemberId},
      ${reviewYear},
      ${grade},
      ${payload.comments || null},
      ${payload.approvedBy || null},
      ${payload.approvedAt ? new Date(payload.approvedAt) : null},
      ${payload.evidenceUrl || null},
      NOW(), NOW()
    )
    RETURNING *
  `);

  await prisma.$executeRaw(Prisma.sql`
    UPDATE party_members
    SET "currentReviewGrade" = ${grade}, "updatedAt" = NOW()
    WHERE id = ${payload.partyMemberId}
  `);

  return created;
}

export async function updatePartyReview(id: string, payload: any) {
  const [existing] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT * FROM party_annual_reviews WHERE id = ${id} LIMIT 1
  `);
  if (!existing) return null;

  const nextYear = payload.reviewYear !== undefined ? parseReviewYear(payload.reviewYear) : existing.reviewYear;
  const nextGrade = payload.grade !== undefined ? parseReviewGrade(payload.grade) : existing.grade;

  if (nextYear !== existing.reviewYear) {
    const [duplicated] = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id FROM party_annual_reviews
      WHERE id <> ${id}
        AND "partyMemberId" = ${existing.partyMemberId}
        AND "reviewYear" = ${nextYear}
      LIMIT 1
    `);
    if (duplicated) {
      throw new Error(`Đảng viên đã có đánh giá năm ${nextYear}`);
    }
  }

  const [updated] = await prisma.$queryRaw<any[]>(Prisma.sql`
    UPDATE party_annual_reviews
    SET
      "reviewYear" = ${nextYear},
      grade = ${nextGrade},
      comments = ${payload.comments ?? existing.comments},
      "approvedBy" = ${payload.approvedBy ?? existing.approvedBy},
      "approvedAt" = ${payload.approvedAt !== undefined
        ? (payload.approvedAt ? new Date(payload.approvedAt) : null)
        : existing.approvedAt},
      "evidenceUrl" = ${payload.evidenceUrl ?? existing.evidenceUrl},
      "updatedAt" = NOW()
    WHERE id = ${id}
    RETURNING *
  `);

  await prisma.$executeRaw(Prisma.sql`
    UPDATE party_members
    SET "currentReviewGrade" = ${updated.grade}, "updatedAt" = NOW()
    WHERE id = ${existing.partyMemberId}
  `);

  return updated;
}
