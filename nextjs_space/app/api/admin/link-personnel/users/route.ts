import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require LINK_PERSONNEL permission to view users for linking
    const authResult = await requireFunction(request, SYSTEM.LINK_PERSONNEL);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        personnelId: true,
        unitId: true,
        personnelProfile: {
          select: {
            id: true,
            fullName: true,
            militaryIdNumber: true,
            militaryRank: true,
            position: true
          }
        }
      },
      orderBy: [
        { personnelId: 'asc' }, // Null first (unlinked)
        { name: 'asc' }
      ],
      take: 500
    });

    // Get unit names separately
    const unitIds = users.map(u => u.unitId).filter(Boolean) as string[];
    const units = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true, name: true }
    });
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    // Map to expected format
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      personnelId: u.personnelId,
      unit: u.unitId ? { name: unitMap.get(u.unitId) } : null,
      personnelProfile: u.personnelProfile ? {
        id: u.personnelProfile.id,
        fullName: u.personnelProfile.fullName,
        militaryId: u.personnelProfile.militaryIdNumber,
        rank: u.personnelProfile.militaryRank,
        position: u.personnelProfile.position
      } : null
    }));

    return NextResponse.json({ success: true, data: mappedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
