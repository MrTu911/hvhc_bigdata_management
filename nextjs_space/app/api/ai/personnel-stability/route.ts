/**
 * API: AI Personnel Stability - Chỉ số ổn định nhân sự
 * Path: /api/ai/personnel-stability
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { unitId, userId } = body;

    const now = new Date();
    const last12Months = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    if (userId) {
      // Chỉ số ổn định cá nhân
      const [disciplines, transfers, awards] = await Promise.all([
        prisma.policyRecord.count({
          where: { userId, deletedAt: null, recordType: 'DISCIPLINE', workflowStatus: 'APPROVED', decisionDate: { gte: last12Months } },
        }),
        prisma.partyMemberHistory.count({
          where: {
            partyMember: { userId },
            historyType: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
            effectiveDate: { gte: last12Months },
          },
        }).catch(() => 0),
        prisma.policyRecord.count({
          where: { userId, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] }, workflowStatus: 'APPROVED', decisionDate: { gte: last12Months } },
        }),
      ]);

      const stabilityScore = Math.max(0, Math.min(100, 100 - disciplines * 25 - transfers * 10 + awards * 5));
      const riskLevel = stabilityScore >= 80 ? 'LOW' : stabilityScore >= 60 ? 'MEDIUM' : stabilityScore >= 40 ? 'HIGH' : 'CRITICAL';

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, militaryId: true, rank: true },
      });

      return NextResponse.json({
        type: 'individual',
        userId,
        user: targetUser,
        stabilityIndex: parseFloat((stabilityScore / 100).toFixed(2)),
        stabilityScore,
        riskLevel,
        factors: {
          disciplinesLast12Months: disciplines,
          transfersLast12Months: transfers,
          awardsLast12Months: awards,
        },
        recommendation: stabilityScore < 60
          ? 'Cần theo dõi và hỗ trợ cán bộ này'
          : stabilityScore < 80
          ? 'Ổn định, tiếp tục theo dõi định kỳ'
          : 'Cán bộ ổn định, phù hợp giao nhiệm vụ quan trọng',
        calculatedAt: new Date().toISOString(),
      });
    }

    if (unitId) {
      // Chỉ số ổn định đơn vị
      const unitUsers = await prisma.user.findMany({
        where: { unitId, status: 'ACTIVE' },
        select: { id: true, name: true, militaryId: true, rank: true },
        take: 100,
      });

      const [totalDisciplines, totalAwards] = await Promise.all([
        prisma.policyRecord.count({
          where: {
            userId: { in: unitUsers.map(u => u.id) },
            deletedAt: null,
            recordType: 'DISCIPLINE',
            workflowStatus: 'APPROVED',
            decisionDate: { gte: last12Months },
          },
        }),
        prisma.policyRecord.count({
          where: {
            userId: { in: unitUsers.map(u => u.id) },
            deletedAt: null,
            recordType: { in: ['REWARD', 'EMULATION'] },
            workflowStatus: 'APPROVED',
            decisionDate: { gte: last12Months },
          },
        }),
      ]);

      const unitSize = unitUsers.length;
      const disciplineRate = unitSize > 0 ? totalDisciplines / unitSize : 0;
      const awardRate = unitSize > 0 ? totalAwards / unitSize : 0;
      const unitStabilityScore = Math.max(0, Math.min(100, 100 - disciplineRate * 50 + awardRate * 10));

      return NextResponse.json({
        type: 'unit',
        unitId,
        personnelCount: unitSize,
        unitStabilityScore: parseFloat(unitStabilityScore.toFixed(1)),
        stabilityIndex: parseFloat((unitStabilityScore / 100).toFixed(2)),
        riskLevel: unitStabilityScore >= 80 ? 'LOW' : unitStabilityScore >= 60 ? 'MEDIUM' : 'HIGH',
        factors: {
          disciplineCount: totalDisciplines,
          disciplineRate: parseFloat(disciplineRate.toFixed(3)),
          awardCount: totalAwards,
          awardRate: parseFloat(awardRate.toFixed(3)),
        },
        calculatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'userId hoặc unitId là bắt buộc' }, { status: 400 });
  } catch (error) {
    console.error('[Personnel Stability POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Top low-stability personnel (risk ranking)
    const now = new Date();
    const last12Months = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const recentDisciplines = await prisma.policyRecord.groupBy({
      by: ['userId'],
      where: {
        deletedAt: null,
        recordType: 'DISCIPLINE',
        workflowStatus: 'APPROVED',
        decisionDate: { gte: last12Months },
        ...(unitId ? { user: { unitId } } : {}),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = recentDisciplines.map(d => d.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, militaryId: true, rank: true, position: true, unitRelation: { select: { name: true } } },
    });
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);

    return NextResponse.json({
      highRiskPersonnel: recentDisciplines.map((d, idx) => ({
        rank: idx + 1,
        user: userMap[d.userId],
        disciplineCount: d._count.id,
        riskLevel: d._count.id >= 3 ? 'CRITICAL' : d._count.id >= 2 ? 'HIGH' : 'MEDIUM',
      })),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[Personnel Stability GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
