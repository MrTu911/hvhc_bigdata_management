/**
 * API: Award Proposals Approve - Phê duyệt đề xuất khen thưởng
 * Path: /api/awards/proposals/[id]/approve
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.APPROVE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();
    const { action, note } = body; // action: REVIEW | APPROVE | REJECT | CANCEL

    const proposal = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
    });
    if (!proposal) return NextResponse.json({ error: 'Không tìm thấy đề xuất' }, { status: 404 });

    // Kiểm tra SoD: người đề xuất không được tự phê duyệt
    if (action === 'APPROVE' && proposal.proposedBy === user.id) {
      return NextResponse.json({ error: 'Người đề xuất không được tự phê duyệt (Separation of Duties)' }, { status: 403 });
    }

    const transitions: Record<string, { from: string[]; to: string; field: Record<string, any> }> = {
      REVIEW:  { from: ['PROPOSED'],      to: 'UNDER_REVIEW', field: { reviewedBy: user.id, reviewedAt: new Date(), reviewerNote: note || null } },
      APPROVE: { from: ['UNDER_REVIEW'],  to: 'APPROVED',     field: { approvedBy: user.id, approvedAt: new Date(), approverNote: note || null } },
      REJECT:  { from: ['PROPOSED', 'UNDER_REVIEW'], to: 'REJECTED', field: { rejectReason: note || 'Bị từ chối' } },
      CANCEL:  { from: ['PROPOSED', 'UNDER_REVIEW'], to: 'CANCELLED', field: { rejectReason: note || 'Đã hủy' } },
    };

    const transition = transitions[action];
    if (!transition) return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    if (!transition.from.includes(proposal.workflowStatus)) {
      return NextResponse.json({ error: `Không thể ${action} từ trạng thái ${proposal.workflowStatus}` }, { status: 400 });
    }

    const updated = await prisma.policyRecord.update({
      where: { id: params.id },
      data: { workflowStatus: transition.to as any, ...transition.field },
      include: { user: { select: { name: true, militaryId: true } } },
    });

    await logAudit({
      userId: user.id,
      functionCode: AWARDS.APPROVE,
      action: action,
      resourceType: 'AWARD_PROPOSAL',
      resourceId: params.id,
      newValue: { workflowStatus: transition.to, note },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, newStatus: transition.to, record: updated });
  } catch (error) {
    console.error('[Award Proposals Approve POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
