/**
 * API: Insurance Benefits - Quản lý quyền lợi BHXH
 * Theo dõi các khoản hưởng BHXH của cán bộ
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  SICK_LEAVE: 'Ốm đau',
  MATERNITY: 'Thai sản',
  RETIREMENT: 'Hưu trí',
  DEATH: 'Tử tuất',
  OCCUPATIONAL: 'TNLĐ/BNN',
  UNEMPLOYMENT: 'Thất nghiệp',
  OTHER: 'Khác',
};

// Benefit calculation formulas
const BENEFIT_FORMULAS = {
  SICK_LEAVE: (baseSalary: number, days: number, insuranceYears: number) => {
    // Nghỉ ốm: 75% lương đóng BHXH x số ngày nghỉ (max 30 ngày/năm cho < 15 năm đóng)
    const rate = insuranceYears >= 30 ? 0.75 : insuranceYears >= 15 ? 0.65 : 0.55;
    return Math.round(baseSalary / 26 * days * rate);
  },
  MATERNITY: (baseSalary: number, days: number) => {
    // Thai sản: 100% lương đóng BHXH x số tháng (6 tháng cho sinh thường)
    return Math.round(baseSalary * 6);
  },
  OCCUPATIONAL: (baseSalary: number, disabilityRate: number) => {
    // TNLĐ/BNN: phụ thuộc mức suy giảm khả năng lao động
    if (disabilityRate >= 81) return Math.round(baseSalary * 36);
    if (disabilityRate >= 61) return Math.round(baseSalary * 24);
    if (disabilityRate >= 31) return Math.round(baseSalary * 12);
    return Math.round(baseSalary * 6);
  },
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const unitId = searchParams.get('unitId') || '';
    const benefitType = searchParams.get('benefitType') || '';
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
      transactionType: 'BENEFIT',
    };

    if (year) where.periodYear = parseInt(year);
    if (benefitType) where.benefitType = benefitType;

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

    const [records, total, totals, byType] = await Promise.all([
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
        _sum: { amount: true },
        _count: true,
      }),
      prisma.insuranceHistory.groupBy({
        by: ['benefitType'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_BENEFIT',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      records: records.map(r => ({
        ...r,
        benefitTypeLabel: BENEFIT_TYPE_LABELS[r.benefitType || ''] || r.benefitType,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        totalAmount: totals._sum?.amount ? Number(totals._sum.amount) : 0,
        recordCount: totals._count,
        byType: byType.map(b => ({
          type: b.benefitType,
          label: BENEFIT_TYPE_LABELS[b.benefitType || ''] || b.benefitType,
          amount: b._sum?.amount ? Number(b._sum.amount) : 0,
          count: b._count,
        })),
      },
      benefitTypes: Object.entries(BENEFIT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    });
  } catch (error) {
    console.error('[InsuranceBenefits GET]', error);
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
      benefitType,
      periodMonth,
      periodYear,
      baseSalary,
      amount,
      benefitPeriod,
      benefitReason,
      documentNumber,
      documentDate,
      notes,
    } = body;

    // Validate insuranceInfo exists
    const insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { id: insuranceInfoId },
    });
    if (!insuranceInfo) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ bảo hiểm' }, { status: 404 });
    }

    const record = await prisma.insuranceHistory.create({
      data: {
        insuranceInfoId,
        transactionType: 'BENEFIT',
        benefitType,
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear),
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        amount: parseFloat(amount),
        benefitPeriod: benefitPeriod ? parseInt(benefitPeriod) : null,
        benefitReason,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : null,
        notes,
      },
      include: {
        insuranceInfo: {
          include: {
            user: { select: { name: true, militaryId: true } },
          },
        },
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_BENEFIT',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[InsuranceBenefits POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const { id, ...data } = body;

    const existing = await prisma.insuranceHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    const record = await prisma.insuranceHistory.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : undefined,
        documentDate: data.documentDate ? new Date(data.documentDate) : undefined,
      },
      include: {
        insuranceInfo: {
          include: {
            user: { select: { name: true, militaryId: true } },
          },
        },
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'INSURANCE_BENEFIT',
      resourceId: record.id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[InsuranceBenefits PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.DELETE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const existing = await prisma.insuranceHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    await prisma.insuranceHistory.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: currentUser.id },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.DELETE,
      action: 'DELETE',
      resourceType: 'INSURANCE_BENEFIT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[InsuranceBenefits DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
