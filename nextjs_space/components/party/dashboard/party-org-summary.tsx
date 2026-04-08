'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PARTY_STATUS_LABELS,
  PARTY_STATUS_COLORS,
  REVIEW_GRADES,
} from '@/lib/constants/party.labels';

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function fmtMoney(v: number) {
  return Number(v || 0).toLocaleString('vi-VN');
}

// Static Tailwind indicator overrides — avoids dynamic inline background
const STATUS_INDICATOR_CLS: Record<string, string> = {
  CHINH_THUC: '[&>div]:bg-emerald-500',
  DU_BI: '[&>div]:bg-blue-500',
  DOI_TUONG: '[&>div]:bg-amber-500',
  CAM_TINH: '[&>div]:bg-yellow-400',
  QUAN_CHUNG: '[&>div]:bg-gray-400',
  CHUYEN_DI: '[&>div]:bg-orange-400',
  XOA_TEN_TU_NGUYEN: '[&>div]:bg-red-400',
  KHAI_TRU: '[&>div]:bg-red-800',
};

const REVIEW_INDICATOR_CLS: Record<string, string> = {
  HTXSNV: '[&>div]:bg-emerald-500',
  HTTNV: '[&>div]:bg-blue-500',
  HTNV: '[&>div]:bg-gray-500',
  KHNV: '[&>div]:bg-red-500',
};

// ── Status Distribution ───────────────────────────────────────────────────────
function StatusDistribution({ data, total }: { data: Record<string, number>; total: number }) {
  const rows = Object.entries(data).sort(([, a], [, b]) => b - a);

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map(([status, count]) => {
        const label = PARTY_STATUS_LABELS[status as keyof typeof PARTY_STATUS_LABELS] ?? status;
        const color = PARTY_STATUS_COLORS[status as keyof typeof PARTY_STATUS_COLORS] ?? '#6b7280';
        const indicatorCls = STATUS_INDICATOR_CLS[status] ?? '[&>div]:bg-slate-400';
        const p = pct(count, total);
        return (
          <div key={status}>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                  <circle cx="4" cy="4" r="4" fill={color} />
                </svg>
                <span className="text-slate-700">{label}</span>
              </div>
              <span className="font-semibold text-slate-900">
                {count}
                <span className="text-xs font-normal text-muted-foreground ml-1">({p}%)</span>
              </span>
            </div>
            <Progress value={p} className={`h-1.5 bg-slate-100 ${indicatorCls}`} />
          </div>
        );
      })}
    </div>
  );
}

// ── Review Grades ─────────────────────────────────────────────────────────────
function ReviewGrades({ data, total }: { data: Record<string, number>; total: number }) {
  const reviewTotal = Object.values(data).reduce((s, v) => s + Number(v), 0) || total;

  return (
    <div className="space-y-3">
      {REVIEW_GRADES.map((g) => {
        const count = data[g.key] ?? 0;
        const p = pct(count, reviewTotal);
        const indicatorCls = REVIEW_INDICATOR_CLS[g.key] ?? '[&>div]:bg-slate-400';
        return (
          <div key={g.key} className={`rounded-lg px-3 py-2.5 ${g.bg} border ${g.border}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold ${g.text}`}>{g.label}</span>
              <span className={`text-sm font-bold ${g.text}`}>{count}</span>
            </div>
            <Progress value={p} className={`h-1.5 bg-white/70 ${indicatorCls}`} />
            <p className={`text-[10px] mt-0.5 ${g.text} opacity-70`}>{p}% tổng đảng viên</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function PartyOrgSummary({ stats }: { stats: any | null }) {
  const dist = stats?.distributions || {};
  const fee = stats?.fee;
  const total = stats?.kpis?.totalMembers || 0;
  const feeRate = fee?.expected > 0
    ? Math.round((fee.actual / fee.expected) * 100)
    : 0;

  const inspectionRows = Object.entries(dist.inspectionTypes || {})
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* Status distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Phân bố trạng thái Đảng viên</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusDistribution data={dist.membersByStatus || {}} total={total} />
        </CardContent>
      </Card>

      {/* Review grades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Xếp loại Đảng viên</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewGrades data={dist.reviewGrades || {}} total={total} />
        </CardContent>
      </Card>

      {/* Inspection types + fee summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Loại kiểm tra/giám sát</CardTitle>
          </CardHeader>
          <CardContent>
            {inspectionRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-2">
                {inspectionRows.map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700 truncate">{type}</span>
                    <span className="font-semibold text-amber-700 ml-2 flex-shrink-0">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {fee && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Tổng hợp Đảng phí</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Phải nộp', value: fee.expected, cls: 'text-slate-700' },
                  { label: 'Đã nộp', value: fee.actual, cls: 'text-emerald-600' },
                  { label: 'Còn nợ', value: fee.debt, cls: 'text-orange-600' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 border p-2">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className={`text-sm font-bold ${item.cls}`}>{fmtMoney(item.value)}đ</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tiến độ thu phí</span>
                  <span className="font-semibold text-emerald-600">{feeRate}%</span>
                </div>
                <Progress value={feeRate} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
