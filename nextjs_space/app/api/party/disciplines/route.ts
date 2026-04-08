import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { PartyAwardDisciplineService } from '@/lib/services/party/party-award-discipline.service';
import { partyDisciplineCreateSchema, partyDisciplineListFiltersSchema } from '@/lib/validators/party/party-discipline.schema';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_DISCIPLINE, PARTY.VIEW_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = partyDisciplineListFiltersSchema.safeParse({
      partyMemberId: searchParams.get('partyMemberId') || undefined,
      severity: searchParams.get('severity') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }

    const result = await PartyAwardDisciplineService.listDisciplines(parsed.data);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.VIEW_DISCIPLINE,
      action: 'VIEW',
      resourceType: 'PARTY_DISCIPLINE',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.APPROVE_DISCIPLINE]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = partyDisciplineCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }

    const created = await PartyAwardDisciplineService.createDiscipline(parsed.data);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.APPROVE_DISCIPLINE,
      action: 'CREATE',
      resourceType: 'PARTY_DISCIPLINE',
      resourceId: created.id,
      newValue: parsed.data,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
