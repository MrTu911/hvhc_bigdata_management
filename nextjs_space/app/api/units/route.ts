/**
 * API: Lấy danh sách đơn vị
 * GET /api/units - Danh sách đơn vị cho dropdown/select
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const units = await prisma.unit.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        level: true,
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      units,
      total: units.length,
    });
  } catch (error: any) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách đơn vị' },
      { status: 500 }
    );
  }
}
