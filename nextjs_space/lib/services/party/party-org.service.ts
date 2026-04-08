import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

const PARTY_ORG_LEVELS = ['DANG_UY_HOC_VIEN', 'DANG_BO', 'CHI_BO_CO_SO', 'CHI_BO_GHEP'] as const;

function toBool(value?: string | null) {
  if (value === undefined || value === null || value === '') return undefined;
  return value === 'true' || value === '1';
}

function ensureOrgLevel(level?: string | null) {
  if (!level) return undefined;
  const normalized = level.trim().toUpperCase();
  if (!PARTY_ORG_LEVELS.includes(normalized as (typeof PARTY_ORG_LEVELS)[number])) {
    throw new Error('orgLevel không hợp lệ');
  }
  return normalized;
}

function inferLegacyLevel(orgLevel?: string) {
  switch (orgLevel) {
    case 'DANG_UY_HOC_VIEN':
      return 1;
    case 'DANG_BO':
      return 2;
    case 'CHI_BO_CO_SO':
    case 'CHI_BO_GHEP':
      return 3;
    default:
      return 1;
  }
}

export async function listPartyOrgs(filters: {
  search?: string;
  parentId?: string;
  orgLevel?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const offset = (page - 1) * limit;
  const orgLevel = ensureOrgLevel(filters.orgLevel);
  const isActive = toBool(filters.isActive);

  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (filters.search) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(Prisma.sql`(o.code ILIKE ${q} OR o.name ILIKE ${q} OR o."shortName" ILIKE ${q})`);
  }
  if (filters.parentId) conditions.push(Prisma.sql`o."parentId" = ${filters.parentId}`);
  if (orgLevel) conditions.push(Prisma.sql`o."orgLevel" = ${orgLevel}`);
  if (isActive !== undefined) conditions.push(Prisma.sql`o."isActive" = ${isActive}`);

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        o.*,
        p.name AS "parentName",
        u.name AS "linkedUnitName"
      FROM party_organizations o
      LEFT JOIN party_organizations p ON p.id = o."parentId"
      LEFT JOIN units u ON u.id = COALESCE(o."linkedUnitId", o."unitId")
      ${whereSql}
      ORDER BY o."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM party_organizations o
      ${whereSql}
    `),
  ]);

  const total = Number(totalRows[0]?.total || 0);
  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function createPartyOrg(payload: any) {
  if (!payload?.code?.trim()) throw new Error('code là bắt buộc');
  if (!payload?.name?.trim()) throw new Error('name là bắt buộc');

  const code = String(payload.code).trim();
  const name = String(payload.name).trim();
  const orgLevel = ensureOrgLevel(payload.orgLevel) || 'CHI_BO_CO_SO';

  const [duplicate] = await prisma.$queryRaw<any[]>(
    Prisma.sql`SELECT id FROM party_organizations WHERE code = ${code} LIMIT 1`,
  );
  if (duplicate) throw new Error('code đã tồn tại');

  if (payload.parentId) {
    const [parent] = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT id FROM party_organizations WHERE id = ${payload.parentId} LIMIT 1`,
    );
    if (!parent) throw new Error('parentId không tồn tại');
  }

  const [created] = await prisma.$queryRaw<any[]>(Prisma.sql`
    INSERT INTO party_organizations (
      id, code, name, "shortName", "organizationType", level, "orgLevel", "parentId",
      "linkedUnitId", "unitId", "secretaryUserId", "deputySecretaryUserId",
      description, "isActive", "createdAt", "updatedAt"
    ) VALUES (
      ${randomUUID()},
      ${code},
      ${name},
      ${payload.shortName || null},
      ${payload.organizationType || 'CHI_BO'},
      ${Number(payload.level || inferLegacyLevel(orgLevel))},
      ${orgLevel},
      ${payload.parentId || null},
      ${payload.linkedUnitId || null},
      ${payload.unitId || null},
      ${payload.secretaryUserId || null},
      ${payload.deputySecretaryUserId || null},
      ${payload.description || null},
      ${payload.isActive === undefined ? true : !!payload.isActive},
      NOW(), NOW()
    )
    RETURNING *
  `);

  return created;
}

export async function updatePartyOrg(id: string, payload: any) {
  const [current] = await prisma.$queryRaw<any[]>(
    Prisma.sql`SELECT * FROM party_organizations WHERE id = ${id} LIMIT 1`,
  );
  if (!current) return null;

  const orgLevel = ensureOrgLevel(payload.orgLevel) || current.orgLevel;
  const code = payload.code?.trim() ?? current.code;

  if (code !== current.code) {
    const [duplicate] = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT id FROM party_organizations WHERE code = ${code} AND id <> ${id} LIMIT 1`,
    );
    if (duplicate) throw new Error('code đã tồn tại');
  }

  if (payload.parentId) {
    const [parent] = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT id FROM party_organizations WHERE id = ${payload.parentId} LIMIT 1`,
    );
    if (!parent) throw new Error('parentId không tồn tại');
  }

  const [updated] = await prisma.$queryRaw<any[]>(Prisma.sql`
    UPDATE party_organizations
    SET
      code = ${code},
      name = ${payload.name?.trim() ?? current.name},
      "shortName" = ${payload.shortName ?? current.shortName},
      "organizationType" = ${payload.organizationType ?? current.organizationType},
      level = ${Number(payload.level ?? inferLegacyLevel(orgLevel))},
      "orgLevel" = ${orgLevel},
      "parentId" = ${payload.parentId ?? current.parentId},
      "linkedUnitId" = ${payload.linkedUnitId ?? current.linkedUnitId},
      "unitId" = ${payload.unitId ?? current.unitId},
      "secretaryUserId" = ${payload.secretaryUserId ?? current.secretaryUserId},
      "deputySecretaryUserId" = ${payload.deputySecretaryUserId ?? current.deputySecretaryUserId},
      description = ${payload.description ?? current.description},
      "isActive" = ${payload.isActive === undefined ? current.isActive : !!payload.isActive},
      "updatedAt" = NOW()
    WHERE id = ${id}
    RETURNING *
  `);

  return updated;
}
