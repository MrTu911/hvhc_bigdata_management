/**
 * API: Insurance Stats - Thống kê bảo hiểm toàn diện
 * RBAC v8.8: Cleaned up to use only requireFunction
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const unitId = searchParams.get('unitId') || '';

    // Build unit filter for user-related queries
    const userUnitFilter = unitId ? { user: { unitId } } : {};

    // Run all queries in parallel
    const [
      totalInsuranceInfo,
      totalContributions,
      totalBenefits,
      totalDependents,
      totalClaims,
      pendingClaims,
      contributionsByMonth,
      benefitsByType,
      dependentsByRelationship,
      claimsByStatus,
      claimsByType,
      byUnit,
      medicalFacilities,
      expiringInsurance,
    ] = await Promise.all([
      // Tổng số hồ sơ BHXH
      prisma.insuranceInfo.count({
        where: { deletedAt: null, ...userUnitFilter },
      }),
      
      // Tổng tiền đóng BHXH trong năm
      prisma.insuranceHistory.aggregate({
        where: {
          transactionType: 'CONTRIBUTION',
          periodYear: parseInt(year, 10),
          deletedAt: null,
          insuranceInfo: userUnitFilter,
        },
        _sum: { amount: true, employeeShare: true, employerShare: true },
        _count: true,
      }),
      
      // Tổng tiền hưởng BHXH trong năm
      prisma.insuranceHistory.aggregate({
        where: {
          transactionType: 'BENEFIT',
          periodYear: parseInt(year, 10),
          deletedAt: null,
          insuranceInfo: userUnitFilter,
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Tổng số người phụ thuộc
      prisma.insuranceDependent.count({ 
        where: { deletedAt: null, status: 'ACTIVE', insuranceInfo: userUnitFilter } 
      }),

      // Tổng số yêu cầu chế độ
      prisma.insuranceClaim.count({
        where: { deletedAt: null, insuranceInfo: userUnitFilter },
      }),

      // Yêu cầu đang chờ xử lý
      prisma.insuranceClaim.count({
        where: { 
          deletedAt: null, 
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
          insuranceInfo: userUnitFilter,
        },
      }),
      
      // Đóng BHXH theo tháng
      prisma.insuranceHistory.groupBy({
        by: ['periodMonth'],
        where: {
          transactionType: 'CONTRIBUTION',
          periodYear: parseInt(year, 10),
          deletedAt: null,
          insuranceInfo: userUnitFilter,
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { periodMonth: 'asc' },
      }),
      
      // Hưởng BHXH theo loại
      prisma.insuranceHistory.groupBy({
        by: ['benefitType'],
        where: {
          transactionType: 'BENEFIT',
          periodYear: parseInt(year, 10),
          deletedAt: null,
          benefitType: { not: null },
          insuranceInfo: userUnitFilter,
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Người phụ thuộc theo quan hệ
      prisma.insuranceDependent.groupBy({
        by: ['relationship'],
        where: { deletedAt: null, status: 'ACTIVE', insuranceInfo: userUnitFilter },
        _count: true,
      }),

      // Yêu cầu theo trạng thái
      prisma.insuranceClaim.groupBy({
        by: ['status'],
        where: { deletedAt: null, insuranceInfo: userUnitFilter },
        _count: true,
        _sum: { amount: true },
      }),

      // Yêu cầu theo loại
      prisma.insuranceClaim.groupBy({
        by: ['claimType'],
        where: { 
          deletedAt: null,
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
          insuranceInfo: userUnitFilter,
        },
        _count: true,
        _sum: { amount: true },
      }),

      // Thống kê theo đơn vị
      prisma.$queryRaw`
        SELECT 
          u.name as "unitName",
          u.id as "unitId",
          COUNT(DISTINCT ii.id)::int as "insuranceCount",
          COUNT(DISTINCT id2.id)::int as "dependentCount",
          COALESCE(SUM(CASE WHEN ih."transactionType" = 'CONTRIBUTION' THEN ih.amount ELSE 0 END), 0)::float as "totalContributions"
        FROM units u
        LEFT JOIN users usr ON usr."unitId" = u.id AND usr.status = 'ACTIVE'
        LEFT JOIN insurance_infos ii ON ii."userId" = usr.id AND ii."deletedAt" IS NULL
        LEFT JOIN insurance_dependents id2 ON id2."insuranceInfoId" = ii.id AND id2."deletedAt" IS NULL
        LEFT JOIN insurance_histories ih ON ih."insuranceInfoId" = ii.id 
          AND ih."deletedAt" IS NULL 
          AND ih."periodYear" = ${parseInt(year)}
        WHERE u.active = true AND u.level = 1
        GROUP BY u.id, u.name
        ORDER BY "insuranceCount" DESC
        LIMIT 20
      `,

      // Cơ sở y tế
      prisma.medicalFacility.count({ where: { deletedAt: null, isActive: true } }),

      // Thẻ BHYT sắp hết hạn (trong 30 ngày)
      prisma.insuranceInfo.count({
        where: {
          deletedAt: null,
          healthInsuranceEndDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          ...userUnitFilter,
        },
      }),
    ]);

    // Format data
    const monthlyContributions = Array.from({ length: 12 }, (_, i) => {
      const monthData = contributionsByMonth.find((m: any) => m.periodMonth === i + 1);
      return {
        month: i + 1,
        amount: monthData?._sum?.amount ? Number(monthData._sum.amount) : 0,
        count: monthData?._count || 0,
      };
    });

    const benefitTypeLabels: Record<string, string> = {
      SICK_LEAVE: 'Ốm đau',
      MATERNITY: 'Thai sản',
      RETIREMENT: 'Hưu trí',
      DEATH: 'Tử tuất',
      OCCUPATIONAL: 'TNLL/BNN',
      UNEMPLOYMENT: 'Thất nghiệp',
      OTHER: 'Khác',
    };

    const benefitsByTypeFormatted = benefitsByType.map((b: any) => ({
      type: b.benefitType,
      label: benefitTypeLabels[b.benefitType] || b.benefitType,
      amount: b._sum?.amount ? Number(b._sum.amount) : 0,
      count: b._count,
    }));

    const relationshipLabels: Record<string, string> = {
      SPOUSE: 'Vợ/Chồng',
      CHILD: 'Con',
      PARENT: 'Cha/Mẹ',
      SIBLING: 'Anh/Chị/Em',
      GRANDPARENT: 'Ông/Bà',
      OTHER: 'Khác',
    };

    const dependentsByRelationshipFormatted = dependentsByRelationship.map((d: any) => ({
      relationship: d.relationship,
      label: relationshipLabels[d.relationship] || d.relationship,
      count: d._count,
    }));

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_STATS',
      result: 'SUCCESS',
    });

    const claimTypeLabels: Record<string, string> = {
      SICK_LEAVE: 'Ốm đau',
      MATERNITY: 'Thai sản',
      OCCUPATIONAL_DISEASE: 'Bệnh nghề nghiệp',
      WORK_ACCIDENT: 'Tai nạn lao động',
      RETIREMENT: 'Hưu trí',
      SURVIVORSHIP: 'Tử tuất',
      UNEMPLOYMENT: 'Thất nghiệp',
      MEDICAL_EXPENSE: 'Chi phí KCB',
      OTHER: 'Khác',
    };

    const claimStatusLabels: Record<string, string> = {
      DRAFT: 'Nháp',
      PENDING: 'Chờ duyệt',
      UNDER_REVIEW: 'Đang xét duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      PAID: 'Đã chi trả',
      CANCELLED: 'Đã hủy',
    };

    return NextResponse.json({
      year: parseInt(year, 10),
      summary: {
        totalInsuranceInfo,
        totalContributions: {
          amount: totalContributions._sum?.amount ? Number(totalContributions._sum.amount) : 0,
          employeeShare: totalContributions._sum?.employeeShare ? Number(totalContributions._sum.employeeShare) : 0,
          employerShare: totalContributions._sum?.employerShare ? Number(totalContributions._sum.employerShare) : 0,
          count: totalContributions._count,
        },
        totalBenefits: {
          amount: totalBenefits._sum?.amount ? Number(totalBenefits._sum.amount) : 0,
          count: totalBenefits._count,
        },
        totalDependents,
        totalClaims,
        pendingClaims,
        medicalFacilities,
        expiringInsurance,
      },
      monthlyContributions,
      benefitsByType: benefitsByTypeFormatted,
      dependentsByRelationship: dependentsByRelationshipFormatted,
      claimsByStatus: claimsByStatus.map((c: any) => ({
        status: c.status,
        label: claimStatusLabels[c.status] || c.status,
        count: c._count,
        amount: c._sum?.amount ? Number(c._sum.amount) : 0,
      })),
      claimsByType: claimsByType.map((c: any) => ({
        type: c.claimType,
        label: claimTypeLabels[c.claimType] || c.claimType,
        count: c._count,
        amount: c._sum?.amount ? Number(c._sum.amount) : 0,
      })),
      byUnit: byUnit as any[],
    });
  } catch (error) {
    console.error('Error fetching insurance stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
