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

    // Lấy danh sách gán hiện tại
    const currentAssignments = await prisma.positionFunction.findMany({
      where: { positionId },
      select: { functionId: true, scope: true }
    });
    const currentFunctionIds = new Set(currentAssignments.map(a => a.functionId));

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

    // 2. Thêm quyền mới (grant)
    const toCreate = grant.filter((fid: string) => !currentFunctionIds.has(fid));
    if (toCreate.length > 0) {
      // Kiểm tra các function tồn tại
      const validFunctions = await prisma.function.findMany({
        where: { id: { in: toCreate }, isActive: true },
        select: { id: true }
      });
      const validFunctionIds = new Set(validFunctions.map(f => f.id));

      const createData = toCreate
        .filter((fid: string) => validFunctionIds.has(fid))
        .map((fid: string) => ({
          positionId,
          functionId: fid,
          scope: scopeByFunctionId[fid] || 'UNIT'
        }));

      if (createData.length > 0) {
        await prisma.positionFunction.createMany({
          data: createData,
          skipDuplicates: true
        });
        results.granted = createData.length;
      }
    }

    // 3. Cập nhật scope cho các quyền đã tồn tại
    const toUpdate = grant.filter((fid: string) => currentFunctionIds.has(fid));
    for (const fid of toUpdate) {
      const newScope = scopeByFunctionId[fid];
      if (newScope) {
        const current = currentAssignments.find(a => a.functionId === fid);
        if (current && current.scope !== newScope) {
          await prisma.positionFunction.updateMany({
            where: { positionId, functionId: fid },
            data: { scope: newScope }
          });
          results.updated++;
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

    return NextResponse.json({
      message: `Đã cập nhật: +${results.granted} quyền, -${results.revoked} quyền, ~${results.updated} scope`,
      results
    });
  } catch (error) {
    console.error('Error batch updating position-functions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
