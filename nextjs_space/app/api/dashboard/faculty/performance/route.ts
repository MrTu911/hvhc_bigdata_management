/**
 * API: Faculty Dashboard - Performance Data
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_FACULTY_PERFORMANCE
  const authResult = await requireFunction(req, FACULTY.VIEW_PERFORMANCE);
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

    // Mock performance data for demo
    const performanceData = {
      monthly: [
        { month: 'Tháng 1', teaching: 85, research: 78, overall: 82 },
        { month: 'Tháng 2', teaching: 87, research: 82, overall: 85 },
        { month: 'Tháng 3', teaching: 86, research: 85, overall: 86 },
        { month: 'Tháng 4', teaching: 89, research: 88, overall: 89 },
        { month: 'Tháng 5', teaching: 90, research: 87, overall: 89 },
        { month: 'Tháng 6', teaching: 88, research: 90, overall: 89 }
      ],
      comparison: {
        thisDepartment: {
          teaching: 88.5,
          research: 85.0,
          studentSatisfaction: 90.2,
          publications: 12
        },
        academy: {
          teaching: 85.0,
          research: 82.5,
          studentSatisfaction: 87.5,
          publications: 10
        }
      },
      topPerformers: [
        { name: 'TS. Nguyễn Văn A', score: 95.5, category: 'Giảng dạy' },
        { name: 'PGS. Trần Thị B', score: 94.2, category: 'Nghiên cứu' },
        { name: 'TS. Lê Văn C', score: 93.8, category: 'Tổng hợp' },
        { name: 'ThS. Phạm Thị D', score: 92.5, category: 'Sáng tạo' },
        { name: 'TS. Hoàng Văn E', score: 91.7, category: 'Ứng dụng' }
      ]
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
