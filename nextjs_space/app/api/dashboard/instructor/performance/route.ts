import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_FACULTY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6months';

    // Generate performance trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const performanceData = months.slice(0, period === '3months' ? 3 : 6).map((month) => ({
      month,
      avgGrade: 72 + Math.random() * 15,
      avgAttendance: 80 + Math.random() * 15,
      avgAssignmentCompletion: 75 + Math.random() * 20,
      studentCount: 45 + Math.floor(Math.random() * 10)
    }));

    // Class comparison data
    const classComparison = [
      { class: 'K65 - Advanced DS', avgGrade: 82.5, studentCount: 48, passRate: 91.7 },
      { class: 'K66 - ML Basics', avgGrade: 78.3, studentCount: 52, passRate: 86.5 },
      { class: 'K67 - Database', avgGrade: 85.1, studentCount: 45, passRate: 95.6 },
      { class: 'K65 - Algorithms', avgGrade: 76.8, studentCount: 50, passRate: 84.0 }
    ];

    // Grade distribution
    const gradeDistribution = [
      { range: '90-100', count: 12, percentage: 12 },
      { range: '80-89', count: 28, percentage: 28 },
      { range: '70-79', count: 35, percentage: 35 },
      { range: '60-69', count: 18, percentage: 18 },
      { range: '<60', count: 7, percentage: 7 }
    ];

    return NextResponse.json({
      performanceData,
      classComparison,
      gradeDistribution,
      summary: {
        avgGrade: 79.5,
        avgAttendance: 87.5,
        avgCompletion: 82.3,
        totalStudents: 195
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
