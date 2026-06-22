/**
 * /api/education/training-materiels/[id]
 * GET: chi tiết + lịch sử cấp phát. PATCH: cập nhật (UPDATE). DELETE: xóa mềm (DELETE).
 * POST: hành động { action: 'issue' | 'return' } — cấp phát/thu hồi (ISSUE/RETURN).
 */

import { NextRequest, NextResponse } from 'next/server';

import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { TRAINING_MATERIEL } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import {
  updateMateriel, deleteMateriel, issueMateriel, returnMateriel,
} from '@/lib/services/education/training-materiel.service';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, TRAINING_MATERIEL.VIEW);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    const materiel = await prisma.trainingMateriel.findUnique({
      where: { id },
      include: { issuances: { orderBy: { issuedAt: 'desc' }, take: 50 } },
    });
    if (!materiel) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy' }, { status: 404 });
    return NextResponse.json({ success: true, data: materiel, error: null });
  } catch (error) {
    console.error('GET training-materiel detail error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tải chi tiết' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, TRAINING_MATERIEL.UPDATE);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const updated = await updateMateriel(id, body);
    await logAudit({
      userId: auth.user!.id, functionCode: TRAINING_MATERIEL.UPDATE, action: 'UPDATE',
      resourceType: 'TRAINING_MATERIEL', resourceId: id, newValue: body, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    console.error('PATCH training-materiel error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi cập nhật' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, TRAINING_MATERIEL.DELETE);
  if (!auth.allowed) return auth.response!;
  try {
    const { id } = await params;
    await deleteMateriel(id);
    await logAudit({
      userId: auth.user!.id, functionCode: TRAINING_MATERIEL.DELETE, action: 'DELETE',
      resourceType: 'TRAINING_MATERIEL', resourceId: id, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (error) {
    console.error('DELETE training-materiel error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi xóa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const functionCode = action === 'return' ? TRAINING_MATERIEL.RETURN : TRAINING_MATERIEL.ISSUE;

  const auth = await requireFunction(req, functionCode);
  if (!auth.allowed) return auth.response!;

  try {
    const { id } = await params;
    if (action === 'return') {
      if (!body.issuanceId) return NextResponse.json({ success: false, data: null, error: 'Thiếu issuanceId' }, { status: 400 });
      const result = await returnMateriel(body.issuanceId);
      await logAudit({
        userId: auth.user!.id, functionCode, action: 'RETURN', resourceType: 'MATERIEL_ISSUANCE',
        resourceId: body.issuanceId, result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ success: true, data: result, error: null });
    }

    // default: issue
    const result = await issueMateriel(id, { ...body, issuedById: auth.user!.id });
    await logAudit({
      userId: auth.user!.id, functionCode, action: 'ISSUE', resourceType: 'TRAINING_MATERIEL',
      resourceId: id, newValue: { quantity: body.quantity, issueType: body.issueType, borrowerUnitId: body.borrowerUnitId },
      result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi cấp phát/thu hồi';
    const status = message.includes('Không đủ') || message.includes('không thu hồi') || message.includes('lớn hơn 0') ? 409 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
