import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { createPartyFee, listPartyFees } from '@/lib/services/party/party-fee.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFunction(request, PARTY.VIEW);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const result = await listPartyFees({
      paymentMonth: searchParams.get('paymentMonth') || undefined,
      status: searchParams.get('status') || undefined,
      partyMemberId: searchParams.get('partyMemberId') || undefined,
      organizationId: searchParams.get('organizationId') || undefined,
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW_FEE_LIST',
      resourceType: 'PARTY_FEE',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      debtSummary: result.debtSummary,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFunction(request, PARTY.CREATE);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const created = await createPartyFee(body);

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.CREATE,
      action: 'UPSERT_FEE_PAYMENT',
      resourceType: 'PARTY_FEE',
      resourceId: created.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /bắt buộc|định dạng|không âm|không tồn tại/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
