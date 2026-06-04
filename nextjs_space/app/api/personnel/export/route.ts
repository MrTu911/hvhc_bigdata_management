/**
 * API: Export Personnel
 * GET /api/personnel/export - Xuất dữ liệu nhân sự ra CSV/Excel
 * Sử dụng Service Layer với scope-based filtering
 * GĐ4.16: Thêm Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { PersonnelService, type PersonnelFilters } from '@/lib/services';
import { exportRateLimiter } from '@/lib/rate-limit';
import { buildCsvRow } from '@/lib/export/server/official-document';
import { buildPersonnelRosterWorkbook } from '@/lib/export/server/personnel-roster-excel';
import {
  PERSONNEL_STATUS_LABELS,
  GENDER_LABELS,
  getRankLabel,
  getLabel,
} from '@/lib/export/labels';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check với scope tự động
    const authResult = await requireScopedFunction(request, PERSONNEL.EXPORT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { user, scopedOptions } = authResult;

    // Rate limiting: 10 requests per 5 minutes
    const rateLimit = await exportRateLimiter(request, user!.id);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    
    const filters: PersonnelFilters = {
      unitId: searchParams.get('unitId') || undefined,
    };

    // Sử dụng PersonnelService với scope filtering tự động
    const result = await PersonnelService.exportData(scopedOptions!, filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const personnel = result.data || [];

    // Service đã log audit tự động

    // Tên đơn vị cho header biểu mẫu (chỉ khi lọc theo 1 đơn vị)
    const unitName = filters.unitId
      ? personnel.find((p) => p.unitId === filters.unitId)?.unit?.name ?? undefined
      : undefined;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const buffer = await buildPersonnelRosterWorkbook(personnel, { unitName });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="danh-sach-trich-ngang_${dateStr}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      const headers = [
        'TT', 'Họ và tên', 'Ngày sinh', 'Quân hàm', 'Chức vụ', 'Đơn vị',
        'Mã nhân sự', 'Số quân', 'Giới tính', 'Dân tộc', 'Trạng thái',
      ];

      const rows = personnel.map((p, index) => [
        index + 1,
        p.fullName || '',
        p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('vi-VN') : '',
        getRankLabel(p.militaryRank),
        p.position || '',
        p.unit?.name || '',
        p.personnelCode || '',
        p.militaryIdNumber || '',
        getLabel(GENDER_LABELS, p.gender),
        p.ethnicity || '',
        getLabel(PERSONNEL_STATUS_LABELS, p.status),
      ]);

      const csvContent = [
        buildCsvRow(headers),
        ...rows.map((r) => buildCsvRow(r)),
      ].join('\r\n');

      const bom = '\uFEFF';

      return new NextResponse(bom + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="danh-sach-trich-ngang_${dateStr}.csv"`,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: personnel,
      meta: {
        total: personnel.length,
        scope: scopedOptions!.scope,
      }
    });
  } catch (error: any) {
    console.error('[Personnel Export API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
