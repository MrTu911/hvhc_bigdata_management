/**
 * API: Command Dashboard - Executive Summary
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  // RBAC Check: VIEW_DASHBOARD_COMMAND
  const authResult = await requireFunction(req, DASHBOARD.VIEW_COMMAND);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {

    // ========== CSDL QUÂN NHÂN ==========
    const [totalUsers, activeUsers, usersByRole, usersByWorkStatus] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { workStatus: 'ACTIVE' } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.user.groupBy({
        by: ['workStatus'],
        _count: { id: true }
      })
    ]);

    // Process user counts by role
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate personnel categories
    const totalOfficers = (roleStats['CHI_HUY_HOC_VIEN'] || 0) + 
                          (roleStats['CHI_HUY_KHOA_PHONG'] || 0) +
                          (roleStats['CHU_NHIEM_BO_MON'] || 0);
    const totalInstructors = roleStats['GIANG_VIEN'] || 0;
    const totalStudents = roleStats['HOC_VIEN'] || 0;
    const totalAdmins = (roleStats['QUAN_TRI_HE_THONG'] || 0) + (roleStats['ADMIN'] || 0);

    // ========== CSDL ĐẢNG VIÊN ==========
    const [totalPartyMembers, partyMembersByStatus] = await Promise.all([
      prisma.partyMember.count(),
      prisma.partyMember.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const partyStats = partyMembersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ========== CSDL CHÍNH SÁCH ==========
    const [totalPolicyRecords, policyByType] = await Promise.all([
      prisma.policyRecord.count(),
      prisma.policyRecord.groupBy({
        by: ['recordType'],
        _count: { id: true }
      })
    ]);

    const policyStats = policyByType.reduce((acc, item) => {
      acc[item.recordType] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ========== CSDL BẢO HIỂM XH ==========
    const totalInsurance = await prisma.insuranceInfo.count();

    // ========== CSDL QUÂN Y ==========
    const totalMedical = await prisma.medicalRecord.count();

    // ========== TỔ CHỨC ĐƠN VỊ ==========
    const [totalUnits, unitsByLevel] = await Promise.all([
      prisma.unit.count(),
      prisma.unit.groupBy({
        by: ['level'],
        _count: { id: true }
      })
    ]);

    const unitStats = unitsByLevel.reduce((acc, item) => {
      acc[`level${item.level}`] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ========== CSDL THI ĐUA KHEN THƯỞNG ==========
    const [totalAwards, awardsByType] = await Promise.all([
      prisma.awardsRecord.count(),
      prisma.awardsRecord.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ]);

    const awardStats = awardsByType.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ========== GIẢNG VIÊN & NGHIÊN CỨU ==========
    const [totalFaculty, totalResearch, totalPublications] = await Promise.all([
      prisma.facultyProfile.count(),
      prisma.scientificResearch.count(),
      prisma.scientificPublication.count()
    ]);

    // ========== BUILD RESPONSE ==========
    const summary = {
      // Tổng quan Quân nhân (CSDL #1)
      personnel: {
        total: totalUsers,
        active: activeUsers,
        officers: totalOfficers,
        instructors: totalInstructors,
        students: totalStudents,
        admins: totalAdmins,
        byRole: roleStats,
        byWorkStatus: usersByWorkStatus.reduce((acc, item) => {
          acc[item.workStatus] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      
      // Đảng viên (CSDL #17)
      partyMembers: {
        total: totalPartyMembers,
        coverage: totalUsers > 0 ? Math.round((totalPartyMembers / totalUsers) * 100) : 0,
        byStatus: partyStats
      },
      
      // Chính sách (CSDL #27)
      policy: {
        total: totalPolicyRecords,
        byType: policyStats
      },
      
      // Bảo hiểm XH (CSDL #28)
      insurance: {
        total: totalInsurance,
        coverage: totalUsers > 0 ? Math.round((totalInsurance / totalUsers) * 100) : 0
      },
      
      // Quân y (CSDL #40)
      medical: {
        total: totalMedical,
        coverage: totalUsers > 0 ? Math.round((totalMedical / totalUsers) * 100) : 0
      },
      
      // Tổ chức đơn vị
      units: {
        total: totalUnits,
        byLevel: unitStats
      },
      
      // Thi đua khen thưởng (CSDL #18)
      awards: {
        total: totalAwards,
        byType: awardStats
      },
      
      // Giảng viên & Nghiên cứu
      faculty: {
        total: totalFaculty,
        research: totalResearch,
        publications: totalPublications
      },
      
      // Modules đã xây dựng
      systemModules: [
        { id: 'csdl_quan_nhan', name: 'CSDL Quân nhân', status: 'active', records: totalUsers },
        { id: 'csdl_dang_vien', name: 'CSDL Đảng viên', status: 'active', records: totalPartyMembers },
        { id: 'csdl_chinh_sach', name: 'CSDL Chính sách', status: 'active', records: totalPolicyRecords },
        { id: 'csdl_bao_hiem', name: 'CSDL Bảo hiểm XH', status: 'active', records: totalInsurance },
        { id: 'csdl_quan_y', name: 'CSDL Quân y', status: 'active', records: totalMedical },
        { id: 'csdl_thi_dua', name: 'CSDL Thi đua KT', status: 'active', records: totalAwards },
        { id: 'csdl_giang_vien', name: 'CSDL Giảng viên', status: 'active', records: totalFaculty },
        { id: 'to_chuc_don_vi', name: 'Tổ chức Đơn vị', status: 'active', records: totalUnits }
      ]
    };

    // Log access using audit system
    await logAudit({
      userId: authResult.user!.id,
      functionCode: DASHBOARD.VIEW_COMMAND,
      action: 'VIEW',
      resourceType: 'DASHBOARD',
      resourceId: 'executive-summary',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Command Dashboard Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi tải dữ liệu Dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
