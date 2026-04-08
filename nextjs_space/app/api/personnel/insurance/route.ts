/**
 * CSDL BHXH/BHYT - Insurance Info API
 * Quản lý thông tin BHXH/BHYT của cán bộ
 * 
 * RBAC Migration: Legacy role checks → Function-based RBAC
 * Features:
 * - Encryption cho insuranceNumber, healthInsuranceNumber, beneficiaryPhone
 * - CRUD với soft delete
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/encryption';

const ENCRYPTED_FIELDS = ['insuranceNumber', 'healthInsuranceNumber', 'beneficiaryPhone'];

function encryptFields(data: any): any {
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

function decryptFields(data: any): any {
  if (!data) return data;
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    if (result[field]) {
      try {
        result[field] = decrypt(result[field]);
      } catch (e) { /* keep original */ }
    }
  }
  return result;
}

/**
 * GET - Lấy thông tin BHXH/BHYT
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: VIEW_INSURANCE
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const total = await prisma.insuranceInfo.count({ where });
    const data = await prisma.insuranceInfo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const decryptedData = data.map(decryptFields);

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_INFO',
      resourceId: userId || 'list',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      data: decryptedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Insurance GET]', error);
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin BHXH/BHYT' }, { status: 500 });
  }
}

/**
 * POST - Tạo thông tin BHXH/BHYT
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: CREATE_INSURANCE
    const authResult = await requireFunction(request, INSURANCE.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { userId, ...insuranceData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    // Check if exists
    const existing = await prisma.insuranceInfo.findFirst({
      where: { userId, deletedAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cán bộ này đã có thông tin BHXH/BHYT' },
        { status: 400 }
      );
    }

    // Encrypt sensitive fields
    const encryptedData = encryptFields(insuranceData);

    // Process dates
    const processedData = {
      ...encryptedData,
      insuranceStartDate: insuranceData.insuranceStartDate ? new Date(insuranceData.insuranceStartDate) : null,
      insuranceEndDate: insuranceData.insuranceEndDate ? new Date(insuranceData.insuranceEndDate) : null,
      healthInsuranceStartDate: insuranceData.healthInsuranceStartDate ? new Date(insuranceData.healthInsuranceStartDate) : null,
      healthInsuranceEndDate: insuranceData.healthInsuranceEndDate ? new Date(insuranceData.healthInsuranceEndDate) : null,
    };

    const insurance = await prisma.insuranceInfo.create({
      data: {
        userId,
        ...processedData,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.CREATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_INFO',
      resourceId: insurance.id,
      newValue: { userId },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Tạo thông tin BHXH/BHYT thành công',
      data: decryptFields(insurance),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Insurance POST]', error);
    return NextResponse.json({ error: 'Lỗi khi tạo thông tin BHXH/BHYT' }, { status: 500 });
  }
}

/**
 * PUT - Cập nhật thông tin BHXH/BHYT
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: UPDATE_INSURANCE
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.insuranceInfo.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    // Encrypt sensitive fields
    const encryptedData = encryptFields(updateData);

    // Process dates
    ['insuranceStartDate', 'insuranceEndDate', 'healthInsuranceStartDate', 'healthInsuranceEndDate'].forEach(field => {
      if (encryptedData[field]) {
        encryptedData[field] = new Date(encryptedData[field]);
      }
    });

    const updated = await prisma.insuranceInfo.update({
      where: { id },
      data: encryptedData,
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'INSURANCE_INFO',
      resourceId: id,
      oldValue: { userId: existing.userId },
      newValue: { userId: updated.userId },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      data: decryptFields(updated),
    });
  } catch (error: any) {
    console.error('[Insurance PUT]', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật' }, { status: 500 });
  }
}

/**
 * DELETE - Xóa mềm thông tin BHXH/BHYT
 */
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check: DELETE_INSURANCE
    const authResult = await requireFunction(request, INSURANCE.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.insuranceInfo.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    await prisma.insuranceInfo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    // Audit log with oldValue
    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.DELETE,
      action: 'DELETE',
      resourceType: 'INSURANCE_INFO',
      resourceId: id,
      oldValue: { userId: existing.userId },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    console.error('[Insurance DELETE]', error);
    return NextResponse.json({ error: 'Lỗi khi xóa' }, { status: 500 });
  }
}
