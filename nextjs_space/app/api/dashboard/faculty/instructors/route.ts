/**
 * API: Faculty Dashboard - Instructors List
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_FACULTY_INSTRUCTORS
  const authResult = await requireFunction(req, FACULTY.VIEW_INSTRUCTORS);
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

    // Get all instructors in department
    const instructors = await prisma.user.findMany({
      where: {
        department: user.department,
        role: 'GIANG_VIEN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { name: 'asc' }
    });

    // Get performance data for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        // Count research files
        const researchCount = await prisma.researchFile.count({
          where: { uploadedBy: instructor.id }
        });

        // Count ML models
        const modelCount = await prisma.mLModel.count({
          where: { ownerId: instructor.id }
        });

        // Get recent activity
        const lastActivity = await prisma.systemLog.findFirst({
          where: { userId: instructor.id },
          orderBy: { createdAt: 'desc' }
        });

        // Mock performance data
        const performance = {
          teachingScore: Math.random() * 20 + 80, // 80-100
          researchScore: Math.random() * 20 + 75, // 75-95
          studentSatisfaction: Math.random() * 15 + 85 // 85-100
        };

        return {
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          joinedDate: instructor.createdAt,
          lastLogin: instructor.lastLoginAt,
          lastActivity: lastActivity?.createdAt || null,
          researchProjects: researchCount,
          mlModels: modelCount,
          performance,
          overallScore: (
            (performance.teachingScore + 
             performance.researchScore + 
             performance.studentSatisfaction) / 3
          ).toFixed(1)
        };
      })
    );

    return NextResponse.json({ instructors: instructorsWithStats });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
