/**
 * PATCH /api/personal/my-policy/[id]  — submit hoặc cancel yêu cầu (chỉ owner)
 * DELETE /api/personal/my-policy/[id] — xóa mềm khi DRAFT
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_POLICY, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, note } = body as { action: 'SUBMIT' | 'CANCEL'; note?: string };

    const existing = await prisma.policyRequest.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    if (existing.requesterId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền thao tác hồ sơ này' },
        { status: 403 }
      );
    }

    if (action === 'SUBMIT') {
      if (existing.status !== PolicyRequestStatus.DRAFT) {
        return NextResponse.json(
          { success: false, error: 'Chỉ có thể gửi hồ sơ ở trạng thái Nháp' },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.policyRequest.update({
          where: { id: params.id },
          data: {
            status: PolicyRequestStatus.SUBMITTED,
            submittedAt: new Date(),
            submittedBy: user.id,
          },
        });
        await tx.policyWorkflowLog.create({
          data: {
            requestId: params.id,
            action: PolicyWorkflowAction.SUBMIT,
            fromStatus: PolicyRequestStatus.DRAFT,
            toStatus: PolicyRequestStatus.SUBMITTED,
            performedBy: user.id,
            performerName: user.name ?? undefined,
            note: note ?? 'Gửi yêu cầu chính sách',
          },
        });
        return req;
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'CANCEL') {
      const cancellable: PolicyRequestStatus[] = [
        PolicyRequestStatus.DRAFT,
        PolicyRequestStatus.SUBMITTED,
      ];
      if (!cancellable.includes(existing.status)) {
        return NextResponse.json(
          { success: false, error: 'Không thể hủy hồ sơ ở trạng thái hiện tại' },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.policyRequest.update({
          where: { id: params.id },
          data: { status: PolicyRequestStatus.CANCELLED },
        });
        await tx.policyWorkflowLog.create({
          data: {
            requestId: params.id,
            action: PolicyWorkflowAction.CANCEL,
            fromStatus: existing.status,
            toStatus: PolicyRequestStatus.CANCELLED,
            performedBy: user.id,
            performerName: user.name ?? undefined,
            note: note ?? 'Người dùng hủy yêu cầu',
          },
        });
        return req;
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[PATCH /api/personal/my-policy/[id]]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  try {
    const existing = await prisma.policyRequest.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    if (existing.requesterId !== user.id) {
      return NextResponse.json({ success: false, error: 'Không có quyền xóa hồ sơ này' }, { status: 403 });
    }

    if (existing.status !== PolicyRequestStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: 'Chỉ có thể xóa hồ sơ ở trạng thái Nháp' },
        { status: 400 }
      );
    }

    await prisma.policyRequest.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa hồ sơ' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[DELETE /api/personal/my-policy/[id]]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
