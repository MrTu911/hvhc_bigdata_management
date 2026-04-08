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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    // Demo report data
    const report = {
      period: {
        month: Number(month),
        year: Number(year)
      },
      department: {
        id: 'dept-1',
        name: 'Bộ môn Quản lý Hậu cần'
      },
      teaching: {
        coursesCount: 8,
        classesCount: 12,
        studentsCount: 431,
        instructorsCount: 6
      },
      research: {
        projectsCount: 3,
        totalBudget: 750000000,
        averageProgress: 43
      },
      instructors: [
        { name: 'Đại tá Nguyễn Văn A', classesCount: 2, projectsCount: 1 },
        { name: 'Thượng tá Trần Thị B', classesCount: 2, projectsCount: 1 },
        { name: 'Trung tá Lê Văn C', classesCount: 2, projectsCount: 2 },
        { name: 'Trung tá Phạm Văn D', classesCount: 1, projectsCount: 1 },
        { name: 'Trung tá Hoàng Văn E', classesCount: 1, projectsCount: 0 },
        { name: 'Thượng úy Nguyễn Văn F', classesCount: 1, projectsCount: 0 }
      ]
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
