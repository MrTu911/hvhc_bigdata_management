/**
 * Next.js Instrumentation – Server initialization hook
 * Chạy một lần khi server khởi động (Node.js runtime only).
 *
 * Dùng để khởi động M19 ScheduleCron (node-cron) để tự động
 * thực thi các lịch xuất định kỳ (TemplateSchedule).
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Chỉ chạy trong Node.js runtime (không phải Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initScheduleCron } = await import('@/lib/services/schedule-executor');
    initScheduleCron();

    // Warm M19 MDM cache khi server khởi động
    const { warmMasterDataCache } = await import('@/lib/master-data-cache');
    warmMasterDataCache().catch(err =>
      console.warn('[MDM] warmMasterDataCache failed at startup:', err)
    );

    // Khởi động M18 export worker (BullMQ)
    // Worker lắng nghe queue m18:export-batch và xử lý batch export jobs.
    // Graceful shutdown được handle bởi BullMQ khi process nhận SIGTERM.
    const { initExportWorker } = await import('@/lib/workers/export-worker');
    initExportWorker();
  }
}
