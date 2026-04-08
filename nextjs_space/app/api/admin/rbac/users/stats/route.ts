/**
 * User Stats API
 * Returns aggregate statistics for all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Get aggregate stats from database
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      usersWithUnit,
      roleDistribution
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: { not: 'ACTIVE' } } }),
      prisma.user.count({ where: { unitId: { not: null } } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        orderBy: { _count: { role: 'desc' } }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      lockedUsers,
      usersWithUnit,
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: r._count.role
      }))
    });
  } catch (error: any) {
    console.error('GET /api/admin/rbac/users/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
