import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import {
  canTransitionPartyWorkflow,
  readWorkflowStatusFromText,
  writeWorkflowStatusToText,
  type PartyWorkflowStatus,
} from '@/lib/services/party/party-workflow.service';

const ACTION_TO_STATUS: Record<string, PartyWorkflowStatus> = {
  SUBMIT: 'SUBMITTED',
  REVIEW: 'UNDER_REVIEW',
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  CANCEL: 'CANCELLED',
  RESET: 'DRAFT',
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').toUpperCase();
    const note = body?.note ? String(body.note) : null;

    if (!ACTION_TO_STATUS[action]) {
      return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
    }

    const requiredFn = action === 'SUBMIT' ? PARTY.APPROVE_ADMISSION : PARTY.APPROVE;
    const authResult = await requireAnyFunction(request, [requiredFn, PARTY.APPROVE_ADMISSION, PARTY.APPROVE]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const existing = await prisma.partyMemberHistory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ kết nạp' }, { status: 404 });
    }

    const current = readWorkflowStatusFromText(existing.notes);
    const next = ACTION_TO_STATUS[action];

    if (!canTransitionPartyWorkflow(current, next)) {
      return NextResponse.json({ error: `Không thể chuyển từ ${current} sang ${next}` }, { status: 400 });
    }

    const updated = await prisma.partyMemberHistory.update({
      where: { id: params.id },
      data: {
        notes: writeWorkflowStatusToText(note ?? existing.notes, next),
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE_ADMISSION,
      action: `WORKFLOW_${action}`,
      resourceType: 'PARTY_ADMISSION',
      resourceId: params.id,
      oldValue: { workflowStatus: current },
      newValue: { workflowStatus: next },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: `Chuyển trạng thái thành công: ${current} -> ${next}`,
      data: updated,
    });
  } catch (error) {
    console.error('[Party Admissions Workflow POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
