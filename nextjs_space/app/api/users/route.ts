/**
 * API: Users Management
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET all users with pagination and filters
 * RBAC: SYSTEM.VIEW_USERS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_USERS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          militaryId: true,
          rank: true,
          department: true,
          unit: true,
          avatar: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.VIEW_USERS,
      action: 'VIEW',
      resourceType: 'USER_LIST',
      result: 'SUCCESS',
      metadata: { count: users.length, page, limit }
    });

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
