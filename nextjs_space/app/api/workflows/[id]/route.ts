/**
 * M13 – Chi tiết workflow instance
 * GET /api/workflows/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW_DETAIL);
  if (!auth.allowed) return auth.response!;

  try {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: { assignedAt: 'asc' },
          select: {
            id: true,
            stepCode: true,
            status: true,
            assigneeId: true,
            assignedAt: true,
            dueAt: true,
            actedAt: true,
            completedAt: true,
          },
        },
        signatures: {
          select: {
            id: true,
            stepInstanceId: true,
            signerId: true,
            signatureType: true,
            status: true,
            signedAt: true,
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json({ success: false, error: 'Workflow instance không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: instance });
  } catch (err) {
    console.error('[GET /api/workflows/:id]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải workflow instance' }, { status: 500 });
  }
}
