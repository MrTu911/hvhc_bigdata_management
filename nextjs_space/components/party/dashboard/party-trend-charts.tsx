'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, Area, AreaChart, ComposedChart, Line,
} from 'recharts';

function formatMonth(ym: string) {
  if (!ym) return ym;
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  return `T${parseInt(parts[1])}`;
}

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

// Recharts-native tooltip styles (passed as props, not JSX style attributes)
const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '13px',
  padding: '8px 12px',
};
const TOOLTIP_LABEL_STYLE = { fontWeight: 600, color: '#334155', marginBottom: '4px' };
const TOOLTIP_ITEM_STYLE = { color: '#475569', padding: '1px 0' };

function moneyFormatter(value: number, name: string): [string, string] {
  return [`${fmtMoney(value)}đ`, name];
}
function pctFormatter(value: number, name: string): [string, string] {
  return [`${value}%`, name];
}
function defaultFormatter(value: number, name: string): [string | number, string] {
  return [value, name];
}

export function PartyTrendCharts({ trends }: { trends: any[] }) {
  const data = (trends || []).map((t) => ({
    ...t,
    monthLabel: formatMonth(t.month),
  }));

  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu xu hướng cho kỳ này
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* Chart 1: Kết nạp mới + Tỷ lệ dự họp */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Kết nạp & Tỷ lệ dự họp</CardTitle>
          <CardDescription>Kết nạp mới theo tháng và tỷ lệ tham dự sinh hoạt</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                unit="%"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value: any, name: string) =>
                  name === 'Dự họp %' ? pctFormatter(value, name) : defaultFormatter(value, name)
                }
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
              />
              <Bar
                yAxisId="left"
                dataKey="newMembers"
                name="Kết nạp mới"
                fill="#818cf8"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="attendanceRate"
                name="Dự họp %"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Đảng phí theo tháng */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Đảng phí theo tháng</CardTitle>
          <CardDescription>Phải nộp, đã nộp và còn nợ</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={fmtMoney}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value: any, name: string) => moneyFormatter(value, name)}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
              />
              <Bar dataKey="feeExpected" name="Phải nộp" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="feeActual" name="Đã nộp" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="feeDebt" name="Còn nợ" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 3: Kỷ luật · Kiểm tra · Đánh giá (full-width) */}
      <Card className="xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Kỷ luật · Kiểm tra · Đánh giá theo tháng</CardTitle>
          <CardDescription>Theo dõi hoạt động kiểm tra, giám sát và đánh giá đảng viên</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gDiscipline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInspection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value: any, name: string) => defaultFormatter(value, name)}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
              />
              <Area
                type="monotone"
                dataKey="disciplines"
                name="Kỷ luật"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#gDiscipline)"
              />
              <Area
                type="monotone"
                dataKey="inspections"
                name="Kiểm tra"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gInspection)"
              />
              <Area
                type="monotone"
                dataKey="reviews"
                name="Đánh giá"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gReview)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
