import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // PROVINCE, DISTRICT, WARD
    const parentId = searchParams.get('parentId');

    const where: any = { isActive: true };
    if (level) {
      where.level = level;
    }
    if (parentId) {
      where.parentId = parentId;
    }

    const units = await prisma.administrativeUnit.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        fullName: true,
        level: true,
        parentId: true,
      },
    });

    return NextResponse.json({ success: true, data: units });
  } catch (error) {
    console.error('Error fetching administrative units:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
