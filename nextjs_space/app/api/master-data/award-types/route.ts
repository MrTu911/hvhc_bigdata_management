import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response;

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    const types = await prisma.awardTypeCatalog.findMany({
      where: {
        isActive: true,
        ...(level ? { level } : {}),
      },
      orderBy: { orderNo: 'asc' },
      select: { id: true, name: true, level: true },
    });

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching award types:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
