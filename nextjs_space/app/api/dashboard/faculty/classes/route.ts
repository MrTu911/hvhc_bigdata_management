/**
 * API: Faculty Dashboard - Classes List
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_FACULTY_CLASSES
  const authResult = await requireFunction(req, FACULTY.VIEW_CLASSES);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: authResult.user!.id }
    });

    if (!user || !user.department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Mock class data (in real system, this would come from a classes table)
    const classes = [
      {
        id: '1',
        name: 'Quản lý Hậu cần Quân sự',
        code: 'QLHCQS101',
        instructor: 'TS. Nguyễn Văn A',
        students: 45,
        schedule: 'Thứ 2, 4 (7:30-9:30)',
        room: 'A201',
        status: 'active',
        progress: 65,
        avgGrade: 8.2,
        attendance: 92
      },
      {
        id: '2',
        name: 'Logistics & Supply Chain',
        code: 'LSC202',
        instructor: 'PGS. Trần Thị B',
        students: 38,
        schedule: 'Thứ 3, 5 (13:30-15:30)',
        room: 'B105',
        status: 'active',
        progress: 58,
        avgGrade: 7.8,
        attendance: 88
      },
      {
        id: '3',
        name: 'Phân tích Dữ liệu Quân sự',
        code: 'PTDLQS303',
        instructor: 'TS. Lê Văn C',
        students: 32,
        schedule: 'Thứ 2, 4 (15:30-17:30)',
        room: 'C301',
        status: 'active',
        progress: 72,
        avgGrade: 8.5,
        attendance: 95
      },
      {
        id: '4',
        name: 'AI trong Quốc phòng',
        code: 'AIQP404',
        instructor: 'TS. Phạm Thị D',
        students: 28,
        schedule: 'Thứ 3, 5 (9:30-11:30)',
        room: 'D202',
        status: 'active',
        progress: 45,
        avgGrade: 8.0,
        attendance: 90
      },
      {
        id: '5',
        name: 'Quản trị Cơ sở Dữ liệu',
        code: 'QTCSDL505',
        instructor: 'ThS. Hoàng Văn E',
        students: 42,
        schedule: 'Thứ 4, 6 (7:30-9:30)',
        room: 'E101',
        status: 'active',
        progress: 80,
        avgGrade: 7.5,
        attendance: 85
      }
    ];

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
