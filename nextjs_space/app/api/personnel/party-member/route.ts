/**
 * CSDL Đảng viên - Party Member API
 * Quản lý hồ sơ Đảng viên
 * 
 * RBAC Migration: Legacy role checks → Function-based RBAC
 * Features:
 * - CRUD với soft delete
 * - Encryption cho partyCardNumber
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/encryption';
import { PartyMemberStatus } from '@prisma/client';

// Fields to encrypt
const ENCRYPTED_FIELDS = ['partyCardNumber'];

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
      } catch (e) {
        // Keep original if decryption fails (legacy data)
      }
    }
  }
  return result;
}

/**
 * GET - Lấy danh sách hoặc chi tiết Đảng viên
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: VIEW_PARTY
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as PartyMemberStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { deletedAt: null };

    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const total = await prisma.partyMember.count({ where });

    const data = await prisma.partyMember.findMany({
      where,
      include: {
        activities: {
          where: { deletedAt: null },
          orderBy: { activityDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Decrypt sensitive fields
    const decryptedData = data.map(decryptFields);

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW',
      resourceType: 'PARTY_MEMBER',
      resourceId: userId || 'list',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      data: decryptedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Party Member GET]', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy dữ liệu Đảng viên' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo hồ sơ Đảng viên mới
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: CREATE_PARTY
    const authResult = await requireFunction(request, PARTY.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      userId,
      partyCardNumber,
      joinDate,
      officialDate,
      partyCell,
      partyCommittee,
      recommender1,
      recommender2,
      status,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Thiếu userId' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.partyMember.findFirst({
      where: { userId, deletedAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cán bộ này đã có hồ sơ Đảng viên' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data
    const encryptedData = encryptFields({ partyCardNumber });

    const partyMember = await prisma.partyMember.create({
      data: {
        userId,
        partyCardNumber: encryptedData.partyCardNumber,
        joinDate: joinDate ? new Date(joinDate) : null,
        officialDate: officialDate ? new Date(officialDate) : null,
        partyCell,
        partyCommittee,
        recommender1,
        recommender2,
        status: status || 'ACTIVE',
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PARTY.CREATE,
      action: 'CREATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: partyMember.id,
      newValue: { userId, partyCell, partyCommittee },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Tạo hồ sơ Đảng viên thành công',
      data: decryptFields(partyMember),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Party Member POST]', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo hồ sơ Đảng viên' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cập nhật hồ sơ Đảng viên
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: UPDATE_PARTY
    const authResult = await requireFunction(request, PARTY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, partyCardNumber, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.partyMember.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    // Encrypt if updating partyCardNumber
    if (partyCardNumber) {
      updateData.partyCardNumber = encrypt(partyCardNumber);
    }

    // Process dates
    if (updateData.joinDate) {
      updateData.joinDate = new Date(updateData.joinDate);
    }
    if (updateData.officialDate) {
      updateData.officialDate = new Date(updateData.officialDate);
    }
    if (updateData.statusChangeDate) {
      updateData.statusChangeDate = new Date(updateData.statusChangeDate);
    }

    const updated = await prisma.partyMember.update({
      where: { id },
      data: updateData,
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: PARTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: id,
      oldValue: { userId: existing.userId, status: existing.status },
      newValue: { userId: updated.userId, status: updated.status },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      data: decryptFields(updated),
    });
  } catch (error: any) {
    console.error('[Party Member PUT]', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa mềm hồ sơ Đảng viên
 */
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check: DELETE_PARTY
    const authResult = await requireFunction(request, PARTY.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.partyMember.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    await prisma.partyMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });

    // Audit log with oldValue
    await logAudit({
      userId: user.id,
      functionCode: PARTY.DELETE,
      action: 'DELETE',
      resourceType: 'PARTY_MEMBER',
      resourceId: id,
      oldValue: { userId: existing.userId, status: existing.status },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    console.error('[Party Member DELETE]', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa' },
      { status: 500 }
    );
  }
}
