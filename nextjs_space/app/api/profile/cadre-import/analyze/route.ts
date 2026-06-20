/**
 * POST /api/profile/cadre-import/analyze — phân tích file Excel mẫu, trả XEM TRƯỚC (không ghi).
 *
 * multipart/form-data: file=<.xlsx>. Gate: MANAGE_MY_PROFILE. SELF scope.
 * Trả về payload sẵn sàng ghi + preview để cán bộ review trước khi xác nhận.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { parseImportWorkbook } from '@/lib/services/personnel/cadre-import.service';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const XLSX_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
  if (!perm.allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền nhập hồ sơ cán bộ điện tử' }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get('file') as File | null;
  } catch {
    return NextResponse.json({ success: false, error: 'Dữ liệu tải lên không hợp lệ' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ success: false, error: 'Chưa chọn file' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.xlsx') && !XLSX_MIME.has(file.type)) {
    return NextResponse.json({ success: false, error: 'Chỉ hỗ trợ file Excel (.xlsx)' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 5MB' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await parseImportWorkbook(buffer);
    return NextResponse.json({
      success: true,
      data: {
        extended: analysis.extended,
        sections: analysis.sections,
        extendedPreview: analysis.extendedPreview,
        sectionsPreview: analysis.sectionsPreview,
        warnings: analysis.warnings,
      },
    });
  } catch (error) {
    console.error('[POST /api/profile/cadre-import/analyze]', error);
    return NextResponse.json({ success: false, error: 'Không đọc được file Excel — kiểm tra lại đúng mẫu' }, { status: 400 });
  }
}
