/**
 * Template Email Service — M18
 *
 * Gửi kết quả export qua email sau khi ExportJob hoàn thành.
 * Tái sử dụng EmailNotifier từ lib/notifications/email.ts.
 * Không tạo email transport mới.
 */

import { prisma } from '@/lib/db';
import { emailNotifier } from '@/lib/notifications/email';
import { ExportJobStatus } from '@prisma/client';

export interface SendExportEmailInput {
  jobId: string;
  recipientEmail: string;
}

export interface SendExportEmailResult {
  sent: boolean;
  reason?: string;
}

/**
 * Gửi email kết quả export cho một ExportJob đã COMPLETED.
 * Trả về { sent: false, reason } nếu không thể gửi.
 */
export async function sendExportResultEmail(
  input: SendExportEmailInput
): Promise<SendExportEmailResult> {
  const { jobId, recipientEmail } = input;

  const job = await prisma.exportJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      signedUrl: true,
      urlExpiresAt: true,
      outputFormat: true,
      entityType: true,
      completedAt: true,
      template: { select: { name: true } },
    },
  });

  if (!job) {
    return { sent: false, reason: `ExportJob ${jobId} không tồn tại` };
  }
  if (job.status !== ExportJobStatus.COMPLETED) {
    return { sent: false, reason: `ExportJob chưa hoàn thành (status: ${job.status})` };
  }
  if (!job.signedUrl) {
    return { sent: false, reason: 'ExportJob chưa có download URL' };
  }

  const expiresText = job.urlExpiresAt
    ? `Link có hiệu lực đến: ${new Date(job.urlExpiresAt).toLocaleString('vi-VN')}`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Xuất dữ liệu hoàn thành</h2>
      <p>Yêu cầu xuất dữ liệu của bạn đã hoàn thành.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px; color: #666;">Template:</td><td style="padding: 6px;">${job.template?.name ?? '—'}</td></tr>
        <tr><td style="padding: 6px; color: #666;">Loại dữ liệu:</td><td style="padding: 6px;">${job.entityType}</td></tr>
        <tr><td style="padding: 6px; color: #666;">Định dạng:</td><td style="padding: 6px;">${job.outputFormat?.toUpperCase()}</td></tr>
        <tr><td style="padding: 6px; color: #666;">Hoàn thành lúc:</td><td style="padding: 6px;">${job.completedAt ? new Date(job.completedAt).toLocaleString('vi-VN') : '—'}</td></tr>
      </table>
      <a href="${job.signedUrl}"
         style="display: inline-block; padding: 12px 24px; background: #1a56db; color: white;
                text-decoration: none; border-radius: 6px; font-weight: bold;">
        Tải file xuống
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 16px;">${expiresText}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động từ hệ thống HVHC BigData.
        Vui lòng không reply.
      </p>
    </div>
  `;

  const sent = await emailNotifier.sendEmail({
    to: recipientEmail,
    subject: `[HVHC] Xuất dữ liệu hoàn thành — ${job.template?.name ?? job.entityType}`,
    html,
  });

  return sent
    ? { sent: true }
    : { sent: false, reason: 'Email transport lỗi — kiểm tra cấu hình SMTP' };
}
