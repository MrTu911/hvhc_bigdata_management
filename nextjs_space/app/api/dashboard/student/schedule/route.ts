import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_STUDENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data - weekly schedule
    const schedule = [
      {
        day: 'Thứ 2',
        sessions: [
          {
            time: '07:00 - 09:00',
            course: 'ML101',
            courseName: 'Machine Learning cơ bản',
            room: 'A301',
            instructor: 'Đại tá Nguyễn Văn A'
          },
          {
            time: '13:00 - 15:00',
            course: 'ML101',
            courseName: 'Machine Learning cơ bản - Lab',
            room: 'Lab102',
            instructor: 'Thượng tá Mai Văn F'
          }
        ]
      },
      {
        day: 'Thứ 3',
        sessions: [
          {
            time: '09:00 - 11:00',
            course: 'DS201',
            courseName: 'Khoa học Dữ liệu',
            room: 'B205',
            instructor: 'Thượng tá Trần Thị B'
          }
        ]
      },
      {
        day: 'Thứ 4',
        sessions: [
          {
            time: '13:00 - 15:00',
            course: 'BD301',
            courseName: 'Big Data và Ứng dụng',
            room: 'C101',
            instructor: 'Thượng tá Lê Văn C'
          }
        ]
      },
      {
        day: 'Thứ 5',
        sessions: [
          {
            time: '07:00 - 09:00',
            course: 'AI401',
            courseName: 'Trí tuệ Nhân tạo',
            room: 'A302',
            instructor: 'Đại tá Phạm Văn D'
          }
        ]
      },
      {
        day: 'Thứ 6',
        sessions: [
          {
            time: '09:00 - 11:00',
            course: 'LG101',
            courseName: 'Logistics và Chuỗi cung ứng',
            room: 'B107',
            instructor: 'Thượng tá Hoàng Thị E'
          }
        ]
      }
    ];

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
