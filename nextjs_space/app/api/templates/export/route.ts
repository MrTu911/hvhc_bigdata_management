/**
 * M18 Template API – C1: POST export single entity
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { exportSingle } from '@/lib/services/export-engine-service';
import { EntityType } from '@/lib/services/data-resolver-service';

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.EXPORT_DATA);
    if (!user) return response!;

    const body = await request.json();
    const { templateId, entityId, outputFormat = 'PDF', entityType = 'personnel', options } = body;

    if (!templateId || !entityId) {
      return NextResponse.json({ success: false, data: null, error: 'templateId và entityId là bắt buộc' }, { status: 400 });
    }

    const result = await exportSingle({
      templateId,
      entityId,
      entityType: entityType as EntityType,
      outputFormat,
      requestedBy: user.id,
      callerType: 'user',
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.EXPORT_DATA,
      action: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: result.jobId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        downloadUrl: result.downloadUrl,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi xuất file';
    console.error('[POST /api/templates/export]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
