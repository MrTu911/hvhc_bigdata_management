/**
 * M18 Template API – C6: POST /api/templates/export/jobs/[jobId]/retry
 *
 * Tạo ExportJob mới sao chép từ job cũ (chỉ retry entity bị lỗi nếu job PARTIAL,
 * hoặc retry toàn bộ nếu job FAILED).
 * Gắn parentJobId để tracing retry chain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { enqueueBatchExport } from '@/lib/queue/export-queue';
import type { BatchExportRequest } from '@/lib/services/export-engine-service';
import type { EntityType } from '@/lib/services/data-resolver-service';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.RETRY_JOB);
    if (!user) return response!;

    const originalJob = await prisma.exportJob.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        requestedBy: true,
        templateId: true,
        templateVersion: true,
        entityIds: true,
        entityType: true,
        outputFormat: true,
        status: true,
        errors: true,
        callerType: true,
      },
    });

    if (!originalJob) {
      return NextResponse.json(
        { success: false, data: null, error: 'Export job không tồn tại' },
        { status: 404 },
      );
    }

    if (originalJob.requestedBy !== user.id) {
      return NextResponse.json(
        { success: false, data: null, error: 'Chỉ người tạo job mới được retry' },
        { status: 403 },
      );
    }

    if (originalJob.status !== 'FAILED' && originalJob.status !== 'PARTIAL') {
      return NextResponse.json(
        { success: false, data: null, error: 'Chỉ retry được job ở trạng thái FAILED hoặc PARTIAL' },
        { status: 400 },
      );
    }

    // Xác định entity cần retry: PARTIAL → chỉ entity lỗi; FAILED → toàn bộ
    let retryEntityIds: string[] = originalJob.entityIds as string[];

    if (originalJob.status === 'PARTIAL' && Array.isArray(originalJob.errors)) {
      const failedIds = (originalJob.errors as { entityId: string }[])
        .map((e) => e.entityId)
        .filter((id) => id && id !== 'batch');

      if (failedIds.length > 0) {
        retryEntityIds = failedIds;
      }
    }

    const template = await prisma.reportTemplate.findUnique({
      where: { id: originalJob.templateId },
      select: { id: true, version: true, isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, data: null, error: 'Template không còn tồn tại' },
        { status: 404 },
      );
    }
    if (!template.isActive) {
      return NextResponse.json(
        { success: false, data: null, error: 'Template đã bị vô hiệu hóa, không thể retry' },
        { status: 400 },
      );
    }

    // Tạo job retry mới, gắn parentJobId
    const retryJob = await prisma.exportJob.create({
      data: {
        templateId: originalJob.templateId,
        templateVersion: template.version,
        requestedBy: user.id,
        entityIds: retryEntityIds,
        entityType: originalJob.entityType,
        outputFormat: originalJob.outputFormat,
        status: 'PENDING',
        progress: 0,
        callerType: originalJob.callerType ?? 'user',
        parentJobId: originalJob.id,
        retryCount: 0,
      },
    });

    // Đẩy vào queue
    const batchReq: BatchExportRequest = {
      templateId: originalJob.templateId,
      entityIds: retryEntityIds,
      entityType: originalJob.entityType as EntityType,
      outputFormat: originalJob.outputFormat as 'PDF' | 'DOCX' | 'XLSX',
      requestedBy: user.id,
      callerType: 'user:retry',
    };

    await enqueueBatchExport({ exportJobId: retryJob.id, request: batchReq });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.RETRY_JOB,
      action: 'RETRY',
      resourceType: 'EXPORT_JOB',
      resourceId: retryJob.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    console.info(
      `[POST /api/templates/export/jobs/${params.jobId}/retry] retryJobId=${retryJob.id} entities=${retryEntityIds.length}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        retryJobId: retryJob.id,
        entityCount: retryEntityIds.length,
        parentJobId: originalJob.id,
      },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi retry job';
    console.error('[POST /api/templates/export/jobs/[jobId]/retry]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
