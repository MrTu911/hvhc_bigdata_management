/**
 * M13 – Lấy workflow instance cho một entity cụ thể
 * GET /api/workflows/entity/:entityType/:entityId
 *
 * Dùng cho các module nghiệp vụ (M03, M05, M09, M10...) để hiển thị
 * trạng thái workflow gắn với một hồ sơ/thực thể cụ thể.
 *
 * Query params:
 *  - all=true  → trả toàn bộ instances (default: chỉ active instance mới nhất)
 *
 * Response khi all=false:
 *  - instance đang active (DRAFT/PENDING/IN_PROGRESS/RETURNED), null nếu không có
 * Response khi all=true:
 *  - mảng tất cả instances, mới nhất trước
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { WorkflowInstanceStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES: WorkflowInstanceStatus[] = [
  WorkflowInstanceStatus.DRAFT,
  WorkflowInstanceStatus.PENDING,
  WorkflowInstanceStatus.IN_PROGRESS,
  WorkflowInstanceStatus.RETURNED,
];

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  const { entityType, entityId } = params;

  if (!entityType?.trim() || !entityId?.trim()) {
    return NextResponse.json(
      { success: false, error: 'entityType và entityId là bắt buộc' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  try {
    if (all) {
      // Tất cả instances của entity, mới nhất trước
      const instances = await prisma.workflowInstance.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          templateId: true,
          title: true,
          status: true,
          currentStepCode: true,
          initiatorId: true,
          currentAssigneeId: true,
          priority: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ success: true, data: instances });
    }

    // Chỉ lấy instance active mới nhất
    const instance = await prisma.workflowInstance.findFirst({
      where: {
        entityType,
        entityId,
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        templateId: true,
        title: true,
        status: true,
        currentStepCode: true,
        initiatorId: true,
        currentAssigneeId: true,
        priority: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        steps: {
          orderBy: { assignedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            stepCode: true,
            status: true,
            assigneeId: true,
            assignedAt: true,
            actedAt: true,
            dueAt: true,
            completedAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: instance ?? null });
  } catch (err) {
    console.error('[GET /api/workflows/entity/:entityType/:entityId]', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải thông tin workflow của entity' },
      { status: 500 }
    );
  }
}
