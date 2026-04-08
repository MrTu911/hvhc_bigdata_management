/**
 * Quan hệ Gia đình - Family Relations API
 * Quản lý thông tin gia đình của cán bộ
 * 
 * RBAC Migration: Legacy role checks → Function-based RBAC
 * Features:
 * - Encryption cho citizenId, phoneNumber
 * - CRUD với soft delete
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/encryption';
import { FamilyRelationType } from '@prisma/client';

const ENCRYPTED_FIELDS = ['citizenId', 'phoneNumber'];

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
 * GET - Lấy thông tin quan hệ gia đình
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: VIEW_PERSONNEL_DETAIL (family is part of personnel detail)
    const authResult = await requireFunction(request, PERSONNEL.VIEW_DETAIL);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const relation = searchParams.get('relation') as FamilyRelationType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { deletedAt: null };
    if (userId) where.userId = userId;
    if (relation) where.relation = relation;

    const total = await prisma.familyRelation.count({ where });
    const data = await prisma.familyRelation.findMany({
      where,
      orderBy: [{ relation: 'asc' }, { fullName: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const decryptedData = data.map(decryptFields);

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'VIEW',
      resourceType: 'FAMILY_RELATION',
      resourceId: userId || 'list',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      data: decryptedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Family GET]', error);
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin gia đình' }, { status: 500 });
  }
}

/**
 * POST - Thêm thành viên gia đình
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: UPDATE_PERSONNEL
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { userId, relation, fullName, ...otherData } = body;

    if (!userId || !relation || !fullName) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: userId, relation, fullName' },
        { status: 400 }
      );
    }

    // Encrypt sensitive fields
    const encryptedData = encryptFields(otherData);

    const family = await prisma.familyRelation.create({
      data: {
        userId,
        relation: relation as FamilyRelationType,
        fullName,
        dateOfBirth: otherData.dateOfBirth ? new Date(otherData.dateOfBirth) : null,
        deceasedDate: otherData.deceasedDate ? new Date(otherData.deceasedDate) : null,
        isDeceased: otherData.isDeceased || false,
        occupation: otherData.occupation,
        workplace: otherData.workplace,
        address: otherData.address,
        notes: otherData.notes,
        citizenId: encryptedData.citizenId,
        phoneNumber: encryptedData.phoneNumber,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'CREATE',
      resourceType: 'FAMILY_RELATION',
      resourceId: family.id,
      newValue: { userId, relation, fullName },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Thêm thành viên gia đình thành công',
      data: decryptFields(family),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Family POST]', error);
    return NextResponse.json({ error: 'Lỗi khi thêm thành viên gia đình' }, { status: 500 });
  }
}

/**
 * PUT - Cập nhật thành viên gia đình
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: UPDATE_PERSONNEL
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, citizenId, phoneNumber, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.familyRelation.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    // Encrypt if updating sensitive fields
    if (citizenId) updateData.citizenId = encrypt(citizenId);
    if (phoneNumber) updateData.phoneNumber = encrypt(phoneNumber);

    // Process dates
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.deceasedDate) updateData.deceasedDate = new Date(updateData.deceasedDate);

    const updated = await prisma.familyRelation.update({
      where: { id },
      data: updateData,
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'FAMILY_RELATION',
      resourceId: id,
      oldValue: { fullName: existing.fullName, relation: existing.relation },
      newValue: { fullName: updated.fullName, relation: updated.relation },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      data: decryptFields(updated),
    });
  } catch (error: any) {
    console.error('[Family PUT]', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật' }, { status: 500 });
  }
}

/**
 * DELETE - Xóa mềm thành viên gia đình
 */
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check: DELETE_PERSONNEL
    const authResult = await requireFunction(request, PERSONNEL.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.familyRelation.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    await prisma.familyRelation.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    // Audit log with oldValue
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'FAMILY_RELATION',
      resourceId: id,
      oldValue: { fullName: existing.fullName, relation: existing.relation },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    console.error('[Family DELETE]', error);
    return NextResponse.json({ error: 'Lỗi khi xóa' }, { status: 500 });
  }
}
