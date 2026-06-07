/**
 * POST /api/personal/my-career/export
 * Xuất "Bản quá trình công tác" của CHÍNH người dùng (SELF scope) qua M18.
 *
 * Luôn dùng dữ liệu của phiên đăng nhập — KHÔNG nhận entityId từ client, nên không
 * thể dùng để xuất hồ sơ người khác. Gate: VIEW_MY_CAREER_HISTORY + EXPORT_DATA.
 *
 * Body: { templateId: string, outputFormat?: 'PDF' | 'DOCX' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL, TEMPLATES } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { exportWithData } from '@/lib/services/export-engine-service';
import { buildCareerExportData } from '@/lib/services/personal/career-export.service';

// Mẫu hợp lệ cho route này (chống lạm dụng render mẫu khác với dữ liệu cá nhân).
const CAREER_TEMPLATE_CODE = 'TPL_M02_QTCT_CANHAN';
const ALLOWED_FORMATS = new Set(['PDF', 'DOCX']);

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  // Xuất quá trình công tác = xem được + có quyền xuất dữ liệu (M18).
  const canView = await authorize(user, PERSONAL.VIEW_CAREER_HISTORY, {});
  if (!canView.allowed) {
    return NextResponse.json(
      { success: false, data: null, error: canView.deniedReason ?? 'Không có quyền xem quá trình công tác' },
      { status: 403 },
    );
  }
  const canExport = await authorize(user, TEMPLATES.EXPORT_DATA, {});
  if (!canExport.allowed) {
    return NextResponse.json(
      { success: false, data: null, error: canExport.deniedReason ?? 'Không có quyền xuất văn bản' },
      { status: 403 },
    );
  }

  let body: { templateId?: string; outputFormat?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, data: null, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { templateId } = body;
  const outputFormat = (body.outputFormat ?? 'PDF').toUpperCase();

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json({ success: false, data: null, error: 'Thiếu templateId' }, { status: 400 });
  }
  if (!ALLOWED_FORMATS.has(outputFormat)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Định dạng không hỗ trợ (chỉ PDF hoặc DOCX)' },
      { status: 400 },
    );
  }

  // Chỉ cho phép mẫu quá trình công tác — tránh dùng route SELF để render mẫu khác.
  const template = await prisma.reportTemplate.findUnique({
    where: { id: templateId },
    select: { code: true },
  });
  if (!template || template.code !== CAREER_TEMPLATE_CODE) {
    return NextResponse.json(
      { success: false, data: null, error: 'Mẫu văn bản không hợp lệ cho quá trình công tác' },
      { status: 400 },
    );
  }

  try {
    const resolvedData = await buildCareerExportData(user.id);

    const result = await exportWithData({
      templateId,
      resolvedData,
      entityType: 'personnel',
      entityId: user.id,
      outputFormat: outputFormat as 'PDF' | 'DOCX',
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
      endpoint: '/api/personal/my-career/export',
      httpMethod: 'POST',
    });

    return NextResponse.json({
      success: true,
      data: { jobId: result.jobId, downloadUrl: result.downloadUrl, expiresIn: result.expiresIn },
      error: null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-career/export]', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi xuất văn bản: ' + msg }, { status: 500 });
  }
}
