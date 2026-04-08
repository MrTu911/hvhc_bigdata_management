import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const cohorts = await prisma.cohort.findMany({
      where: { isActive: true },
      orderBy: { startYear: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        startYear: true,
        endYear: true,
      },
    });

    return NextResponse.json({ success: true, data: cohorts });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
