/**
 * API: Awards - Quản lý hồ sơ khen thưởng (CRUD)
 * Path: /api/awards
 * Uses PolicyRecord with recordType: REWARD | EMULATION
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

async function getUnitDescendants(unitId: string): Promise<string[]> {
  const allUnits = await prisma.unit.findMany({ select: { id: true, parentId: true } });
  const result: string[] = [unitId];
  const queue = [unitId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    allUnits.filter(u => u.parentId === cur).forEach(c => { result.push(c.id); queue.push(c.id); });
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const workflowStatus = searchParams.get('workflowStatus') || '';
    const year = searchParams.get('year') || '';
    const unitId = searchParams.get('unitId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
      recordType: { in: ['REWARD', 'EMULATION'] },
    };

    if (level) where.level = level;
    if (workflowStatus) where.workflowStatus = workflowStatus;
    if (year) {
      where.decisionDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`),
      };
    }
    if (unitId) {
      const unitIds = await getUnitDescendants(unitId);
      where.user = { unitId: { in: unitIds } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { decisionNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { militaryId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.policyRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, name: true, militaryId: true, rank: true, position: true,
              unitRelation: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { decisionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policyRecord.count({ where }),
    ]);

    const statusStats = await prisma.policyRecord.groupBy({
      by: ['workflowStatus'],
      where: { deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
      _count: { id: true },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.VIEW, action: 'VIEW', resourceType: 'AWARD', result: 'SUCCESS' });

    return NextResponse.json({
      awards: records,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        total,
        byStatus: statusStats.reduce((acc, s) => { acc[s.workflowStatus] = s._count.id; return acc; }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('[Awards GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.CREATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const {
      userId, recordType, level, title, reason, decisionNumber, decisionDate,
      effectiveDate, expiryDate, signerName, signerPosition, issuingUnit,
      year, achievementSummary, isCollective,
    } = body;

    if (!userId || !title || !reason) {
      return NextResponse.json({ error: 'userId, title, reason là bắt buộc' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

    const award = await prisma.policyRecord.create({
      data: {
        userId,
        recordType: recordType || 'REWARD',
        level: level || 'UNIT',
        title,
        reason,
        decisionNumber: decisionNumber || null,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        signerName: signerName || null,
        signerPosition: signerPosition || null,
        issuingUnit: issuingUnit || null,
        workflowStatus: 'PROPOSED',
        status: 'ACTIVE',
        year: year || new Date().getFullYear(),
        achievementSummary: achievementSummary || null,
        isCollective: isCollective || false,
        proposedBy: user.id,
        proposedAt: new Date(),
      },
      include: { user: { select: { name: true, militaryId: true } } },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.CREATE, action: 'CREATE', resourceType: 'AWARD', resourceId: award.id, newValue: { userId, title, recordType }, result: 'SUCCESS' });
    return NextResponse.json(award, { status: 201 });
  } catch (error) {
    console.error('[Awards POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
