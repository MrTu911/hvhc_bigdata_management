/**
 * API: Party Activities - Sinh hoạt Đảng
 * Path: /api/party/activities
 * Uses PartyActivity (MEETING, STUDY, CRITICISM, VOLUNTEER, OTHER)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activityType = searchParams.get('activityType') || '';
    const partyMemberId = searchParams.get('partyMemberId') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      activityType: activityType
        ? activityType
        : { not: 'EVALUATION' }, // Exclude evaluations from activities list
      deletedAt: null,
    };

    if (partyMemberId) where.partyMemberId = partyMemberId;
    if (fromDate) where.activityDate = { ...(where.activityDate || {}), gte: new Date(fromDate) };
    if (toDate) where.activityDate = { ...(where.activityDate || {}), lte: new Date(toDate) };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.partyActivity.findMany({
        where,
        include: {
          partyMember: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  militaryId: true,
                  rank: true,
                  unitRelation: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { activityDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partyActivity.count({ where }),
    ]);

    // Thống kê theo loại hoạt động
    const typeStats = await prisma.partyActivity.groupBy({
      by: ['activityType'],
      where: { deletedAt: null, activityType: { not: 'EVALUATION' } },
      _count: { id: true },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW',
      resourceType: 'PARTY_ACTIVITY',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      activities,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        total,
        byType: typeStats.reduce((acc, s) => {
          acc[s.activityType] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('[Party Activities GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.MANAGE_MEETING);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const body = await request.json();

    const { partyMemberId, activityType, activityDate, description, location, result, attachmentUrl } = body;

    if (!partyMemberId || !activityType || !activityDate || !description) {
      return NextResponse.json({ error: 'partyMemberId, activityType, activityDate, description là bắt buộc' }, { status: 400 });
    }

    if (activityType === 'EVALUATION') {
      return NextResponse.json({ error: 'Dùng endpoint /api/party/evaluations để ghi đánh giá phân loại' }, { status: 400 });
    }

    const member = await prisma.partyMember.findUnique({ where: { id: partyMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const activity = await prisma.partyActivity.create({
      data: {
        partyMemberId,
        activityType,
        activityDate: new Date(activityDate),
        description,
        location: location || null,
        result: result || null,
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        partyMember: { include: { user: { select: { name: true, militaryId: true } } } },
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.MANAGE_MEETING,
      action: 'CREATE',
      resourceType: 'PARTY_ACTIVITY',
      resourceId: activity.id,
      newValue: { partyMemberId, activityType, activityDate },
      result: 'SUCCESS',
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('[Party Activities POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
