/**
 * POST /api/exports/aggregate
 * Xuất BẢNG DANH SÁCH tổng hợp (1 file Excel/PDF) theo CSDL, lọc theo phạm vi quyền.
 *
 * Body: { entityType: 'personnel'|'student'|'party_member'|'scientist_profile',
 *         format?: 'XLSX'|'PDF', keyword?: string }
 *
 * RBAC: EXPORT_BATCH (scope-aware). Scope quyết định đơn vị được xuất:
 *   ACADEMY → toàn bộ; DEPARTMENT → đơn vị + cấp dưới; UNIT → đơn vị; SELF → rỗng.
 * Học viên (HocVien) không gắn đơn vị → yêu cầu scope ≥ DEPARTMENT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  exportAggregate,
  type AggregateEntityType,
  type AggregateFormat,
} from '@/lib/services/aggregate-export-service';

const ENTITY_TYPES: AggregateEntityType[] = ['personnel', 'student', 'party_member', 'scientist_profile'];
const FORMATS: AggregateFormat[] = ['XLSX', 'PDF'];

export async function POST(request: NextRequest) {
  try {
    const { user, response, scope } = await requireScopedFunction(request, TEMPLATES.EXPORT_BATCH);
    if (!user) return response!;

    const body = await request.json().catch(() => ({}));
    const entityType = body.entityType as AggregateEntityType;
    const format = (body.format as AggregateFormat) ?? 'XLSX';
    const keyword = typeof body.keyword === 'string' ? body.keyword : undefined;

    if (!ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ success: false, data: null, error: 'entityType không hợp lệ' }, { status: 400 });
    }
    if (!FORMATS.includes(format)) {
      return NextResponse.json({ success: false, data: null, error: 'format không hợp lệ' }, { status: 400 });
    }

    const effectiveScope = scope ?? 'SELF';

    // Học viên không gắn đơn vị → chỉ cho phép phạm vi rộng để tránh lộ dữ liệu.
    if (entityType === 'student' && effectiveScope !== 'ACADEMY' && effectiveScope !== 'DEPARTMENT') {
      return NextResponse.json(
        { success: false, data: null, error: 'Phạm vi quyền không đủ để xuất danh sách học viên (cần cấp Phòng/Ban trở lên)' },
        { status: 403 },
      );
    }

    const accessibleUnitIds = await getAccessibleUnitIds(user, effectiveScope);

    const result = await exportAggregate({
      entityType,
      format,
      keyword,
      requestedBy: user.id,
      scopeCtx: { scope: effectiveScope, accessibleUnitIds },
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.EXPORT_BATCH,
      action: 'AGGREGATE_EXPORT',
      resourceType: 'AGGREGATE_LIST',
      resourceId: entityType,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      metadata: { entityType, format, scope: effectiveScope, count: result.count },
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi xuất danh sách tổng hợp';
    console.error('[POST /api/exports/aggregate]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
