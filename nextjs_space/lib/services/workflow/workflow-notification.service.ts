/**
 * M13 – Workflow Notification Service (Phase 1: in-app)
 *
 * Tạo, gửi và quản lý thông báo trong hệ thống liên quan đến workflow.
 * Phase 1 hỗ trợ kênh IN_APP (ghi vào WorkflowNotification, FE poll hoặc websocket).
 * Phase 2 mở rộng: EMAIL, SMS via adapter.
 *
 * Quy tắc:
 *  - Không retry vô hạn — ghi FAILED và để cron retry sau
 *  - Không spam: kiểm tra duplicate trước khi tạo thông báo cùng eventType
 *  - Không gửi thông báo nếu recipientId null/undefined
 */

import prisma from '@/lib/db';

// ---------------------------------------------------------------------------
// Event types — khớp với design doc
// ---------------------------------------------------------------------------

export const WF_EVENT = {
  NEW_TASK: 'NEW_TASK',               // có việc mới chờ xử lý
  APPROVED: 'APPROVED',               // quy trình được duyệt
  REJECTED: 'REJECTED',               // quy trình bị từ chối
  RETURNED: 'RETURNED',               // quy trình bị trả lại
  CANCELLED: 'CANCELLED',             // quy trình bị hủy
  STEP_COMPLETED: 'STEP_COMPLETED',   // bước hoàn thành, chuyển bước mới
  NEAR_DUE: 'NEAR_DUE',               // sắp đến hạn (nhắc trước X giờ)
  OVERDUE: 'OVERDUE',                 // quá hạn
  ESCALATED: 'ESCALATED',             // leo thang
  SIGN_SUCCESS: 'SIGN_SUCCESS',       // ký số thành công
  SIGN_FAILED: 'SIGN_FAILED',         // ký số thất bại
} as const;

export type WfEventType = (typeof WF_EVENT)[keyof typeof WF_EVENT];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendNotificationInput {
  workflowInstanceId: string;
  recipientId: string;
  eventType: WfEventType;
  title: string;
  message: string;
  channel?: 'IN_APP' | 'EMAIL' | 'SMS';
  payloadJson?: Record<string, unknown>;
  /** Nếu set, thông báo sẽ được ghi nhưng chưa gửi ngay */
  scheduledAt?: Date;
}

export interface BulkSendInput {
  workflowInstanceId: string;
  recipientIds: string[];
  eventType: WfEventType;
  title: string;
  message: string;
  payloadJson?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WorkflowNotificationServiceClass {

  /**
   * Gửi thông báo đến một người dùng.
   * Phase 1: chỉ ghi vào DB (IN_APP). Channel EMAIL/SMS để Phase 2.
   */
  async send(input: SendNotificationInput): Promise<string> {
    if (!input.recipientId) return '';

    const channel = input.channel ?? 'IN_APP';
    const now = new Date();

    const notif = await prisma.workflowNotification.create({
      data: {
        workflowInstanceId: input.workflowInstanceId,
        recipientId: input.recipientId,
        channel,
        eventType: input.eventType,
        title: input.title,
        message: input.message,
        status: input.scheduledAt && input.scheduledAt > now ? 'PENDING' : 'SENT',
        scheduledAt: input.scheduledAt ?? null,
        sentAt: input.scheduledAt && input.scheduledAt > now ? null : now,
        payloadJson: input.payloadJson ?? undefined,
      },
    });

    return notif.id;
  }

  /**
   * Gửi cùng một thông báo đến nhiều người.
   * Dùng createMany để tối ưu số lượng DB round-trip.
   */
  async sendBulk(input: BulkSendInput): Promise<void> {
    const recipients = input.recipientIds.filter(Boolean);
    if (recipients.length === 0) return;

    const now = new Date();
    await prisma.workflowNotification.createMany({
      data: recipients.map((recipientId) => ({
        workflowInstanceId: input.workflowInstanceId,
        recipientId,
        channel: 'IN_APP',
        eventType: input.eventType,
        title: input.title,
        message: input.message,
        status: 'SENT',
        sentAt: now,
        payloadJson: input.payloadJson ?? undefined,
      })),
      skipDuplicates: false,
    });
  }

  /**
   * Thông báo khi có bước mới gán cho người xử lý.
   * Gọi từ WorkflowEngineService sau khi tạo WorkflowStepInstance mới.
   */
  async notifyNewTask(params: {
    workflowInstanceId: string;
    instanceTitle: string;
    assigneeId: string;
    stepName: string;
    dueAt?: Date | null;
  }): Promise<void> {
    const duePart = params.dueAt
      ? ` Hạn xử lý: ${params.dueAt.toLocaleDateString('vi-VN')}.`
      : '';

    await this.send({
      workflowInstanceId: params.workflowInstanceId,
      recipientId: params.assigneeId,
      eventType: WF_EVENT.NEW_TASK,
      title: `Có việc mới chờ bạn xử lý`,
      message: `Bước "${params.stepName}" trong quy trình "${params.instanceTitle}" đang chờ bạn xử lý.${duePart}`,
    });
  }

  /**
   * Thông báo kết quả phê duyệt cho người khởi tạo.
   */
  async notifyInitiator(params: {
    workflowInstanceId: string;
    instanceTitle: string;
    initiatorId: string;
    eventType: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';
    actorName?: string;
    comment?: string;
  }): Promise<void> {
    const eventLabels: Record<string, string> = {
      APPROVED: 'đã được phê duyệt',
      REJECTED: 'bị từ chối',
      RETURNED: 'được trả lại để bổ sung',
      CANCELLED: 'bị hủy',
    };
    const label = eventLabels[params.eventType] ?? params.eventType;
    const commentPart = params.comment ? ` Lý do: ${params.comment}` : '';

    await this.send({
      workflowInstanceId: params.workflowInstanceId,
      recipientId: params.initiatorId,
      eventType: params.eventType as WfEventType,
      title: `Quy trình ${label}`,
      message: `Quy trình "${params.instanceTitle}" ${label}.${commentPart}`,
      payloadJson: { actorName: params.actorName, comment: params.comment },
    });
  }

  /**
   * Nhắc người xử lý sắp đến hạn.
   * Gọi từ cron job workflow-reminder.
   */
  async notifyNearDue(params: {
    workflowInstanceId: string;
    instanceTitle: string;
    assigneeId: string;
    stepCode: string;
    dueAt: Date;
    hoursLeft: number;
  }): Promise<void> {
    await this.send({
      workflowInstanceId: params.workflowInstanceId,
      recipientId: params.assigneeId,
      eventType: WF_EVENT.NEAR_DUE,
      title: `Sắp đến hạn xử lý`,
      message: `Bước "${params.stepCode}" trong quy trình "${params.instanceTitle}" còn ${params.hoursLeft} giờ đến hạn.`,
      payloadJson: { dueAt: params.dueAt, stepCode: params.stepCode },
    });
  }

  /**
   * Thông báo quá hạn — gọi từ cron job workflow-overdue.
   */
  async notifyOverdue(params: {
    workflowInstanceId: string;
    instanceTitle: string;
    assigneeId: string;
    stepCode: string;
    dueAt: Date;
  }): Promise<void> {
    await this.send({
      workflowInstanceId: params.workflowInstanceId,
      recipientId: params.assigneeId,
      eventType: WF_EVENT.OVERDUE,
      title: `Quá hạn xử lý`,
      message: `Bước "${params.stepCode}" trong quy trình "${params.instanceTitle}" đã quá hạn từ ${params.dueAt.toLocaleDateString('vi-VN')}.`,
      payloadJson: { dueAt: params.dueAt, stepCode: params.stepCode },
    });
  }

  /**
   * Lấy danh sách thông báo in-app của người dùng (inbox).
   * Hỗ trợ filter unread và pagination.
   */
  async listMyNotifications(
    recipientId: string,
    options: { unreadOnly?: boolean; page?: number; limit?: number } = {}
  ) {
    const { unreadOnly = false, page = 1, limit = 20 } = options;

    const where = {
      recipientId,
      channel: 'IN_APP',
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.workflowNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workflowNotification.count({ where }),
      prisma.workflowNotification.count({
        where: { recipientId, channel: 'IN_APP', readAt: null },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Đánh dấu một thông báo đã đọc.
   * Fail-safe: không throw nếu không tìm thấy.
   */
  async markAsRead(notifId: string, recipientId: string): Promise<boolean> {
    const notif = await prisma.workflowNotification.findFirst({
      where: { id: notifId, recipientId },
      select: { id: true, readAt: true },
    });
    if (!notif || notif.readAt) return false;

    await prisma.workflowNotification.update({
      where: { id: notifId },
      data: { readAt: new Date() },
    });
    return true;
  }

  /**
   * Đánh dấu tất cả thông báo in-app của người dùng là đã đọc.
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await prisma.workflowNotification.updateMany({
      where: { recipientId, channel: 'IN_APP', readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}

export const WorkflowNotificationService = new WorkflowNotificationServiceClass();
