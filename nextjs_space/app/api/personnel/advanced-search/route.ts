/**
 * API: Personnel Advanced Search – Tìm kiếm nhân sự nâng cao
 * Path: POST /api/personnel/advanced-search
 * Supports multi-field filtering, range queries, and full-text search
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      // Basic identity
      keyword,          // Full-text across name, militaryId, email
      name,
      militaryId,
      email,
      // Classification
      rank,             // Exact or partial match
      rankList,         // Array of rank values
      position,
      unitId,
      unitIds,          // Array
      // Status
      workStatus,       // ACTIVE | TRANSFERRED | RETIRED | SUSPENDED | RESIGNED
      isActive,
      gender,
      // Date ranges
      dobFrom,
      dobTo,
      enlistmentFrom,
      enlistmentTo,
      // Party membership
      isPartyMember,
      // Education
      educationLevel,
      // Awards/Discipline
      hasAwards,
      hasDiscipline,
      // Pagination & sort
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = body;

    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where: any = {};
    if (isActive !== undefined) {
      where.status = isActive ? 'ACTIVE' : { not: 'ACTIVE' };
    }

    // Keyword search (OR across multiple fields)
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { militaryId: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { position: { contains: keyword, mode: 'insensitive' } },
        { rank: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (militaryId) where.militaryId = { contains: militaryId, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (position) where.position = { contains: position, mode: 'insensitive' };

    // Rank – exact list or partial
    if (rankList?.length) {
      where.rank = { in: rankList };
    } else if (rank) {
      where.rank = { contains: rank, mode: 'insensitive' };
    }

    // Unit
    if (unitIds?.length) {
      where.unitId = { in: unitIds };
    } else if (unitId) {
      where.unitId = unitId;
    }

    // Status filters
    if (workStatus) where.workStatus = workStatus;
    // Map frontend gender codes to DB values (DB stores 'Nam'/'Nữ')
    if (gender) {
      where.gender = gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : gender;
    }

    // Date ranges
    if (dobFrom || dobTo) {
      where.dateOfBirth = {
        ...(dobFrom && { gte: new Date(dobFrom) }),
        ...(dobTo && { lte: new Date(dobTo) }),
      };
    }
    if (enlistmentFrom || enlistmentTo) {
      where.enlistmentDate = {
        ...(enlistmentFrom && { gte: new Date(enlistmentFrom) }),
        ...(enlistmentTo && { lte: new Date(enlistmentTo) }),
      };
    }

    // Party member filter
    if (isPartyMember === true) {
      where.partyMember = { isNot: null };
    } else if (isPartyMember === false) {
      where.partyMember = { is: null };
    }

    // Education level
    if (educationLevel) {
      where.educationLevel = { contains: educationLevel, mode: 'insensitive' };
    }

    // Awards/Discipline filters (existence check)
    if (hasAwards) {
      where.policyRecords = {
        some: { recordType: { in: ['REWARD', 'EMULATION'] }, workflowStatus: 'APPROVED', deletedAt: null },
      };
    }
    if (hasDiscipline) {
      where.policyRecords = {
        some: { recordType: 'DISCIPLINE', workflowStatus: 'APPROVED', deletedAt: null },
      };
    }

    // Sorting
    const orderBy: any = {};
    const validSortFields = ['name', 'rank', 'militaryId', 'dateOfBirth', 'enlistmentDate', 'createdAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'name';
    orderBy[field] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [personnel, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          militaryId: true,
          rank: true,
          position: true,
          gender: true,
          dateOfBirth: true,
          email: true,
          workStatus: true,
          enlistmentDate: true,
          educationLevel: true,
          unitRelation: { select: { id: true, name: true } },
          partyMember: { select: { status: true, joinDate: true } },
          _count: {
            select: {
              policyRecords: true,
              educationHistory: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Facets – counts for sidebar filters
    const [rankFacets, statusFacets, genderFacets] = await Promise.all([
      prisma.user.groupBy({
        by: ['rank'],
        where: { ...where, rank: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }).catch(() => []),
      prisma.user.groupBy({
        by: ['workStatus'],
        where,
        _count: { id: true },
      }).catch(() => []),
      prisma.user.groupBy({
        by: ['gender'],
        where: { ...where, gender: { not: null } },
        _count: { id: true },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      personnel,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      facets: {
        rank: rankFacets.map((r: any) => ({ value: r.rank, count: r._count.id })),
        workStatus: statusFacets.map((r: any) => ({ value: r.workStatus, count: r._count.id })),
        gender: genderFacets.map((r: any) => ({
          value: r.gender === 'Nam' ? 'MALE' : r.gender === 'Nữ' ? 'FEMALE' : r.gender,
          count: r._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('[Personnel Advanced Search POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
