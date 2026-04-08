/**
 * API: Insurance Contributions - Quản lý đóng góp BHXH
 * Tính theo bảng lương quân đội theo cấp bậc
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';
import { Decimal } from '@prisma/client/runtime/library';

// Hệ số lương theo cấp bậc quân hàm (chuẩn 2024)
const RANK_SALARY_COEFFICIENTS: Record<string, number> = {
  'Đại tướng': 10.4,
  'Thượng tướng': 9.8,
  'Trung tướng': 9.2,
  'Thiếu tướng': 8.6,
  'Đại tá': 8.0,
  'Thượng tá': 7.3,
  'Trung tá': 6.6,
  'Thiếu tá': 6.0,
  'Đại úy': 5.4,
  'Thượng úy': 4.8,
  'Trung úy': 4.2,
  'Thiếu úy': 3.6,
  'Thượng sĩ': 3.2,
  'Trung sĩ': 2.8,
  'Hạ sĩ': 2.4,
  'Binh nhất': 2.0,
  'Binh nhì': 1.8,
};

// Mức lương cơ sở hiện hành (VND)
const BASE_SALARY = 1_800_000;

// Tỷ lệ đóng BHXH
const INSURANCE_RATES = {
  bhxh: 0.08,        // BHXH: 8% người lao động
  bhxh_employer: 0.175, // BHXH: 17.5% người sử dụng lao động
  bhyt: 0.015,       // BHYT: 1.5% người lao động
  bhyt_employer: 0.03, // BHYT: 3% người sử dụng lao động
  bhtn: 0.01,        // BHTN: 1% người lao động
  bhtn_employer: 0.01, // BHTN: 1% người sử dụng lao động
};

function calculateInsuranceAmount(rank: string, seniorityYears: number = 0) {
  const coefficient = RANK_SALARY_COEFFICIENTS[rank] || 3.0;
  const seniorityAllowance = Math.min(seniorityYears, 25) * 0.01; // Max 25%
  const totalCoefficient = coefficient * (1 + seniorityAllowance);
  const salary = Math.round(BASE_SALARY * totalCoefficient);
  
  const employeeShare = Math.round(salary * (INSURANCE_RATES.bhxh + INSURANCE_RATES.bhyt + INSURANCE_RATES.bhtn));
  const employerShare = Math.round(salary * (INSURANCE_RATES.bhxh_employer + INSURANCE_RATES.bhyt_employer + INSURANCE_RATES.bhtn_employer));
  
  return {
    baseSalary: salary,
    employeeShare,
    employerShare,
    totalContribution: employeeShare + employerShare,
    breakdown: {
      bhxh: Math.round(salary * INSURANCE_RATES.bhxh),
      bhyt: Math.round(salary * INSURANCE_RATES.bhyt),
      bhtn: Math.round(salary * INSURANCE_RATES.bhtn),
      bhxh_employer: Math.round(salary * INSURANCE_RATES.bhxh_employer),
      bhyt_employer: Math.round(salary * INSURANCE_RATES.bhyt_employer),
      bhtn_employer: Math.round(salary * INSURANCE_RATES.bhtn_employer),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const unitId = searchParams.get('unitId') || '';
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
      transactionType: 'CONTRIBUTION',
    };

    if (year) where.periodYear = parseInt(year);
    if (month) where.periodMonth = parseInt(month);

    if (search || unitId) {
      where.insuranceInfo = {
        user: {
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { militaryId: { contains: search, mode: 'insensitive' } },
            ],
          } : {}),
          ...(unitId ? { unitId } : {}),
        },
      };
    }

    const [records, total, totals] = await Promise.all([
      prisma.insuranceHistory.findMany({
        where,
        include: {
          insuranceInfo: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  militaryId: true,
                  rank: true,
                  position: true,
                  unitRelation: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insuranceHistory.count({ where }),
      prisma.insuranceHistory.aggregate({
        where,
        _sum: {
          amount: true,
          employeeShare: true,
          employerShare: true,
        },
        _count: true,
      }),
    ]);

    // Monthly summary
    const monthlyData = await prisma.insuranceHistory.groupBy({
      by: ['periodMonth'],
      where: { ...where, periodYear: parseInt(year) },
      _sum: { amount: true },
      _count: true,
      orderBy: { periodMonth: 'asc' },
    });

    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_CONTRIBUTION',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      records,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        totalAmount: totals._sum?.amount ? Number(totals._sum.amount) : 0,
        employeeTotal: totals._sum?.employeeShare ? Number(totals._sum.employeeShare) : 0,
        employerTotal: totals._sum?.employerShare ? Number(totals._sum.employerShare) : 0,
        recordCount: totals._count,
      },
      monthlyData: monthlyData.map(m => ({
        month: m.periodMonth,
        amount: m._sum?.amount ? Number(m._sum.amount) : 0,
        count: m._count,
      })),
      salaryTable: Object.entries(RANK_SALARY_COEFFICIENTS).map(([rank, coef]) => ({
        rank,
        coefficient: coef,
        ...calculateInsuranceAmount(rank),
      })),
    });
  } catch (error) {
    console.error('[InsuranceContributions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const {
      insuranceInfoId,
      periodMonth,
      periodYear,
      baseSalary,
      amount,
      employeeShare,
      employerShare,
      documentNumber,
      documentDate,
      notes,
    } = body;

    // Validate insuranceInfo exists
    const insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { id: insuranceInfoId },
      include: { user: { select: { rank: true } } },
    });
    if (!insuranceInfo) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ bảo hiểm' }, { status: 404 });
    }

    // Auto calculate if not provided
    let finalData = { baseSalary, amount, employeeShare, employerShare };
    if (!amount && insuranceInfo.user?.rank) {
      const calc = calculateInsuranceAmount(insuranceInfo.user.rank);
      finalData = {
        baseSalary: calc.baseSalary,
        amount: calc.totalContribution,
        employeeShare: calc.employeeShare,
        employerShare: calc.employerShare,
      };
    }

    const record = await prisma.insuranceHistory.create({
      data: {
        insuranceInfoId,
        transactionType: 'CONTRIBUTION',
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear),
        baseSalary: finalData.baseSalary,
        amount: finalData.amount,
        employeeShare: finalData.employeeShare,
        employerShare: finalData.employerShare,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : null,
        notes,
      },
      include: {
        insuranceInfo: {
          include: {
            user: { select: { name: true, militaryId: true, rank: true } },
          },
        },
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_CONTRIBUTION',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[InsuranceContributions POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch create contributions for all personnel in a unit
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const { unitId, periodMonth, periodYear, documentNumber, documentDate } = body;

    // Get all users in unit with insurance info
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(unitId ? { unitId } : {}),
        insuranceInfo: { isNot: null },
      },
      include: {
        insuranceInfo: true,
      },
    });

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.insuranceInfo) {
        skipped++;
        continue;
      }

      // Check if already exists
      const existing = await prisma.insuranceHistory.findFirst({
        where: {
          insuranceInfoId: user.insuranceInfo.id,
          transactionType: 'CONTRIBUTION',
          periodMonth: parseInt(periodMonth),
          periodYear: parseInt(periodYear),
          deletedAt: null,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const calc = calculateInsuranceAmount(user.rank || 'Trung úy');

      await prisma.insuranceHistory.create({
        data: {
          insuranceInfoId: user.insuranceInfo.id,
          transactionType: 'CONTRIBUTION',
          periodMonth: parseInt(periodMonth),
          periodYear: parseInt(periodYear),
          baseSalary: calc.baseSalary,
          amount: calc.totalContribution,
          employeeShare: calc.employeeShare,
          employerShare: calc.employerShare,
          documentNumber,
          documentDate: documentDate ? new Date(documentDate) : null,
        },
      });
      created++;
    }

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'BATCH_CREATE',
      resourceType: 'INSURANCE_CONTRIBUTION',
      newValue: { unitId, periodMonth, periodYear, created, skipped },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `Đã tạo ${created} bản ghi đóng góp, bỏ qua ${skipped} bản ghi`,
    });
  } catch (error) {
    console.error('[InsuranceContributions PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
