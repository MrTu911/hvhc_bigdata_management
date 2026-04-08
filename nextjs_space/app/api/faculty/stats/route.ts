/**
 * Faculty Stats API - Sử dụng Service Layer với scope-based filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { FacultyService } from '@/lib/services';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Kiểm tra quyền với scope tự động
    const authResult = await requireScopedFunction(req, FACULTY.VIEW);
    
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { scopedOptions } = authResult;

    // Lấy thống kê từ FacultyService (tự động filter theo scope)
    const statsResult = await FacultyService.getStats(scopedOptions!);

    if (!statsResult.success) {
      return NextResponse.json({ error: statsResult.error }, { status: 500 });
    }

    const stats = statsResult.data;

    // Lấy thêm thông tin chi tiết nếu cần
    const units = await prisma.unit.findMany({
      where: { active: true },
      select: { id: true, name: true, code: true },
    });

    // Map unit IDs to names
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalFaculty: stats?.total || 0,
          byRank: (stats?.byRank as Array<{ rank: string; count: number }>)?.reduce((acc: Record<string, number>, r: { rank: string; count: number }) => {
            acc[r.rank || 'Chưa cập nhật'] = r.count;
            return acc;
          }, {} as Record<string, number>) || {},
          byDegree: (stats?.byDegree as Array<{ degree: string; count: number }>)?.reduce((acc: Record<string, number>, d: { degree: string; count: number }) => {
            acc[d.degree || 'Chưa cập nhật'] = d.count;
            return acc;
          }, {} as Record<string, number>) || {},
        },
        byDepartment: (stats?.byUnit as Array<{ unitId: string; count: number }>)?.map((u: { unitId: string; count: number }) => ({
          departmentId: u.unitId,
          departmentName: unitMap.get(u.unitId) || 'Không xác định',
          count: u.count,
        })) || [],
        research: {
          totalProjects: stats?.totalResearchProjects || 0,
          publicationsPerFaculty: 0,
        },
      },
      scope: scopedOptions!.scope,
    });
  } catch (error: any) {
    console.error('[Faculty Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
