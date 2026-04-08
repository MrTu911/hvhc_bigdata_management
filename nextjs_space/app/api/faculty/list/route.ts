/**
 * Faculty List API - Sử dụng Service Layer với scope-based filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { FacultyService, type FacultyFilters } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    // Kiểm tra quyền với scope tự động
    const authResult = await requireScopedFunction(req, FACULTY.VIEW);
    
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { user, scopedOptions } = authResult;

    // Parse query params
    const { searchParams } = new URL(req.url);
    const filters: FacultyFilters = {
      unitId: searchParams.get('unitId') || undefined,
      academicRank: searchParams.get('academicRank') || undefined,
      academicDegree: searchParams.get('academicDegree') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Sử dụng FacultyService với scope filtering tự động
    const result = await FacultyService.findMany(scopedOptions!, filters, pagination);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      faculty: result.data,
      pagination: result.meta,
    });
  } catch (error: any) {
    console.error('[Faculty List API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
