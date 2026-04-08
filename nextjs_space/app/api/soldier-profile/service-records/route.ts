/**
 * API: Hồ sơ thăng quân hàm chiến sĩ/HSQ (SoldierServiceRecord)
 * GET  /api/soldier-profile/service-records?soldierProfileId=xxx
 * POST /api/soldier-profile/service-records  – tạo mới bản ghi thăng/hạ quân hàm
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const RANK_LABELS: Record<string, string> = {
  THUONG_SI: 'Thượng sĩ',
  TRUNG_SI:  'Trung sĩ',
  HA_SI:     'Hạ sĩ',
  BINH_NHAT: 'Binh nhất',
  BINH_NHI:  'Binh nhì',
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const soldierProfileId = searchParams.get('soldierProfileId');
    const eventType = searchParams.get('eventType'); // optional filter

    if (!soldierProfileId) {
      return NextResponse.json({ error: 'soldierProfileId là bắt buộc' }, { status: 400 });
    }

    const where: Record<string, unknown> = { soldierProfileId };
    if (eventType) where.eventType = eventType;

    const records = await prisma.soldierServiceRecord.findMany({
      where,
      orderBy: { eventDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: records.map(r => ({
        ...r,
        previousRankLabel: r.previousRank ? (RANK_LABELS[r.previousRank] ?? r.previousRank) : null,
        newRankLabel:      r.newRank      ? (RANK_LABELS[r.newRank]      ?? r.newRank)      : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching service records:', error);
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
      soldierProfileId,
      eventType,
      eventDate,
      decisionNumber,
      previousRank,
      newRank,
      previousUnit,
      newUnit,
      description,
      notes,
    } = body;

    if (!soldierProfileId || !eventType || !eventDate) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: soldierProfileId, eventType, eventDate' },
        { status: 400 },
      );
    }

    // If this is a rank change, optionally update currentRank on the profile
    const isRankChange = eventType === 'THANG_CAP' || eventType === 'HA_CAP';

    const [record] = await prisma.$transaction(async (tx) => {
      const created = await tx.soldierServiceRecord.create({
        data: {
          soldierProfileId,
          eventType,
          eventDate: new Date(eventDate),
          decisionNumber: decisionNumber ?? null,
          previousRank: previousRank ?? null,
          newRank: newRank ?? null,
          previousUnit: previousUnit ?? null,
          newUnit: newUnit ?? null,
          description: description ?? null,
          notes: notes ?? null,
          createdBy: authResult.user?.id ?? null,
        },
      });

      // Auto-update currentRank if it's a promotion/demotion
      if (isRankChange && newRank) {
        await tx.soldierProfile.update({
          where: { id: soldierProfileId },
          data: {
            currentRank: newRank,
            lastRankDate: new Date(eventDate),
            updatedBy: authResult.user?.id ?? null,
          },
        });
      }

      return [created];
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating service record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
