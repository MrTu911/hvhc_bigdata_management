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

    // Demo data - learning materials
    const materials = [
      {
        id: '1',
        title: 'Slide bài giảng - Machine Learning Overview',
        course: 'ML101',
        type: 'PDF',
        size: '5.2 MB',
        uploadedAt: new Date('2025-10-01'),
        downloads: 45
      },
      {
        id: '2',
        title: 'Dataset mẫu - Iris Classification',
        course: 'ML101',
        type: 'CSV',
        size: '12 KB',
        uploadedAt: new Date('2025-10-05'),
        downloads: 38
      },
      {
        id: '3',
        title: 'Video hướng dẫn - Data Preprocessing',
        course: 'DS201',
        type: 'VIDEO',
        size: '125 MB',
        uploadedAt: new Date('2025-09-28'),
        downloads: 52
      },
      {
        id: '4',
        title: 'Tài liệu tham khảo - Hadoop Ecosystem',
        course: 'BD301',
        type: 'PDF',
        size: '8.7 MB',
        uploadedAt: new Date('2025-10-10'),
        downloads: 30
      },
      {
        id: '5',
        title: 'Code mẫu - Neural Network Implementation',
        course: 'AI401',
        type: 'ZIP',
        size: '2.1 MB',
        uploadedAt: new Date('2025-10-08'),
        downloads: 41
      }
    ];

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}
