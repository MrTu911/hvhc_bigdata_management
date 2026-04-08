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

    if (format === 'csv') {
      const headers = [
        'Họ tên', 'Quân hàm', 'Chức vụ', 'Đơn vị',
        'Mã nhân sự', 'Số QNCN', 'Ngày sinh',
        'Giới tính', 'Trạng thái'
      ];

      const rows = personnel.map(p => [
        p.fullName || '',
        p.militaryRank || '',
        p.position || '',
        p.unit?.name || '',
        p.personnelCode || '',
        p.militaryIdNumber || '',
        p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('vi-VN') : '',
        p.gender || '',
        p.status || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const bom = '\uFEFF';

      return new NextResponse(bom + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="personnel_${new Date().toISOString().split('T')[0]}.csv"`,
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
