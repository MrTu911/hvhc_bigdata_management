/**
 * API: Disciplines - Quản lý hồ sơ kỷ luật
 * Path: /api/disciplines
 * Uses PolicyRecord with recordType: DISCIPLINE
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
    const authResult = await requireFunction(request, AWARDS.VIEW_DISCIPLINE);
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

    const where: any = { deletedAt: null, recordType: 'DISCIPLINE' };
    if (level) where.level = level;
    if (workflowStatus) where.workflowStatus = workflowStatus;
    if (year) {
      where.decisionDate = { gte: new Date(`${year}-01-01`), lt: new Date(`${parseInt(year) + 1}-01-01`) };
    }
    if (unitId) {
      const unitIds = await getUnitDescendants(unitId);
      where.user = { unitId: { in: unitIds } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { decisionNumber: { contains: search, mode: 'insensitive' } },
        { violationSummary: { contains: search, mode: 'insensitive' } },
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

    const levelStats = await prisma.policyRecord.groupBy({
      by: ['level'],
      where: { deletedAt: null, recordType: 'DISCIPLINE' },
      _count: { id: true },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.VIEW_DISCIPLINE, action: 'VIEW', resourceType: 'DISCIPLINE', result: 'SUCCESS' });

    return NextResponse.json({
      disciplines: records,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        total,
        byLevel: levelStats.reduce((acc, s) => { acc[s.level] = s._count.id; return acc; }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('[Disciplines GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.CREATE_DISCIPLINE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const {
      userId, level, title, reason, violationSummary, legalBasis,
      decisionNumber, decisionDate, effectiveDate, expiryDate,
      signerName, signerPosition, issuingUnit, durationMonths,
    } = body;

    if (!userId || !title || !reason) {
      return NextResponse.json({ error: 'userId, title, reason là bắt buộc' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

    const discipline = await prisma.policyRecord.create({
      data: {
        userId,
        recordType: 'DISCIPLINE',
        level: level || 'UNIT',
        title,
        reason,
        violationSummary: violationSummary || null,
        legalBasis: legalBasis || null,
        decisionNumber: decisionNumber || null,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        signerName: signerName || null,
        signerPosition: signerPosition || null,
        issuingUnit: issuingUnit || null,
        durationMonths: durationMonths || null,
        workflowStatus: 'PROPOSED',
        status: 'ACTIVE',
        year: new Date().getFullYear(),
        proposedBy: user.id,
        proposedAt: new Date(),
      },
      include: { user: { select: { name: true, militaryId: true } } },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.CREATE_DISCIPLINE, action: 'CREATE', resourceType: 'DISCIPLINE', resourceId: discipline.id, newValue: { userId, title, level }, result: 'SUCCESS' });
    return NextResponse.json(discipline, { status: 201 });
  } catch (error) {
    console.error('[Disciplines POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
