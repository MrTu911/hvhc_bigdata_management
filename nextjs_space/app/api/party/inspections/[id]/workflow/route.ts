import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
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

    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_INSPECTION, PARTY.UPDATE]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const inspectionRepo = (prisma as any).partyInspectionTarget;
    const existing = await inspectionRepo.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ kiểm tra' }, { status: 404 });
    }

    const current = readWorkflowStatusFromText(existing.recommendation);
    const next = ACTION_TO_STATUS[action];
    if (!canTransitionPartyWorkflow(current, next)) {
      return NextResponse.json({ error: `Không thể chuyển từ ${current} sang ${next}` }, { status: 400 });
    }

    const updated = await inspectionRepo.update({
      where: { id: params.id },
      data: {
        recommendation: writeWorkflowStatusToText(note ?? existing.recommendation, next),
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.MANAGE_INSPECTION,
      action: `WORKFLOW_${action}`,
      resourceType: 'PARTY_INSPECTION',
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
    console.error('[Party Inspections Workflow POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
