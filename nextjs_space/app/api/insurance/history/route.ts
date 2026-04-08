/**
 * API: Insurance History - Lịch sử đóng/hưởng BHXH
 * RBAC v8.8: Cleaned up to use only requireFunction
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

// GET - Lấy lịch sử BHXH
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const insuranceInfoId = searchParams.get('insuranceInfoId');
    const userId = searchParams.get('userId');
    const transactionType = searchParams.get('transactionType');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
      ...(insuranceInfoId && { insuranceInfoId }),
      ...(transactionType && { transactionType }),
      ...(year && { periodYear: parseInt(year, 10) }),
    };

    // If userId, get insuranceInfoId first
    if (userId) {
      const insuranceInfo = await prisma.insuranceInfo.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (insuranceInfo) {
        where.insuranceInfoId = insuranceInfo.id;
      } else {
        return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    const [histories, total] = await Promise.all([
      prisma.insuranceHistory.findMany({
        where,
        include: {
          insuranceInfo: {
            select: {
              id: true,
              insuranceNumber: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.insuranceHistory.count({ where }),
    ]);

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_HISTORY',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      data: histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching insurance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo bản ghi lịch sử mới
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      insuranceInfoId,
      userId, // Alternative to insuranceInfoId
      transactionType,
      periodMonth,
      periodYear,
      baseSalary,
      amount,
      employeeShare,
      employerShare,
      benefitType,
      benefitReason,
      benefitPeriod,
      documentNumber,
      documentDate,
      notes,
    } = body;

    // Validate required fields
    if (!transactionType || !periodMonth || !periodYear || amount === undefined) {
      return NextResponse.json(
        { error: 'transactionType, periodMonth, periodYear và amount là bắt buộc' },
        { status: 400 }
      );
    }

    // Get or create insuranceInfoId
    let targetInsuranceInfoId = insuranceInfoId;
    if (!targetInsuranceInfoId && userId) {
      const insuranceInfo = await prisma.insuranceInfo.findFirst({
        where: { userId },
      });
      if (insuranceInfo) {
        targetInsuranceInfoId = insuranceInfo.id;
      } else {
        return NextResponse.json(
          { error: 'Không tìm thấy thông tin bảo hiểm của người dùng' },
          { status: 400 }
        );
      }
    }

    if (!targetInsuranceInfoId) {
      return NextResponse.json(
        { error: 'insuranceInfoId hoặc userId là bắt buộc' },
        { status: 400 }
      );
    }

    const history = await prisma.insuranceHistory.create({
      data: {
        insuranceInfoId: targetInsuranceInfoId,
        transactionType,
        periodMonth,
        periodYear,
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        amount: parseFloat(amount),
        employeeShare: employeeShare ? parseFloat(employeeShare) : null,
        employerShare: employerShare ? parseFloat(employerShare) : null,
        benefitType,
        benefitReason,
        benefitPeriod,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : null,
        notes,
      },
      include: {
        insuranceInfo: {
          select: {
            id: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.CREATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_HISTORY',
      resourceId: history.id,
      newValue: history,
      result: 'SUCCESS',
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật bản ghi
export async function PUT(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const oldHistory = await prisma.insuranceHistory.findUnique({ where: { id } });
    if (!oldHistory || oldHistory.deletedAt) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    // Parse decimal fields
    const parsedData: any = { ...updateData };
    if (updateData.baseSalary !== undefined) {
      parsedData.baseSalary = updateData.baseSalary ? parseFloat(updateData.baseSalary) : null;
    }
    if (updateData.amount !== undefined) {
      parsedData.amount = parseFloat(updateData.amount);
    }
    if (updateData.employeeShare !== undefined) {
      parsedData.employeeShare = updateData.employeeShare ? parseFloat(updateData.employeeShare) : null;
    }
    if (updateData.employerShare !== undefined) {
      parsedData.employerShare = updateData.employerShare ? parseFloat(updateData.employerShare) : null;
    }
    if (updateData.documentDate !== undefined) {
      parsedData.documentDate = updateData.documentDate ? new Date(updateData.documentDate) : null;
    }

    const history = await prisma.insuranceHistory.update({
      where: { id },
      data: parsedData,
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'INSURANCE_HISTORY',
      resourceId: history.id,
      oldValue: oldHistory,
      newValue: history,
      result: 'SUCCESS',
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error updating insurance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa bản ghi (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // RBAC check
    const authResult = await requireFunction(request, INSURANCE.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const oldHistory = await prisma.insuranceHistory.findUnique({ where: { id } });
    if (!oldHistory || oldHistory.deletedAt) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    await prisma.insuranceHistory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user!.id,
      },
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.DELETE,
      action: 'DELETE',
      resourceType: 'INSURANCE_HISTORY',
      resourceId: id,
      oldValue: oldHistory,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Đã xóa bản ghi' });
  } catch (error) {
    console.error('Error deleting insurance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
