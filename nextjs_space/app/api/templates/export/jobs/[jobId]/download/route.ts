/**
 * M18 Template API – C5: GET /api/templates/export/jobs/[jobId]/download
 *
 * Renew signed URL nếu cần rồi redirect hoặc trả URL.
 * Scope: user chỉ download job của chính mình (SELF) trừ khi có scope rộng hơn.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { getPresignedDownloadUrl } from '@/lib/services/infrastructure/storage.service';
import prisma from '@/lib/db';

const URL_TTL = 3600; // 1 giờ cho download link

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { user, scopedOptions, response } = await requireScopedFunction(
      request,
      TEMPLATES.VIEW_JOBS,
    );
    if (!user) return response!;

    const scope = scopedOptions?.scope ?? 'SELF';

    const job = await prisma.exportJob.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        requestedBy: true,
        status: true,
        outputKey: true,
        signedUrl: true,
        urlExpiresAt: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, data: null, error: 'Export job không tồn tại' },
        { status: 404 },
      );
    }

    // Scope SELF chỉ được download job của mình
    if (scope === 'SELF' && job.requestedBy !== user.id) {
      return NextResponse.json(
        { success: false, data: null, error: 'Không có quyền truy cập job này' },
        { status: 403 },
      );
    }

    if (job.status !== 'COMPLETED' || !job.outputKey) {
      return NextResponse.json(
        { success: false, data: null, error: 'File chưa sẵn sàng hoặc job chưa hoàn thành' },
        { status: 400 },
      );
    }

    // Renew URL nếu hết hạn hoặc sắp hết hạn (< 5 phút)
    const now = Date.now();
    const expiresAt = job.urlExpiresAt?.getTime() ?? 0;
    const needRenew = !job.signedUrl || expiresAt - now < 5 * 60 * 1000;

    let downloadUrl = job.signedUrl;

    if (needRenew) {
      downloadUrl = await getPresignedDownloadUrl('M18_EXPORT', job.outputKey, {
        expirySeconds: URL_TTL,
      });
      await prisma.exportJob.update({
        where: { id: job.id },
        data: {
          signedUrl: downloadUrl,
          urlExpiresAt: new Date(now + URL_TTL * 1000),
        },
      });
    }

    // Redirect trực tiếp → browser download ngay
    return NextResponse.redirect(downloadUrl!);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tải file';
    console.error('[GET /api/templates/export/jobs/[jobId]/download]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
