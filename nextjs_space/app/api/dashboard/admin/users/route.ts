/**
 * API: Dashboard Admin - Danh sách người dùng
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // RBAC Check: VIEW_USERS
  const authResult = await requireFunction(request, SYSTEM.VIEW_USERS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    // Get recent users from database (last 20)
    const users = await prisma.user.findMany({
      take: 20,
      orderBy: { 
        lastLoginAt: 'desc' 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      }
    }).then(users => users.map(user => ({
      ...user,
      lastLogin: user.lastLoginAt?.toISOString() || new Date().toISOString()
    })));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
