/**
 * API: Chi tiết / Cập nhật / Xóa quyết định thăng cấp
 * PATCH  /api/officer-career/promotions/[id]
 * DELETE /api/officer-career/promotions/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PromotionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }
    const { user } = authResult;

    const existing = await prisma.officerPromotion.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      promotionType,
      effectiveDate,
      decisionNumber,
      decisionDate,
      previousRank,
      newRank,
      previousPosition,
      newPosition,
      reason,
      notes,
    } = body;

    const updated = await prisma.officerPromotion.update({
      where: { id: params.id },
      data: {
        promotionType:    promotionType ? (promotionType as PromotionType) : undefined,
        effectiveDate:    effectiveDate    ? new Date(effectiveDate)    : undefined,
        decisionNumber:   decisionNumber   ?? undefined,
        decisionDate:     decisionDate     ? new Date(decisionDate)     : undefined,
        previousRank:     previousRank     ?? undefined,
        newRank:          newRank          ?? undefined,
        previousPosition: previousPosition ?? undefined,
        newPosition:      newPosition      ?? undefined,
        reason:           reason           ?? undefined,
        notes:            notes            ?? undefined,
      },
      include: {
        officerCareer: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
      },
    });

    await logAudit({
      userId:       user!.id,
      functionCode: PERSONNEL.UPDATE,
      action:       'UPDATE',
      resourceType: 'OFFICER_PROMOTION',
      resourceId:   params.id,
      oldValue:     JSON.stringify(existing),
      newValue:     JSON.stringify(updated),
      result:       'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }
    const { user } = authResult;

    const existing = await prisma.officerPromotion.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.officerPromotion.delete({ where: { id: params.id } });

    await logAudit({
      userId:       user!.id,
      functionCode: PERSONNEL.DELETE,
      action:       'DELETE',
      resourceType: 'OFFICER_PROMOTION',
      resourceId:   params.id,
      oldValue:     JSON.stringify(existing),
      result:       'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
