/**
 * M13 – Đánh dấu một thông báo đã đọc
 * POST /api/notifications/:notifId/read
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { notifId: string } }
) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const updated = await WorkflowNotificationService.markAsRead(params.notifId, actor.id);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Thông báo không tồn tại hoặc đã được đọc' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id: params.notifId, readAt: new Date() } });
  } catch (err) {
    console.error('[POST /api/notifications/:notifId/read]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật thông báo' }, { status: 500 });
  }
}
