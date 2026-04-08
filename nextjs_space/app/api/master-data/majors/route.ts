import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response;

    const majors = await prisma.majorCatalog.findMany({
      where: { isActive: true },
      orderBy: { orderNo: 'asc' },
      select: { id: true, name: true, shortName: true, fieldGroup: true },
    });

    return NextResponse.json({ success: true, data: majors });
  } catch (error) {
    console.error('Error fetching majors:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
