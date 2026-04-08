/**
 * API: CSDL Quân nhân - Chi tiết/Cập nhật/Xóa
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

/**
 * GET - Lấy chi tiết hồ sơ quân nhân
 * RBAC: PERSONNEL.VIEW_DETAIL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW_DETAIL);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const soldier = await prisma.soldierProfile.findUnique({
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
        serviceRecords: {
          orderBy: { eventDate: 'desc' }
        }
      }
    });

    if (!soldier) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: soldier });
  } catch (error) {
    console.error('Error fetching soldier profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cập nhật hồ sơ quân nhân
 * RBAC: PERSONNEL.UPDATE
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { soldierCategory, currentRank, serviceType, healthCategory, lastHealthCheckDate, skillCertificates, trainingCourses } = body;

    const existing = await prisma.soldierProfile.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.soldierProfile.update({
      where: { id: params.id },
      data: {
        soldierCategory,
        currentRank,
        serviceType,
        healthCategory,
        lastHealthCheckDate: lastHealthCheckDate ? new Date(lastHealthCheckDate) : undefined,
        skillCertificates,
        trainingCourses,
        updatedBy: user?.id
      },
      include: {
        personnel: {
          select: { fullName: true, personnelCode: true }
        }
      }
    });

    await logAudit({
      userId: user?.id || '',
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'SOLDIER_PROFILE',
      resourceId: params.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating soldier profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa hồ sơ quân nhân
 * RBAC: PERSONNEL.DELETE
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const { user } = authResult;

    const existing = await prisma.soldierProfile.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.soldierProfile.delete({
      where: { id: params.id }
    });

    await logAudit({
      userId: user?.id || '',
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'SOLDIER_PROFILE',
      resourceId: params.id,
      oldValue: JSON.stringify(existing),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting soldier profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
