/**
 * Schedule Executor Service – M19
 * Thực thi các lịch xuất định kỳ (TemplateSchedule) theo cron expression.
 *
 * - Khởi động qua instrumentation.ts khi server start
 * - Cũng có thể trigger thủ công qua POST /api/templates/schedules/run
 */

import cron from 'node-cron';
import nodemailer from 'nodemailer';
import prisma from '@/lib/db';
import { startBatchExport } from './export-engine-service';
import { EntityType } from './data-resolver-service';

// ─── Email Transport ──────────────────────────────────────────────────────────

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'noreply@hvhc.edu.vn';
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) return null;

  return { transport: nodemailer.createTransport({ host, port, secure, auth: { user, pass } }), from };
}

async function sendEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  if (!recipients.length) return;
  const config = createTransport();
  if (!config) {
    console.warn('[ScheduleExecutor] SMTP not configured – email not sent.');
    return;
  }
  await config.transport.sendMail({
    from: config.from,
    to: recipients.join(', '),
    subject,
    html,
  });
}

// ─── Entity Resolution ────────────────────────────────────────────────────────

/**
 * Resolve entity IDs từ filterJson.
 * filterJson có thể chứa:
 *   { entityIds: string[] }            – danh sách ID cố định
 *   { entityType: string, unitId: string }  – lọc theo đơn vị
 *   { entityType: string, all: true }  – tất cả entity của loại đó
 */
async function resolveEntityIds(
  filterJson: Record<string, unknown>,
  entityType: string
): Promise<string[]> {
  // Direct list
  if (Array.isArray(filterJson.entityIds) && filterJson.entityIds.length > 0) {
    return filterJson.entityIds as string[];
  }

  const type = (filterJson.entityType as string) || entityType;
  const unitId = filterJson.unitId as string | undefined;
  const limit = Math.min(Number(filterJson.limit) || 100, 500);

  try {
    switch (type) {
      case 'personnel': {
        const where = unitId ? { unitId } : {};
        const rows = await prisma.personnel.findMany({ where, select: { id: true }, take: limit });
        return rows.map((r) => r.id);
      }
      case 'student': {
        const rows = await prisma.hocVien.findMany({ select: { id: true }, take: limit });
        return rows.map((r) => r.id);
      }
      case 'faculty': {
        const where = unitId ? { unitId } : {};
        const rows = await prisma.facultyProfile.findMany({ where, select: { id: true }, take: limit });
        return rows.map((r) => r.id);
      }
      case 'party_member': {
        const rows = await prisma.partyMember.findMany({ select: { id: true }, take: limit });
        return rows.map((r) => r.id);
      }
      default:
        return [];
    }
  } catch (err) {
    console.error('[ScheduleExecutor] resolveEntityIds error:', err);
    return [];
  }
}

// ─── Compute next run time ────────────────────────────────────────────────────

/**
 * Sử dụng node-cron's ScheduledTask.getNextRun() để tính thời gian chạy tiếp theo.
 */
function computeNextRun(cronExpression: string): Date | null {
  try {
    if (!cron.validate(cronExpression)) return null;
    const task = cron.schedule(cronExpression, () => {});
    const next = task.getNextRun();
    task.stop();
    task.destroy();
    return next;
  } catch {
    return null;
  }
}

// ─── Execute a single schedule ────────────────────────────────────────────────

export async function executeSchedule(scheduleId: string): Promise<{
  success: boolean;
  jobId?: string;
  entityCount: number;
  error?: string;
}> {
  const schedule = await prisma.templateSchedule.findUnique({
    where: { id: scheduleId },
    include: { template: { select: { id: true, name: true, isActive: true } } },
  });

  if (!schedule || !schedule.isActive) {
    return { success: false, entityCount: 0, error: 'Lịch xuất không tồn tại hoặc đã tắt' };
  }
  if (!schedule.template.isActive) {
    return { success: false, entityCount: 0, error: 'Template đã bị vô hiệu hóa' };
  }

  const filterJson = (schedule.filterJson as Record<string, unknown>) || {};
  const entityType = (filterJson.entityType as string) || 'personnel';
  const entityIds = await resolveEntityIds(filterJson, entityType);

  if (entityIds.length === 0) {
    await prisma.templateSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'NO_ENTITIES',
        nextRunAt: computeNextRun(schedule.cronExpression),
      },
    });
    return { success: true, entityCount: 0 };
  }

  try {
    const result = await startBatchExport({
      templateId: schedule.templateId,
      entityIds,
      entityType: entityType as EntityType,
      outputFormat: schedule.outputFormat as 'PDF' | 'DOCX' | 'XLSX',
      requestedBy: schedule.createdBy,
      callerType: 'schedule',
      zipName: schedule.zipName || `scheduled_${scheduleId}`,
    });

    // Update schedule status
    const nextRun = computeNextRun(schedule.cronExpression);
    await prisma.templateSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'OK',
        nextRunAt: nextRun,
      },
    });

    // Send email notification (non-blocking)
    if (schedule.recipientEmails.length > 0) {
      const subject = `[HVHC] Xuất định kỳ hoàn tất – ${schedule.template.name}`;
      const html = buildEmailHtml(schedule.template.name, entityIds.length, result.jobId);
      sendEmail(schedule.recipientEmails, subject, html).catch((err) =>
        console.error('[ScheduleExecutor] sendEmail error:', err)
      );
    }

    return { success: true, jobId: result.jobId, entityCount: entityIds.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.templateSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: `ERROR: ${msg.slice(0, 200)}`,
        nextRunAt: computeNextRun(schedule.cronExpression),
      },
    });
    return { success: false, entityCount: entityIds.length, error: msg };
  }
}

// ─── Check & run due schedules ────────────────────────────────────────────────

export async function runDueSchedules(): Promise<{
  ran: number;
  errors: number;
  details: Array<{ id: string; success: boolean; error?: string }>;
}> {
  const now = new Date();

  // Find active schedules that are due
  const dueSchedules = await prisma.templateSchedule.findMany({
    where: {
      isActive: true,
      OR: [
        { nextRunAt: null },
        { nextRunAt: { lte: now } },
      ],
    },
    select: { id: true, cronExpression: true, lastRunAt: true },
  });

  let ran = 0;
  let errors = 0;
  const details: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const schedule of dueSchedules) {
    // Double-check cron matches now (to avoid re-running within same minute)
    const lastRun = schedule.lastRunAt;
    if (lastRun && now.getTime() - lastRun.getTime() < 55000) {
      // Already ran within 55 seconds – skip
      continue;
    }

    const result = await executeSchedule(schedule.id);
    details.push({ id: schedule.id, success: result.success, error: result.error });
    if (result.success) ran++;
    else errors++;
  }

  return { ran, errors, details };
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(templateName: string, entityCount: number, jobId: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Xuất định kỳ hoàn tất</title></head>
<body style="font-family:Arial,sans-serif;color:#333;padding:24px">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <div style="background:#1e4d8c;color:#fff;padding:20px">
      <h2 style="margin:0;font-size:18px">HVHC BigData – Xuất định kỳ hoàn tất</h2>
    </div>
    <div style="padding:24px">
      <p>Lịch xuất định kỳ đã chạy thành công:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;background:#f8fafc;width:40%">Template</td>
          <td style="padding:8px;border:1px solid #e2e8f0">${templateName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;background:#f8fafc">Số lượng bản ghi</td>
          <td style="padding:8px;border:1px solid #e2e8f0">${entityCount}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;background:#f8fafc">Job ID</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px">${jobId}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;background:#f8fafc">Thời gian</td>
          <td style="padding:8px;border:1px solid #e2e8f0">${new Date().toLocaleString('vi-VN')}</td>
        </tr>
      </table>
      <p style="color:#64748b;font-size:13px">
        Truy cập hệ thống HVHC BigData để tải file xuất tại mục <strong>Lịch sử xuất file</strong>.
        Link download có hiệu lực trong 24 giờ.
      </p>
    </div>
    <div style="background:#f8fafc;padding:12px 24px;font-size:12px;color:#94a3b8">
      Email tự động từ HVHC BigData M19 – Xuất định kỳ. Không trả lời email này.
    </div>
  </div>
</body>
</html>`;
}

// ─── Cron initialization ──────────────────────────────────────────────────────

let cronInitialized = false;

/**
 * Khởi động cron job chạy mỗi phút để kiểm tra & thực thi lịch xuất định kỳ.
 * Chỉ gọi một lần từ instrumentation.ts trên server.
 */
export function initScheduleCron(): void {
  if (cronInitialized) return;
  cronInitialized = true;

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await runDueSchedules();
      if (result.ran > 0 || result.errors > 0) {
        console.log(`[M19 ScheduleCron] Ran: ${result.ran}, Errors: ${result.errors}`);
      }
    } catch (err) {
      console.error('[M19 ScheduleCron] Uncaught error:', err);
    }
  });

  console.log('[M19 ScheduleCron] Initialized – checking schedules every minute.');
}
