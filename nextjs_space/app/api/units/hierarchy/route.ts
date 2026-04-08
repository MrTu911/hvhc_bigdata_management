import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/units/hierarchy - Lấy cây tổ chức đơn vị
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all units with relations
    const units = await prisma.unit.findMany({
      where: { active: true },
      include: {
        commander: {
          select: {
            id: true,
            name: true,
            rank: true,
            email: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    // Build hierarchy tree
    const buildTree = (parentId: string | null = null): any[] => {
      return units
        .filter((unit) => unit.parentId === parentId)
        .map((unit) => ({
          id: unit.id,
          name: unit.name,
          code: unit.code,
          type: unit.type,
          level: unit.level,
          commander: unit.commander,
          userCount: unit._count.users,
          childCount: unit._count.children,
          children: buildTree(unit.id),
        }));
    };

    const tree = buildTree();

    return NextResponse.json({
      success: true,
      data: {
        tree,
        total: units.length,
      },
    });
  } catch (error) {
    console.error('Get units hierarchy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
