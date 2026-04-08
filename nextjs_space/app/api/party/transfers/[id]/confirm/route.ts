import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { writeWorkflowStatusToText } from '@/lib/services/party/party-workflow.service';
import {
  assertPartyLifecycleTransition,
  createLifecycleTransitionTrail,
} from '@/lib/services/party/party-lifecycle.service';

const ALLOWED_CONFIRM_STATUS = ['PENDING', 'CONFIRMED', 'REJECTED'] as const;
type ConfirmStatus = (typeof ALLOWED_CONFIRM_STATUS)[number];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.APPROVE_TRANSFER, PARTY.APPROVE]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const body = await request.json().catch(() => ({}));
    const nextStatus: ConfirmStatus = body?.confirmStatus ?? 'CONFIRMED';
    const note: string | null = body?.note ?? null;

    if (!ALLOWED_CONFIRM_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: 'confirmStatus không hợp lệ' }, { status: 400 });
    }

    const transfer = await prisma.partyTransfer.findUnique({
      where: { id: params.id },
      include: { partyMember: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ chuyển sinh hoạt' }, { status: 404 });
    }

    const confirmedAt = nextStatus === 'PENDING' ? null : new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const transferUpdated = await tx.partyTransfer.update({
        where: { id: params.id },
        data: {
          confirmStatus: nextStatus,
          confirmDate: confirmedAt,
          note: writeWorkflowStatusToText(note ?? transfer.note, nextStatus === 'CONFIRMED' ? 'APPROVED' : nextStatus === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW'),
        },
      });

      if (nextStatus === 'CONFIRMED') {
        const fromStatus = transfer.partyMember.status;
        assertPartyLifecycleTransition(fromStatus, 'CHINH_THUC');
        await tx.partyMember.update({
          where: { id: transfer.partyMemberId },
          data: {
            organizationId: transfer.toPartyOrgId,
            status: 'CHINH_THUC',
            statusChangeDate: confirmedAt,
            statusChangeReason: 'Xác nhận chuyển sinh hoạt Đảng',
          },
        });
        await createLifecycleTransitionTrail(tx, {
          partyMemberId: transfer.partyMemberId,
          fromStatus,
          toStatus: 'CHINH_THUC',
          actorId: user.id,
          reason: 'Xác nhận chuyển sinh hoạt Đảng',
        });
      }

      return transferUpdated;
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE_TRANSFER,
      action: nextStatus === 'CONFIRMED' ? 'WORKFLOW_APPROVE' : nextStatus === 'REJECTED' ? 'WORKFLOW_REJECT' : 'WORKFLOW_REVIEW',
      resourceType: 'PARTY_TRANSFER',
      resourceId: params.id,
      newValue: { confirmStatus: nextStatus, workflowStatus: nextStatus === 'CONFIRMED' ? 'APPROVED' : nextStatus === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW' },
      result: 'SUCCESS',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Party Transfers Confirm POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
