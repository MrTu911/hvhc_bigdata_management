import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, FACULTY.VIEW_INSTRUCTORS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data
    const instructors = [
      {
        id: '1',
        name: 'Đại tá Nguyễn Văn A',
        email: 'nguyenvana@hvhc.edu.vn',
        classesCount: 2,
        studentsCount: 98,
        teachingHours: 90,
        researchProjects: 1
      },
      {
        id: '2',
        name: 'Thượng tá Trần Thị B',
        email: 'tranthib@hvhc.edu.vn',
        classesCount: 2,
        studentsCount: 105,
        teachingHours: 90,
        researchProjects: 1
      },
      {
        id: '3',
        name: 'Trung tá Lê Văn C',
        email: 'levanc@hvhc.edu.vn',
        classesCount: 2,
        studentsCount: 93,
        teachingHours: 90,
        researchProjects: 2
      },
      {
        id: '4',
        name: 'Trung tá Phạm Văn D',
        email: 'phamvand@hvhc.edu.vn',
        classesCount: 1,
        studentsCount: 45,
        teachingHours: 75,
        researchProjects: 1
      },
      {
        id: '5',
        name: 'Trung tá Hoàng Văn E',
        email: 'hoangvane@hvhc.edu.vn',
        classesCount: 1,
        studentsCount: 48,
        teachingHours: 60,
        researchProjects: 0
      },
      {
        id: '6',
        name: 'Thượng úy Nguyễn Văn F',
        email: 'nguyenvanf@hvhc.edu.vn',
        classesCount: 1,
        studentsCount: 42,
        teachingHours: 45,
        researchProjects: 0
      }
    ];

    return NextResponse.json({ instructors });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}
