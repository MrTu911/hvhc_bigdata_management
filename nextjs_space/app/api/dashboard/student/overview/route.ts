import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // RBAC: VIEW_DASHBOARD_STUDENT - scope SELF
    const authResult = await requireFunction(request, DASHBOARD.VIEW_STUDENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Get student profile by email
    const student = await prisma.hocVien.findFirst({
      where: { 
        email: user.email
      },
      include: {
        ketQuaHocTap: true
      }
    });

    if (!student) {
      // Return default values if no student profile
      const overview = {
        enrolledCourses: 0,
        upcomingAssignments: 0,
        completedAssignments: 0,
        averageGrade: 0
      };
      return NextResponse.json({ overview });
    }

    // Calculate statistics
    const totalCourses = new Set(student.ketQuaHocTap.map(k => k.maMon || k.monHoc)).size;
    const completedCourses = student.ketQuaHocTap.filter(k => k.diemTongKet && k.diemTongKet >= 5).length;
    
    // Calculate average grade using diemTongKet
    const gradesWithScores = student.ketQuaHocTap.filter(k => k.diemTongKet !== null);
    const averageGrade = gradesWithScores.length > 0
      ? gradesWithScores.reduce((sum, k) => sum + (k.diemTongKet || 0), 0) / gradesWithScores.length
      : 0;

    const overview = {
      enrolledCourses: totalCourses,
      upcomingAssignments: Math.max(0, totalCourses - completedCourses),
      completedAssignments: completedCourses,
      averageGrade: Number(averageGrade.toFixed(2))
    };

    return NextResponse.json({ overview });
  } catch (error) {
    console.error('Error fetching student overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
