import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listQualityRules,
  createQualityRule,
  getQualitySummaryByTable,
} from '@/lib/services/infrastructure/data-quality.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DATA_QUALITY_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'summary') {
      const summary = await getQualitySummaryByTable();
      return NextResponse.json({ success: true, data: summary });
    }

    const rules = await listQualityRules();
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DATA_QUALITY_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    const required = ['ruleCode', 'name', 'ruleType', 'targetTable', 'ruleConfig', 'severity'];
    const missing  = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const rule = await createQualityRule({
      ruleCode:     body.ruleCode,
      name:         body.name,
      description:  body.description,
      ruleType:     body.ruleType,
      targetTable:  body.targetTable,
      targetColumn: body.targetColumn,
      ruleConfig:   body.ruleConfig,
      severity:     body.severity,
    });
    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('Unique') ? 409 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
