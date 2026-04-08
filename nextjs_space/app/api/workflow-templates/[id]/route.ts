/**
 * M13 – Workflow Template Detail
 * GET   /api/workflow-templates/:id  – chi tiết template + versions
 * PATCH /api/workflow-templates/:id  – cập nhật metadata (name, description, isActive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { WorkflowVersionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          select: {
            id: true,
            versionNo: true,
            status: true,
            publishedAt: true,
            publishedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (err) {
    console.error('[GET /api/workflow-templates/:id]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải template' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.DESIGN);
  if (!auth.allowed) return auth.response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const { name, description, isActive } = body as Record<string, unknown>;

  // Chỉ cho sửa metadata, không cho đổi code/moduleKey sau khi tạo
  const updateData: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
  if (typeof description === 'string') updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: 'Không có field nào để cập nhật' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    void actor; // actor logged via RBAC middleware already

    const existing = await prisma.workflowTemplate.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template không tồn tại' }, { status: 404 });
    }

    // Không deactivate template nếu còn instance PENDING/IN_PROGRESS dùng nó
    if (isActive === false) {
      const activeCount = await prisma.workflowInstance.count({
        where: {
          templateId: params.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });
      if (activeCount > 0) {
        return NextResponse.json(
          { success: false, error: `Không thể deactivate: còn ${activeCount} workflow instance đang chạy` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.workflowTemplate.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }
    console.error('[PATCH /api/workflow-templates/:id]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật template' }, { status: 500 });
  }
}
