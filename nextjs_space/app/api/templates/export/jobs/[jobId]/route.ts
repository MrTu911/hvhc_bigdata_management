/**
 * M18 Template API – C4: GET job status/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { getJobStatus } from '@/lib/services/export-engine-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW_JOBS);
    if (!user) return response!;

    const job = await getJobStatus(params.jobId, user.id);

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        successCount: job.successCount,
        failCount: job.failCount,
        errors: job.errors,
        downloadUrl: job.signedUrl,
        urlExpiresAt: job.urlExpiresAt,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy job status';
    if (msg.includes('không tồn tại') || msg.includes('không có quyền')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
