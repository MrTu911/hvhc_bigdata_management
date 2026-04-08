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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // Get current user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { personnelProfile: true }
    });
    
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const oldPersonnelId = targetUser.personnelId;
    const oldPersonnelName = targetUser.personnelProfile?.fullName;

    // Update user to remove personnel link
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { personnelId: null }
    });

    // Log audit
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.LINK_PERSONNEL,
      action: 'UNLINK_PERSONNEL',
      resourceType: 'USER',
      resourceId: userId,
      oldValue: { personnelId: oldPersonnelId, personnelName: oldPersonnelName },
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error unlinking personnel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
