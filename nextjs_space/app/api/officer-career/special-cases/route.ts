/**
 * API: Trường hợp đặc biệt rút ngắn hạn thăng quân hàm
 * GET  /api/officer-career/special-cases  – list (filter by officerCareerId or soldierProfileId)
 * POST /api/officer-career/special-cases  – create
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { SPECIAL_CASE_TYPE_LABELS } from '@/lib/promotion/promotionUtils';

export const dynamic = 'force-dynamic';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const officerCareerId = searchParams.get('officerCareerId');
    const soldierProfileId = searchParams.get('soldierProfileId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: Record<string, unknown> = {};
    if (officerCareerId) where.officerCareerId = officerCareerId;
    if (soldierProfileId) where.soldierProfileId = soldierProfileId;
    if (activeOnly) where.isActive = true;

    const cases = await prisma.promotionSpecialCase.findMany({
      where,
      include: {
        officerCareer: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
        soldierProfile: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: cases.map((c) => ({
        ...c,
        caseTypeLabel: SPECIAL_CASE_TYPE_LABELS[c.caseType] ?? c.caseType,
      })),
    });
  } catch (error) {
    console.error('Error fetching special cases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      officerCareerId,
      soldierProfileId,
      caseType,
      title,
      description,
      reductionMonths,
      decisionNumber,
      decisionDate,
      issuedBy,
      notes,
    } = body;

    if (!caseType || !title || reductionMonths == null) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: caseType, title, reductionMonths' },
        { status: 400 },
      );
    }
    if (!officerCareerId && !soldierProfileId) {
      return NextResponse.json(
        { error: 'Phải cung cấp officerCareerId hoặc soldierProfileId' },
        { status: 400 },
      );
    }
    if (reductionMonths < 1) {
      return NextResponse.json(
        { error: 'reductionMonths phải >= 1' },
        { status: 400 },
      );
    }

    const created = await prisma.promotionSpecialCase.create({
      data: {
        officerCareerId: officerCareerId ?? null,
        soldierProfileId: soldierProfileId ?? null,
        caseType,
        title,
        description: description ?? null,
        reductionMonths: parseInt(reductionMonths),
        decisionNumber: decisionNumber ?? null,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        issuedBy: issuedBy ?? null,
        notes: notes ?? null,
        isActive: true,
        createdBy: authResult.user?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating special case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
