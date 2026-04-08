/**
 * Personnel Statistics API
 * Thống kê tổng quan từ bảng personnel (CSDL chính)
 * Kết hợp dữ liệu từ officer_careers và soldier_profiles
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    // === TỔNG QUAN – từ bảng personnel ===
    const total = await prisma.personnel.count({ where: { deletedAt: null } });

    // Trạng thái công tác (PersonnelStatus)
    const statusCounts = await prisma.personnel.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    const statusLabels: Record<string, string> = {
      DANG_CONG_TAC: 'Đang công tác',
      CHUYEN_CONG_TAC: 'Chuyển công tác',
      NGHI_HUU: 'Nghỉ hưu',
      PHỤC_VỤ_HẾT_HẠN: 'Hết hạn phục vụ',
      XUAT_NGU: 'Xuất ngũ',
      HY_SINH: 'Hy sinh',
      TU_TRAN: 'Tử trận',
    };

    const active = statusCounts.find(s => s.status === 'DANG_CONG_TAC')?._count || 0;
    const byWorkStatus = statusCounts.map(item => ({
      status: String(item.status || 'UNKNOWN'),
      count: item._count,
      label: statusLabels[String(item.status)] || String(item.status) || 'Khác',
    }));

    // Retired/transferred fallback from officer promotions
    const retired = statusCounts.find(s => s.status === 'NGHI_HUU')?._count || 0;
    const transferred = statusCounts.find(s => s.status === 'CHUYEN_CONG_TAC')?._count || 0;
    const suspended = 0;
    const resigned = statusCounts.find(s => String(s.status) === 'XUAT_NGU')?._count || 0;

    const totalUnits = await prisma.unit.count();

    // === LOẠI CÁN BỘ (category) ===
    const categoryCounts = await prisma.personnel.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _count: true,
    });

    const categoryLabels: Record<string, string> = {
      CAN_BO_CHI_HUY: 'Sĩ quan',
      HOC_VIEN_QUAN_SU: 'Học viên quân sự',
      CONG_NHAN_VIEN: 'Công nhân viên',
      QUAN_NHAN_CHUYEN_NGHIEP: 'QNCN',
    };

    const byPersonnelType = categoryCounts.map(item => ({
      type: String(item.category || 'UNKNOWN'),
      count: item._count,
      label: categoryLabels[String(item.category)] || String(item.category) || 'Khác',
    }));

    // === QUÂN HÀM – từ personnel.militaryRank ===
    const rankCounts = await prisma.personnel.groupBy({
      by: ['militaryRank'],
      where: { deletedAt: null, militaryRank: { not: null } },
      _count: true,
      orderBy: { _count: { militaryRank: 'desc' } },
      take: 12,
    });

    const byRank = rankCounts.map(item => ({
      rank: item.militaryRank || 'Chưa có',
      count: item._count,
    }));

    // === HỌC VỊ – từ personnel.educationLevel ===
    const eduCounts = await prisma.personnel.groupBy({
      by: ['educationLevel'],
      where: { deletedAt: null, educationLevel: { not: null } },
      _count: true,
      orderBy: { _count: { educationLevel: 'desc' } },
    });

    const byEducationLevel = eduCounts.map(item => ({
      level: item.educationLevel || 'Chưa có',
      count: item._count,
    }));

    // === GIỚI TÍNH ===
    const genderCounts = await prisma.personnel.groupBy({
      by: ['gender'],
      where: { deletedAt: null },
      _count: true,
    });

    const byGender = genderCounts.map(item => ({
      gender: item.gender === 'Nam' ? 'Nam' : item.gender === 'Nữ' ? 'Nữ' : 'Khác',
      count: item._count,
    }));

    // === ĐƠN VỊ (TOP 10) ===
    const unitCounts = await prisma.personnel.groupBy({
      by: ['unitId'],
      where: { deletedAt: null, unitId: { not: null } },
      _count: true,
      orderBy: { _count: { unitId: 'desc' } },
      take: 10,
    });

    const unitIds = unitCounts.map(u => u.unitId).filter((id): id is string => id !== null);
    const units = unitIds.length > 0
      ? await prisma.unit.findMany({
          where: { id: { in: unitIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const unitMap = new Map(units.map(u => [u.id, u]));
    const byUnit = unitCounts
      .filter(item => item.unitId !== null)
      .map(item => {
        const unit = unitMap.get(item.unitId || '');
        return {
          unitId: item.unitId || '',
          unitName: unit?.name || 'Chưa phân',
          unitCode: unit?.code || 'N/A',
          count: item._count,
        };
      });

    // === VAI TRÒ HỆ THỐNG (từ users) ===
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
      orderBy: { _count: { role: 'desc' } },
    });

    const roleLabels: Record<string, string> = {
      QUAN_TRI_HE_THONG: 'Quản trị HT',
      CHI_HUY_HOC_VIEN: 'Chỉ huy HV',
      CHI_HUY_KHOA: 'Chỉ huy Khoa',
      CHU_NHIEM_BO_MON: 'CN Bộ môn',
      GIANG_VIEN: 'Giảng viên',
      CAN_BO: 'Cán bộ',
      HOC_VIEN: 'Học viên',
    };

    const byRole = roleCounts.map(item => ({
      role: item.role,
      count: item._count,
      label: roleLabels[item.role] || item.role,
    }));

    // === PHÂN BỐ TUỔI – từ personnel ===
    const personnelDOB = await prisma.personnel.findMany({
      select: { dateOfBirth: true },
      where: { deletedAt: null, dateOfBirth: { not: null } },
    });

    const now = new Date();
    const ageRanges = [
      { range: 'Dưới 30 tuổi', min: 0, max: 29, count: 0 },
      { range: '30 - 39 tuổi', min: 30, max: 39, count: 0 },
      { range: '40 - 49 tuổi', min: 40, max: 49, count: 0 },
      { range: '50 - 59 tuổi', min: 50, max: 59, count: 0 },
      { range: 'Trên 60 tuổi', min: 60, max: 200, count: 0 },
    ];

    personnelDOB.forEach(p => {
      if (p.dateOfBirth) {
        const age = now.getFullYear() - p.dateOfBirth.getFullYear();
        const range = ageRanges.find(r => age >= r.min && age <= r.max);
        if (range) range.count++;
      }
    });

    const ageDistribution = ageRanges.map(r => ({ range: r.range, count: r.count }));

    // === DIỆN QUẢN LÝ – từ bảng chuyên biệt ===
    const [officerCount, soldierCount, partyMemberCount] = await Promise.all([
      prisma.officerCareer.count(),
      prisma.soldierProfile.count(),
      prisma.partyMember.count({ where: { deletedAt: null } }),
    ]);

    const byManagementCategory = [
      { category: 'CAN_BO', count: officerCount, label: 'Diện Cán bộ quản lý' },
      { category: 'QUAN_LUC', count: soldierCount, label: 'Diện Quân lực quản lý' },
    ].filter(item => item.count > 0);

    // === DIỆN QUẢN LÝ (managingOrgan) ===
    const managingOrganCounts = await prisma.personnel.groupBy({
      by: ['managingOrgan'],
      where: { deletedAt: null },
      _count: true,
    });

    const organLabels: Record<string, string> = {
      BAN_CAN_BO: 'Ban Cán bộ',
      BAN_QUAN_LUC: 'Ban Quân lực',
    };

    const byManagementLevel = managingOrganCounts
      .filter(item => item.managingOrgan !== null)
      .map(item => ({
        level: String(item.managingOrgan),
        count: item._count,
        label: organLabels[String(item.managingOrgan)] || String(item.managingOrgan),
      }));

    return NextResponse.json({
      summary: {
        total,
        active,
        retired,
        transferred,
        suspended,
        resigned,
        totalUnits,
        officerCount,
        soldierCount,
        partyMemberCount,
      },
      byWorkStatus,
      byPersonnelType,
      byRank,
      byEducationLevel,
      byGender,
      byUnit,
      byRole,
      ageDistribution,
      byManagementCategory,
      byManagementLevel,
    });
  } catch (error: any) {
    console.error('[Personnel Stats]', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thống kê: ' + error.message },
      { status: 500 }
    );
  }
}
