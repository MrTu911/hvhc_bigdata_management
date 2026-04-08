/**
 * API Thống kê CSDL Cán bộ
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy tổng số cán bộ (không phải học viên)
    const total = await prisma.user.count({
      where: { 
        role: { notIn: ['HOC_VIEN', 'HOC_VIEN_SINH_VIEN'] } 
      }
    });

    // Lấy users
    const users = await prisma.user.findMany({
      where: { 
        role: { notIn: ['HOC_VIEN', 'HOC_VIEN_SINH_VIEN'] } 
      },
      select: {
        id: true,
        name: true,
        rank: true,
        gender: true,
        unitId: true,
        createdAt: true,
        employeeId: true,
        position: true,
      }
    });

    // Lấy units
    const units = await prisma.unit.findMany({
      select: { id: true, name: true }
    });
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    // Group by rank
    const rankCountMap = new Map<string, number>();
    users.forEach(u => {
      const rank = u.rank || 'Chưa xác định';
      rankCountMap.set(rank, (rankCountMap.get(rank) || 0) + 1);
    });
    const byRank = Array.from(rankCountMap.entries())
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by unit
    const unitCountMap = new Map<string, number>();
    users.forEach(u => {
      const unitName = u.unitId ? unitMap.get(u.unitId) || 'Chưa phân công' : 'Chưa phân công';
      unitCountMap.set(unitName, (unitCountMap.get(unitName) || 0) + 1);
    });
    const byUnit = Array.from(unitCountMap.entries())
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by gender
    const genderCountMap = new Map<string, number>();
    users.forEach(u => {
      const gender = u.gender === 'MALE' ? 'Nam' : u.gender === 'FEMALE' ? 'Nữ' : 'Khác';
      genderCountMap.set(gender, (genderCountMap.get(gender) || 0) + 1);
    });
    const byGender = Array.from(genderCountMap.entries())
      .map(([gender, count]) => ({ gender, count }));

    // Recent 10
    const recent = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(u => ({
        name: u.name,
        employeeId: u.employeeId,
        rank: u.rank,
        position: u.position,
        unit: u.unitId ? unitMap.get(u.unitId) : null,
        createdAt: u.createdAt,
      }));

    return NextResponse.json({
      total,
      byRank,
      byUnit,
      byGender,
      recent,
    });
  } catch (error) {
    console.error('Personnel stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê cán bộ' },
      { status: 500 }
    );
  }
}
