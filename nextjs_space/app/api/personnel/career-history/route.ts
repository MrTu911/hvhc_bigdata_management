/**
 * CSDL Quân nhân - Career History API
 * Quản lý lịch sử công tác của cán bộ
 * 
 * RBAC Migration: Legacy role checks → Function-based RBAC
 * Features:
 * - CRUD với soft delete
 * - Audit logging cho mọi thao tác
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { CareerEventType } from '@prisma/client';

/**
 * GET - Lấy danh sách lịch sử công tác
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: VIEW_PERSONNEL
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const eventType = searchParams.get('eventType') as CareerEventType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { deletedAt: null };

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const total = await prisma.careerHistory.count({ where });

    const data = await prisma.careerHistory.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW,
      action: 'VIEW',
      resourceType: 'CAREER_HISTORY',
      resourceId: userId || 'list',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Career History GET]', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy dữ liệu lịch sử công tác' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo mới bản ghi lịch sử công tác
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: UPDATE_PERSONNEL (creating career history is an update to personnel record)
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      userId,
      eventType,
      eventDate,
      effectiveDate,
      oldPosition,
      newPosition,
      oldRank,
      newRank,
      oldUnit,
      newUnit,
      trainingName,
      trainingInstitution,
      trainingResult,
      certificateNumber,
      decisionNumber,
      decisionDate,
      signerName,
      signerPosition,
      attachmentUrl,
      notes,
    } = body;

    if (!userId || !eventType || !eventDate) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: userId, eventType, eventDate' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy cán bộ' },
        { status: 404 }
      );
    }

    const careerHistory = await prisma.careerHistory.create({
      data: {
        userId,
        eventType: eventType as CareerEventType,
        eventDate: new Date(eventDate),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        oldPosition,
        newPosition,
        oldRank,
        newRank,
        oldUnit,
        newUnit,
        trainingName,
        trainingInstitution,
        trainingResult,
        certificateNumber,
        decisionNumber,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        signerName,
        signerPosition,
        attachmentUrl,
        notes,
        createdById: user.id,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'CREATE',
      resourceType: 'CAREER_HISTORY',
      resourceId: careerHistory.id,
      newValue: { userId, eventType, eventDate, newPosition, newRank },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Tạo bản ghi lịch sử công tác thành công',
      data: careerHistory,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Career History POST]', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo bản ghi lịch sử công tác' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cập nhật bản ghi lịch sử công tác
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bản ghi' }, { status: 400 });
    }

    const existing = await prisma.careerHistory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy bản ghi' },
        { status: 404 }
      );
    }

    // Process dates
    if (updateData.eventDate) {
      updateData.eventDate = new Date(updateData.eventDate);
    }
    if (updateData.effectiveDate) {
      updateData.effectiveDate = new Date(updateData.effectiveDate);
    }
    if (updateData.decisionDate) {
      updateData.decisionDate = new Date(updateData.decisionDate);
    }

    const updated = await prisma.careerHistory.update({
      where: { id },
      data: updateData,
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'CAREER_HISTORY',
      resourceId: id,
      oldValue: { eventType: existing.eventType, eventDate: existing.eventDate },
      newValue: { eventType: updated.eventType, eventDate: updated.eventDate },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('[Career History PUT]', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật bản ghi' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa mềm bản ghi lịch sử công tác
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
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bản ghi' }, { status: 400 });
    }

    const existing = await prisma.careerHistory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy bản ghi' },
        { status: 404 }
      );
    }

    await prisma.careerHistory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        deletionReason: reason || undefined,
      },
    });

    // Audit log with oldValue
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'CAREER_HISTORY',
      resourceId: id,
      oldValue: { userId: existing.userId, eventType: existing.eventType },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      message: 'Xóa bản ghi thành công',
    });
  } catch (error: any) {
    console.error('[Career History DELETE]', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa bản ghi' },
      { status: 500 }
    );
  }
}
