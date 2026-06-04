/**
 * POST /api/education/graduation/audit/[id]/reject
 * Từ chối GraduationAudit: ELIGIBLE | PENDING → REJECTED.
 * Requires: EDUCATION.APPROVE_GRADUATION
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { rejectAudit } from '@/lib/services/education/graduation-batch.service';

export const dynamic = 'force-dynamic';

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFunction(req, EDUCATION.APPROVE_GRADUATION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { rejectReason } = body as { rejectReason?: string };

    if (!rejectReason?.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: 'rejectReason là bắt buộc' },
        { status: 400 }
      );
    }

    const updated = await rejectAudit(id, user!.id, rejectReason);

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.APPROVE_GRADUATION,
      action: 'UPDATE',
      resourceType: 'GRADUATION_AUDIT',
      resourceId: id,
      newValue: { status: 'REJECTED', rejectReason },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error: any) {
    const status = error.message?.includes('Không thể') ? 400 : 500;
    return NextResponse.json({ success: false, data: null, error: error.message }, { status });
  }
}
