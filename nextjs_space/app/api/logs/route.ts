import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

/**
 * GET system logs
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (level) where.level = level;
    if (category) where.category = category;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.name,
        userEmail: log.user?.email,
        userRole: log.user?.role,
        level: log.level,
        category: log.category,
        action: log.action,
        description: log.description,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
