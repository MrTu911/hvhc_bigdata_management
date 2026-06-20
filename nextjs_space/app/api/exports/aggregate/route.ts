/**
 * POST /api/exports/aggregate
 * Xuất BẢNG DANH SÁCH tổng hợp (1 file Excel/PDF) theo CSDL, lọc theo phạm vi quyền
 * + bộ lọc nâng cao (đơn vị cụ thể, trạng thái, từ khóa).
 *
 * Body: { entityType, format?: 'XLSX'|'PDF', keyword?, status?, unitId? }
 *
 * RBAC: EXPORT_BATCH (scope-aware). Scope quyết định đơn vị được xuất:
 *   ACADEMY → toàn bộ; DEPARTMENT → đơn vị + cấp dưới; UNIT → đơn vị; SELF → rỗng.
 * unitId (nếu có) phải nằm trong phạm vi quyền. CSDL không gắn đơn vị (học viên,
 * hội đồng) yêu cầu scope ≥ DEPARTMENT.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FunctionScope } from '@prisma/client';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  exportAggregate,
  type AggregateEntityType,
  type AggregateFormat,
} from '@/lib/services/aggregate-export-service';

const ENTITY_TYPES: AggregateEntityType[] = [
  'personnel', 'officer', 'soldier', 'student', 'party_member', 'scientist_profile', 'scientific_council',
  'policy', 'award', 'research_project', 'publication', 'legacy_project',
  'insurance', 'faculty', 'party_org', 'subject',
];
const FORMATS: AggregateFormat[] = ['XLSX', 'PDF'];

// CSDL không gắn đơn vị → chỉ cho phép phạm vi rộng (≥ Phòng/Ban) để tránh lộ dữ liệu.
const ACADEMY_LEVEL_TYPES: AggregateEntityType[] = ['student', 'scientific_council'];

const SCOPE_LABELS: Record<FunctionScope, string> = {
  SELF: 'Cá nhân', UNIT: 'Đơn vị', DEPARTMENT: 'Phòng/Ban (gồm cấp dưới)', ACADEMY: 'Toàn Học viện',
};

export async function POST(request: NextRequest) {
  try {
    const { user, response, scope } = await requireScopedFunction(request, TEMPLATES.EXPORT_BATCH);
    if (!user) return response!;

    const body = await request.json().catch(() => ({}));
    const entityType = body.entityType as AggregateEntityType;
    const format = (body.format as AggregateFormat) ?? 'XLSX';
    const keyword = typeof body.keyword === 'string' ? body.keyword : undefined;
    const status = typeof body.status === 'string' && body.status ? body.status : undefined;
    const unitId = typeof body.unitId === 'string' && body.unitId ? body.unitId : undefined;

    if (!ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ success: false, data: null, error: 'entityType không hợp lệ' }, { status: 400 });
    }
    if (!FORMATS.includes(format)) {
      return NextResponse.json({ success: false, data: null, error: 'format không hợp lệ' }, { status: 400 });
    }

    const effectiveScope = scope ?? 'SELF';

    if (ACADEMY_LEVEL_TYPES.includes(entityType) && effectiveScope !== 'ACADEMY' && effectiveScope !== 'DEPARTMENT') {
      return NextResponse.json(
        { success: false, data: null, error: 'Phạm vi quyền không đủ để xuất danh sách này (cần cấp Phòng/Ban trở lên)' },
        { status: 403 },
      );
    }

    const accessibleUnitIds = await getAccessibleUnitIds(user, effectiveScope);

    // Tính danh sách đơn vị để lọc + nhãn phạm vi.
    let unitFilter: string[] | null;
    let scopeLabel = SCOPE_LABELS[effectiveScope];
    if (unitId) {
      if (effectiveScope !== 'ACADEMY' && !accessibleUnitIds.includes(unitId)) {
        return NextResponse.json(
          { success: false, data: null, error: 'Đơn vị được chọn nằm ngoài phạm vi quyền' },
          { status: 403 },
        );
      }
      unitFilter = [unitId];
      scopeLabel = 'Đơn vị đã chọn';
    } else if (effectiveScope === 'ACADEMY') {
      unitFilter = null;
    } else {
      unitFilter = accessibleUnitIds;
    }

    const result = await exportAggregate({
      entityType,
      format,
      keyword,
      status,
      scopeLabel,
      requestedBy: user.id,
      scopeCtx: { scope: effectiveScope, unitFilter },
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.EXPORT_BATCH,
      action: 'AGGREGATE_EXPORT',
      resourceType: 'AGGREGATE_LIST',
      resourceId: entityType,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      metadata: { entityType, format, scope: effectiveScope, unitId: unitId ?? null, status: status ?? null, count: result.count },
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi xuất danh sách tổng hợp';
    console.error('[POST /api/exports/aggregate]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
