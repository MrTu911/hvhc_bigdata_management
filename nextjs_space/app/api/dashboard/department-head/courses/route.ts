import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, FACULTY.VIEW_CLASSES);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data
    const courses = [
      {
        id: '1',
        code: 'QL301',
        name: 'Quản lý Dự án',
        credits: 3,
        classesCount: 3,
        studentsCount: 150,
        instructors: ['Đại tá Nguyễn Văn A', 'Thượng tá Trần Thị B']
      },
      {
        id: '2',
        code: 'LG302',
        name: 'Logistics và Chuỗi cung ứng',
        credits: 4,
        classesCount: 2,
        studentsCount: 100,
        instructors: ['Thượng tá Trần Thị B', 'Trung tá Lê Văn C']
      },
      {
        id: '3',
        code: 'QL303',
        name: 'Quản trị Chiến lược',
        credits: 3,
        classesCount: 2,
        studentsCount: 90,
        instructors: ['Thượng tá Lê Văn C', 'Trung tá Phạm Văn D']
      }
    ];

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
