/**
 * API: Policy Request Detail
 * Routes: GET, DELETE
 * RBAC: POLICY.VIEW, POLICY.DELETE
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { POLICY } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET - Lấy chi tiết hồ sơ
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { id } = params;

    const policyRequest = await prisma.policyRequest.findUnique({
      where: { id, deletedAt: null },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            rank: true,
            position: true,
            unit: true,
            department: true,
          },
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            requiresApproval: true,
            approvalLevels: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            cloudStoragePath: true,
            isPublic: true,
            description: true,
            createdAt: true,
          },
        },
        workflowLogs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            fromStatus: true,
            toStatus: true,
            performedBy: true,
            performerName: true,
            performerRole: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!policyRequest) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.VIEW,
      action: 'VIEW',
      resourceType: 'POLICY_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
    });

    return NextResponse.json(policyRequest);
  } catch (error) {
    console.error('Error fetching policy request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa hồ sơ (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.DELETE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { id } = params;

    const existingRequest = await prisma.policyRequest.findUnique({
      where: { id },
    });

    if (!existingRequest || existingRequest.deletedAt) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    // Only allow delete when DRAFT or CANCELLED
    const allowedStatuses: PolicyRequestStatus[] = [PolicyRequestStatus.DRAFT, PolicyRequestStatus.CANCELLED];
    if (!allowedStatuses.includes(existingRequest.status)) {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa hồ sơ ở trạng thái Nháp hoặc Đã hủy' },
        { status: 400 }
      );
    }

    // Check ownership or admin
    if (existingRequest.requesterId !== session.user.id) {
      const canDelete = await requireFunction(request, POLICY.APPROVE);
      if (!canDelete.allowed) {
        return NextResponse.json(
          { error: 'Không có quyền xóa hồ sơ của người khác' },
          { status: 403 }
        );
      }
    }

    // Soft delete
    await prisma.$transaction(async (tx) => {
      await tx.policyRequest.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      });

      await tx.policyWorkflowLog.create({
        data: {
          requestId: id,
          action: PolicyWorkflowAction.CANCEL,
          fromStatus: existingRequest.status,
          toStatus: PolicyRequestStatus.CANCELLED,
          performedBy: session.user.id,
          performerName: session.user.name || undefined,
          note: 'Hồ sơ đã bị xóa',
        },
      });
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.DELETE,
      action: 'DELETE',
      resourceType: 'POLICY_REQUEST',
      resourceId: id,
      oldValue: JSON.stringify(existingRequest),
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Đã xóa hồ sơ' });
  } catch (error) {
    console.error('Error deleting policy request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
