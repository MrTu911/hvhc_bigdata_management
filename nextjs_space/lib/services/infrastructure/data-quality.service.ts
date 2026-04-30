/**
 * M12 – Data Quality Service
 *
 * Quản lý data quality rules và lưu kết quả kiểm tra.
 * Business transformation logic không nằm ở đây —
 * service chỉ lưu rule definition và kết quả từ worker/DAG trả về.
 */

import prisma from '@/lib/db';
import { raiseAlert, resolveAlert } from '@/lib/services/infrastructure/alert.service';
import type {
  DataQualityRule,
  DataQualityResult,
  DataQualityRuleType,
  DQSeverity,
} from '@prisma/client';

// DQ alert title prefix — dùng để dedup và auto-resolve
const DQ_ALERT_PREFIX = '[DQ]';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateRuleInput {
  ruleCode:     string;
  name:         string;
  description?: string;
  ruleType:     DataQualityRuleType;
  targetTable:  string;
  targetColumn?: string;
  ruleConfig:   object;  // {threshold, condition, sqlHint, ...}
  severity:     DQSeverity;
}

export interface RecordQualityResultInput {
  ruleId:        string;
  pipelineRunId?: string;
  passed:        boolean;
  totalChecked:  number;
  failedRows:    number;
  severity:      DQSeverity;
  sampleData?:   object;
  note?:         string;
}

export interface ListResultsFilter {
  ruleId?:       string;
  targetTable?:  string;
  passed?:       boolean;
  severity?:     DQSeverity;
  fromDate?:     Date;
  toDate?:       Date;
  page?:         number;
  pageSize?:     number;
}

// ─── Rule management ──────────────────────────────────────────────────────────

export async function createQualityRule(input: CreateRuleInput): Promise<DataQualityRule> {
  return prisma.dataQualityRule.create({
    data: {
      ruleCode:     input.ruleCode,
      name:         input.name,
      description:  input.description,
      ruleType:     input.ruleType,
      targetTable:  input.targetTable,
      targetColumn: input.targetColumn,
      ruleConfig:   input.ruleConfig,
      severity:     input.severity,
      isActive:     true,
    },
  });
}

export async function listQualityRules(activeOnly = true) {
  return prisma.dataQualityRule.findMany({
    where:   activeOnly ? { isActive: true } : undefined,
    orderBy: [{ targetTable: 'asc' }, { ruleCode: 'asc' }],
  });
}

export async function getQualityRule(id: string): Promise<DataQualityRule | null> {
  return prisma.dataQualityRule.findUnique({ where: { id } });
}

export async function toggleRuleActive(id: string, isActive: boolean): Promise<void> {
  await prisma.dataQualityRule.update({ where: { id }, data: { isActive } });
}

export async function updateRuleConfig(id: string, ruleConfig: object): Promise<void> {
  await prisma.dataQualityRule.update({ where: { id }, data: { ruleConfig } });
}

// ─── Alert sync ───────────────────────────────────────────────────────────────

/**
 * Lookup serviceId để gắn DQ alert.
 * Ưu tiên AIRFLOW (DQ chạy qua DAG), fallback về POSTGRESQL.
 * Cache trong module scope — đủ cho dev, production nên restart khi thay đổi.
 */
let _dqServiceId: string | null | undefined = undefined;

async function resolveDqServiceId(): Promise<string | null> {
  if (_dqServiceId !== undefined) return _dqServiceId;

  const svc = await prisma.bigDataService.findFirst({
    where:   { type: 'AIRFLOW', status: { not: 'UNKNOWN' } },
    orderBy: { createdAt: 'asc' },
    select:  { id: true },
  }) ?? await prisma.bigDataService.findFirst({
    where:   { type: 'POSTGRESQL', status: { not: 'UNKNOWN' } },
    orderBy: { createdAt: 'asc' },
    select:  { id: true },
  });

  _dqServiceId = svc?.id ?? null;
  return _dqServiceId;
}

/**
 * Raise alert khi DQ rule CRITICAL/ERROR fail.
 * Auto-resolve khi rule pass lại.
 * Dedup bằng (serviceId + title) — giống pattern của health.service.
 */
async function syncDqAlert(
  rule:   Pick<DataQualityRule, 'ruleCode' | 'name' | 'severity'>,
  passed: boolean,
  failedRows: number,
  totalChecked: number,
): Promise<void> {
  // Chỉ raise alert cho CRITICAL và ERROR severity
  if (rule.severity === 'WARNING' || rule.severity === 'INFO') return;

  const serviceId = await resolveDqServiceId();
  if (!serviceId) return;

  const alertTitle   = `${DQ_ALERT_PREFIX} ${rule.ruleCode} thất bại`;
  const alertSeverity = rule.severity === 'CRITICAL' ? 'CRITICAL' : 'ERROR';

  if (!passed) {
    const failPct = totalChecked > 0
      ? ((failedRows / totalChecked) * 100).toFixed(1)
      : '?';
    await raiseAlert({
      serviceId,
      title:    alertTitle,
      message:  `Rule "${rule.name}" (${rule.ruleCode}): ${failedRows}/${totalChecked} rows failed (${failPct}%). Cần kiểm tra và xử lý dữ liệu.`,
      severity: alertSeverity as 'CRITICAL' | 'ERROR',
      metadata: { ruleCode: rule.ruleCode, failedRows, totalChecked, source: 'data-quality' },
    });
  } else {
    // Passed → resolve alert đang active nếu có
    const existing = await prisma.serviceAlert.findFirst({
      where:  { serviceId, title: alertTitle, status: { in: ['ACTIVE', 'ACKNOWLEDGED'] } },
      select: { id: true },
    });
    if (existing) {
      await resolveAlert(existing.id, 'system:dq-auto-resolve');
    }
  }
}

// ─── Result recording ─────────────────────────────────────────────────────────

/**
 * Lưu kết quả một lần kiểm tra.
 * Caller là Airflow worker hoặc API callback — không phải UI trực tiếp.
 * Tự động raise/resolve ServiceAlert với rule CRITICAL/ERROR.
 */
export async function recordQualityResult(
  input: RecordQualityResultInput,
): Promise<DataQualityResult> {
  const failRate =
    input.totalChecked > 0
      ? input.failedRows / input.totalChecked
      : 0;

  const rule = await prisma.dataQualityRule.findUnique({
    where:  { id: input.ruleId },
    select: { ruleCode: true, name: true, severity: true },
  });

  const result = await prisma.dataQualityResult.create({
    data: {
      ruleId:        input.ruleId,
      pipelineRunId: input.pipelineRunId,
      passed:        input.passed,
      totalChecked:  input.totalChecked,
      failedRows:    input.failedRows,
      failRate,
      severity:      input.severity,
      sampleData:    input.sampleData ?? {},
      note:          input.note,
    },
  });

  // Alert sync non-blocking — lỗi alert không ảnh hưởng ghi result
  if (rule) {
    syncDqAlert(rule, input.passed, input.failedRows, input.totalChecked).catch((err) =>
      console.warn('[data-quality] alert sync failed:', err),
    );
  }

  return result;
}

/**
 * Bulk record — dùng khi một pipeline run có nhiều DQ rules cùng lúc.
 * Raise alert cho bất kỳ CRITICAL/ERROR rule nào fail.
 */
export async function recordQualityResults(
  inputs: RecordQualityResultInput[],
): Promise<{ count: number; alertsRaised: number }> {
  const data = inputs.map((input) => ({
    ruleId:        input.ruleId,
    pipelineRunId: input.pipelineRunId,
    passed:        input.passed,
    totalChecked:  input.totalChecked,
    failedRows:    input.failedRows,
    failRate:      input.totalChecked > 0 ? input.failedRows / input.totalChecked : 0,
    severity:      input.severity,
    sampleData:    input.sampleData ?? {},
    note:          input.note,
  }));

  const created = await prisma.dataQualityResult.createMany({ data });

  // Sync alerts cho từng rule có CRITICAL/ERROR fail
  const rules = await prisma.dataQualityRule.findMany({
    where:  { id: { in: inputs.map((i) => i.ruleId) } },
    select: { id: true, ruleCode: true, name: true, severity: true },
  });

  const ruleMap = new Map(rules.map((r) => [r.id, r]));
  let alertsRaised = 0;

  await Promise.allSettled(
    inputs.map(async (input) => {
      const rule = ruleMap.get(input.ruleId);
      if (!rule) return;
      const before = alertsRaised;
      await syncDqAlert(rule, input.passed, input.failedRows, input.totalChecked);
      if (!input.passed && (rule.severity === 'CRITICAL' || rule.severity === 'ERROR')) {
        alertsRaised = before + 1;
      }
    }),
  );

  return { count: created.count, alertsRaised };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listQualityResults(filter: ListResultsFilter) {
  const page     = filter.page     ?? 1;
  const pageSize = filter.pageSize ?? 30;

  const where: Parameters<typeof prisma.dataQualityResult.findMany>[0]['where'] = {};
  if (filter.ruleId)   where.ruleId = filter.ruleId;
  if (filter.passed !== undefined) where.passed = filter.passed;
  if (filter.severity) where.severity = filter.severity;
  if (filter.fromDate || filter.toDate) {
    where.checkedAt = {};
    if (filter.fromDate) where.checkedAt.gte = filter.fromDate;
    if (filter.toDate)   where.checkedAt.lte = filter.toDate;
  }
  if (filter.targetTable) {
    where.rule = { targetTable: filter.targetTable };
  }

  const [results, total] = await prisma.$transaction([
    prisma.dataQualityResult.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        rule: {
          select: { ruleCode: true, name: true, targetTable: true, ruleType: true },
        },
      },
    }),
    prisma.dataQualityResult.count({ where }),
  ]);

  return { results, total, page, pageSize };
}

/**
 * Tóm tắt trạng thái chất lượng dữ liệu theo bảng — dùng cho admin dashboard.
 */
export async function getQualitySummaryByTable(): Promise<
  Array<{ targetTable: string; totalRules: number; failingRules: number; lastCheckedAt: Date | null }>
> {
  const rules = await prisma.dataQualityRule.findMany({
    where:   { isActive: true },
    include: {
      results: {
        orderBy: { checkedAt: 'desc' },
        take:    1,
      },
    },
  });

  const tableMap = new Map<
    string,
    { totalRules: number; failingRules: number; lastCheckedAt: Date | null }
  >();

  for (const rule of rules) {
    const key    = rule.targetTable;
    const entry  = tableMap.get(key) ?? { totalRules: 0, failingRules: 0, lastCheckedAt: null };
    const latest = rule.results[0];

    entry.totalRules++;
    if (latest && !latest.passed) entry.failingRules++;
    if (latest && (!entry.lastCheckedAt || latest.checkedAt > entry.lastCheckedAt)) {
      entry.lastCheckedAt = latest.checkedAt;
    }

    tableMap.set(key, entry);
  }

  return Array.from(tableMap.entries()).map(([targetTable, stats]) => ({
    targetTable,
    ...stats,
  }));
}

/**
 * Lấy kết quả DQ gần nhất của mỗi rule — snapshot hiện trạng.
 */
export async function getLatestResultPerRule(): Promise<
  Array<DataQualityResult & { rule: Pick<DataQualityRule, 'ruleCode' | 'name' | 'targetTable'> }>
> {
  const rules = await prisma.dataQualityRule.findMany({
    where: { isActive: true },
    select: { id: true, ruleCode: true, name: true, targetTable: true },
  });

  const latestResults = await Promise.all(
    rules.map((r) =>
      prisma.dataQualityResult.findFirst({
        where:   { ruleId: r.id },
        orderBy: { checkedAt: 'desc' },
        include: { rule: { select: { ruleCode: true, name: true, targetTable: true } } },
      }),
    ),
  );

  return latestResults.filter(Boolean) as Array<
    DataQualityResult & { rule: Pick<DataQualityRule, 'ruleCode' | 'name' | 'targetTable'> }
  >;
}
