import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/users/stats - Thống kê nhân sự tổng quan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total users
    const total = await prisma.user.count();

    // Get active users
    const active = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const byRole: Record<string, number> = {};
    usersByRole.forEach((item) => {
      byRole[item.role] = item._count.id;
    });

    // Get users by personnel type
    const usersByType = await prisma.user.groupBy({
      by: ['personnelType'],
      _count: { id: true },
      where: {
        personnelType: { not: null },
      },
    });

    const byType: Record<string, number> = {};
    usersByType.forEach((item) => {
      if (item.personnelType) {
        byType[item.personnelType] = item._count.id;
      }
    });

    // Get users by department/unit
    const usersByDept = await prisma.user.groupBy({
      by: ['department'],
      _count: { id: true },
      where: {
        department: { not: null },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const byUnit = usersByDept.map((item) => ({
      unit: item.department || 'Không rõ',
      count: item._count.id,
    }));

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get command officers
    const commandOfficers = await prisma.user.count({
      where: {
        role: {
          in: ['CHI_HUY_HOC_VIEN', 'CHI_HUY_KHOA_PHONG', 'CHU_NHIEM_BO_MON'],
        },
      },
    });

    // Get faculty
    const faculty = await prisma.user.count({
      where: {
        OR: [
          { role: 'GIANG_VIEN' },
          { personnelType: 'GIANG_VIEN' },
        ],
      },
    });

    // Get students
    const students = await prisma.user.count({
      where: {
        OR: [
          { role: 'HOC_VIEN' },
          { role: 'HOC_VIEN_SINH_VIEN' },
          { personnelType: 'HOC_VIEN_QUAN_SU' },
          { personnelType: 'SINH_VIEN_DAN_SU' },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        recentUsers,
        commandOfficers,
        faculty,
        students,
        byRole,
        byType,
        byUnit,
      },
    });
  } catch (error) {
    console.error('Get users stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
