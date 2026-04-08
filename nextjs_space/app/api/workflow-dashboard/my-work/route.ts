/**
 * M13 – My Work Dashboard
 * GET /api/workflow-dashboard/my-work
 *
 * Trả về:
 *  - stats: MyWorkStats (KPI cards)
 *  - tasks: danh sách việc đang chờ tôi xử lý
 *
 * Query params:
 *  - limit: số tasks trả về (default 20, max 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowDashboardService } from '@/lib/services/workflow/workflow-dashboard.service';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    // Chạy song song: stats + pending tasks + unread notification count
    const [stats, tasks, notifResult] = await Promise.all([
      WorkflowDashboardService.getMyWorkStats(actor.id),
      WorkflowDashboardService.getMyPendingTasks(actor.id, limit),
      WorkflowNotificationService.listMyNotifications(actor.id, { unreadOnly: true, limit: 1 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        tasks,
        unreadNotifCount: notifResult.unreadCount,
      },
    });
  } catch (err) {
    console.error('[GET /api/workflow-dashboard/my-work]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải my work dashboard' }, { status: 500 });
  }
}
