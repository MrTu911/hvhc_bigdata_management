export const dynamic = 'force-dynamic';

/**
 * API: RBAC User-Position Assignment
 * GET /api/admin/rbac/user-positions - Lấy danh sách gán chức danh cho người dùng
 * POST /api/admin/rbac/user-positions - Gán chức danh cho người dùng
 * DELETE /api/admin/rbac/user-positions - Gỡ chức danh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unitId = searchParams.get('unitId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (userId) where.userId = userId;
    if (unitId) where.unitId = unitId;

    const [userPositions, total] = await Promise.all([
      prisma.userPosition.findMany({
        where,
        include: {
          position: true,
          unit: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { startDate: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.userPosition.count({ where })
    ]);

    // Fetch user details separately
    const userIds = [...new Set(userPositions.map(up => up.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        rank: true
      }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine data
    const result = userPositions.map(up => ({
      ...up,
      user: userMap.get(up.userId) || null
    }));

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user-positions:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách gán chức danh' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, positionId, unitId, startDate, endDate, isPrimary } = body;

    if (!userId || !positionId) {
      return NextResponse.json(
        { success: false, error: 'userId và positionId là bắt buộc' },
        { status: 400 }
      );
    }

    // If this is primary, unset other primary positions for this user
    if (isPrimary) {
      await prisma.userPosition.updateMany({
        where: {
          userId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // Check if exists (same user, position, unit)
    const existing = await prisma.userPosition.findFirst({
      where: {
        userId,
        positionId,
        unitId: unitId || null,
        endDate: null // Chỉ check những vị trí chưa kết thúc
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Người dùng đã được gán chức danh này' },
        { status: 400 }
      );
    }

    const userPosition = await prisma.userPosition.create({
      data: {
        userId,
        positionId,
        unitId: unitId || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isPrimary: isPrimary || false
      },
      include: {
        position: true,
        unit: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    await logAudit({
      userId: session.user.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'CREATE',
      resourceType: 'USER_POSITION',
      resourceId: userPosition.id,
      newValue: userPosition,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      data: { ...userPosition, user }
    });
  } catch (error: any) {
    console.error('Error assigning position:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi gán chức danh' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.userPosition.findUnique({
      where: { id },
      include: {
        position: { select: { name: true } }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bản ghi' },
        { status: 404 }
      );
    }

    // Fetch user for logging
    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { name: true, email: true }
    });

    await prisma.userPosition.delete({
      where: { id }
    });

    await logAudit({
      userId: session.user.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'DELETE',
      resourceType: 'USER_POSITION',
      resourceId: id,
      oldValue: { ...existing, user },
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      message: 'Gỡ chức danh thành công'
    });
  } catch (error: any) {
    console.error('Error removing position:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi gỡ chức danh' },
      { status: 500 }
    );
  }
}
