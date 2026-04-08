/**
 * API: Emulation Rewards - Khen thưởng/Kỷ luật (Thi đua)
 * Path: /api/emulation/rewards
 * RBAC: AWARDS.* function codes
 * @version 8.9
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Helper to get all descendant units
async function getUnitDescendants(unitId: string): Promise<string[]> {
  const descendants: string[] = [];
  const children = await prisma.unit.findMany({
    where: { parentId: unitId },
    select: { id: true },
  });

  for (const child of children) {
    descendants.push(child.id);
    const childDescendants = await getUnitDescendants(child.id);
    descendants.push(...childDescendants);
  }

  return descendants;
}

// GET - Danh sách khen thưởng/kỷ luật
export async function GET(request: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xem chính sách
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const recordType = searchParams.get('recordType') || ''; // REWARD or DISCIPLINE
    const level = searchParams.get('level') || '';
    const status = searchParams.get('status') || '';
    const year = searchParams.get('year') || '';
    const unitId = searchParams.get('unitId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { decisionNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { militaryId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (recordType) {
      where.recordType = recordType;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    // Filter by unit - get user's unit and descendants
    if (unitId) {
      const descendants = await getUnitDescendants(unitId);
      const unitIds = [unitId, ...descendants];
      where.user = {
        ...(where.user || {}),
        unitId: { in: unitIds },
      };
    }

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      where.decisionDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [records, total] = await Promise.all([
      prisma.policyRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              militaryId: true,
              rank: true,
              position: true,
              unitId: true,
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

    // Thống kê
    const [rewardStats, disciplineStats] = await Promise.all([
      prisma.policyRecord.count({ where: { recordType: 'REWARD', deletedAt: null } }),
      prisma.policyRecord.count({ where: { recordType: 'DISCIPLINE', deletedAt: null } }),
    ]);

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: AWARDS.VIEW,
      action: 'VIEW',
      resourceType: 'AWARD_RECORD',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        rewards: rewardStats,
        disciplines: disciplineStats,
      },
    });
  } catch (error) {
    console.error('[Policy Records GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Thêm khen thưởng/kỷ luật mới
export async function POST(request: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền tạo khen thưởng
    const authResult = await requireFunction(request, AWARDS.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      userId,
      recordType,
      level,
      title,
      reason,
      decisionNumber,
      decisionDate,
      effectiveDate,
      expiryDate,
      signerName,
      signerPosition,
      issuingUnit,
      workflowStatus,
      status,
    } = body;

    // Kiểm tra user tồn tại
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        unitRelation: {
          include: {
            commander: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    const record = await prisma.policyRecord.create({
      data: {
        userId,
        recordType: recordType || 'REWARD',
        level: level || 'UNIT',
        title,
        reason,
        decisionNumber,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        signerName,
        signerPosition,
        issuingUnit,
        workflowStatus: workflowStatus || 'PROPOSED',
        status: status || 'ACTIVE',
      },
      include: {
        user: { select: { name: true, militaryId: true, email: true } },
      },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: AWARDS.CREATE,
      action: 'CREATE',
      resourceType: 'AWARD_RECORD',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[Policy Records POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
