import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    const institutions = await prisma.trainingInstitution.findMany({
      where: {
        isActive: true,
        ...(country ? { country } : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, shortName: true, country: true, type: true },
    });

    return NextResponse.json({ success: true, data: institutions });
  } catch (error) {
    console.error('Error fetching training institutions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
