/**
 * API: Dashboard Cán bộ
 * GET /api/dashboard/personnel
 * Thống kê quân nhân/cán bộ từ database thực
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { cached, CACHE_TTL, dashboardCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const user = authResult.user!;
    const cacheKey = dashboardCacheKey(user.id, 'personnel');

    const data = await cached(cacheKey, CACHE_TTL.DASHBOARD_DATA, async () => {
      // 1. Tổng quan quân nhân
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
      const inactiveUsers = await prisma.user.count({ where: { status: 'INACTIVE' } });

      // 2. Thống kê theo vai trò
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      });

      // 3. Thống kê theo cấp bậc (rank)
      const usersByRank = await prisma.user.groupBy({
        by: ['rank'],
        _count: { id: true },
        where: { rank: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 15
      });

      // 4. Thống kê theo đơn vị
      const usersByDepartment = await prisma.user.groupBy({
        by: ['department'],
        _count: { id: true },
        where: { department: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // 5. Thống kê theo trình độ học vấn
      const usersByEducation = await prisma.user.groupBy({
        by: ['educationLevel'],
        _count: { id: true },
        where: { educationLevel: { not: null } },
        orderBy: { _count: { id: 'desc' } }
      });

      // 6. Thống kê theo giới tính
      const usersByGender = await prisma.user.groupBy({
        by: ['gender'],
        _count: { id: true },
        where: { gender: { not: null } }
      });

      // 7. Thống kê theo loại quân nhân
      const usersByPersonnelType = await prisma.user.groupBy({
        by: ['personnelType'],
        _count: { id: true },
        where: { personnelType: { not: null } }
      });

      // 8. Người dùng mới gần đây
      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          rank: true,
          department: true,
          position: true,
          status: true,
          createdAt: true
        }
      });

      // 9. Đăng nhập gần đây
      const recentLogins = await prisma.user.findMany({
        take: 10,
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true
        }
      });

      // 10. Phân bố tuổi (tính từ dateOfBirth)
      const usersWithAge = await prisma.user.findMany({
        where: { dateOfBirth: { not: null } },
        select: { dateOfBirth: true }
      });

      const currentYear = new Date().getFullYear();
      const ageDistribution = { under30: 0, '30to40': 0, '40to50': 0, over50: 0 };

      usersWithAge.forEach(u => {
        if (u.dateOfBirth) {
          const age = currentYear - u.dateOfBirth.getFullYear();
          if (age < 30) ageDistribution.under30++;
          else if (age < 40) ageDistribution['30to40']++;
          else if (age < 50) ageDistribution['40to50']++;
          else ageDistribution.over50++;
        }
      });

      // 11. Thống kê đơn vị
      const totalDepartments = await prisma.department.count();
      const totalUnits = await prisma.unit.count();

      // 12. Hoạt động Audit gần đây (không cache riêng — lấy theo batch)
      const recentActivities = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          actorUserId: true,
          action: true,
          resourceType: true,
          createdAt: true
        }
      });

      return {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalDepartments,
          totalUnits,
          activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
        usersByRank: usersByRank.map(r => ({ rank: r.rank || 'Chưa xác định', count: r._count.id })),
        usersByDepartment: usersByDepartment.map(d => ({ department: d.department || 'Chưa phân công', count: d._count.id })),
        usersByEducation: usersByEducation.map(e => ({ education: e.educationLevel || 'Không rõ', count: e._count.id })),
        usersByGender: usersByGender.map(g => ({ gender: g.gender || 'Không rõ', count: g._count.id })),
        usersByPersonnelType: usersByPersonnelType.map(p => ({ type: p.personnelType || 'Khác', count: p._count.id })),
        ageDistribution: [
          { age: 'Dưới 30', count: ageDistribution.under30 },
          { age: '30-40', count: ageDistribution['30to40'] },
          { age: '40-50', count: ageDistribution['40to50'] },
          { age: 'Trên 50', count: ageDistribution.over50 }
        ],
        recentUsers: recentUsers.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
        recentLogins: recentLogins.map(u => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() })),
        recentActivities: recentActivities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Personnel dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
