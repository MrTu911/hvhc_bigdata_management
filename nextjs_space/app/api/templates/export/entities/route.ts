/**
 * M18 Template API – GET danh sách đối tượng để preview/export
 *
 * GET /api/templates/export/entities?entityType=personnel&q=nguyen&limit=10
 *
 * Phục vụ combobox chọn đối tượng (cán bộ/học viên/đảng viên) trong dialog
 * Preview & Export. Gate bằng TEMPLATES.VIEW (preview chỉ cần VIEW; export user
 * cũng xem được thư viện template).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { searchExportEntities } from '@/lib/services/template/entity-search.service';
import { EntityType } from '@/lib/services/data-resolver-service';

const SUPPORTED: EntityType[] = ['personnel', 'student', 'faculty', 'party_member'];

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as EntityType | null;
    const q = searchParams.get('q') ?? '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!entityType || !SUPPORTED.includes(entityType)) {
      return NextResponse.json(
        { success: false, data: null, error: 'entityType không hợp lệ' },
        { status: 400 },
      );
    }

    const data = await searchExportEntities(entityType, q, Number.isFinite(limit) ? limit : 10);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error('[GET /api/templates/export/entities]', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi tìm đối tượng' },
      { status: 500 },
    );
  }
}
