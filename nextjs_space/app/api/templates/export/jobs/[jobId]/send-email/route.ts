/**
 * POST /api/templates/export/jobs/[jobId]/send-email
 * Gửi kết quả export qua email cho recipient.
 * ExportJob phải có status COMPLETED và signedUrl.
 * Requires: TEMPLATES.VIEW_JOBS
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { sendExportResultEmail } from '@/lib/services/template/template-email.service';

export const dynamic = 'force-dynamic';

interface RouteParams { params: Promise<{ jobId: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFunction(req, TEMPLATES.VIEW_JOBS);
    if (!auth.allowed) return auth.response!;

    const { jobId } = await params;
    const body = await req.json().catch(() => ({}));
    const { recipientEmail } = body as { recipientEmail?: string };

    if (!recipientEmail?.trim() || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, data: null, error: 'recipientEmail hợp lệ là bắt buộc' },
        { status: 400 }
      );
    }

    const result = await sendExportResultEmail({ jobId, recipientEmail });

    if (!result.sent) {
      return NextResponse.json(
        { success: false, data: null, error: result.reason ?? 'Không thể gửi email' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: { sent: true, recipientEmail }, error: null });
  } catch (error: any) {
    console.error('POST send-email error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Internal error' }, { status: 500 });
  }
}
