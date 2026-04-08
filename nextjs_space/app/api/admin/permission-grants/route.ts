/**
 * Permission Grants API
 * Quản lý cấp quyền chi tiết cho user
 * 
 * Features:
 * - GET: Lấy danh sách grants (filter by userId, permission, status)
 * - POST: Tạo grant mới
 * - PUT: Cập nhật grant (gia hạn, thêm personnel)
 * - DELETE: Thu hồi grant (soft revoke)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logCreate, logUpdate, logDelete } from '@/lib/audit-service';
import { PermissionType, PermissionScopeType } from '@prisma/client';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

/**
 * GET - Lấy danh sách permission grants
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_RBAC permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permission = searchParams.get('permission') as PermissionType | null;
    const status = searchParams.get('status'); // active, expired, revoked, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const now = new Date();
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }
    if (permission) {
      where.permission = permission;
    }

    // Filter by status
    switch (status) {
      case 'active':
        where.isRevoked = false;
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ];
        break;
      case 'expired':
        where.isRevoked = false;
        where.expiresAt = { lte: now };
        break;
      case 'revoked':
        where.isRevoked = true;
        break;
      // 'all' hoặc không có filter
    }

    const [total, grants] = await Promise.all([
      prisma.userPermissionGrant.count({ where }),
      prisma.userPermissionGrant.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, rank: true, position: true },
          },
          grantedBy: {
            select: { id: true, name: true },
          },
          personnelGrants: {
            include: {
              grant: false, // Avoid circular
            },
          },
        },
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Enrich with personnel info if scope is PERSONNEL
    const enrichedGrants = await Promise.all(
      grants.map(async (grant) => {
        if (grant.scopeType === PermissionScopeType.PERSONNEL && grant.personnelGrants.length > 0) {
          const personnelIds = grant.personnelGrants.map(pg => pg.personnelId);
          const personnel = await prisma.user.findMany({
            where: { id: { in: personnelIds } },
            select: { id: true, name: true, email: true, rank: true },
          });
          return { ...grant, personnel };
        }
        return { ...grant, personnel: [] };
      })
    );

    return NextResponse.json({
      data: enrichedGrants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Permission Grants GET]', error);
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách quyền' }, { status: 500 });
  }
}

/**
 * POST - Tạo permission grant mới
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_RBAC permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      userId,
      permission,
      scopeType,
      unitId,
      personnelIds,
      expiresAt,
      reason,
    } = body;

    // Validation
    if (!userId || !permission || !scopeType) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (userId, permission, scopeType)' },
        { status: 400 }
      );
    }

    // Validate scopeType requirements
    if (scopeType === PermissionScopeType.UNIT && !unitId) {
      return NextResponse.json(
        { error: 'Scope UNIT yêu cầu chọn đơn vị' },
        { status: 400 }
      );
    }
    if (scopeType === PermissionScopeType.PERSONNEL && (!personnelIds || personnelIds.length === 0)) {
      return NextResponse.json(
        { error: 'Scope PERSONNEL yêu cầu chọn ít nhất một cán bộ' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Check for duplicate grant
    const existingGrant = await prisma.userPermissionGrant.findFirst({
      where: {
        userId,
        permission: permission as PermissionType,
        scopeType: scopeType as PermissionScopeType,
        unitId: unitId || null,
        isRevoked: false,
      },
    });

    if (existingGrant) {
      return NextResponse.json(
        { error: 'Quyền này đã được cấp cho người dùng' },
        { status: 400 }
      );
    }

    // Create grant with personnel if needed
    const grant = await prisma.userPermissionGrant.create({
      data: {
        userId,
        permission: permission as PermissionType,
        scopeType: scopeType as PermissionScopeType,
        unitId: scopeType === PermissionScopeType.UNIT ? unitId : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reason,
        grantedById: user.id,
        ...(scopeType === PermissionScopeType.PERSONNEL && personnelIds?.length > 0 && {
          personnelGrants: {
            create: personnelIds.map((pid: string) => ({ personnelId: pid })),
          },
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        personnelGrants: true,
      },
    });

    await logCreate(
      { userId: user.id, role: user.role || '' },
      'PERMISSION_GRANT',
      grant.id,
      {
        targetUserId: userId,
        permission,
        scopeType,
        unitId,
        personnelCount: personnelIds?.length || 0,
      }
    );

    return NextResponse.json({
      message: 'Cấp quyền thành công',
      data: grant,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Permission Grants POST]', error);
    return NextResponse.json({ error: 'Lỗi khi cấp quyền' }, { status: 500 });
  }
}

/**
 * PUT - Cập nhật grant (gia hạn, thêm/xóa personnel)
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_RBAC permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, expiresAt, personnelIds, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.userPermissionGrant.findUnique({
      where: { id },
      include: { personnelGrants: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy grant' }, { status: 404 });
    }

    if (existing.isRevoked) {
      return NextResponse.json({ error: 'Grant đã bị thu hồi' }, { status: 400 });
    }

    // Update grant
    const updateData: any = {};
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (reason !== undefined) {
      updateData.reason = reason;
    }

    const updated = await prisma.userPermissionGrant.update({
      where: { id },
      data: updateData,
    });

    // Update personnel list if provided and scope is PERSONNEL
    if (personnelIds !== undefined && existing.scopeType === PermissionScopeType.PERSONNEL) {
      // Remove old
      await prisma.userPermissionGrantPersonnel.deleteMany({
        where: { grantId: id },
      });
      // Add new
      if (personnelIds.length > 0) {
        await prisma.userPermissionGrantPersonnel.createMany({
          data: personnelIds.map((pid: string) => ({ grantId: id, personnelId: pid })),
        });
      }
    }

    await logUpdate(
      { userId: user.id, role: user.role || '' },
      'PERMISSION_GRANT',
      id,
      { expiresAt: existing.expiresAt },
      { expiresAt: updated.expiresAt }
    );

    return NextResponse.json({ message: 'Cập nhật thành công', data: updated });
  } catch (error: any) {
    console.error('[Permission Grants PUT]', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật' }, { status: 500 });
  }
}

/**
 * DELETE - Thu hồi grant (soft revoke)
 */
export async function DELETE(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_RBAC permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.userPermissionGrant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy grant' }, { status: 404 });
    }

    if (existing.isRevoked) {
      return NextResponse.json({ error: 'Grant đã bị thu hồi trước đó' }, { status: 400 });
    }

    await prisma.userPermissionGrant.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedById: user.id,
        revokedReason: reason || 'Thu hồi bởi Admin',
      },
    });

    await logDelete(
      { userId: user.id, role: user.role || '' },
      'PERMISSION_GRANT',
      id,
      { userId: existing.userId, permission: existing.permission, reason }
    );

    return NextResponse.json({ message: 'Thu hồi quyền thành công' });
  } catch (error: any) {
    console.error('[Permission Grants DELETE]', error);
    return NextResponse.json({ error: 'Lỗi khi thu hồi quyền' }, { status: 500 });
  }
}
