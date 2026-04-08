/**
 * M13 – Inbox thông báo in-app
 * GET /api/notifications/my?unreadOnly=true&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Thông báo cá nhân không cần quyền đặc biệt, chỉ cần đăng nhập
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const result = await WorkflowNotificationService.listMyNotifications(actor.id, {
      unreadOnly,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[GET /api/notifications/my]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải thông báo' }, { status: 500 });
  }
}

/** PATCH /api/notifications/my — đánh dấu tất cả đã đọc */
export async function PATCH(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const count = await WorkflowNotificationService.markAllAsRead(actor.id);
    return NextResponse.json({ success: true, data: { markedCount: count } });
  } catch (err) {
    console.error('[PATCH /api/notifications/my]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật thông báo' }, { status: 500 });
  }
}
