import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listQualityResults,
  recordQualityResult,
  getLatestResultPerRule,
} from '@/lib/services/infrastructure/data-quality.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DATA_QUALITY_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'latest') {
      const latest = await getLatestResultPerRule();
      return NextResponse.json({ success: true, data: latest });
    }

    const result = await listQualityResults({
      ruleId:      searchParams.get('ruleId')      ?? undefined,
      targetTable: searchParams.get('targetTable') ?? undefined,
      passed:      searchParams.get('passed') === 'true'
                   ? true : searchParams.get('passed') === 'false' ? false : undefined,
      severity:    (searchParams.get('severity') as any) ?? undefined,
      page:        Number(searchParams.get('page')     ?? 1),
      pageSize:    Number(searchParams.get('pageSize') ?? 30),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Dùng bởi Airflow worker callback — ghi kết quả DQ
export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DATA_QUALITY_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    const required = ['ruleId', 'passed', 'totalChecked', 'failedRows', 'severity'];
    const missing  = required.filter((f) => body[f] === undefined || body[f] === null);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await recordQualityResult({
      ruleId:        body.ruleId,
      pipelineRunId: body.pipelineRunId,
      passed:        body.passed,
      totalChecked:  body.totalChecked,
      failedRows:    body.failedRows,
      severity:      body.severity,
      sampleData:    body.sampleData,
      note:          body.note,
    });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
