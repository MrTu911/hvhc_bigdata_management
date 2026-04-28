import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listInfraAlerts,
  getAlertSummary,
  raiseAlert,
} from '@/lib/services/infrastructure/alert.service';
import type { AlertSeverity, AlertStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.ALERT_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'summary') {
      const summary = await getAlertSummary();
      return NextResponse.json({ success: true, data: summary });
    }

    const result = await listInfraAlerts({
      serviceId: searchParams.get('serviceId') ?? undefined,
      status:    (searchParams.get('status') as AlertStatus) ?? undefined,
      severity:  (searchParams.get('severity') as AlertSeverity) ?? undefined,
      page:      Number(searchParams.get('page')     ?? 1),
      pageSize:  Number(searchParams.get('pageSize') ?? 50),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.ALERT_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();

    const required = ['serviceId', 'title', 'message', 'severity'];
    const missing  = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const alert = await raiseAlert({
      serviceId: body.serviceId,
      title:     body.title,
      message:   body.message,
      severity:  body.severity,
      metadata:  body.metadata,
    });
    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
