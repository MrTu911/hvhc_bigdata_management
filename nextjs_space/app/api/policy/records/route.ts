/**
 * API: Policy Records
 * GET /api/policy/records - Lấy danh sách hồ sơ chế độ chính sách
 * 
 * RBAC: Function-based với Scope filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { POLICY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Helper: Lấy danh sách đơn vị con (recursive)
async function getSubordinateUnitIds(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];
  const children = await prisma.unit.findMany({
    where: { parentId: unitId },
    select: { id: true },
  });
  for (const child of children) {
    const childUnits = await getSubordinateUnitIds(child.id);
    result.push(...childUnits);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    // RBAC Check với Scope: VIEW_POLICY
    const { user, scopedOptions, response } = await requireScopedFunction(request, POLICY.VIEW);
    if (!user) {
      return response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const recordType = searchParams.get('recordType');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const unitId = searchParams.get('unitId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
    };

    // Scope-based filtering
    const scope = scopedOptions?.scope || 'SELF';
    
    if (scope === 'ACADEMY') {
      // Full access - có thể filter theo unitId nếu cần
      if (unitId && unitId !== 'ALL') {
        const subordinateUnitIds = await getSubordinateUnitIds(unitId);
        where.user = { unitId: { in: subordinateUnitIds } };
      }
    } else if (scope === 'DEPARTMENT' || scope === 'UNIT') {
      // Giới hạn theo đơn vị user và đơn vị con
      if (user.unitId) {
        const subordinateUnitIds = await getSubordinateUnitIds(user.unitId);
        where.user = { unitId: { in: subordinateUnitIds } };
      } else {
        where.userId = user.id; // Fallback to self
      }
    } else {
      // SELF scope - chỉ bản ghi của chính mình
      where.userId = user.id;
    }

    // Record type filter
    if (recordType) {
      where.recordType = recordType;
    }

    // Status filter (maps to workflowStatus)
    if (status) {
      where.workflowStatus = status;
    }

    // UserId filter (chỉ khi scope cho phép)
    if (userId && scope === 'ACADEMY') {
      where.userId = userId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { decisionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.policyRecord.findMany({
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
              unitRelation: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policyRecord.count({ where }),
    ]);

    // Thống kê theo loại (trong scope)
    const stats = await prisma.policyRecord.groupBy({
      by: ['recordType'],
      where: { ...where, deletedAt: null },
      _count: { id: true },
    });

    // Log audit
    await logAudit({
      userId: user.id,
      functionCode: POLICY.VIEW,
      action: 'VIEW',
      resourceType: 'POLICY_RECORD',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.map(s => ({
        type: s.recordType,
        count: s._count.id,
      })),
      scope, // Return scope for UI awareness
    });
  } catch (error) {
    console.error('Policy records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: CREATE_POLICY
    const { user, response } = await requireScopedFunction(request, POLICY.CREATE);
    if (!user) {
      return response!;
    }

    const body = await request.json();
    const { userId, recordType, level, title, reason, ...rest } = body;

    if (!userId || !recordType || !level || !title || !reason) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const record = await prisma.policyRecord.create({
      data: {
        userId,
        recordType,
        level,
        title,
        reason,
        ...rest,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await logAudit({
      userId: user.id,
      functionCode: POLICY.CREATE,
      action: 'CREATE',
      resourceType: 'POLICY_RECORD',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create policy record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
