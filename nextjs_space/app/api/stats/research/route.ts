/**
 * API Thống kê CSDL Nghiên cứu KH — v8.9 fix: dùng scientificResearch + scientificPublication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, RESEARCH.VIEW);
    if (!authResult.allowed) return authResult.response!;

    const [projects, pubCount] = await Promise.all([
      prisma.scientificResearch.findMany({
        select: { id: true, level: true, result: true, year: true },
      }),
      prisma.scientificPublication.count(),
    ]);

    const total = projects.length;
    const publications = pubCount;

    // Phân bố theo trạng thái (result field)
    const statusCountMap = new Map<string, number>();
    projects.forEach(p => {
      const statusLabel = p.result?.includes('Xuất sắc') ? 'Xuất sắc'
        : p.result?.includes('Tốt') ? 'Tốt'
        : p.result?.includes('Khá') ? 'Khá'
        : p.result?.includes('Đạt') ? 'Đạt'
        : p.result || 'Đang thực hiện';
      statusCountMap.set(statusLabel, (statusCountMap.get(statusLabel) || 0) + 1);
    });
    const byStatus = Array.from(statusCountMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Phân bố theo cấp
    const levelCountMap = new Map<string, number>();
    projects.forEach(p => {
      const lv = p.level === 'Nhà nước' || p.level === 'NATIONAL' ? 'Cấp Nhà nước'
        : p.level === 'Bộ' || p.level === 'MINISTRY' ? 'Cấp Bộ'
        : p.level === 'Học viện' || p.level === 'ACADEMY' ? 'Cấp Học viện'
        : p.level === 'Cơ sở' ? 'Cấp Cơ sở'
        : p.level || 'Khác';
      levelCountMap.set(lv, (levelCountMap.get(lv) || 0) + 1);
    });
    const byLevel = Array.from(levelCountMap.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    // Xu hướng theo năm (từ dữ liệu thực)
    const yearCountMap = new Map<number, number>();
    projects.forEach(p => {
      if (p.year) yearCountMap.set(p.year, (yearCountMap.get(p.year) || 0) + 1);
    });
    const trend = Array.from(yearCountMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    return NextResponse.json({ total, publications, byStatus, byLevel, trend });
  } catch (error) {
    console.error('Research stats error:', error);
    return NextResponse.json({ error: 'Lỗi lấy thống kê nghiên cứu' }, { status: 500 });
  }
}
