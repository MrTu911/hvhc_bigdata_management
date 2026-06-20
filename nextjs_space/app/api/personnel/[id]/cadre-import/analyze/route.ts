/**
 * POST /api/personnel/[id]/cadre-import/analyze — phân tích file Excel mẫu cho 1 cán bộ (không ghi).
 *
 * [id] = User.id hoặc Personnel.id. Gate: PERSONNEL.UPDATE (scope enforced khi confirm).
 * Trường nhạy cảm chỉ được trích khi có VIEW_SENSITIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { parseImportWorkbook } from '@/lib/services/personnel/cadre-import.service';
import type { AuthUser } from '@/lib/rbac/types';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const XLSX_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

function toAuthUser(user: { id: string; email?: string | null; role?: string | null; unitId?: string | null }): AuthUser {
  return { id: user.id, email: user.email || '', role: user.role || '', unitId: user.unitId ?? null };
}

export async function POST(request: NextRequest, { params: _params }: { params: { id: string } }) {
  const { user, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
  if (!user) return response!;
  const canSensitive = (await authorize(toAuthUser(user), PERSONNEL.VIEW_SENSITIVE, {})).allowed;

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get('file') as File | null;
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
    const analysis = await parseImportWorkbook(buffer, canSensitive);
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
    console.error('[POST /api/personnel/[id]/cadre-import/analyze]', error);
    return NextResponse.json({ success: false, error: 'Không đọc được file Excel — kiểm tra lại đúng mẫu' }, { status: 400 });
  }
}
