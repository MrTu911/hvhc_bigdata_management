/**
 * API: Faculty Dashboard - Statistics
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_FACULTY_STATS
  const authResult = await requireFunction(req, FACULTY.VIEW_STATS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    // Get user's department from session
    const user = await prisma.user.findUnique({
      where: { id: authResult.user!.id }
    });

    if (!user || !user.department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Get department statistics
    const departmentName = user.department;

    // Count instructors in department
    const instructorCount = await prisma.user.count({
      where: {
        department: departmentName,
        role: 'GIANG_VIEN'
      }
    });

    // Count students in department
    const studentCount = await prisma.user.count({
      where: {
        department: departmentName,
        role: 'HOC_VIEN_SINH_VIEN'
      }
    });

    // Get all users in department
    const departmentUserIds = (await prisma.user.findMany({
      where: { department: departmentName },
      select: { id: true }
    })).map(u => u.id);

    // Count active research projects
    const activeProjects = await prisma.researchFile.count({
      where: {
        uploadedBy: {
          in: departmentUserIds
        },
        tags: {
          has: 'active'
        }
      }
    });

    // Count ML models from department
    const mlModels = await prisma.mLModel.count({
      where: {
        ownerId: {
          in: departmentUserIds
        }
      }
    });

    // Get recent activities
    const recentActivities = await prisma.systemLog.findMany({
      where: {
        userId: {
          in: departmentUserIds
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate average performance (mock data for now)
    const avgPerformance = 85.5;
    const completionRate = 78.3;

    const stats = {
      instructors: instructorCount,
      students: studentCount,
      activeProjects,
      mlModels,
      avgPerformance,
      completionRate,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        userName: activity.user?.name || 'Unknown',
        timestamp: activity.createdAt,
        details: activity.description || ''
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching faculty stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
