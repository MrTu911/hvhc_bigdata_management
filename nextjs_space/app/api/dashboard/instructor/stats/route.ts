import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
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

    // Get basic stats
    const [
      totalStudents,
      totalClasses,
      avgAttendance,
      pendingGrades
    ] = await Promise.all([
      // Total students
      prisma.hocVien.count(),
      
      // Total classes (mock data - could come from a classes table)
      Promise.resolve(4),
      
      // Average attendance (mock calculation)
      Promise.resolve(87.5),
      
      // Pending grades (mock data)
      Promise.resolve(12)
    ]);

    return NextResponse.json({
      totalStudents,
      totalClasses,
      avgAttendance,
      pendingGrades
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor stats' },
      { status: 500 }
    );
  }
}
