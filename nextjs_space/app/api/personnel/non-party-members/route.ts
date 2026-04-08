/**
 * API: Non-Party Members
 * GET /api/personnel/non-party-members
 * Returns users who are NOT party members (for adding new party members)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get all existing party member user IDs
    const existingPartyMembers = await prisma.partyMember.findMany({
      where: { deletedAt: null },
      select: { userId: true },
    });
    const partyMemberUserIds = existingPartyMembers.map(pm => pm.userId);

    // Build where filter
    const where: any = {
      id: { notIn: partyMemberUserIds },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users who are NOT party members
    const nonPartyMembers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        rank: true,
        position: true,
        militaryId: true,
        unitRelation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 500,
    });

    return NextResponse.json(nonPartyMembers);
  } catch (error) {
    console.error('Non-party members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
