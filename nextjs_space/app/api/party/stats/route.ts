/**
 * API: Party Stats - Thống kê & báo cáo Đảng
 * Path: /api/party/stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const [
      totalMembers,
      byStatus,
      byPosition,
      evaluationsThisYear,
      gradeDistribution,
      activitiesThisYear,
      transfersThisYear,
      newMembersThisYear,
    ] = await Promise.all([
      prisma.partyMember.count({ where: { deletedAt: null } }),
      prisma.partyMember.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { id: true } }),
      prisma.partyMember.groupBy({ by: ['currentPosition'], where: { deletedAt: null }, _count: { id: true } }),
      prisma.partyActivity.count({ where: { activityType: 'EVALUATION', evaluationYear: year, deletedAt: null } }),
      prisma.partyActivity.groupBy({
        by: ['evaluationGrade'],
        where: { activityType: 'EVALUATION', evaluationYear: year, deletedAt: null },
        _count: { id: true },
      }),
      prisma.partyActivity.count({
        where: {
          activityType: { not: 'EVALUATION' },
          activityDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
          deletedAt: null,
        },
      }),
      prisma.partyMemberHistory.count({
        where: {
          historyType: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
          effectiveDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
        },
      }),
      prisma.partyMember.count({
        where: {
          joinDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      year,
      overview: {
        totalMembers,
        evaluationsThisYear,
        activitiesThisYear,
        transfersThisYear,
        newMembersThisYear,
      },
      byStatus: byStatus.reduce((acc, s) => { acc[s.status] = s._count.id; return acc; }, {} as Record<string, number>),
      byPosition: byPosition.reduce((acc, s) => { if (s.currentPosition) acc[s.currentPosition] = s._count.id; return acc; }, {} as Record<string, number>),
      gradeDistribution: gradeDistribution.reduce((acc, s) => { if (s.evaluationGrade) acc[s.evaluationGrade] = s._count.id; return acc; }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('[Party Stats GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
