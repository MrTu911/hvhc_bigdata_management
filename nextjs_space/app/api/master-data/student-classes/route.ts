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
    const cohortId = searchParams.get('cohortId');

    const where: any = { isActive: true };
    if (cohortId) {
      where.cohortId = cohortId;
    }

    const classes = await prisma.studentClass.findMany({
      where,
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        cohortId: true,
        majorId: true,
        cohort: {
          select: { code: true, name: true },
        },
        major: {
          select: { code: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
