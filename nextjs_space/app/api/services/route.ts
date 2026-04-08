import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all BigData services
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (status) where.status = status;

    const services = await prisma.bigDataService.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        host: true,
        port: true,
        url: true,
        version: true,
        description: true,
        uptime: true,
        lastChecked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
