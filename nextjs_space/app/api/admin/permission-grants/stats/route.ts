/**
 * Permission Grants Stats API
 * Thống kê về permission grants
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_RBAC permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const now = new Date();

    // Count by status
    const [totalActive, totalExpired, totalRevoked, totalAll] = await Promise.all([
      prisma.userPermissionGrant.count({
        where: {
          isRevoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      }),
      prisma.userPermissionGrant.count({
        where: {
          isRevoked: false,
          expiresAt: { lte: now },
        },
      }),
      prisma.userPermissionGrant.count({
        where: { isRevoked: true },
      }),
      prisma.userPermissionGrant.count(),
    ]);

    // Count by permission type
    const byPermission = await prisma.userPermissionGrant.groupBy({
      by: ['permission'],
      where: {
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      _count: true,
    });

    // Count by scope type
    const byScope = await prisma.userPermissionGrant.groupBy({
      by: ['scopeType'],
      where: {
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      _count: true,
    });

    // Users with grants
    const usersWithGrants = await prisma.userPermissionGrant.findMany({
      where: {
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSoon = await prisma.userPermissionGrant.count({
      where: {
        isRevoked: false,
        expiresAt: {
          gt: now,
          lte: sevenDaysFromNow,
        },
      },
    });

    return NextResponse.json({
      totals: {
        active: totalActive,
        expired: totalExpired,
        revoked: totalRevoked,
        all: totalAll,
      },
      usersWithGrants: usersWithGrants.length,
      expiringSoon,
      byPermission: byPermission.reduce((acc, item) => {
        acc[item.permission] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byScope: byScope.reduce((acc, item) => {
        acc[item.scopeType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error('[Permission Grants Stats]', error);
    return NextResponse.json({ error: 'Lỗi khi lấy thống kê' }, { status: 500 });
  }
}
