/**
 * POST /api/profile/cadre-import/confirm — nhập HSCB từ Excel (ghi trực tiếp).
 *
 * Chỉ cho nhập TRỰC TIẾP khi cán bộ còn ở giai đoạn khai báo lần đầu
 * (User.profileDeclaredAt = null). Sau khi đã chốt khai báo → 409, phải gửi đề nghị
 * 2 cấp (POST /api/profile/change-requests).
 *
 * File được PARSE LẠI ở server (không tin payload đã phân tích từ client) để giữ
 * nguyên validate/coerce. Trường do chỉ huy/M02 quản lý bị loại trước khi ghi.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  parseImportWorkbook,
  applyCadreImport,
  type CadreImportMode,
} from '@/lib/services/personnel/cadre-import.service';
import { assertDeclaring, DeclarationError } from '@/lib/services/personnel/profile-declaration.service';
import { DECLARATION_LOCKED_EXTENDED_FIELDS } from '@/lib/constants/profile-declaration';
import type { AuthUser } from '@/lib/rbac/types';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const XLSX_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền nhập hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  try {
    await assertDeclaring(user.id);
  } catch (error) {
    if (error instanceof DeclarationError) {
      return NextResponse.json(
        { success: false, code: error.status === 409 ? 'REQUIRES_APPROVAL' : undefined, error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }

  let file: File | null = null;
  let mode: CadreImportMode = 'append';
  try {
    const formData = await request.formData();
    file = formData.get('file') as File | null;
    if (formData.get('mode') === 'replace') mode = 'replace';
  } catch {
    return NextResponse.json({ success: false, error: 'Dữ liệu tải lên không hợp lệ' }, { status: 400 });
  }

  if (!file) return NextResponse.json({ success: false, error: 'Chưa chọn file' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.xlsx') && !XLSX_MIME.has(file.type)) {
    return NextResponse.json({ success: false, error: 'Chỉ hỗ trợ file Excel (.xlsx)' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 5MB' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await parseImportWorkbook(buffer, true);

    // Loại trường do chỉ huy/M02 quản lý trước khi ghi.
    for (const field of DECLARATION_LOCKED_EXTENDED_FIELDS) {
      if (field in analysis.extended) delete analysis.extended[field];
    }

    const authUser = toAuthUser(user);
    const result = await applyCadreImport(
      authUser,
      'SELF',
      user.id,
      { extended: analysis.extended, sections: analysis.sections },
      true,
      mode,
    );

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.MANAGE_PROFILE,
      action: 'DECLARE_IMPORT',
      resourceType: 'CADRE_IMPORT',
      resourceId: user.id,
      newValue: JSON.stringify({ mode, sections: result.sections.map((s) => ({ slug: s.slug, created: s.created })) }),
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: { ...result, warnings: analysis.warnings } });
  } catch (error) {
    console.error('[POST /api/profile/cadre-import/confirm]', error);
    return NextResponse.json({ success: false, error: 'Lỗi xử lý file nhập' }, { status: 500 });
  }
}
