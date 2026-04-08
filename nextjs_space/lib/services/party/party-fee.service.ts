import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

function ensureMonth(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    throw new Error('paymentMonth phải đúng định dạng YYYY-MM');
  }
  return value;
}

function nonNegative(value: any, field: string) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) throw new Error(`${field} không âm`);
  return num;
}

function feeStatus(expectedAmount: number, actualAmount: number) {
  if (actualAmount <= 0) return 'UNPAID';
  if (actualAmount >= expectedAmount) return 'PAID';
  return 'PARTIAL';
}

export async function listPartyFees(filters: {
  paymentMonth?: string;
  status?: string;
  partyMemberId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const offset = (page - 1) * limit;

  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (filters.paymentMonth) conditions.push(Prisma.sql`f."paymentMonth" = ${filters.paymentMonth}`);
  if (filters.status) conditions.push(Prisma.sql`f.status = ${filters.status}`);
  if (filters.partyMemberId) conditions.push(Prisma.sql`f."partyMemberId" = ${filters.partyMemberId}`);
  if (filters.organizationId) conditions.push(Prisma.sql`pm."organizationId" = ${filters.organizationId}`);

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  const [items, totalRows, debtRows] = await Promise.all([
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        f.*,
        u.name AS "partyMemberName",
        pm."organizationId",
        org.name AS "organizationName"
      FROM party_fee_payments f
      JOIN party_members pm ON pm.id = f."partyMemberId"
      JOIN users u ON u.id = pm."userId"
      LEFT JOIN party_organizations org ON org.id = pm."organizationId"
      ${whereSql}
      ORDER BY f."paymentMonth" DESC, f."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM party_fee_payments f
      JOIN party_members pm ON pm.id = f."partyMemberId"
      ${whereSql}
    `),
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(f."expectedAmount"), 0)::float AS "expectedTotal",
        COALESCE(SUM(f."actualAmount"), 0)::float AS "actualTotal",
        COALESCE(SUM(f."debtAmount"), 0)::float AS "debtTotal",
        COUNT(*) FILTER (WHERE f.status = 'PAID')::int AS "paidCount",
        COUNT(*) FILTER (WHERE f.status = 'PARTIAL')::int AS "partialCount",
        COUNT(*) FILTER (WHERE f.status = 'UNPAID')::int AS "unpaidCount"
      FROM party_fee_payments f
      JOIN party_members pm ON pm.id = f."partyMemberId"
      ${whereSql}
    `),
  ]);

  const total = Number(totalRows[0]?.total || 0);
  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    debtSummary: debtRows[0] || {
      expectedTotal: 0,
      actualTotal: 0,
      debtTotal: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
    },
  };
}

export async function createPartyFee(payload: any) {
  if (!payload?.partyMemberId) throw new Error('partyMemberId là bắt buộc');

  const paymentMonth = ensureMonth(payload.paymentMonth);
  const expectedAmount = nonNegative(payload.expectedAmount, 'expectedAmount');
  const actualAmount = nonNegative(payload.actualAmount ?? 0, 'actualAmount');
  const debtAmount = Math.max(0, expectedAmount - actualAmount);
  const status = feeStatus(expectedAmount, actualAmount);

  const [member] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_members WHERE id = ${payload.partyMemberId} LIMIT 1
  `);
  if (!member) throw new Error('partyMemberId không tồn tại');

  const [upserted] = await prisma.$queryRaw<any[]>(Prisma.sql`
    INSERT INTO party_fee_payments (
      id, "partyMemberId", "paymentMonth", "expectedAmount", "actualAmount",
      "paymentDate", "debtAmount", status, note, "createdAt", "updatedAt"
    ) VALUES (
      ${randomUUID()},
      ${payload.partyMemberId},
      ${paymentMonth},
      ${expectedAmount},
      ${actualAmount},
      ${payload.paymentDate ? new Date(payload.paymentDate) : null},
      ${debtAmount},
      ${status},
      ${payload.note || null},
      NOW(), NOW()
    )
    ON CONFLICT ("partyMemberId", "paymentMonth")
    DO UPDATE SET
      "expectedAmount" = EXCLUDED."expectedAmount",
      "actualAmount" = EXCLUDED."actualAmount",
      "paymentDate" = EXCLUDED."paymentDate",
      "debtAmount" = EXCLUDED."debtAmount",
      status = EXCLUDED.status,
      note = EXCLUDED.note,
      "updatedAt" = NOW()
    RETURNING *
  `);

  await refreshPartyMemberDebt(payload.partyMemberId);
  return upserted;
}

export async function autoGeneratePartyFees(payload: any) {
  const paymentMonth = ensureMonth(payload?.paymentMonth);
  const expectedAmount = nonNegative(payload?.expectedAmount ?? 0, 'expectedAmount');

  const members = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id
    FROM party_members
    WHERE "deletedAt" IS NULL
      AND status IN ('DU_BI', 'CHINH_THUC')
      ${payload?.organizationId ? Prisma.sql`AND "organizationId" = ${payload.organizationId}` : Prisma.sql``}
  `);

  if (members.length === 0) {
    return { paymentMonth, generatedCount: 0, generatedMemberIds: [] as string[] };
  }

  await prisma.$transaction(
    members.map((m) =>
      prisma.$executeRaw(Prisma.sql`
        INSERT INTO party_fee_payments (
          id, "partyMemberId", "paymentMonth", "expectedAmount", "actualAmount",
          "debtAmount", status, "createdAt", "updatedAt"
        ) VALUES (
          ${randomUUID()},
          ${m.id},
          ${paymentMonth},
          ${expectedAmount},
          0,
          ${expectedAmount},
          'UNPAID',
          NOW(), NOW()
        )
        ON CONFLICT ("partyMemberId", "paymentMonth")
        DO NOTHING
      `),
    ),
  );

  await prisma.$executeRaw(Prisma.sql`
    UPDATE party_members pm
    SET "currentDebtAmount" = COALESCE(sub.total_debt, 0), "updatedAt" = NOW()
    FROM (
      SELECT "partyMemberId", SUM("debtAmount")::float AS total_debt
      FROM party_fee_payments
      WHERE "partyMemberId" IN (${Prisma.join(members.map((m) => m.id))})
      GROUP BY "partyMemberId"
    ) sub
    WHERE pm.id = sub."partyMemberId"
  `);

  return {
    paymentMonth,
    generatedCount: members.length,
    generatedMemberIds: members.map((m) => m.id),
  };
}

export async function getPartyMemberFeeHistory(partyMemberId: string) {
  const [member] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT pm.id, pm."partyCardNumber", u.name AS "partyMemberName", pm."currentDebtAmount"
    FROM party_members pm
    JOIN users u ON u.id = pm."userId"
    WHERE pm.id = ${partyMemberId}
    LIMIT 1
  `);
  if (!member) return null;

  const items = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT *
    FROM party_fee_payments
    WHERE "partyMemberId" = ${partyMemberId}
    ORDER BY "paymentMonth" DESC
  `);

  return {
    member,
    items,
    summary: {
      expectedTotal: items.reduce((s, x) => s + Number(x.expectedAmount || 0), 0),
      actualTotal: items.reduce((s, x) => s + Number(x.actualAmount || 0), 0),
      debtTotal: items.reduce((s, x) => s + Number(x.debtAmount || 0), 0),
    },
  };
}

export async function refreshPartyMemberDebt(partyMemberId: string) {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE party_members
    SET "currentDebtAmount" = (
      SELECT COALESCE(SUM("debtAmount"), 0)
      FROM party_fee_payments
      WHERE "partyMemberId" = ${partyMemberId}
    ),
    "updatedAt" = NOW()
    WHERE id = ${partyMemberId}
  `);
}
