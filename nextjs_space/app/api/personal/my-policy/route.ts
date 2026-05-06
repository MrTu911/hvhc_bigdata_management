/**
 * GET  /api/personal/my-policy
 * POST /api/personal/my-policy  — khai báo yêu cầu chính sách mới (SELF scope)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_POLICY, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: perm.deniedReason ?? 'Không có quyền xem chính sách cá nhân' },
      { status: 403 }
    );
  }

  try {
    const [policyRecords, policyRequests, categories, stats] = await Promise.all([
      prisma.policyRecord.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          recordType: true,
          form: true,
          level: true,
          title: true,
          reason: true,
          decisionNumber: true,
          decisionDate: true,
          effectiveDate: true,
          expiryDate: true,
          signerName: true,
          signerPosition: true,
          issuingUnit: true,
          status: true,
          workflowStatus: true,
          year: true,
          achievementSummary: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.policyRequest.findMany({
        where: { requesterId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          requestNumber: true,
          title: true,
          description: true,
          reason: true,
          requestedAmount: true,
          approvedAmount: true,
          status: true,
          effectiveDate: true,
          submittedAt: true,
          approvedAt: true,
          rejectedAt: true,
          rejectReason: true,
          approverNote: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, code: true, name: true } },
          workflowLogs: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              action: true,
              fromStatus: true,
              toStatus: true,
              performerName: true,
              performerRole: true,
              note: true,
              createdAt: true,
            },
          },
          _count: { select: { attachments: true } },
        },
      }),
      prisma.policyCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, code: true, name: true, description: true, requiresApproval: true },
      }),
      // Stats
      prisma.policyRequest.groupBy({
        by: ['status'],
        where: { requesterId: user.id, deletedAt: null },
        _count: true,
      }),
    ]);

    const statusCounts = Object.fromEntries(stats.map((s) => [s.status, s._count]));

    return NextResponse.json({
      success: true,
      data: {
        policyRecords,
        policyRequests,
        categories,
        stats: {
          totalRecords: policyRecords.length,
          totalRequests: policyRequests.length,
          draft: statusCounts['DRAFT'] ?? 0,
          submitted: statusCounts['SUBMITTED'] ?? 0,
          underReview: statusCounts['UNDER_REVIEW'] ?? 0,
          approved: statusCounts['APPROVED'] ?? 0,
          rejected: statusCounts['REJECTED'] ?? 0,
          completed: statusCounts['COMPLETED'] ?? 0,
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-policy]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

// ─── POST — khai báo yêu cầu mới ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_POLICY, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền gửi yêu cầu chính sách' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { categoryId, title, description, reason, requestedAmount, effectiveDate, action } = body;

    if (!categoryId || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'categoryId, title và description là bắt buộc' },
        { status: 400 }
      );
    }

    const category = await prisma.policyCategory.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      return NextResponse.json(
        { success: false, error: 'Danh mục không tồn tại hoặc đã vô hiệu hóa' },
        { status: 400 }
      );
    }

    // Generate request number CS-YYYY-XXXX
    const year = new Date().getFullYear();
    const prefix = `CS-${year}-`;
    const last = await prisma.policyRequest.findFirst({
      where: { requestNumber: { startsWith: prefix } },
      orderBy: { requestNumber: 'desc' },
    });
    const nextNum = last ? parseInt(last.requestNumber.split('-')[2], 10) + 1 : 1;
    const requestNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;

    const isDraft = action !== 'SUBMIT';
    const initialStatus = isDraft ? PolicyRequestStatus.DRAFT : PolicyRequestStatus.SUBMITTED;

    const newRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.policyRequest.create({
        data: {
          requestNumber,
          requesterId: user.id,
          categoryId,
          title: title.trim(),
          description: description.trim(),
          reason: reason?.trim() ?? null,
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          status: initialStatus,
          submittedAt: isDraft ? null : new Date(),
          submittedBy: isDraft ? null : user.id,
        },
        include: {
          category: { select: { id: true, code: true, name: true } },
        },
      });

      await tx.policyWorkflowLog.create({
        data: {
          requestId: req.id,
          action: isDraft ? PolicyWorkflowAction.CREATE : PolicyWorkflowAction.SUBMIT,
          toStatus: initialStatus,
          performedBy: user.id,
          performerName: user.name ?? undefined,
          note: isDraft ? 'Lưu nháp' : 'Gửi yêu cầu',
        },
      });

      return req;
    });

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-policy]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
