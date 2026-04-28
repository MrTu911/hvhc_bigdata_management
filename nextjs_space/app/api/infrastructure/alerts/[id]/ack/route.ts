import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import { acknowledgeAlert, resolveAlert } from '@/lib/services/infrastructure/alert.service';
import { logAudit, extractAuditContext } from '@/lib/audit-service';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, INFRA.ALERT_MANAGE);
  if (!auth.allowed) return auth.response!;

  const { id } = params;
  const body   = await req.json().catch(() => ({}));
  const action = body.action as 'acknowledge' | 'resolve' | undefined;

  const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);

  try {
    if (action === 'resolve') {
      const alert = await resolveAlert(id, auth.user!.id);
      await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', id, {
        after:    { status: 'RESOLVED' },
        metadata: { operation: 'alert_resolve', alertTitle: alert.title, severity: alert.severity },
      });
      return NextResponse.json({ success: true, data: alert });
    }

    // default: acknowledge
    const alert = await acknowledgeAlert(id, auth.user!.id);
    await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', id, {
      after:    { status: 'ACKNOWLEDGED' },
      metadata: { operation: 'alert_acknowledge', alertTitle: alert.title, severity: alert.severity },
    });
    return NextResponse.json({ success: true, data: alert });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
