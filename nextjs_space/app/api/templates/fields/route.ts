/**
 * M18 – Field Catalog API
 * GET /api/templates/fields?entityType=personnel
 *
 * Trả về danh sách field khả dụng theo entity type.
 * Catalog được quản lý tập trung tại lib/services/template/field-catalog.registry.ts
 * — thêm entity type mới ở đó, không sửa file này.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { FIELD_CATALOG } from '@/lib/services/template/field-catalog.registry';

export type { FieldEntry, FieldCatalog } from '@/lib/services/template/field-catalog.registry';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const data =
      entityType && FIELD_CATALOG[entityType]
        ? { [entityType]: FIELD_CATALOG[entityType] }
        : FIELD_CATALOG;

    return NextResponse.json({ success: true, data, error: null });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi tải field catalog' },
      { status: 500 },
    );
  }
}
