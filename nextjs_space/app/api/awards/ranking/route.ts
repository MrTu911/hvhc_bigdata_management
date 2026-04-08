/**
 * API: Awards Ranking - Bảng xếp hạng thi đua
 * Path: /api/awards/ranking
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const rankBy = searchParams.get('rankBy') || 'individual'; // individual | unit
    const limit = parseInt(searchParams.get('limit') || '20');

    if (rankBy === 'unit') {
      // Xếp hạng theo đơn vị
      const unitRanking = await prisma.policyRecord.groupBy({
        by: ['unitId'],
        where: {
          deletedAt: null,
          recordType: { in: ['REWARD', 'EMULATION'] },
          workflowStatus: 'APPROVED',
          decisionDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
          unitId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      const unitIds = unitRanking.map(r => r.unitId).filter(Boolean) as string[];
      const units = await prisma.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, name: true, code: true },
      });
      const unitMap = units.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);

      return NextResponse.json({
        year,
        rankBy: 'unit',
        ranking: unitRanking.map((r, idx) => ({
          rank: idx + 1,
          unit: r.unitId ? unitMap[r.unitId] : null,
          awardCount: r._count.id,
        })),
      });
    }

    // Xếp hạng cá nhân
    const individualRanking = await prisma.policyRecord.groupBy({
      by: ['userId'],
      where: {
        deletedAt: null,
        recordType: { in: ['REWARD', 'EMULATION'] },
        workflowStatus: 'APPROVED',
        decisionDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = individualRanking.map(r => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, militaryId: true, rank: true, position: true, unitRelation: { select: { id: true, name: true } } },
    });
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);

    return NextResponse.json({
      year,
      rankBy: 'individual',
      ranking: individualRanking.map((r, idx) => ({
        rank: idx + 1,
        user: userMap[r.userId],
        awardCount: r._count.id,
      })),
    });
  } catch (error) {
    console.error('[Awards Ranking GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
