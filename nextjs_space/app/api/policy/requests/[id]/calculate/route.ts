/**
 * POST /api/policy/requests/[id]/calculate
 * Preview tính toán benefit amount cho PolicyRequest.
 * Không commit vào DB — chỉ trả về kết quả dự tính.
 * Requires: POLICY.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { POLICY } from '@/lib/rbac/function-codes';
import { calculateBenefitAmount } from '@/lib/services/policy-calculation.service';

export const dynamic = 'force-dynamic';

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFunction(req, POLICY.VIEW);
    if (!auth.allowed) return auth.response!;

    const { id } = await params;
    const result = await calculateBenefitAmount(id);

    if (!result) {
      return NextResponse.json(
        { success: false, data: null, error: 'PolicyRequest không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error: any) {
    console.error('POST /api/policy/requests/[id]/calculate error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Calculation failed' }, { status: 500 });
  }
}
