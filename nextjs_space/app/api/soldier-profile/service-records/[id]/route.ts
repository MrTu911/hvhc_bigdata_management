/**
 * API: SoldierServiceRecord - single item
 * GET    /api/soldier-profile/service-records/[id]
 * PATCH  /api/soldier-profile/service-records/[id]
 * DELETE /api/soldier-profile/service-records/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const record = await prisma.soldierServiceRecord.findUnique({ where: { id: params.id } });
    if (!record) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.soldierServiceRecord.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const body = await request.json();
    const { eventType, eventDate, decisionNumber, previousRank, newRank, previousUnit, newUnit, description, notes } = body;

    const updated = await prisma.soldierServiceRecord.update({
      where: { id: params.id },
      data: {
        ...(eventType !== undefined      && { eventType }),
        ...(eventDate !== undefined      && { eventDate: new Date(eventDate) }),
        ...(decisionNumber !== undefined && { decisionNumber }),
        ...(previousRank !== undefined   && { previousRank }),
        ...(newRank !== undefined        && { newRank }),
        ...(previousUnit !== undefined   && { previousUnit }),
        ...(newUnit !== undefined        && { newUnit }),
        ...(description !== undefined    && { description }),
        ...(notes !== undefined          && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.soldierServiceRecord.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    await prisma.soldierServiceRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Đã xóa bản ghi' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
