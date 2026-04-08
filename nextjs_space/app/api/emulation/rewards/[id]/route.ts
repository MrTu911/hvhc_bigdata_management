/**
 * API: Emulation Rewards Detail (Khen thưởng/Kỷ luật)
 * Path: /api/emulation/rewards/[id]
 * RBAC: AWARDS.* function codes
 * @version 8.9
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';

/**
 * GET - Chi tiết khen thưởng/kỷ luật
 * RBAC: AWARDS.VIEW
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const record = await prisma.policyRecord.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            militaryId: true,
            rank: true,
            position: true,
            email: true,
            unitRelation: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('[Policy Record GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT - Cập nhật khen thưởng/kỷ luật
 * RBAC: AWARDS.UPDATE
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, AWARDS.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      title,
      reason,
      level,
      decisionNumber,
      decisionDate,
      effectiveDate,
      expiryDate,
      signerName,
      signerPosition,
      issuingUnit,
      status,
      workflowStatus,
    } = body;

    // Check if record exists
    const existing = await prisma.policyRecord.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    const record = await prisma.policyRecord.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(reason && { reason }),
        ...(level && { level }),
        ...(decisionNumber !== undefined && { decisionNumber }),
        ...(decisionDate && { decisionDate: new Date(decisionDate) }),
        ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(signerName !== undefined && { signerName }),
        ...(signerPosition !== undefined && { signerPosition }),
        ...(issuingUnit !== undefined && { issuingUnit }),
        ...(status && { status }),
        ...(workflowStatus && { workflowStatus }),
      },
      include: {
        user: { select: { name: true, militaryId: true } },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[Policy Record PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Xóa khen thưởng/kỷ luật (soft delete)
 * RBAC: AWARDS.DELETE
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, AWARDS.DELETE);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const { user } = authResult;

    // Check if record exists
    const existing = await prisma.policyRecord.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    // Soft delete
    await prisma.policyRecord.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: user?.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Policy Record DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
