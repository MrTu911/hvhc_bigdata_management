import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Danh sách thông tin bảo hiểm
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const hasInsurance = searchParams.get('hasInsurance'); // 'true', 'false', or ''
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { militaryId: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (hasInsurance === 'true') {
      where.OR = [
        { insuranceNumber: { not: null } },
        { healthInsuranceNumber: { not: null } },
      ];
    } else if (hasInsurance === 'false') {
      where.insuranceNumber = null;
      where.healthInsuranceNumber = null;
    }

    const [records, total] = await Promise.all([
      prisma.insuranceInfo.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              militaryId: true,
              rank: true,
              position: true,
              dateOfBirth: true,
              unitRelation: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insuranceInfo.count({ where }),
    ]);

    // Thống kê
    const [totalUsers, withBHXH, withBHYT] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.insuranceInfo.count({ where: { insuranceNumber: { not: null }, deletedAt: null } }),
      prisma.insuranceInfo.count({ where: { healthInsuranceNumber: { not: null }, deletedAt: null } }),
    ]);

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_INFO',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      data: records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalUsers,
        withBHXH,
        withBHYT,
        coverage: totalUsers > 0 ? Math.round((withBHXH / totalUsers) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('[Insurance GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Thêm thông tin bảo hiểm
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const currentUser = authResult.user!;

    const body = await request.json();
    const {
      userId,
      insuranceNumber,
      insuranceStartDate,
      insuranceEndDate,
      healthInsuranceNumber,
      healthInsuranceStartDate,
      healthInsuranceEndDate,
      healthInsuranceHospital,
      beneficiaryName,
      beneficiaryRelation,
      beneficiaryPhone,
      notes,
    } = body;

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Kiểm tra đã có thông tin bảo hiểm chưa
    const existing = await prisma.insuranceInfo.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'Người dùng đã có thông tin bảo hiểm' }, { status: 409 });
    }

    const record = await prisma.insuranceInfo.create({
      data: {
        userId,
        insuranceNumber,
        insuranceStartDate: insuranceStartDate ? new Date(insuranceStartDate) : null,
        insuranceEndDate: insuranceEndDate ? new Date(insuranceEndDate) : null,
        healthInsuranceNumber,
        healthInsuranceStartDate: healthInsuranceStartDate ? new Date(healthInsuranceStartDate) : null,
        healthInsuranceEndDate: healthInsuranceEndDate ? new Date(healthInsuranceEndDate) : null,
        healthInsuranceHospital,
        beneficiaryName,
        beneficiaryRelation,
        beneficiaryPhone,
        notes,
      },
      include: {
        user: { select: { name: true, militaryId: true } },
      },
    });

    // Audit log
    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_INFO',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[Insurance POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật thông tin bảo hiểm
export async function PUT(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const currentUser = authResult.user!;

    const body = await request.json();
    const { id, ...data } = body;

    // Get existing record for audit
    const existing = await prisma.insuranceInfo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin bảo hiểm' }, { status: 404 });
    }

    const record = await prisma.insuranceInfo.update({
      where: { id },
      data: {
        ...data,
        insuranceStartDate: data.insuranceStartDate ? new Date(data.insuranceStartDate) : undefined,
        insuranceEndDate: data.insuranceEndDate ? new Date(data.insuranceEndDate) : undefined,
        healthInsuranceStartDate: data.healthInsuranceStartDate ? new Date(data.healthInsuranceStartDate) : undefined,
        healthInsuranceEndDate: data.healthInsuranceEndDate ? new Date(data.healthInsuranceEndDate) : undefined,
      },
      include: {
        user: { select: { name: true, militaryId: true } },
      },
    });

    // Audit log
    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'INSURANCE_INFO',
      resourceId: record.id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[Insurance PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
