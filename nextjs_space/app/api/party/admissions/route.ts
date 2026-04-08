/**
 * API: Party Admissions - Quy trình kết nạp Đảng
 * Path: /api/party/admissions
 * RBAC: PARTY.* function codes
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { writeWorkflowStatusToText } from '@/lib/services/party/party-workflow.service';
import {
  assertPartyLifecycleTransition,
  createLifecycleTransitionTrail,
} from '@/lib/services/party/party-lifecycle.service';

// GET - Danh sách hồ sơ kết nạp
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const historyType = searchParams.get('historyType') || 'ADMITTED';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      historyType,
    };

    const [records, total] = await Promise.all([
      prisma.partyMemberHistory.findMany({
        where,
        include: {
          partyMember: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  militaryId: true,
                  rank: true,
                  position: true,
                  unitId: true,
                  unitRelation: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
          organization: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partyMemberHistory.count({ where }),
    ]);

    // Filter by search on member name
    const filtered = search
      ? records.filter(r =>
          r.partyMember.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.partyMember.user.militaryId?.toLowerCase().includes(search.toLowerCase())
        )
      : records;

    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW',
      resourceType: 'PARTY_ADMISSION',
      result: 'SUCCESS',
      metadata: { page, limit, historyType },
    });

    return NextResponse.json({
      admissions: filtered,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Party Admissions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Ghi nhận bước kết nạp mới
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.APPROVE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const body = await request.json();

    const {
      partyMemberId,
      organizationId,
      historyType,
      position,
      decisionNumber,
      decisionDate,
      effectiveDate,
      fromOrganization,
      toOrganization,
      reason,
      notes,
    } = body;

    if (!partyMemberId || !historyType) {
      return NextResponse.json({ error: 'partyMemberId và historyType là bắt buộc' }, { status: 400 });
    }

    const member = await prisma.partyMember.findUnique({ where: { id: partyMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const isOfficialConfirmed = historyType === 'OFFICIAL_CONFIRMED';
    if (isOfficialConfirmed) {
      assertPartyLifecycleTransition(member.status, 'CHINH_THUC');
    }

    const history = await prisma.$transaction(async (tx) => {
      const created = await tx.partyMemberHistory.create({
        data: {
          partyMemberId,
          organizationId: organizationId || null,
          historyType,
          position: position || null,
          decisionNumber: decisionNumber || null,
          decisionDate: decisionDate ? new Date(decisionDate) : null,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          fromOrganization: fromOrganization || null,
          toOrganization: toOrganization || null,
          reason: reason || null,
          notes: writeWorkflowStatusToText(notes || null, 'SUBMITTED'),
        },
        include: {
          partyMember: { include: { user: { select: { name: true, militaryId: true } } } },
        },
      });

      if (isOfficialConfirmed) {
        await tx.partyMember.update({
          where: { id: partyMemberId },
          data: {
            status: 'CHINH_THUC',
            officialDate: effectiveDate ? new Date(effectiveDate) : new Date(),
            statusChangeDate: new Date(),
            statusChangeReason: reason || null,
          },
        });

        await createLifecycleTransitionTrail(tx, {
          partyMemberId,
          fromStatus: member.status,
          toStatus: 'CHINH_THUC',
          actorId: user.id,
          reason: reason || null,
          officialDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        });
      }

      return created;
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE,
      action: 'WORKFLOW_SUBMIT',
      resourceType: 'PARTY_ADMISSION',
      resourceId: history.id,
      newValue: { partyMemberId, historyType, decisionNumber, workflowStatus: 'SUBMITTED' },
      result: 'SUCCESS',
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('[Party Admissions POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
