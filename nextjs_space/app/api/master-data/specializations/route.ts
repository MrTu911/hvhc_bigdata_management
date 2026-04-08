import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const specializations = await prisma.specializationCatalog.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        parentId: true,
      },
    });

    return NextResponse.json({ success: true, data: specializations });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
