import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, FACULTY.VIEW_STATS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data
    const teachingStats = {
      totalClasses: 12,
      totalStudents: 431,
      totalCredits: 36,
      averageClassSize: 36
    };

    const researchStats = {
      totalProjects: 3,
      activeProjects: 3,
      completedProjects: 0,
      totalBudget: 750000000,
      averageProgress: 43
    };

    const workloadDistribution = [
      { name: 'Đại tá Nguyễn Văn A', hours: 90, classes: 2 },
      { name: 'Thượng tá Trần Thị B', hours: 90, classes: 2 },
      { name: 'Trung tá Lê Văn C', hours: 90, classes: 2 },
      { name: 'Trung tá Phạm Văn D', hours: 75, classes: 1 },
      { name: 'Trung tá Hoàng Văn E', hours: 60, classes: 1 },
      { name: 'Thượng úy Nguyễn Văn F', hours: 45, classes: 1 }
    ];

    return NextResponse.json({
      teaching: teachingStats,
      research: researchStats,
      workload: workloadDistribution
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
