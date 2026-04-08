import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC  
    const authResult = await requireFunction(request, FACULTY.VIEW_RESEARCH);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data
    const projects = [
      {
        id: '1',
        title: 'Ứng dụng AI trong Tối ưu hóa Chuỗi cung ứng',
        description: 'Nghiên cứu và phát triển hệ thống AI để tối ưu hóa chuỗi cung ứng quân sự',
        status: 'IN_PROGRESS',
        progress: 60,
        budget: 300000000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2026-06-30'),
        daysRemaining: 622,
        lead: { id: '2', name: 'Thượng tá Trần Thị B' },
        membersCount: 3
      },
      {
        id: '2',
        title: 'Mô hình Dự báo Nhu cầu Vật tư',
        description: 'Xây dựng mô hình dự báo nhu cầu vật tư dựa trên dữ liệu lịch sử',
        status: 'IN_PROGRESS',
        progress: 40,
        budget: 200000000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2026-12-31'),
        daysRemaining: 807,
        lead: { id: '3', name: 'Trung tá Lê Văn C' },
        membersCount: 2
      },
      {
        id: '3',
        title: 'Nghiên cứu ứng dụng Blockchain',
        description: 'Nghiên cứu ứng dụng công nghệ blockchain trong quản lý hậu cần',
        status: 'ACTIVE',
        progress: 30,
        budget: 250000000,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2026-09-30'),
        daysRemaining: 715,
        lead: { id: '4', name: 'Trung tá Phạm Văn D' },
        membersCount: 4
      }
    ];

    const stats = {
      total: projects.length,
      active: projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length,
      completed: 0,
      totalBudget: projects.reduce((sum: number, p: any) => sum + p.budget, 0),
      averageProgress: projects.reduce((sum: number, p: any) => sum + p.progress, 0) / projects.length
    };

    return NextResponse.json({ projects, stats });
  } catch (error) {
    console.error('Error fetching research:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research' },
      { status: 500 }
    );
  }
}
