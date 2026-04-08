import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response;

    const ranks = await prisma.militaryRank.findMany({
      where: { isActive: true },
      orderBy: { orderNo: 'asc' },
      select: { id: true, name: true, shortCode: true, category: true, orderNo: true },
    });

    return NextResponse.json({ success: true, data: ranks });
  } catch (error) {
    console.error('Error fetching military ranks:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
