/**
 * /api/education/maps/[id]
 * GET: chi tiết + lịch sử mượn (bản đồ mật cần VIEW_MAP_SECRET).
 * PATCH: cập nhật (UPDATE). DELETE: xóa mềm (DELETE).
 * POST: { action: 'issue' | 'return' } — cấp phát/thu hồi (ISSUE/RETURN).
 */

import { NextRequest, NextResponse } from 'next/server';

import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { MAP } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { hasPermission } from '@/lib/rbac/policy';
import {
  updateMapAsset, deleteMapAsset, issueMapAsset, returnMapAsset, RESTRICTED_SECURITY_LEVELS,
} from '@/lib/services/education/map-asset.service';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, MAP.VIEW);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    const asset = await prisma.mapAsset.findUnique({
      where: { id },
      include: { loans: { orderBy: { issuedAt: 'desc' }, take: 50 } },
    });
    if (!asset) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy' }, { status: 404 });

    // Guard backend: bản đồ mật cần quyền nhạy cảm
    if (RESTRICTED_SECURITY_LEVELS.includes(asset.securityLevel)) {
      const { hasPermission: canSecret } = await hasPermission(auth.user!.id, MAP.VIEW_SECRET);
      if (!canSecret) return NextResponse.json({ success: false, data: null, error: 'Không có quyền xem bản đồ mật' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: asset, error: null });
  } catch (error) {
    console.error('GET map detail error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tải chi tiết' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, MAP.UPDATE);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    // Nâng cấp lên mức mật cần quyền nhạy cảm
    if (body.securityLevel && RESTRICTED_SECURITY_LEVELS.includes(body.securityLevel)) {
      const { hasPermission: canSecret } = await hasPermission(auth.user!.id, MAP.VIEW_SECRET);
      if (!canSecret) return NextResponse.json({ success: false, data: null, error: 'Không có quyền quản lý bản đồ mật' }, { status: 403 });
    }
    const updated = await updateMapAsset(id, body);
    await logAudit({
      userId: auth.user!.id, functionCode: MAP.UPDATE, action: 'UPDATE',
      resourceType: 'MAP_ASSET', resourceId: id, newValue: body, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    console.error('PATCH map error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi cập nhật' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, MAP.DELETE);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    await deleteMapAsset(id);
    await logAudit({
      userId: auth.user!.id, functionCode: MAP.DELETE, action: 'DELETE',
      resourceType: 'MAP_ASSET', resourceId: id, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (error) {
    console.error('DELETE map error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi xóa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const functionCode = action === 'return' ? MAP.RETURN : MAP.ISSUE;

  const auth = await requireFunction(req, functionCode);
  if (!auth.allowed) return auth.response!;

  try {
    const { id } = await params;
    if (action === 'return') {
      if (!body.loanId) return NextResponse.json({ success: false, data: null, error: 'Thiếu loanId' }, { status: 400 });
      const result = await returnMapAsset(body.loanId);
      await logAudit({
        userId: auth.user!.id, functionCode, action: 'RETURN', resourceType: 'MAP_LOAN',
        resourceId: body.loanId, result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ success: true, data: result, error: null });
    }

    const result = await issueMapAsset(id, { ...body, issuedById: auth.user!.id });
    await logAudit({
      userId: auth.user!.id, functionCode, action: 'ISSUE', resourceType: 'MAP_ASSET',
      resourceId: id, newValue: { quantity: body.quantity, loanType: body.loanType, borrowerUnitId: body.borrowerUnitId },
      result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi cấp phát/thu hồi';
    const status = message.includes('Không đủ') || message.includes('không thu hồi') || message.includes('lớn hơn 0') ? 409 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
