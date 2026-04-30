import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listQualityResults,
  recordQualityResult,
  getLatestResultPerRule,
  getQualitySummaryByTable,
} from '@/lib/services/infrastructure/data-quality.service';
import type { DQSeverity } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.DATA_QUALITY_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'dashboard') {
      const [latestPerRule, summaryByTable] = await Promise.all([
        getLatestResultPerRule(),
        getQualitySummaryByTable(),
      ]);

      const totalRules     = latestPerRule.length;
      const failingTotal   = latestPerRule.filter((r) => !r.passed).length;
      const failingCritical = latestPerRule.filter(
        (r) => !r.passed && r.severity === 'CRITICAL',
      ).length;
      const failingError = latestPerRule.filter(
        (r) => !r.passed && r.severity === 'ERROR',
      ).length;

      const overallStatus =
        failingCritical > 0 ? 'CRITICAL'
        : failingError  > 0 ? 'ERROR'
        : failingTotal  > 0 ? 'WARNING'
        : 'HEALTHY';

      return NextResponse.json({
        success: true,
        data: {
          overallStatus,
          counts: {
            totalRules,
            failingTotal,
            failingCritical,
            failingError,
            passing: totalRules - failingTotal,
          },
          summaryByTable,
          latestPerRule,
        },
      });
    }

    if (view === 'latest') {
      const latest = await getLatestResultPerRule();
      return NextResponse.json({ success: true, data: latest });
    }

    const result = await listQualityResults({
      ruleId:      searchParams.get('ruleId')      ?? undefined,
      targetTable: searchParams.get('targetTable') ?? undefined,
      passed:      searchParams.get('passed') === 'true'
                   ? true : searchParams.get('passed') === 'false' ? false : undefined,
      severity:    (searchParams.get('severity') as DQSeverity) ?? undefined,
      page:        Number(searchParams.get('page')     ?? 1),
      pageSize:    Number(searchParams.get('pageSize') ?? 30),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
