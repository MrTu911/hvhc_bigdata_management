/**
 * API Thống kê CSDL Chế độ Chính sách
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { POLICY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, POLICY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy dữ liệu chế độ chính sách
    const policyRecords = await prisma.policyRecord.findMany();

    const total = policyRecords.length;
    
    // Đếm theo trạng thái ACTIVE/EXPIRED/VOIDED
    const pending = policyRecords.filter(p => p.status === 'ACTIVE').length;

    // Phân bố theo loại (recordType)
    const typeCountMap = new Map<string, number>();
    policyRecords.forEach(r => {
      const type = r.recordType || 'Khác';
      typeCountMap.set(type, (typeCountMap.get(type) || 0) + 1);
    });
    const byType = Array.from(typeCountMap.entries())
      .map(([type, count]) => ({ type, count }))
      .slice(0, 8);

    // Phân bố theo trạng thái
    const statusCountMap = new Map<string, number>();
    policyRecords.forEach(r => {
      const status = r.status;
      const statusLabel = status === 'ACTIVE' ? 'Hoạt động' 
        : status === 'EXPIRED' ? 'Hết hạn' 
        : status === 'VOIDED' ? 'Hủy bỏ' 
        : 'Khác';
      statusCountMap.set(statusLabel, (statusCountMap.get(statusLabel) || 0) + 1);
    });
    const byStatus = Array.from(statusCountMap.entries())
      .map(([status, count]) => ({ status, count }));

    return NextResponse.json({
      total,
      pending,
      byType,
      byStatus,
    });
  } catch (error) {
    console.error('Policy stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê chế độ chính sách' },
      { status: 500 }
    );
  }
}
