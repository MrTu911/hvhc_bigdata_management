import 'server-only'
import prisma from '@/lib/db'
import { NotificationDispatcher } from '@/lib/notifications/dispatcher'

type ProposalEvent =
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'UNIT_APPROVED'
  | 'DEPT_APPROVED'
  | 'APPROVED'
  | 'REJECTED'

interface NotifyPayload {
  id: string
  title: string
  piId: string
  unitId?: string | null
  revisionNote?: string | null
  rejectReason?: string | null
}

const dispatcher = new NotificationDispatcher()

// Gửi thông báo in-app qua bảng wf_notifications (WorkflowNotification)
// và email/telegram qua dispatcher cho các sự kiện quan trọng
export async function notifyProposalEvent(
  event: ProposalEvent,
  proposal: NotifyPayload,
  _unitId: string | null // reserved for future scope-based recipient lookup
): Promise<void> {
  const { id, title, piId, revisionNote, rejectReason } = proposal

  const messages: Record<ProposalEvent, { title: string; body: (p: NotifyPayload) => string }> = {
    SUBMITTED: {
      title: '📋 Đề xuất NCKH mới cần xét duyệt',
      body: (p) => `Đề xuất "${p.title}" (ID: ${p.id}) đã được nộp và chờ xét duyệt cấp Bộ môn.`,
    },
    REVISION_REQUESTED: {
      title: '✏️ Đề xuất cần chỉnh sửa',
      body: (p) => `Đề xuất "${p.title}" của bạn cần chỉnh sửa.\nGhi chú: ${p.revisionNote ?? '(không có)'}`,
    },
    UNIT_APPROVED: {
      title: '✅ Đề xuất đã được duyệt cấp Bộ môn',
      body: (p) => `Đề xuất "${p.title}" đã vượt qua cấp Bộ môn và chờ xét duyệt cấp Khoa.`,
    },
    DEPT_APPROVED: {
      title: '✅ Đề xuất đã được duyệt cấp Khoa',
      body: (p) => `Đề xuất "${p.title}" đã vượt qua cấp Khoa và chờ phê duyệt cấp Học viện.`,
    },
    APPROVED: {
      title: '🎉 Đề xuất NCKH được phê duyệt',
      body: (p) => `Chúc mừng! Đề xuất "${p.title}" đã được phê duyệt chính thức. Đề tài NCKH đã được tạo.`,
    },
    REJECTED: {
      title: '❌ Đề xuất NCKH bị từ chối',
      body: (p) => `Đề xuất "${p.title}" đã bị từ chối.\nLý do: ${p.rejectReason ?? '(không có)'}`,
    },
  }

  const { title: notifTitle, body } = messages[event]
  const message = body(proposal)

  // Xác định người nhận in-app
  const recipients = await resolveRecipients(event, piId, proposal.unitId ?? null)

  // Ghi in-app notifications vào notification_history (sử dụng raw query vì WorkflowNotification yêu cầu workflowInstanceId)
  if (recipients.length > 0) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO notification_history (id, type, recipient, subject, message, status, metadata, sent_at)
       SELECT gen_random_uuid()::text, 'in_app', r.id, $1, $2, 'SENT', '{"proposalId":"' || $3 || '","event":"' || $4 || '"}', NOW()
       FROM unnest($5::text[]) AS r(id)`,
      notifTitle,
      message,
      id,
      event,
      recipients
    ).catch((err) => console.error('[PROPOSAL_NOTIFY_INAPP_ERROR]', err))
  }

  // Email/Telegram cho các sự kiện quan trọng (PI)
  const emailEvents: ProposalEvent[] = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED']
  if (emailEvents.includes(event)) {
    const severity = event === 'REJECTED' ? 'WARNING' : 'INFO'
    dispatcher
      .sendAlert({
        severity,
        title: notifTitle,
        message,
        details: { proposalId: id, event },
        channels: ['email'],
      })
      .catch((err) => console.error('[PROPOSAL_NOTIFY_EMAIL_ERROR]', err))
  }
}

async function resolveRecipients(
  event: ProposalEvent,
  piId: string,
  unitId: string | null
): Promise<string[]> {
  // PI nhận thông báo khi sự kiện liên quan đến mình
  const piEvents: ProposalEvent[] = ['REVISION_REQUESTED', 'UNIT_APPROVED', 'DEPT_APPROVED', 'APPROVED', 'REJECTED']
  if (piEvents.includes(event)) return [piId]

  // SUBMITTED: tìm user có APPROVE_RESEARCH_DEPT trong cùng unit
  if (event === 'SUBMITTED' && unitId) {
    const approvers = await prisma.user.findMany({
      where: {
        unitId,
        userFunctions: {
          some: { functionCode: 'APPROVE_RESEARCH_DEPT', isActive: true },
        },
      },
      select: { id: true },
    })
    return approvers.map((u) => u.id)
  }

  return []
}
