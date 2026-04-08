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

    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get('class') || 'all';
    const performanceFilter = searchParams.get('performance') || 'all';

    // Get students with performance data
    const students = await prisma.hocVien.findMany({
      select: {
        id: true,
        hoTen: true,
        email: true,
        lop: true,
        maHocVien: true,
      },
      take: 50
    });

    // Enhance with mock performance data
    const enhancedStudents = students.map((student, index) => {
      const gradeValue = 65 + Math.random() * 30; // 65-95
      const attendanceValue = 70 + Math.random() * 25; // 70-95
      const assignmentsCompleted = Math.floor(8 + Math.random() * 4); // 8-12
      const totalAssignments = 12;
      
      let performance: 'excellent' | 'good' | 'average' | 'poor';
      if (gradeValue >= 85) performance = 'excellent';
      else if (gradeValue >= 75) performance = 'good';
      else if (gradeValue >= 65) performance = 'average';
      else performance = 'poor';

      let alertLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
      let alertMessage = '';
      
      if (attendanceValue < 75) {
        alertLevel = 'high';
        alertMessage = 'Low attendance rate';
      } else if (gradeValue < 70) {
        alertLevel = 'medium';
        alertMessage = 'Below average performance';
      } else if (assignmentsCompleted < 8) {
        alertLevel = 'low';
        alertMessage = 'Missing assignments';
      }

      return {
        id: student.id,
        name: student.hoTen || `Student ${index + 1}`,
        email: student.email,
        class: student.lop || ['K65', 'K66', 'K67'][index % 3],
        studentCode: student.maHocVien,
        grade: parseFloat(gradeValue.toFixed(1)),
        attendance: parseFloat(attendanceValue.toFixed(1)),
        assignments: {
          completed: assignmentsCompleted,
          total: totalAssignments
        },
        performance,
        alert: {
          level: alertLevel,
          message: alertMessage
        },
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    // Apply filters
    let filteredStudents = enhancedStudents;
    
    if (classFilter !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.class === classFilter);
    }
    
    if (performanceFilter !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.performance === performanceFilter);
    }

    return NextResponse.json({
      students: filteredStudents,
      total: filteredStudents.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
