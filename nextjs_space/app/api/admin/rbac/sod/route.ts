/**
 * API: Quản lý Separation of Duties (SoD)
 * - GET: Lấy danh sách SoD rules
 * - POST: Tạo SoD rule mới
 * - DELETE: Xóa SoD rule
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách SoD rules
export async function GET(req: NextRequest) {
  // RBAC Check: MANAGE_SOD
  const authResult = await requireFunction(req, SYSTEM.MANAGE_SOD);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const rules = await prisma.permissionConflict.findMany({
      orderBy: [{ severity: 'desc' }, { functionCodeA: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      rules,
      total: rules.length,
    });
  } catch (error: any) {
    console.error('SoD GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Tạo SoD rule mới
export async function POST(req: NextRequest) {
  // RBAC Check: MANAGE_SOD
  const authResult = await requireFunction(req, SYSTEM.MANAGE_SOD);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { functionCodeA, functionCodeB, description, severity } = body;

    if (!functionCodeA || !functionCodeB) {
      return NextResponse.json(
        { error: 'functionCodeA và functionCodeB là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra tồn tại
    const existing = await prisma.permissionConflict.findFirst({
      where: {
        OR: [
          { functionCodeA, functionCodeB },
          { functionCodeA: functionCodeB, functionCodeB: functionCodeA },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SoD rule đã tồn tại' },
        { status: 400 }
      );
    }

    const rule = await prisma.permissionConflict.create({
      data: {
        functionCodeA,
        functionCodeB,
        description: description || null,
        severity: severity || 'BLOCK',
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_SOD,
      action: 'CREATE',
      resourceType: 'SOD_RULE',
      resourceId: rule.id,
      newValue: rule,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('SoD POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa SoD rule
export async function DELETE(req: NextRequest) {
  // RBAC Check: MANAGE_SOD
  const authResult = await requireFunction(req, SYSTEM.MANAGE_SOD);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.permissionConflict.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'SoD rule không tồn tại' },
        { status: 404 }
      );
    }

    await prisma.permissionConflict.delete({ where: { id } });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_SOD,
      action: 'DELETE',
      resourceType: 'SOD_RULE',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa SoD rule thành công',
    });
  } catch (error: any) {
    console.error('SoD DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
