import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { autoGeneratePartyFees } from '@/lib/services/party/party-fee.service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFunction(request, PARTY.CREATE);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const generated = await autoGeneratePartyFees(body);

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.CREATE,
      action: 'AUTO_GENERATE_FEE',
      resourceType: 'PARTY_FEE',
      newValue: body,
      metadata: { generatedCount: generated.generatedCount, paymentMonth: generated.paymentMonth },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: generated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /định dạng|không âm/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
