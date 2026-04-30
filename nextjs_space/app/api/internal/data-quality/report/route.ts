/**
 * M12 – Internal: Data Quality Run Callback
 * POST /api/internal/data-quality/report
 *
 * Nhận kết quả từ Airflow DAG hoặc DQ worker sau khi chạy kiểm tra chất lượng dữ liệu.
 * Tự động raise ServiceAlert khi có rule CRITICAL/ERROR fail.
 * Tự động resolve alert khi rule pass lại.
 *
 * Bảo vệ bằng CRON_SECRET (Bearer token) — không expose ra public.
 *
 * Airflow DAG ví dụ (cuối task DQ):
 *   callback = SimpleHttpOperator(
 *     task_id='report_dq_results',
 *     http_conn_id='hvhc_app',
 *     endpoint='/api/internal/data-quality/report',
 *     method='POST',
 *     headers={'Authorization': 'Bearer {{ var.value.HVHC_CRON_SECRET }}'},
 *     data=json.dumps({
 *       'pipelineRunId': '{{ dag_run.conf.get("hvhc_run_id") }}',
 *       'results': [
 *         { 'ruleId': '...', 'passed': True, 'totalChecked': 5000, 'failedRows': 0, 'severity': 'CRITICAL' },
 *         { 'ruleId': '...', 'passed': False, 'totalChecked': 5000, 'failedRows': 12, 'severity': 'ERROR', 'note': '...' },
 *       ]
 *     }),
 *   )
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import {
  recordQualityResult,
  recordQualityResults,
} from '@/lib/services/infrastructure/data-quality.service';
import type { DQSeverity } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SingleResultPayload {
  mode:          'single';
  ruleId:        string;
  pipelineRunId?: string;
  passed:        boolean;
  totalChecked:  number;
  failedRows:    number;
  severity:      DQSeverity;
  sampleData?:   Record<string, unknown>;
  note?:         string;
}

interface BulkResultItem {
  ruleId:        string;
  passed:        boolean;
  totalChecked:  number;
  failedRows:    number;
  severity:      DQSeverity;
  sampleData?:   Record<string, unknown>;
  note?:         string;
}

interface BulkResultPayload {
  mode?:          'bulk';   // default khi không có mode
  pipelineRunId?: string;
  results:        BulkResultItem[];
}

type DQReportPayload = SingleResultPayload | BulkResultPayload;

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_SEVERITIES = new Set(['CRITICAL', 'ERROR', 'WARNING', 'INFO']);

function validateResultItem(item: Partial<BulkResultItem>, idx?: number): string | null {
  const prefix = idx !== undefined ? `results[${idx}]` : 'body';
  if (!item.ruleId)                       return `${prefix}.ruleId required`;
  if (item.passed === undefined)          return `${prefix}.passed required`;
  if (item.totalChecked === undefined)    return `${prefix}.totalChecked required`;
  if (item.failedRows  === undefined)     return `${prefix}.failedRows required`;
  if (!item.severity || !VALID_SEVERITIES.has(item.severity)) {
    return `${prefix}.severity must be CRITICAL|ERROR|WARNING|INFO`;
  }
  return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: DQReportPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // ── Single result mode ──────────────────────────────────────────────────
    if ((body as SingleResultPayload).mode === 'single') {
      const p = body as SingleResultPayload;
      const err = validateResultItem(p);
      if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

      const result = await recordQualityResult({
        ruleId:        p.ruleId,
        pipelineRunId: p.pipelineRunId,
        passed:        p.passed,
        totalChecked:  p.totalChecked,
        failedRows:    p.failedRows,
        severity:      p.severity,
        sampleData:    p.sampleData,
        note:          p.note,
      });

      console.log(
        `[dq/report] single ruleId=${p.ruleId} passed=${p.passed} failed=${p.failedRows}/${p.totalChecked}`,
      );
      return NextResponse.json({ success: true, data: { id: result.id, passed: result.passed } });
    }

    // ── Bulk mode (default) ─────────────────────────────────────────────────
    const p = body as BulkResultPayload;
    if (!Array.isArray(p.results) || p.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'results array required and must be non-empty' },
        { status: 400 },
      );
    }
    if (p.results.length > 100) {
      return NextResponse.json(
        { success: false, error: 'results array too large (max 100 per request)' },
        { status: 400 },
      );
    }

    // Validate tất cả items trước khi ghi
    for (let i = 0; i < p.results.length; i++) {
      const err = validateResultItem(p.results[i], i);
      if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const { count, alertsRaised } = await recordQualityResults(
      p.results.map((r) => ({
        ruleId:        r.ruleId,
        pipelineRunId: p.pipelineRunId,
        passed:        r.passed,
        totalChecked:  r.totalChecked,
        failedRows:    r.failedRows,
        severity:      r.severity,
        sampleData:    r.sampleData,
        note:          r.note,
      })),
    );

    const failCount = p.results.filter((r) => !r.passed).length;
    console.log(
      `[dq/report] bulk count=${count} failed=${failCount} alertsRaised=${alertsRaised}` +
      (p.pipelineRunId ? ` pipelineRunId=${p.pipelineRunId}` : ''),
    );

    return NextResponse.json({
      success: true,
      data: { count, failCount, alertsRaised },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[dq/report] handler error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
