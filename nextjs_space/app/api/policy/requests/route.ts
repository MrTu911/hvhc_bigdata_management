/**
 * API: Policy Requests - Hồ sơ yêu cầu chính sách
 * Routes: GET, POST, PUT
 * RBAC: POLICY.VIEW, POLICY.CREATE_REQUEST, POLICY.UPDATE
 * Workflow: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → COMPLETED
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { POLICY } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

// Generate request number: CS-YYYY-XXXX
async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CS-${year}-`;
  
  const lastRequest = await prisma.policyRequest.findFirst({
    where: { requestNumber: { startsWith: prefix } },
    orderBy: { requestNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastRequest) {
    const lastNum = parseInt(lastRequest.requestNumber.split('-')[2], 10);
    nextNumber = lastNum + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// GET - Lấy danh sách hồ sơ
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PolicyRequestStatus | null;
    const categoryId = searchParams.get('categoryId');
    const requesterId = searchParams.get('requesterId');
    const myRequests = searchParams.get('myRequests') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(requesterId && { requesterId }),
      ...(myRequests && { requesterId: session.user.id }),
    };

    const [requests, total] = await Promise.all([
      prisma.policyRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true, rank: true } },
          category: { select: { id: true, code: true, name: true } },
          attachments: { select: { id: true, fileName: true, fileType: true, fileSize: true } },
          _count: { select: { workflowLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.policyRequest.count({ where }),
    ]);

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.VIEW,
      action: 'VIEW',
      resourceType: 'POLICY_REQUEST',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching policy requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo hồ sơ mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.CREATE_REQUEST);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      categoryId,
      title,
      description,
      reason,
      requestedAmount,
      effectiveDate,
      expiryDate,
    } = body;

    // Validate required fields
    if (!categoryId || !title || !description) {
      return NextResponse.json(
        { error: 'categoryId, title và description là bắt buộc' },
        { status: 400 }
      );
    }

    // Check category exists
    const category = await prisma.policyCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại hoặc đã vô hiệu hóa' },
        { status: 400 }
      );
    }

    // Generate request number
    const requestNumber = await generateRequestNumber();

    // Create request with initial workflow log
    const policyRequest = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.policyRequest.create({
        data: {
          requestNumber,
          requesterId: session.user.id,
          categoryId,
          title,
          description,
          reason,
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: PolicyRequestStatus.DRAFT,
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, code: true, name: true } },
        },
      });

      // Create workflow log
      await tx.policyWorkflowLog.create({
        data: {
          requestId: newRequest.id,
          action: PolicyWorkflowAction.CREATE,
          toStatus: PolicyRequestStatus.DRAFT,
          performedBy: session.user.id,
          performerName: session.user.name || undefined,
        },
      });

      return newRequest;
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.CREATE_REQUEST,
      action: 'CREATE',
      resourceType: 'POLICY_REQUEST',
      resourceId: policyRequest.id,
      newValue: JSON.stringify(policyRequest),
      result: 'SUCCESS',
    });

    return NextResponse.json(policyRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating policy request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật hồ sơ (chỉ khi DRAFT)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      id,
      categoryId,
      title,
      description,
      reason,
      requestedAmount,
      effectiveDate,
      expiryDate,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    // Get existing request
    const existingRequest = await prisma.policyRequest.findUnique({
      where: { id },
    });

    if (!existingRequest || existingRequest.deletedAt) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    // Only allow edit when DRAFT
    if (existingRequest.status !== PolicyRequestStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Chỉ có thể sửa hồ sơ ở trạng thái Nháp' },
        { status: 400 }
      );
    }

    // Check ownership or admin
    if (existingRequest.requesterId !== session.user.id) {
      // Need APPROVE permission to edit others' requests
      const canEdit = await requireFunction(request, POLICY.APPROVE);
      if (!canEdit.allowed) {
        return NextResponse.json(
          { error: 'Không có quyền sửa hồ sơ của người khác' },
          { status: 403 }
        );
      }
    }

    // Update request
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.policyRequest.update({
        where: { id },
        data: {
          ...(categoryId && { categoryId }),
          ...(title && { title }),
          ...(description && { description }),
          ...(reason !== undefined && { reason }),
          ...(requestedAmount !== undefined && {
            requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
          }),
          ...(effectiveDate !== undefined && {
            effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          }),
          ...(expiryDate !== undefined && {
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          }),
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, code: true, name: true } },
        },
      });

      // Create workflow log
      await tx.policyWorkflowLog.create({
        data: {
          requestId: updated.id,
          action: PolicyWorkflowAction.UPDATE,
          fromStatus: existingRequest.status,
          toStatus: updated.status,
          performedBy: session.user.id,
          performerName: session.user.name || undefined,
        },
      });

      return updated;
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.UPDATE,
      action: 'UPDATE',
      resourceType: 'POLICY_REQUEST',
      resourceId: updatedRequest.id,
      oldValue: JSON.stringify(existingRequest),
      newValue: JSON.stringify(updatedRequest),
      result: 'SUCCESS',
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating policy request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
