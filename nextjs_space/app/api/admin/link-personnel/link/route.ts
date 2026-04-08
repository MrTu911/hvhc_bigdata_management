import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require LINK_PERSONNEL permission
    const authResult = await requireFunction(request, SYSTEM.LINK_PERSONNEL);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { userId, personnelId } = await request.json();

    if (!userId || !personnelId) {
      return NextResponse.json({ success: false, error: 'Missing userId or personnelId' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if personnel exists
    const personnel = await prisma.personnel.findUnique({ where: { id: personnelId } });
    if (!personnel) {
      return NextResponse.json({ success: false, error: 'Personnel not found' }, { status: 404 });
    }

    // Check if personnel is already linked to another user
    const existingLink = await prisma.user.findFirst({
      where: { personnelId, id: { not: userId } }
    });
    if (existingLink) {
      return NextResponse.json({ 
        success: false, 
        error: 'Personnel này đã được liên kết với User khác' 
      }, { status: 400 });
    }

    // Update user with personnel link
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { personnelId }
    });

    // Log audit
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.LINK_PERSONNEL,
      action: 'LINK_PERSONNEL',
      resourceType: 'USER',
      resourceId: userId,
      newValue: { personnelId, personnelName: personnel.fullName },
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error linking personnel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
