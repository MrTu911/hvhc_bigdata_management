/**
 * API Route: Gửi lại thông báo thất bại
 * POST /api/notifications/history/:id/retry
 *
 * Gửi lại một bản ghi trong notification_history qua đúng kênh gốc
 * (Email / Telegram). Thông báo "system" (in-app) không gửi qua kênh ngoài.
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS (hành động vận hành của quản trị hệ thống) + audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  getNotificationHistoryById,
  updateNotificationHistoryStatus,
} from '@/lib/notifications/history';
import { emailNotifier } from '@/lib/notifications/email';
import { telegramNotifier } from '@/lib/notifications/telegram';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for') ?? undefined;
  const userAgent = request.headers.get('user-agent') ?? undefined;

  try {
    const entry = await getNotificationHistoryById(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi thông báo' }, { status: 404 });
    }

    if (entry.status !== 'failed' && entry.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Chỉ gửi lại được bản ghi đang ở trạng thái Thất bại hoặc Đang chờ' },
        { status: 409 }
      );
    }

    // Xác định kênh & kiểm tra cấu hình trước khi gửi (báo lỗi rõ ràng nếu thiếu env).
    let delivered = false;
    let failureReason: string | null = null;

    if (entry.notification_type === 'email') {
      if (!emailNotifier.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Kênh Email chưa được cấu hình (thiếu SMTP_HOST/SMTP_USER/SMTP_PASSWORD)' },
          { status: 503 }
        );
      }
      delivered = await emailNotifier.sendEmail({
        to: entry.recipient,
        subject: entry.subject || '(Không tiêu đề)',
        html: entry.message,
      });
      if (!delivered) failureReason = 'Gửi email thất bại (SMTP từ chối hoặc lỗi kết nối)';
    } else if (entry.notification_type === 'telegram') {
      if (!telegramNotifier.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Kênh Telegram chưa được cấu hình (thiếu TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)' },
          { status: 503 }
        );
      }
      delivered = await telegramNotifier.sendMessage(entry.message);
      if (!delivered) failureReason = 'Gửi Telegram thất bại (Bot API từ chối hoặc lỗi kết nối)';
    } else {
      return NextResponse.json(
        { success: false, error: 'Thông báo hệ thống (in-app) không hỗ trợ gửi lại qua kênh ngoài' },
        { status: 422 }
      );
    }

    // Cập nhật trạng thái theo kết quả gửi lại.
    const newStatus = delivered ? 'sent' : 'failed';
    await updateNotificationHistoryStatus(
      id,
      newStatus,
      delivered ? null : `${failureReason} — gửi lại lúc ${new Date().toLocaleString('vi-VN')}`
    );

    // Audit: thao tác gửi lại là hành động vận hành nhạy cảm.
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.VIEW_SYSTEM_STATS,
      action: 'RETRY_NOTIFICATION',
      resourceType: 'notification_history',
      resourceId: String(id),
      result: delivered ? 'SUCCESS' : 'FAIL',
      ipAddress,
      userAgent,
      endpoint: `/api/notifications/history/${id}/retry`,
      httpMethod: 'POST',
      errorMessage: delivered ? undefined : failureReason ?? undefined,
      metadata: { notificationType: entry.notification_type, recipient: entry.recipient },
    });

    if (!delivered) {
      return NextResponse.json(
        { success: false, error: failureReason ?? 'Gửi lại thất bại', data: { id, status: newStatus } },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { id, status: newStatus } });
  } catch (error: any) {
    console.error('[POST /api/notifications/history/:id/retry]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi gửi lại thông báo', details: error?.message },
      { status: 500 }
    );
  }
}
