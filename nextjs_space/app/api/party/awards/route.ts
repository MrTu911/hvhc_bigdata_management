import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { PartyAwardDisciplineService } from '@/lib/services/party/party-award-discipline.service';
import { partyAwardCreateSchema, partyAwardListFiltersSchema } from '@/lib/validators/party/party-award.schema';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_MEMBER, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = partyAwardListFiltersSchema.safeParse({
      partyMemberId: searchParams.get('partyMemberId') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }

    const result = await PartyAwardDisciplineService.listAwards(parsed.data);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.VIEW_MEMBER,
      action: 'VIEW',
      resourceType: 'PARTY_AWARD',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_REVIEW, PARTY.UPDATE_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = partyAwardCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }

    const created = await PartyAwardDisciplineService.createAward(parsed.data);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.UPDATE_MEMBER,
      action: 'CREATE',
      resourceType: 'PARTY_AWARD',
      resourceId: created.id,
      newValue: parsed.data,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
