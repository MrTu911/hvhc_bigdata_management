/**
 * API: Batch update quyền cho chức vụ
 * POST /api/admin/rbac/position-functions/batch
 * Body: { positionId, grant: [], revoke: [], scopeByFunctionId: {} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { clearPermissionCache } from '@/lib/rbac/policy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { positionId, grant = [], revoke = [], scopeByFunctionId = {} } = body;

    if (!positionId) {
      return NextResponse.json({ error: 'positionId là bắt buộc' }, { status: 400 });
    }

    // Kiểm tra position tồn tại
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
      return NextResponse.json({ error: 'Không tìm thấy chức vụ' }, { status: 404 });
    }

    // Lấy danh sách gán hiện tại. Chỉ coi là "đang gán" khi isActive=true
    // (giống GET ma trận) để có thể kích hoạt lại grant đã bị tắt.
    const currentAssignments = await prisma.positionFunction.findMany({
      where: { positionId },
      select: { functionId: true, scope: true, isActive: true }
    });
    const activeFunctionIds = new Set(
      currentAssignments.filter(a => a.isActive).map(a => a.functionId)
    );

    const results = {
      granted: 0,
      revoked: 0,
      updated: 0,
      errors: [] as string[]
    };

    // 1. Xóa quyền (revoke)
    if (revoke.length > 0) {
      const deleteResult = await prisma.positionFunction.deleteMany({
        where: {
          positionId,
          functionId: { in: revoke }
        }
      });
      results.revoked = deleteResult.count;
    }

    // 2. Gán / kích hoạt lại quyền (grant) — upsert để bật lại cả grant đã bị tắt
    if (grant.length > 0) {
      const validFunctions = await prisma.function.findMany({
        where: { id: { in: grant }, isActive: true },
        select: { id: true }
      });
      const validFunctionIds = new Set(validFunctions.map(f => f.id));

      for (const fid of grant as string[]) {
        if (!validFunctionIds.has(fid)) continue;
        const scopeForFn = scopeByFunctionId[fid] || 'UNIT';
        await prisma.positionFunction.upsert({
          where: { positionId_functionId: { positionId, functionId: fid } },
          update: { scope: scopeForFn, isActive: true },
          create: { positionId, functionId: fid, scope: scopeForFn, isActive: true },
        });
        if (!activeFunctionIds.has(fid)) {
          results.granted++;
        } else {
          const current = currentAssignments.find(a => a.functionId === fid);
          if (current && current.scope !== scopeForFn) results.updated++;
        }
      }
    }

    // Ghi audit log
    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'UPDATE',
      resourceType: 'POSITION_FUNCTIONS',
      resourceId: positionId,
      newValue: JSON.stringify({ grant, revoke, scopeByFunctionId }),
      result: 'SUCCESS'
    });

    // Invalidate permission cache cho tất cả users đang giữ position này
    const affectedUsers = await prisma.userPosition.findMany({
      where: { positionId, isActive: true },
      select: { userId: true },
    });
    let cacheInvalidated = 0;
    for (const { userId } of affectedUsers) {
      clearPermissionCache(userId);
      cacheInvalidated++;
    }

    return NextResponse.json({
      message: `Đã cập nhật: +${results.granted} quyền, -${results.revoked} quyền, ~${results.updated} scope`,
      results,
      cacheInvalidated,
    });
  } catch (error) {
    console.error('Error batch updating position-functions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
