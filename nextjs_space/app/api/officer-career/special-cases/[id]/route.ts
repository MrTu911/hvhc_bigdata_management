/**
 * API: Trường hợp đặc biệt - single item
 * GET    /api/officer-career/special-cases/[id]
 * PATCH  /api/officer-career/special-cases/[id]
 * DELETE /api/officer-career/special-cases/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { SPECIAL_CASE_TYPE_LABELS } from '@/lib/promotion/promotionUtils';

export const dynamic = 'force-dynamic';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const record = await prisma.promotionSpecialCase.findUnique({
      where: { id: params.id },
      include: {
        officerCareer: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
        soldierProfile: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...record, caseTypeLabel: SPECIAL_CASE_TYPE_LABELS[record.caseType] ?? record.caseType },
    });
  } catch (error) {
    console.error('Error fetching special case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.promotionSpecialCase.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    const body = await request.json();
    const {
      caseType,
      title,
      description,
      reductionMonths,
      decisionNumber,
      decisionDate,
      issuedBy,
      isActive,
      notes,
    } = body;

    if (reductionMonths !== undefined && reductionMonths < 1) {
      return NextResponse.json({ error: 'reductionMonths phải >= 1' }, { status: 400 });
    }

    const updated = await prisma.promotionSpecialCase.update({
      where: { id: params.id },
      data: {
        ...(caseType !== undefined && { caseType }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(reductionMonths !== undefined && { reductionMonths: parseInt(reductionMonths) }),
        ...(decisionNumber !== undefined && { decisionNumber }),
        ...(decisionDate !== undefined && { decisionDate: decisionDate ? new Date(decisionDate) : null }),
        ...(issuedBy !== undefined && { issuedBy }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
        updatedBy: authResult.user?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating special case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.promotionSpecialCase.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    await prisma.promotionSpecialCase.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Đã xóa trường hợp đặc biệt' });
  } catch (error) {
    console.error('Error deleting special case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
