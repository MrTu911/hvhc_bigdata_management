/**
 * API: Party Evaluations - Đánh giá phân loại đảng viên hàng năm
 * Path: /api/party/evaluations
 * Uses PartyAnnualReview model (party_annual_reviews table)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, getScopeFromAuthResult } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

const MEMBER_INCLUDE = {
  partyMember: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          militaryId: true,
          rank: true,
          position: true,
          unitRelation: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const scope = getScopeFromAuthResult(authResult.authResult);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const grade = searchParams.get('grade') || '';
    const submissionStatus = searchParams.get('submissionStatus') || '';
    const partyMemberId = searchParams.get('partyMemberId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Scope-based unit filtering: UNIT sees own unit only, DEPARTMENT sees subtree
    const unitIds = scope !== 'ACADEMY' ? await getAccessibleUnitIds(user, scope) : null;

    const where: any = {};

    if (year) where.reviewYear = year;
    if (grade) where.grade = grade;
    if (submissionStatus) where.submissionStatus = submissionStatus;
    if (partyMemberId) where.partyMemberId = partyMemberId;

    // Build partyMember filter combining scope + search
    const memberFilter: any = {};
    if (unitIds !== null) {
      memberFilter.user = { unitId: { in: unitIds } };
    }
    if (search) {
      const searchFilter = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { militaryId: { contains: search, mode: 'insensitive' } },
        ],
      };
      if (memberFilter.user) {
        memberFilter.user = { AND: [memberFilter.user, searchFilter] };
      } else {
        memberFilter.user = searchFilter;
      }
    }
    if (Object.keys(memberFilter).length > 0) {
      where.partyMember = memberFilter;
    }

    const [evaluations, total] = await Promise.all([
      prisma.partyAnnualReview.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: [{ reviewYear: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partyAnnualReview.count({ where }),
    ]);

    // Grade + submission stats — filtered by year only, for the distribution cards
    const gradeStatsWhere: any = {};
    if (year) gradeStatsWhere.reviewYear = year;
    if (unitIds !== null) {
      gradeStatsWhere.partyMember = { user: { unitId: { in: unitIds } } };
    }

    const [gradeStats, submissionStats] = await Promise.all([
      prisma.partyAnnualReview.groupBy({
        by: ['grade'],
        where: gradeStatsWhere,
        _count: { id: true },
      }),
      prisma.partyAnnualReview.groupBy({
        by: ['submissionStatus'],
        where: gradeStatsWhere,
        _count: { id: true },
      }),
    ]);

    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW',
      resourceType: 'PARTY_EVALUATION',
      result: 'SUCCESS',
      metadata: { year, grade },
    });

    return NextResponse.json({
      evaluations,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        total,
        byGrade: gradeStats.reduce((acc, s) => {
          acc[s.grade] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        bySubmissionStatus: submissionStats.reduce((acc, s) => {
          acc[s.submissionStatus] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('[Party Evaluations GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const body = await request.json();

    const { partyMemberId, reviewYear, grade, comments, approvedBy, evidenceUrl } = body;

    if (!partyMemberId || !reviewYear || !grade) {
      return NextResponse.json(
        { error: 'partyMemberId, reviewYear, grade là bắt buộc' },
        { status: 400 },
      );
    }

    const member = await prisma.partyMember.findUnique({ where: { id: partyMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const evaluation = await prisma.partyAnnualReview.create({
      data: {
        partyMemberId,
        reviewYear: parseInt(String(reviewYear)),
        grade,
        comments: comments || null,
        approvedBy: approvedBy || null,
        evidenceUrl: evidenceUrl || null,
      },
      include: MEMBER_INCLUDE,
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.UPDATE,
      action: 'CREATE',
      resourceType: 'PARTY_EVALUATION',
      resourceId: evaluation.id,
      newValue: { partyMemberId, reviewYear, grade },
      result: 'SUCCESS',
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Đảng viên đã có đánh giá năm này' },
        { status: 409 },
      );
    }
    console.error('[Party Evaluations POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
