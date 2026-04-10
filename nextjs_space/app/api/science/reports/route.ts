/**
 * GET /api/science/reports
 *
 * Tạo báo cáo BQP khoa học theo mẫu. Job được xử lý bất đồng bộ qua BullMQ (M18).
 *
 * Query params:
 *   type   — loại báo cáo: MONTHLY | QUARTERLY | ANNUAL | BUDGET | SCIENTIST
 *   unit   — unitId (optional, bỏ qua = academy-wide)
 *   year   — năm báo cáo (required)
 *   format — DOCX | XLSX (default: DOCX)
 *
 * BQP Template codes:
 *   MONTHLY    → BQP-NCKH-MONTHLY         Báo cáo tháng NCKH đơn vị
 *   QUARTERLY  → BQP-NCKH-PROJECT-LEVEL   Báo cáo đề tài theo cấp
 *   ANNUAL     → BQP-NCKH-WORKS-ANNUAL    Danh sách công trình KH năm
 *   BUDGET     → BQP-NCKH-BUDGET-SUMMARY  Tổng hợp kinh phí NCKH
 *   SCIENTIST  → BQP-NCKH-SCIENTIST       Hồ sơ nhà khoa học (BQP format)
 *
 * RBAC: SCIENCE.REPORT_EXPORT ('EXPORT_SCIENCE_REPORT')
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SCIENCE } from '@/lib/rbac/function-codes';
import { enqueueBatchExport } from '@/lib/queue/export-queue';
import { logAudit } from '@/lib/audit';

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPE_TO_TEMPLATE_CODE: Record<string, string> = {
  MONTHLY:   'BQP-NCKH-MONTHLY',
  QUARTERLY: 'BQP-NCKH-PROJECT-LEVEL',
  ANNUAL:    'BQP-NCKH-WORKS-ANNUAL',
  BUDGET:    'BQP-NCKH-BUDGET-SUMMARY',
  SCIENTIST: 'BQP-NCKH-SCIENTIST',
};

const ACADEMY_SCOPE_ENTITY = '__ACADEMY__';

// ─── Validation ───────────────────────────────────────────────────────────────

const reportQuerySchema = z.object({
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'BUDGET', 'SCIENTIST']),
  unit: z.string().cuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  format: z.enum(['DOCX', 'XLSX']).default('DOCX'),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.REPORT_EXPORT);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const parsed = reportQuerySchema.safeParse({
    type:   searchParams.get('type'),
    unit:   searchParams.get('unit') ?? undefined,
    year:   searchParams.get('year'),
    format: searchParams.get('format') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { type, unit, year, format } = parsed.data;
  const templateCode = REPORT_TYPE_TO_TEMPLATE_CODE[type];

  // Resolve template by BQP code
  const template = await prisma.reportTemplate.findUnique({
    where: { code: templateCode },
    select: { id: true, isActive: true, version: true, name: true },
  });

  if (!template) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Mẫu báo cáo '${templateCode}' chưa được cấu hình trong hệ thống`,
      },
      { status: 404 },
    );
  }

  if (!template.isActive) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Mẫu báo cáo '${templateCode}' đã bị vô hiệu hóa`,
      },
      { status: 409 },
    );
  }

  // Use unitId as scope identifier; fall back to academy sentinel
  const scopeEntityId = unit ?? ACADEMY_SCOPE_ENTITY;

  // Create ExportJob record directly (entityType 'science_report' is not in M18 EntityType union,
  // but the DB column is a plain string — the worker resolves data via template.dataMap)
  const exportJob = await prisma.exportJob.create({
    data: {
      templateId:      template.id,
      templateVersion: template.version,
      requestedBy:     auth.user!.id,
      entityIds:       [scopeEntityId],
      entityType:      'science_report',
      outputFormat:    format,
      status:          'PENDING',
      progress:        0,
      callerType:      'user',
    },
  });

  // Enqueue to M18 BullMQ export queue
  await enqueueBatchExport({
    exportJobId: exportJob.id,
    request: {
      templateId:  template.id,
      entityIds:   [scopeEntityId],
      entityType:  'science_report' as never,   // M18 worker handles this type string
      outputFormat: format,
      requestedBy: auth.user!.id,
      callerType:  'user',
      zipName:     `bqp-${templateCode}-${year}${unit ? `-${unit}` : ''}.zip`,
    },
  });

  await logAudit({
    userId:       auth.user!.id,
    functionCode: SCIENCE.REPORT_EXPORT,
    action:       'CREATE',
    resourceType: 'SCIENCE_REPORT_JOB',
    resourceId:   exportJob.id,
    result:       'SUCCESS',
    metadata:     { type, unit: unit ?? 'academy', year, format, templateCode },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        jobId:        exportJob.id,
        templateCode,
        templateName: template.name,
        reportType:   type,
        year,
        unit:         unit ?? null,
        format,
        status:       'PENDING',
      },
      error: null,
    },
    { status: 202 },
  );
}
