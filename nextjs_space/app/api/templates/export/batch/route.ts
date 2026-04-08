/**
 * M18 Template API – C2: POST batch export
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { startBatchExport } from '@/lib/services/export-engine-service';
import { EntityType } from '@/lib/services/data-resolver-service';

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.EXPORT_BATCH);
    if (!user) return response!;

    const body = await request.json();
    const { templateId, entityIds, entityType = 'personnel', outputFormat = 'PDF', zipName } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId là bắt buộc' }, { status: 400 });
    }

    if (!Array.isArray(entityIds) || entityIds.length === 0) {
      return NextResponse.json({ error: 'entityIds phải là mảng không rỗng' }, { status: 400 });
    }

    if (entityIds.length > 500) {
      return NextResponse.json({ error: 'Số lượng entity không được vượt quá 500' }, { status: 400 });
    }

    const result = await startBatchExport({
      templateId,
      entityIds,
      entityType: entityType as EntityType,
      outputFormat,
      requestedBy: user.id,
      callerType: 'user',
      zipName,
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.EXPORT_BATCH,
      action: 'BATCH_EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: result.jobId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        queuePosition: result.queuePosition,
        estimatedTime: result.estimatedTime,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi khởi động batch export';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
