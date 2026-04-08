import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require LINK_PERSONNEL permission to view linkable personnel
    const authResult = await requireFunction(request, SYSTEM.LINK_PERSONNEL);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const availableOnly = searchParams.get('available') === 'true';

    // Get personnel IDs that are already linked to users
    const linkedPersonnelIds = await prisma.user.findMany({
      where: { personnelId: { not: null } },
      select: { personnelId: true }
    }).then(users => users.map(u => u.personnelId).filter(Boolean) as string[]);

    const personnel = await prisma.personnel.findMany({
      where: {
        ...(availableOnly ? { id: { notIn: linkedPersonnelIds } } : {}),
        ...(search ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { militaryIdNumber: { contains: search, mode: 'insensitive' as const } },
            { militaryRank: { contains: search, mode: 'insensitive' as const } },
            { position: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {})
      },
      select: {
        id: true,
        fullName: true,
        militaryIdNumber: true,
        militaryRank: true,
        position: true,
        category: true,
        unit: {
          select: { name: true }
        }
      },
      orderBy: { fullName: 'asc' },
      take: 100
    });

    // Map to expected format
    const mappedPersonnel = personnel.map(p => ({
      id: p.id,
      fullName: p.fullName,
      militaryId: p.militaryIdNumber,
      rank: p.militaryRank,
      position: p.position,
      category: p.category,
      unit: p.unit
    }));

    return NextResponse.json({ success: true, data: mappedPersonnel });
  } catch (error) {
    console.error('Error fetching personnel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
