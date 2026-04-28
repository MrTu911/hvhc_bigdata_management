import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit, extractAuditContext } from '@/lib/audit-service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.ALERT_VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const policies = await prisma.metricThresholdPolicy.findMany({
      where:   { isActive: true },
      orderBy: { metricName: 'asc' },
    });
    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.ALERT_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    if (body.warningThreshold !== undefined && body.criticalThreshold !== undefined) {
      if (body.warningThreshold >= body.criticalThreshold) {
        return NextResponse.json(
          { success: false, error: 'warningThreshold must be less than criticalThreshold' },
          { status: 400 },
        );
      }
    }

    const before = await prisma.metricThresholdPolicy.findUnique({ where: { id: body.id } });
    const updated = await prisma.metricThresholdPolicy.update({
      where: { id: body.id },
      data: {
        warningThreshold:  body.warningThreshold,
        criticalThreshold: body.criticalThreshold,
        autoAction:        body.autoAction,
        isActive:          body.isActive,
      },
    });
    const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
    await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', body.id, {
      before: before ? {
        warningThreshold:  before.warningThreshold,
        criticalThreshold: before.criticalThreshold,
        autoAction:        before.autoAction,
        isActive:          before.isActive,
      } : null,
      after: {
        warningThreshold:  updated.warningThreshold,
        criticalThreshold: updated.criticalThreshold,
        autoAction:        updated.autoAction,
        isActive:          updated.isActive,
      },
      metadata: { operation: 'threshold_update', metricName: updated.metricName },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
