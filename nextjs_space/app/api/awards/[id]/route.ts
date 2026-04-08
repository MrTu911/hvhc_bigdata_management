/**
 * API: Awards - Chi tiết/Cập nhật/Xóa hồ sơ khen thưởng
 * Path: /api/awards/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const award = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, militaryId: true, rank: true, position: true,
            unitRelation: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!award) return NextResponse.json({ error: 'Không tìm thấy khen thưởng' }, { status: 404 });
    return NextResponse.json(award);
  } catch (error) {
    console.error('[Awards GET/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.UPDATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const existing = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
    });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy khen thưởng' }, { status: 404 });

    // Chỉ được cập nhật khi ở trạng thái PROPOSED
    if (existing.workflowStatus !== 'PROPOSED') {
      return NextResponse.json({ error: 'Chỉ có thể cập nhật khen thưởng ở trạng thái Đề xuất' }, { status: 400 });
    }

    const updated = await prisma.policyRecord.update({
      where: { id: params.id },
      data: {
        level: body.level ?? existing.level,
        title: body.title ?? existing.title,
        reason: body.reason ?? existing.reason,
        decisionNumber: body.decisionNumber ?? existing.decisionNumber,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : existing.decisionDate,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : existing.effectiveDate,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
        signerName: body.signerName ?? existing.signerName,
        signerPosition: body.signerPosition ?? existing.signerPosition,
        issuingUnit: body.issuingUnit ?? existing.issuingUnit,
        year: body.year ?? existing.year,
        achievementSummary: body.achievementSummary ?? existing.achievementSummary,
        isCollective: body.isCollective ?? existing.isCollective,
      },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.UPDATE, action: 'UPDATE', resourceType: 'AWARD', resourceId: params.id, result: 'SUCCESS' });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Awards PUT/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, AWARDS.DELETE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const existing = await prisma.policyRecord.findFirst({
      where: { id: params.id, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
    });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy khen thưởng' }, { status: 404 });

    if (!['PROPOSED', 'REJECTED', 'CANCELLED'].includes(existing.workflowStatus)) {
      return NextResponse.json({ error: 'Không thể xóa khen thưởng đã được phê duyệt' }, { status: 400 });
    }

    await prisma.policyRecord.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    await logAudit({ userId: user.id, functionCode: AWARDS.DELETE, action: 'DELETE', resourceType: 'AWARD', resourceId: params.id, result: 'SUCCESS' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Awards DELETE/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
