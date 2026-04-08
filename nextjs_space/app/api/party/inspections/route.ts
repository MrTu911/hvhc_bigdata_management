/**
 * API: Party Inspections (UC-71)
 * Path: /api/party/inspections
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { writeWorkflowStatusToText } from '@/lib/services/party/party-workflow.service';

const INSPECTION_TYPES = [
  'KIEM_TRA_DINH_KY',
  'KIEM_TRA_KHI_CO_DAU_HIEU',
  'GIAM_SAT_CHUYEN_DE',
  'PHUC_KET_KY_LUAT',
] as const;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_INSPECTION, PARTY.VIEW]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const inspectionType = searchParams.get('inspectionType') || '';
    const partyMemberId = searchParams.get('partyMemberId') || '';
    const partyOrgId = searchParams.get('partyOrgId') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (inspectionType) where.inspectionType = inspectionType;
    if (partyMemberId) where.partyMemberId = partyMemberId;
    if (partyOrgId) where.partyOrgId = partyOrgId;
    if (fromDate) where.openedAt = { ...(where.openedAt || {}), gte: new Date(fromDate) };
    if (toDate) where.openedAt = { ...(where.openedAt || {}), lte: new Date(toDate) };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { findings: { contains: search, mode: 'insensitive' } },
        { recommendation: { contains: search, mode: 'insensitive' } },
        { decisionRef: { contains: search, mode: 'insensitive' } },
        { partyMember: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { partyOrg: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const inspectionRepo = (prisma as any).partyInspectionTarget;

    const [data, total] = await Promise.all([
      inspectionRepo.findMany({
        where,
        include: {
          partyMember: { include: { user: { select: { id: true, name: true, militaryId: true, rank: true } } } },
          partyOrg: { select: { id: true, name: true, code: true, unitId: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      inspectionRepo.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Party Inspections GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_INSPECTION, PARTY.UPDATE]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const body = await request.json();
    const {
      partyMemberId,
      partyOrgId,
      inspectionType,
      title,
      openedAt,
      closedAt,
      findings,
      recommendation,
      decisionRef,
      attachmentUrl,
    } = body;

    if (!title || !openedAt || !inspectionType) {
      return NextResponse.json({ error: 'title, openedAt, inspectionType là bắt buộc' }, { status: 400 });
    }
    if (!partyMemberId && !partyOrgId) {
      return NextResponse.json({ error: 'Phải chọn ít nhất một đối tượng: partyMemberId hoặc partyOrgId' }, { status: 400 });
    }
    if (!INSPECTION_TYPES.includes(inspectionType)) {
      return NextResponse.json({ error: 'inspectionType không hợp lệ' }, { status: 400 });
    }

    const inspectionRepo = (prisma as any).partyInspectionTarget;

    const created = await inspectionRepo.create({
      data: {
        partyMemberId: partyMemberId || null,
        partyOrgId: partyOrgId || null,
        inspectionType,
        title,
        openedAt: new Date(openedAt),
        closedAt: closedAt ? new Date(closedAt) : null,
        findings: findings || null,
        recommendation: writeWorkflowStatusToText(recommendation || null, 'SUBMITTED'),
        decisionRef: decisionRef || null,
        attachmentUrl: attachmentUrl || null,
        createdBy: user.id,
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
      action: 'WORKFLOW_SUBMIT',
      resourceType: 'PARTY_INSPECTION',
      resourceId: created.id,
      newValue: { inspectionType, title, partyMemberId, partyOrgId, workflowStatus: 'SUBMITTED' },
      result: 'SUCCESS',
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[Party Inspections POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
