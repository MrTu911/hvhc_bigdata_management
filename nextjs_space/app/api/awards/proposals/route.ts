/**
 * API: Award Proposals - Đề xuất khen thưởng (workflow)
 * Path: /api/awards/proposals
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const workflowStatus = searchParams.get('workflowStatus') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
      recordType: { in: ['REWARD', 'EMULATION'] },
      workflowStatus: workflowStatus || { in: ['PROPOSED', 'UNDER_REVIEW'] },
    };

    const [proposals, total] = await Promise.all([
      prisma.policyRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, name: true, militaryId: true, rank: true, position: true,
              unitRelation: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { proposedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policyRecord.count({ where }),
    ]);

    await logAudit({ userId: user.id, functionCode: AWARDS.VIEW, action: 'VIEW', resourceType: 'AWARD_PROPOSAL', result: 'SUCCESS' });

    return NextResponse.json({
      proposals,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Award Proposals GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
