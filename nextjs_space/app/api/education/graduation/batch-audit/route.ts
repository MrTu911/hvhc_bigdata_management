/**
 * POST /api/education/graduation/batch-audit
 * Chạy graduation engine cho nhiều học viên theo cohort filter.
 * Requires: EDUCATION.RUN_GRADUATION function code
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { batchRunGraduation } from '@/lib/services/education/graduation-batch.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.RUN_GRADUATION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json().catch(() => ({}));
    const { cohortFilter } = body as {
      cohortFilter?: { khoaHoc?: string; unitId?: string; limit?: number };
    };

    const result = await batchRunGraduation(cohortFilter ?? {});

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.RUN_GRADUATION,
      action: 'CREATE',
      resourceType: 'GRADUATION_AUDIT_BATCH',
      resourceId: `batch-${Date.now()}`,
      newValue: { cohortFilter, summary: result },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: result, error: null }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/education/graduation/batch-audit error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Batch audit failed' }, { status: 500 });
  }
}
