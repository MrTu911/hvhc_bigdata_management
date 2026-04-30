/**
 * Template Analytics Service – M18 UC-T10
 *
 * Aggregate thống kê sử dụng template từ ExportJob.
 * TemplateAnalyticsDaily dùng làm cache theo ngày — upsert sau mỗi lần query.
 *
 * Thiết kế:
 *  - Source of truth: ExportJob (realtime)
 *  - Cache:           TemplateAnalyticsDaily (by day, lazy upsert)
 *  - avgRenderMs:     tính từ completedAt − createdAt trong JS (Prisma không hỗ trợ DATEDIFF trong groupBy)
 */

import prisma from '@/lib/db';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalTemplates: number;
  activeTemplates: number;
  totalJobs: number;
  totalExports: number;       // sum của successCount trên toàn bộ jobs
  totalFailed: number;        // sum của failCount
  successRate: number;        // 0–100, tính trên (success + fail)
  avgRenderMs: number | null; // ms, trung bình từ completed jobs 30 ngày qua
  jobsToday: number;
  exportsToday: number;
}

export interface DailyTrendPoint {
  date: string;         // 'YYYY-MM-DD'
  jobCount: number;
  successCount: number;
  failCount: number;
}

export interface TopTemplate {
  templateId: string;
  name: string;
  code: string;
  category: string | null;
  totalJobs: number;
  totalExports: number;
  failCount: number;
  successRate: number;  // 0–100
  avgRenderMs: number | null;
}

export interface TemplateAnalyticsDetail {
  template: {
    id: string;
    name: string;
    code: string;
    category: string | null;
    version: number;
    isActive: boolean;
  };
  summary: {
    totalJobs: number;
    totalExports: number;
    failCount: number;
    successRate: number;
    avgRenderMs: number | null;
  };
  dailyTrend: DailyTrendPoint[];
  formatBreakdown: { format: string; count: number }[];
  entityTypeBreakdown: { entityType: string; count: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

/** Tính avgRenderMs từ danh sách job đã completed. */
function calcAvgRenderMs(
  jobs: { createdAt: Date; completedAt: Date | null }[],
): number | null {
  const valid = jobs.filter(j => j.completedAt !== null);
  if (valid.length === 0) return null;
  const total = valid.reduce(
    (sum, j) => sum + (j.completedAt!.getTime() - j.createdAt.getTime()),
    0,
  );
  return Math.round(total / valid.length);
}

/** Điền ngày còn thiếu trong khoảng [startDate, endDate] bằng zero point. */
function fillDateGaps(
  points: DailyTrendPoint[],
  days: number,
): DailyTrendPoint[] {
  const map = new Map(points.map(p => [p.date, p]));
  const result: DailyTrendPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateString(d);
    result.push(
      map.get(key) ?? { date: key, jobCount: 0, successCount: 0, failCount: 0 },
    );
  }
  return result;
}

function sinceNDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Tóm tắt tổng hệ thống: KPI cards cho dashboard analytics.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const todayStart = startOfToday();
  const thirtyDaysAgo = sinceNDaysAgo(30);

  const [
    totalTemplates,
    activeTemplates,
    allJobAgg,
    todayJobAgg,
    completedJobsRecent,
  ] = await Promise.all([
    prisma.reportTemplate.count({ where: { parentId: null } }),
    prisma.reportTemplate.count({ where: { parentId: null, isActive: true } }),
    prisma.exportJob.aggregate({
      _count: { id: true },
      _sum: { successCount: true, failCount: true },
    }),
    prisma.exportJob.aggregate({
      where: { createdAt: { gte: todayStart } },
      _count: { id: true },
      _sum: { successCount: true },
    }),
    // Chỉ fetch completedAt để tính avgRenderMs, giới hạn 30 ngày gần nhất
    prisma.exportJob.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
      take: 500,
    }),
  ]);

  const totalExports = allJobAgg._sum.successCount ?? 0;
  const totalFailed = allJobAgg._sum.failCount ?? 0;
  const denominator = totalExports + totalFailed;
  const successRate = denominator > 0 ? Math.round((totalExports / denominator) * 100) : 0;

  return {
    totalTemplates,
    activeTemplates,
    totalJobs: allJobAgg._count.id,
    totalExports,
    totalFailed,
    successRate,
    avgRenderMs: calcAvgRenderMs(completedJobsRecent),
    jobsToday: todayJobAgg._count.id,
    exportsToday: todayJobAgg._sum.successCount ?? 0,
  };
}

/**
 * Format breakdown tổng hợp trong N ngày gần nhất.
 */
export async function getFormatBreakdown(
  days: 7 | 30 | 90 = 30,
): Promise<{ format: string; count: number }[]> {
  const since = sinceNDaysAgo(days);
  const grouped = await prisma.exportJob.groupBy({
    by: ['outputFormat'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  return grouped.map(g => ({ format: g.outputFormat, count: g._count.id }));
}

/**
 * Trend xuất file theo ngày trong N ngày gần nhất.
 * Aggregate trong JS để tránh dùng raw SQL.
 */
export async function getDailyTrend(days: 7 | 30 | 90 = 30): Promise<DailyTrendPoint[]> {
  const since = sinceNDaysAgo(days);

  const jobs = await prisma.exportJob.findMany({
    where: { createdAt: { gte: since } },
    select: {
      createdAt: true,
      successCount: true,
      failCount: true,
    },
  });

  // Aggregate by date string
  const dateMap = new Map<string, { jobCount: number; successCount: number; failCount: number }>();

  for (const job of jobs) {
    const key = toDateString(job.createdAt);
    const existing = dateMap.get(key) ?? { jobCount: 0, successCount: 0, failCount: 0 };
    dateMap.set(key, {
      jobCount: existing.jobCount + 1,
      successCount: existing.successCount + job.successCount,
      failCount: existing.failCount + job.failCount,
    });
  }

  const points: DailyTrendPoint[] = Array.from(dateMap.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  return fillDateGaps(points, days);
}

/**
 * Top N template được sử dụng nhiều nhất trong N ngày gần nhất.
 */
export async function getTopTemplates(
  limit = 10,
  days: 7 | 30 | 90 = 30,
): Promise<TopTemplate[]> {
  const since = sinceNDaysAgo(days);

  // groupBy templateId để đếm jobs + sum success/fail
  const grouped = await prisma.exportJob.groupBy({
    by: ['templateId'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    _sum: { successCount: true, failCount: true },
    orderBy: { _sum: { successCount: 'desc' } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const templateIds = grouped.map(g => g.templateId);

  // Fetch template metadata
  const templates = await prisma.reportTemplate.findMany({
    where: { id: { in: templateIds }, parentId: null },
    select: { id: true, name: true, code: true, category: true },
  });
  const templateMap = new Map(templates.map(t => [t.id, t]));

  // Fetch completed jobs to compute avgRenderMs per template
  const completedJobs = await prisma.exportJob.findMany({
    where: {
      templateId: { in: templateIds },
      status: 'COMPLETED',
      createdAt: { gte: since },
      completedAt: { not: null },
    },
    select: { templateId: true, createdAt: true, completedAt: true },
  });

  // Group render times by templateId
  const renderTimes = new Map<string, { createdAt: Date; completedAt: Date | null }[]>();
  for (const j of completedJobs) {
    const arr = renderTimes.get(j.templateId) ?? [];
    arr.push({ createdAt: j.createdAt, completedAt: j.completedAt });
    renderTimes.set(j.templateId, arr);
  }

  return grouped.map(g => {
    const tmpl = templateMap.get(g.templateId);
    const exports = g._sum.successCount ?? 0;
    const failed = g._sum.failCount ?? 0;
    const denom = exports + failed;

    return {
      templateId: g.templateId,
      name: tmpl?.name ?? '(đã xóa)',
      code: tmpl?.code ?? g.templateId.slice(0, 8),
      category: tmpl?.category ?? null,
      totalJobs: g._count.id,
      totalExports: exports,
      failCount: failed,
      successRate: denom > 0 ? Math.round((exports / denom) * 100) : 0,
      avgRenderMs: calcAvgRenderMs(renderTimes.get(g.templateId) ?? []),
    };
  });
}

/**
 * Chi tiết analytics cho 1 template.
 */
export async function getTemplateAnalyticsDetail(
  templateId: string,
  days: 7 | 30 | 90 = 30,
): Promise<TemplateAnalyticsDetail | null> {
  const since = sinceNDaysAgo(days);

  const [template, allJobs] = await Promise.all([
    prisma.reportTemplate.findUnique({
      where: { id: templateId, parentId: null },
      select: { id: true, name: true, code: true, category: true, version: true, isActive: true },
    }),
    prisma.exportJob.findMany({
      where: { templateId, createdAt: { gte: since } },
      select: {
        createdAt: true,
        completedAt: true,
        successCount: true,
        failCount: true,
        status: true,
        outputFormat: true,
        entityType: true,
      },
    }),
  ]);

  if (!template) return null;

  // Summary
  const totalJobs = allJobs.length;
  const totalExports = allJobs.reduce((s, j) => s + j.successCount, 0);
  const failCount = allJobs.reduce((s, j) => s + j.failCount, 0);
  const denom = totalExports + failCount;
  const avgRenderMs = calcAvgRenderMs(allJobs.filter(j => j.status === 'COMPLETED'));

  // Daily trend
  const dateMap = new Map<string, { jobCount: number; successCount: number; failCount: number }>();
  for (const j of allJobs) {
    const key = toDateString(j.createdAt);
    const existing = dateMap.get(key) ?? { jobCount: 0, successCount: 0, failCount: 0 };
    dateMap.set(key, {
      jobCount: existing.jobCount + 1,
      successCount: existing.successCount + j.successCount,
      failCount: existing.failCount + j.failCount,
    });
  }
  const trendPoints: DailyTrendPoint[] = Array.from(dateMap.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  // Format breakdown
  const fmtMap = new Map<string, number>();
  for (const j of allJobs) {
    fmtMap.set(j.outputFormat, (fmtMap.get(j.outputFormat) ?? 0) + 1);
  }
  const formatBreakdown = Array.from(fmtMap.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  // Entity type breakdown
  const etMap = new Map<string, number>();
  for (const j of allJobs) {
    etMap.set(j.entityType, (etMap.get(j.entityType) ?? 0) + 1);
  }
  const entityTypeBreakdown = Array.from(etMap.entries())
    .map(([entityType, count]) => ({ entityType, count }))
    .sort((a, b) => b.count - a.count);

  // Upsert TemplateAnalyticsDaily (lazy cache — non-blocking)
  void upsertDailyCache(templateId, trendPoints).catch((err: unknown) => {
    console.error('[M18 analytics cache] upsertDailyCache failed', { templateId, error: err });
  });

  return {
    template,
    summary: {
      totalJobs,
      totalExports,
      failCount,
      successRate: denom > 0 ? Math.round((totalExports / denom) * 100) : 0,
      avgRenderMs,
    },
    dailyTrend: fillDateGaps(trendPoints, days),
    formatBreakdown,
    entityTypeBreakdown,
  };
}

/**
 * Upsert TemplateAnalyticsDaily từ trend points vừa tính.
 * Fire-and-forget — không block response.
 */
async function upsertDailyCache(
  templateId: string,
  points: DailyTrendPoint[],
): Promise<void> {
  for (const p of points) {
    if (p.jobCount === 0) continue;
    await prisma.templateAnalyticsDaily.upsert({
      where: {
        templateId_date: {
          templateId,
          date: new Date(p.date),
        },
      },
      update: {
        totalExports: p.successCount + p.failCount,
        successCount: p.successCount,
        failCount: p.failCount,
      },
      create: {
        templateId,
        date: new Date(p.date),
        totalExports: p.successCount + p.failCount,
        successCount: p.successCount,
        failCount: p.failCount,
      },
    });
  }
}
