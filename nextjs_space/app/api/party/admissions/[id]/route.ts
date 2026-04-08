/**
 * API: Party Admissions - Chi tiết bước kết nạp
 * Path: /api/party/admissions/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history = await prisma.partyMemberHistory.findUnique({
      where: { id: params.id },
      include: {
        partyMember: {
          include: {
            user: {
              select: { id: true, name: true, email: true, militaryId: true, rank: true, position: true, unitRelation: { select: { id: true, name: true } } },
            },
            activities: { where: { deletedAt: null }, orderBy: { activityDate: 'desc' }, take: 5 },
          },
        },
        organization: { select: { id: true, name: true, code: true, organizationType: true } },
      },
    });

    if (!history) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('[Party Admissions GET/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, PARTY.APPROVE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const body = await request.json();

    const existing = await prisma.partyMemberHistory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    const updated = await prisma.partyMemberHistory.update({
      where: { id: params.id },
      data: {
        organizationId: body.organizationId ?? existing.organizationId,
        position: body.position ?? existing.position,
        decisionNumber: body.decisionNumber ?? existing.decisionNumber,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : existing.decisionDate,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : existing.effectiveDate,
        fromOrganization: body.fromOrganization ?? existing.fromOrganization,
        toOrganization: body.toOrganization ?? existing.toOrganization,
        reason: body.reason ?? existing.reason,
        notes: body.notes ?? existing.notes,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE,
      action: 'UPDATE',
      resourceType: 'PARTY_ADMISSION',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Party Admissions PUT/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
