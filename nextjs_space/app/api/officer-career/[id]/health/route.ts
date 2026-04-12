/**
 * API: Cập nhật sức khỏe sĩ quan
 * PATCH /api/officer-career/[id]/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['Loại 1', 'Loại 2', 'Loại 3', 'Loại 4'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }
    const { user } = authResult;

    const existing = await prisma.officerCareer.findUnique({
      where: { id: params.id },
      select: { id: true, healthCategory: true, healthNotes: true, lastHealthCheckDate: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Officer career not found' }, { status: 404 });
    }

    const body = await request.json();
    const { healthCategory, healthNotes, lastHealthCheckDate } = body;

    if (healthCategory !== undefined && healthCategory !== null) {
      if (!VALID_CATEGORIES.includes(healthCategory)) {
        return NextResponse.json(
          { error: `healthCategory phải là một trong: ${VALID_CATEGORIES.join(', ')}` },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.officerCareer.update({
      where: { id: params.id },
      data: {
        healthCategory:      healthCategory      ?? existing.healthCategory,
        healthNotes:         healthNotes         !== undefined ? (healthNotes || null)  : existing.healthNotes,
        lastHealthCheckDate: lastHealthCheckDate !== undefined
          ? (lastHealthCheckDate ? new Date(lastHealthCheckDate) : null)
          : existing.lastHealthCheckDate,
        updatedBy: user!.id,
      },
      select: {
        id:                  true,
        healthCategory:      true,
        healthNotes:         true,
        lastHealthCheckDate: true,
        personnel: { select: { fullName: true, personnelCode: true } },
      },
    });

    await logAudit({
      userId:       user!.id,
      functionCode: PERSONNEL.UPDATE,
      action:       'UPDATE',
      resourceType: 'OFFICER_HEALTH',
      resourceId:   params.id,
      oldValue:     JSON.stringify({
        healthCategory:      existing.healthCategory,
        healthNotes:         existing.healthNotes,
        lastHealthCheckDate: existing.lastHealthCheckDate,
      }),
      newValue: JSON.stringify({
        healthCategory:      updated.healthCategory,
        healthNotes:         updated.healthNotes,
        lastHealthCheckDate: updated.lastHealthCheckDate,
      }),
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating officer health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
