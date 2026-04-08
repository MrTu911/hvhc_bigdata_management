import 'server-only';
import db from '@/lib/db';
import { PartyOrgLevel, PartyOrganizationType, Prisma } from '@prisma/client';

export interface PartyOrgCreateInput {
  code: string;
  name: string;
  shortName?: string;
  organizationType: PartyOrganizationType;
  level?: number;
  orgLevel?: PartyOrgLevel;
  parentId?: string;
  linkedUnitId?: string;
  unitId?: string;
  secretaryUserId?: string;
  deputySecretaryUserId?: string;
  description?: string;
  isActive?: boolean;
  establishedDate?: Date;
  dissolvedDate?: Date;
}

export interface PartyOrgUpdateInput {
  code?: string;
  name?: string;
  shortName?: string;
  organizationType?: PartyOrganizationType;
  level?: number;
  orgLevel?: PartyOrgLevel;
  parentId?: string;
  linkedUnitId?: string;
  unitId?: string;
  secretaryUserId?: string;
  deputySecretaryUserId?: string;
  description?: string;
  isActive?: boolean;
  establishedDate?: Date;
  dissolvedDate?: Date;
}

export interface PartyOrgFindManyInput {
  search?: string;
  orgLevel?: PartyOrgLevel;
  parentId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

const BASIC_INCLUDE = {
  parent: {
    select: { id: true, code: true, name: true },
  },
  _count: {
    select: { members: true, children: true },
  },
} as const;

const FULL_INCLUDE = {
  parent: {
    select: { id: true, code: true, name: true },
  },
  children: {
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      orgLevel: true,
      isActive: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' as const },
  },
  members: {
    where: { deletedAt: null },
    take: 20,
    select: {
      id: true,
      partyRole: true,
      currentPosition: true,
      status: true,
      user: {
        select: { id: true, name: true, militaryId: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { members: true, children: true },
  },
} as const;

export const PartyOrgRepo = {
  async findMany(input: PartyOrgFindManyInput) {
    const { search, orgLevel, parentId, isActive, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyOrganizationWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(orgLevel !== undefined && { orgLevel }),
      ...(parentId !== undefined && { parentId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      db.partyOrganization.findMany({
        where,
        include: BASIC_INCLUDE,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      db.partyOrganization.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyOrganization.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
  },

  async findByCode(code: string) {
    return db.partyOrganization.findUnique({
      where: { code },
      include: BASIC_INCLUDE,
    });
  },

  async create(input: PartyOrgCreateInput) {
    return db.partyOrganization.create({
      data: input,
      include: BASIC_INCLUDE,
    });
  },

  async update(id: string, input: PartyOrgUpdateInput) {
    return db.partyOrganization.update({
      where: { id },
      data: input,
      include: BASIC_INCLUDE,
    });
  },
};
