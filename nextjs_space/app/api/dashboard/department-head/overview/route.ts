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

    // Demo data for Department Head Dashboard
    const overview = {
      coursesCount: 8,
      instructorsCount: 6,
      classesCount: 12,
      projectsCount: 3
    };

    const recentClasses = [
      {
        id: '1',
        name: 'K23-QL01',
        course: { name: 'Quản lý Dự án' },
        instructor: { name: 'Đại tá Nguyễn Văn A' },
        createdAt: new Date('2024-09-01')
      },
      {
        id: '2',
        name: 'K23-LG01',
        course: { name: 'Logistics và Chuỗi cung ứng' },
        instructor: { name: 'Thượng tá Trần Thị B' },
        createdAt: new Date('2024-09-01')
      },
      {
        id: '3',
        name: 'K23-QL02',
        course: { name: 'Quản trị Chiến lược' },
        instructor: { name: 'Thượng tá Lê Văn C' },
        createdAt: new Date('2024-09-02')
      }
    ];

    return NextResponse.json({
      overview,
      recentClasses
    });
  } catch (error) {
    console.error('Error fetching department head overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
