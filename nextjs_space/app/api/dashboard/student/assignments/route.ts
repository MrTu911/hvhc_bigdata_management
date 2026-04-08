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

    // Demo data - assignments
    const assignments = [
      {
        id: '1',
        title: 'Bài tập 1: Thuật toán Machine Learning',
        course: 'ML101',
        courseName: 'Machine Learning cơ bản',
        dueDate: new Date('2025-10-20T23:59:59'),
        status: 'PENDING',
        priority: 'HIGH',
        description: 'Implement các thuật toán ML cơ bản'
      },
      {
        id: '2',
        title: 'Project giữa kỳ: Data Analysis',
        course: 'DS201',
        courseName: 'Khoa học Dữ liệu',
        dueDate: new Date('2025-10-25T23:59:59'),
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        description: 'Phân tích dataset và viết báo cáo'
      },
      {
        id: '3',
        title: 'Bài tập 3: Hadoop MapReduce',
        course: 'BD301',
        courseName: 'Big Data và Ứng dụng',
        dueDate: new Date('2025-10-18T23:59:59'),
        status: 'PENDING',
        priority: 'URGENT',
        description: 'Viết MapReduce job xử lý dữ liệu'
      },
      {
        id: '4',
        title: 'Lab 2: Neural Networks',
        course: 'AI401',
        courseName: 'Trí tuệ Nhân tạo',
        dueDate: new Date('2025-10-22T23:59:59'),
        status: 'PENDING',
        priority: 'MEDIUM',
        description: 'Xây dựng mạng neural đơn giản'
      },
      {
        id: '5',
        title: 'Bài tập 2: Tối ưu hóa chuỗi cung ứng',
        course: 'LG101',
        courseName: 'Logistics và Chuỗi cung ứng',
        dueDate: new Date('2025-11-01T23:59:59'),
        status: 'COMPLETED',
        priority: 'MEDIUM',
        description: 'Giải bài toán tối ưu logistics',
        grade: 9.0,
        submittedAt: new Date('2025-10-12T15:30:00')
      }
    ];

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
