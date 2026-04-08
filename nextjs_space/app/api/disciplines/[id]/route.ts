/**
 * API: Disciplines - Chi tiết/Cập nhật/Xóa hồ sơ kỷ luật
 * Path: /api/disciplines/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW_DISCIPLINE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const record = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: 'DISCIPLINE' },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, militaryId: true, rank: true, position: true,
            unitRelation: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!record) return NextResponse.json({ error: 'Không tìm thấy kỷ luật' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    console.error('[Disciplines GET/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.CREATE_DISCIPLINE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const existing = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: 'DISCIPLINE' },
    });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy kỷ luật' }, { status: 404 });

    if (existing.workflowStatus !== 'PROPOSED') {
      return NextResponse.json({ error: 'Chỉ có thể cập nhật kỷ luật ở trạng thái Đề xuất' }, { status: 400 });
    }

    const updated = await prisma.policyRecord.update({
      where: { id: params.id },
      data: {
        level: body.level ?? existing.level,
        title: body.title ?? existing.title,
        reason: body.reason ?? existing.reason,
        violationSummary: body.violationSummary ?? existing.violationSummary,
        legalBasis: body.legalBasis ?? existing.legalBasis,
        decisionNumber: body.decisionNumber ?? existing.decisionNumber,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : existing.decisionDate,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : existing.effectiveDate,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
        signerName: body.signerName ?? existing.signerName,
        signerPosition: body.signerPosition ?? existing.signerPosition,
        issuingUnit: body.issuingUnit ?? existing.issuingUnit,
        durationMonths: body.durationMonths ?? existing.durationMonths,
        workflowStatus: body.workflowStatus && ['PROPOSED', 'CANCELLED'].includes(body.workflowStatus)
          ? body.workflowStatus : existing.workflowStatus,
      },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.CREATE_DISCIPLINE, action: 'UPDATE', resourceType: 'DISCIPLINE', resourceId: params.id, result: 'SUCCESS' });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Disciplines PUT/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.CREATE_DISCIPLINE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const existing = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: 'DISCIPLINE' },
    });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy kỷ luật' }, { status: 404 });

    if (!['PROPOSED', 'REJECTED', 'CANCELLED'].includes(existing.workflowStatus)) {
      return NextResponse.json({ error: 'Không thể xóa kỷ luật đã được phê duyệt' }, { status: 400 });
    }

    await prisma.policyRecord.update({ where: { id: params.id }, data: { deletedAt: new Date(), deletedBy: user.id } });
    await logAudit({ userId: user.id, functionCode: AWARDS.CREATE_DISCIPLINE, action: 'DELETE', resourceType: 'DISCIPLINE', resourceId: params.id, result: 'SUCCESS' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Disciplines DELETE/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
