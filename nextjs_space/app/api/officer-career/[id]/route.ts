/**
 * API: CSDL Cán bộ - Chi tiết/Cập nhật/Xóa
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW_DETAIL);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const officer = await prisma.officerCareer.findUnique({
      where: { id: params.id },
      include: {
        personnel: {
          select: {
            id: true,
            personnelCode: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
            placeOfOrigin: true,
            ethnicity: true,
            religion: true,
            militaryRank: true,
            position: true,
            category: true,
            status: true,
            educationLevel: true,
            specialization: true,
            unit: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        promotions: {
          orderBy: { effectiveDate: 'desc' }
        }
      }
    });

    if (!officer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: officer });
  } catch (error) {
    console.error('Error fetching officer career:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { currentRank, currentPosition, lastEvaluationDate, lastEvaluationResult, commandHistory, trainingHistory } = body;

    const existing = await prisma.officerCareer.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.officerCareer.update({
      where: { id: params.id },
      data: {
        currentRank,
        currentPosition,
        lastEvaluationDate: lastEvaluationDate ? new Date(lastEvaluationDate) : undefined,
        lastEvaluationResult,
        commandHistory,
        trainingHistory,
        updatedBy: user!.id
      },
      include: {
        personnel: {
          select: { fullName: true, personnelCode: true }
        }
      }
    });

    await logAudit({
      userId: user!.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'OFFICER_CAREER',
      resourceId: params.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating officer career:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const existing = await prisma.officerCareer.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.officerCareer.delete({
      where: { id: params.id }
    });

    await logAudit({
      userId: user!.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'OFFICER_CAREER',
      resourceId: params.id,
      oldValue: JSON.stringify(existing),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting officer career:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
