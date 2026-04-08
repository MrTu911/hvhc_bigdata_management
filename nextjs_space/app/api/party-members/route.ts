/**
 * @deprecated Route này đã được thay thế bởi /api/party/members/
 * Vẫn hoạt động để không phá client cũ nhưng sẽ bị xoá sau khi migrate xong.
 * Xem: app/api/party/members/route.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

function addDeprecationHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Deprecated', 'true');
  res.headers.set('X-Deprecated-Use', '/api/party/members/');
  return res;
}

// Helper to get all descendant unit IDs
async function getUnitDescendants(unitId: string): Promise<string[]> {
  const allUnits = await prisma.unit.findMany({ select: { id: true, parentId: true } });
  const result: string[] = [unitId];
  const queue = [unitId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = allUnits.filter(u => u.parentId === currentId);
    children.forEach(c => {
      result.push(c.id);
      queue.push(c.id);
    });
  }
  return result;
}

// GET - Danh sách đảng viên
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const user = authResult.user!;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const partyCell = searchParams.get('partyCell') || '';
    const unitId = searchParams.get('unitId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
    };

    // Build user filter
    const userFilter: any = {};

    if (search) {
      userFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by unit (including all child units)
    if (unitId) {
      const unitIds = await getUnitDescendants(unitId);
      userFilter.unitId = { in: unitIds };
    }

    if (Object.keys(userFilter).length > 0) {
      where.user = userFilter;
    }

    if (status) {
      where.status = status;
    }

    if (partyCell) {
      where.partyCell = { contains: partyCell, mode: 'insensitive' };
    }

    const [members, total] = await Promise.all([
      prisma.partyMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              militaryId: true,
              rank: true,
              position: true,
              unitId: true,
              unitRelation: { select: { id: true, name: true, code: true } },
            },
          },
          activities: {
            where: { deletedAt: null },
            orderBy: { activityDate: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partyMember.count({ where }),
    ]);

    // Thống kê
    const stats = await prisma.partyMember.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW',
      resourceType: 'PARTY_MEMBER',
      result: 'SUCCESS',
      metadata: { page, limit, filters: { search, status, partyCell, unitId } },
    });

    return addDeprecationHeaders(NextResponse.json({
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        byStatus: stats.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    }));
  } catch (error) {
    console.error('[Party Members GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Thêm đảng viên mới
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.CREATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const user = authResult.user!;
    const body = await request.json();
    const { userId, partyCardNumber, joinDate, officialDate, partyCell, partyCommittee, recommender1, recommender2 } = body;

    // Kiểm tra user tồn tại
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Kiểm tra đã là đảng viên chưa
    const existing = await prisma.partyMember.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'Người dùng đã là đảng viên' }, { status: 409 });
    }

    const member = await prisma.partyMember.create({
      data: {
        userId,
        partyCardNumber,
        joinDate: joinDate ? new Date(joinDate) : null,
        officialDate: officialDate ? new Date(officialDate) : null,
        partyCell,
        partyCommittee,
        recommender1,
        recommender2,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.CREATE,
      action: 'CREATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: member.id,
      newValue: { userId, partyCardNumber, partyCell },
      result: 'SUCCESS',
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('[Party Members POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
