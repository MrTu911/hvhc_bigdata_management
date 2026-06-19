/**
 * POST /api/personnel/[id]/profile-document/export
 * Xuất "Phiếu cập nhật thông tin hồ sơ cán bộ điện tử" (mẫu 99 trường) cho 1 cán bộ.
 *
 * [id] = Personnel.id. Dữ liệu lấy từ User (account của Personnel) qua resolver
 * cadre-profile-export.service rồi render bằng template TPL_M02_HSCB_DIENTU (exportWithData).
 *
 * Bảo mật:
 *   - Gate TEMPLATES.EXPORT_DATA (rbacCode của template).
 *   - Enforce scope: chỉ xuất được cán bộ trong phạm vi đơn vị truy cập (hoặc chính mình ở SELF).
 *   - Mask trường nhạy cảm (CCCD, lương, giá trị/giấy tờ tài sản) khi thiếu PERSONNEL.VIEW_SENSITIVE.
 *
 * Body: { templateId: string, outputFormat?: 'PDF' | 'DOCX' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { PERSONNEL, TEMPLATES } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { exportWithData } from '@/lib/services/export-engine-service';
import { buildCadreProfileExportData } from '@/lib/services/personnel/cadre-profile-export.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

const HSCB_TEMPLATE_CODE = 'TPL_M02_HSCB_DIENTU';
const ALLOWED_FORMATS = new Set(['PDF', 'DOCX']);

/** Ẩn các trường nhạy cảm khi caller thiếu VIEW_SENSITIVE (CCCD, lương, tài sản). */
function maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data, soCCCD: '', heSoLuong: '', mucLuong: '', heSoPCCV: '' };
  if (Array.isArray(masked.asset_list)) {
    masked.asset_list = (masked.asset_list as Record<string, unknown>[]).map((a) => ({
      ...a,
      giaTri: '',
      giayTo: '',
    }));
  }
  return masked;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, scope, response } = await requireScopedFunction(request, TEMPLATES.EXPORT_DATA);
  if (!user) return response!;

  const authUser: AuthUser = {
    id: user.id,
    email: user.email!,
    role: user.role || '',
    unitId: user.unitId,
  };
  const effectiveScope: FunctionScope = scope || 'SELF';

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

  // Ghim đúng mẫu hồ sơ cán bộ điện tử — chống dùng route này render mẫu khác.
  const template = await prisma.reportTemplate.findUnique({
    where: { id: templateId },
    select: { code: true },
  });
  if (!template || template.code !== HSCB_TEMPLATE_CODE) {
    return NextResponse.json(
      { success: false, data: null, error: 'Mẫu văn bản không hợp lệ cho hồ sơ cán bộ điện tử' },
      { status: 400 },
    );
  }

  // [id] có thể là User.id (trang chi tiết cán bộ — User-centric) hoặc Personnel.id.
  // Dữ liệu hồ sơ lấy theo User nên ưu tiên resolve User trước.
  const resolved = await resolveAccount(params.id);
  if (!resolved) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy cán bộ' }, { status: 404 });
  }
  if (!resolved.accountUserId) {
    return NextResponse.json(
      { success: false, data: null, error: 'Cán bộ chưa có tài khoản liên kết để lấy dữ liệu hồ sơ' },
      { status: 404 },
    );
  }
  const accountUserId = resolved.accountUserId;

  const allowed = await canAccessPersonnel(authUser, effectiveScope, {
    unitId: resolved.unitId,
    accountUserId,
  });
  if (!allowed) {
    return NextResponse.json(
      { success: false, data: null, error: 'Không có quyền xuất hồ sơ cán bộ ngoài phạm vi đơn vị' },
      { status: 403 },
    );
  }

  try {
    const canSensitive = await authorize(authUser, PERSONNEL.VIEW_SENSITIVE, {});
    let resolvedData = await buildCadreProfileExportData(accountUserId);
    if (!canSensitive.allowed) resolvedData = maskSensitive(resolvedData);

    const result = await exportWithData({
      templateId,
      resolvedData,
      entityType: 'personnel',
      entityId: params.id,
      outputFormat: outputFormat as 'PDF' | 'DOCX',
      requestedBy: user.id,
      callerType: 'user',
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.EXPORT_DATA,
      action: 'EXPORT',
      resourceType: 'CADRE_PROFILE_DOC',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      endpoint: `/api/personnel/${params.id}/profile-document/export`,
      httpMethod: 'POST',
    });

    return NextResponse.json({
      success: true,
      data: { jobId: result.jobId, downloadUrl: result.downloadUrl, expiresIn: result.expiresIn },
      error: null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personnel/[id]/profile-document/export]', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi xuất văn bản: ' + msg }, { status: 500 });
  }
}

/**
 * Resolve account user + unit từ [id] (User.id ưu tiên, fallback Personnel.id).
 * Trả null nếu không tìm thấy bản ghi nào.
 */
async function resolveAccount(
  id: string,
): Promise<{ accountUserId: string | null; unitId: string | null } | null> {
  const account = await prisma.user.findUnique({ where: { id }, select: { id: true, unitId: true } });
  if (account) return { accountUserId: account.id, unitId: account.unitId };

  const personnel = await prisma.personnel.findUnique({
    where: { id },
    select: { unitId: true, account: { select: { id: true } } },
  });
  if (!personnel) return null;
  return { accountUserId: personnel.account?.id ?? null, unitId: personnel.unitId };
}

/** Kiểm tra caller có được truy cập cán bộ này theo scope không. */
async function canAccessPersonnel(
  user: AuthUser,
  scope: FunctionScope,
  target: { unitId: string | null; accountUserId: string },
): Promise<boolean> {
  if (scope === 'ACADEMY') return true;
  if (scope === 'SELF') return target.accountUserId === user.id;
  const unitIds = await getAccessibleUnitIds(user, scope);
  return target.unitId != null && unitIds.includes(target.unitId);
}
