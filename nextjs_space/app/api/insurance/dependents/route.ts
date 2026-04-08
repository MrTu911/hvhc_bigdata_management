/**
 * API: Insurance Dependents - Người phụ thuộc BHXH
 * RBAC v8.8: Cleaned up to use only requireFunction
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách người phụ thuộc
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
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      deletedAt: null,
      ...(insuranceInfoId && { insuranceInfoId }),
      ...(status && { status }),
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
        return NextResponse.json([]);
      }
    }

    const dependents = await prisma.insuranceDependent.findMany({
      where,
      include: {
        insuranceInfo: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_DEPENDENT',
      result: 'SUCCESS',
    });

    return NextResponse.json(dependents);
  } catch (error) {
    console.error('Error fetching insurance dependents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Thêm người phụ thuộc
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
      userId, // Alternative
      fullName,
      relationship,
      dateOfBirth,
      gender,
      citizenId,
      healthInsuranceNumber,
      healthInsuranceStartDate,
      healthInsuranceEndDate,
      healthInsuranceHospital,
      documentNumber,
      documentDate,
      notes,
    } = body;

    // Validate required fields
    if (!fullName || !relationship) {
      return NextResponse.json(
        { error: 'fullName và relationship là bắt buộc' },
        { status: 400 }
      );
    }

    // Get insuranceInfoId
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

    const dependent = await prisma.insuranceDependent.create({
      data: {
        insuranceInfoId: targetInsuranceInfoId,
        fullName,
        relationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        citizenId,
        healthInsuranceNumber,
        healthInsuranceStartDate: healthInsuranceStartDate ? new Date(healthInsuranceStartDate) : null,
        healthInsuranceEndDate: healthInsuranceEndDate ? new Date(healthInsuranceEndDate) : null,
        healthInsuranceHospital,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : null,
        notes,
      },
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.CREATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_DEPENDENT',
      resourceId: dependent.id,
      newValue: dependent,
      result: 'SUCCESS',
    });

    return NextResponse.json(dependent, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance dependent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật người phụ thuộc
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

    const oldDependent = await prisma.insuranceDependent.findUnique({ where: { id } });
    if (!oldDependent || oldDependent.deletedAt) {
      return NextResponse.json({ error: 'Không tìm thấy người phụ thuộc' }, { status: 404 });
    }

    // Parse date fields
    const parsedData: any = { ...updateData };
    ['dateOfBirth', 'healthInsuranceStartDate', 'healthInsuranceEndDate', 'documentDate'].forEach((field) => {
      if (updateData[field] !== undefined) {
        parsedData[field] = updateData[field] ? new Date(updateData[field]) : null;
      }
    });

    const dependent = await prisma.insuranceDependent.update({
      where: { id },
      data: parsedData,
    });

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'INSURANCE_DEPENDENT',
      resourceId: dependent.id,
      oldValue: oldDependent,
      newValue: dependent,
      result: 'SUCCESS',
    });

    return NextResponse.json(dependent);
  } catch (error) {
    console.error('Error updating insurance dependent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa người phụ thuộc (soft delete)
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

    const oldDependent = await prisma.insuranceDependent.findUnique({ where: { id } });
    if (!oldDependent || oldDependent.deletedAt) {
      return NextResponse.json({ error: 'Không tìm thấy người phụ thuộc' }, { status: 404 });
    }

    await prisma.insuranceDependent.update({
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
      resourceType: 'INSURANCE_DEPENDENT',
      resourceId: id,
      oldValue: oldDependent,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Đã xóa người phụ thuộc' });
  } catch (error) {
    console.error('Error deleting insurance dependent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
