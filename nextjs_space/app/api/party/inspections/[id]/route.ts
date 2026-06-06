/**
 * API: Party Inspection detail (UC-71)
 * Path: /api/party/inspections/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { enforceScopeAccess } from '@/lib/rbac/scope-access';

// Inspections target either a party member or a party org. Scope by the
// member's unit when present, else by the org's unit (party org maps 1:1 to a unit).
const MEMBER_UNIT_INCLUDE = {
  partyMember: { select: { userId: true, user: { select: { unitId: true } } } },
  partyOrg: { select: { unitId: true, linkedUnitId: true } },
} as const;

function scopeContextForMember(record: any) {
  const memberUnit = record?.partyMember?.user?.unitId ?? null;
  const orgUnit = record?.partyOrg?.linkedUnitId ?? record?.partyOrg?.unitId ?? null;
  return {
    resourceUnitId: memberUnit ?? orgUnit,
    resourceOwnerId: record?.partyMember?.userId ?? null,
  };
}

const INSPECTION_TYPES = [
  'KIEM_TRA_DINH_KY',
  'KIEM_TRA_KHI_CO_DAU_HIEU',
  'GIAM_SAT_CHUYEN_DE',
  'PHUC_KET_KY_LUAT',
] as const;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_INSPECTION, PARTY.VIEW]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const inspectionRepo = (prisma as any).partyInspectionTarget;

    const item = await inspectionRepo.findUnique({
      where: { id: params.id },
      include: {
        partyMember: { include: { user: { select: { id: true, name: true, militaryId: true, rank: true, position: true, unitId: true } } } },
        partyOrg: { select: { id: true, code: true, name: true, orgLevel: true, unitId: true, linkedUnitId: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!item) return NextResponse.json({ error: 'Không tìm thấy hồ sơ kiểm tra' }, { status: 404 });

    const denied = await enforceScopeAccess(authResult.user!, authResult.authResult, scopeContextForMember(item));
    if (denied) return denied;

    return NextResponse.json(item);
  } catch (error) {
    console.error('[Party Inspections GET/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_INSPECTION, PARTY.UPDATE]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const inspectionRepo = (prisma as any).partyInspectionTarget;
    const existing = await inspectionRepo.findUnique({
      where: { id: params.id },
      include: MEMBER_UNIT_INCLUDE,
    });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy hồ sơ kiểm tra' }, { status: 404 });

    const deniedUpdate = await enforceScopeAccess(authResult.user!, authResult.authResult, scopeContextForMember(existing));
    if (deniedUpdate) return deniedUpdate;

    const body = await request.json();
    const nextInspectionType = body.inspectionType ?? existing.inspectionType;
    const nextPartyMemberId = body.partyMemberId === undefined ? existing.partyMemberId : body.partyMemberId;
    const nextPartyOrgId = body.partyOrgId === undefined ? existing.partyOrgId : body.partyOrgId;

    if (!INSPECTION_TYPES.includes(nextInspectionType)) {
      return NextResponse.json({ error: 'inspectionType không hợp lệ' }, { status: 400 });
    }
    if (!nextPartyMemberId && !nextPartyOrgId) {
      return NextResponse.json({ error: 'Phải còn ít nhất một đối tượng: partyMemberId hoặc partyOrgId' }, { status: 400 });
    }

    const updated = await inspectionRepo.update({
      where: { id: params.id },
      data: {
        partyMemberId: nextPartyMemberId || null,
        partyOrgId: nextPartyOrgId || null,
        inspectionType: nextInspectionType,
        title: body.title ?? existing.title,
        openedAt: body.openedAt ? new Date(body.openedAt) : existing.openedAt,
        closedAt: body.closedAt ? new Date(body.closedAt) : body.closedAt === null ? null : existing.closedAt,
        findings: body.findings ?? existing.findings,
        recommendation: body.recommendation ?? existing.recommendation,
        decisionRef: body.decisionRef ?? existing.decisionRef,
        attachmentUrl: body.attachmentUrl ?? existing.attachmentUrl,
      },
      include: {
        partyMember: { include: { user: { select: { id: true, name: true, militaryId: true } } } },
        partyOrg: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.MANAGE_INSPECTION,
      action: 'UPDATE',
      resourceType: 'PARTY_INSPECTION',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Party Inspections PUT/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
