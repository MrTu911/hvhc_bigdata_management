'use client';

/**
 * M18 — KPI Nhóm mẫu văn bản hành chính (Nghị định 30/2020)
 *
 * Hiển thị độ phủ thể thức theo module + thống kê sử dụng của nhóm mẫu hành chính.
 * Dữ liệu từ GET /api/templates/admin-docs/kpis.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, RefreshCw, FileText, LayoutGrid, Layers, Link2, Download, CheckCircle2, BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ─── Types (mirror service) ─────────────────────────────────────────────────────
interface CountItem { key: string; label: string; count: number }
interface CoverageRow { module: string; counts: Record<string, number>; total: number }
interface AdminDocKpis {
  total: number;
  entityBound: number;
  skeleton: number;
  modulesCovered: number;
  docTypesCovered: number;
  byModule: CountItem[];
  byDocType: CountItem[];
  byCategory: CountItem[];
  byClassification: CountItem[];
  coverage: { docTypes: { key: string; label: string }[]; rows: CoverageRow[] };
  usage: { totalJobs: number; totalExports: number; failCount: number; successRate: number; topUsed: { code: string; name: string; exports: number }[] };
}

// ─── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color = 'blue',
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: 'blue' | 'green' | 'amber' | 'purple' | 'gray';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Thanh tỉ lệ ngang đơn giản cho breakdown. */
function BreakdownList({ items, max }: { items: CountItem[]; max: number }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Chưa có dữ liệu</p>;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-2 text-sm">
          <span className="w-28 truncate" title={it.label}>{it.label}</span>
          <div className="flex-1 bg-gray-100 rounded h-2 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${max > 0 ? (it.count / max) * 100 : 0}%` }} />
          </div>
          <span className="w-8 text-right text-xs font-medium text-gray-600">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDocKpiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<AdminDocKpis | null>(null);

  const fetchKpis = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetch('/api/templates/admin-docs/kpis');
      if (!res.ok) throw new Error('Lỗi tải KPI');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Lỗi tải KPI');
      setKpis(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  const maxModule = kpis ? Math.max(1, ...kpis.byModule.map((m) => m.count)) : 1;
  const maxCategory = kpis ? Math.max(1, ...kpis.byCategory.map((m) => m.count)) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              KPI mẫu văn bản hành chính (NĐ 30/2020)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Độ phủ thể thức theo module và thống kê sử dụng
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchKpis(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Tổng mẫu" value={kpis.total} icon={FileText} color="blue" />
          <KpiCard label="Module phủ" value={kpis.modulesCovered} icon={LayoutGrid} color="purple" />
          <KpiCard label="Thể thức phủ" value={`${kpis.docTypesCovered}/8`} icon={Layers} color="amber" />
          <KpiCard label="Gắn dữ liệu" value={kpis.entityBound} sub={`${kpis.skeleton} form trắng`} icon={Link2} color="green" />
          <KpiCard label="Lượt xuất" value={kpis.usage.totalExports.toLocaleString()} sub={`${kpis.usage.totalJobs} job`} icon={Download} color="blue" />
          <KpiCard label="Tỉ lệ thành công" value={`${kpis.usage.successRate}%`} icon={CheckCircle2} color={kpis.usage.successRate >= 90 ? 'green' : 'amber'} />
        </div>
      )}

      {/* Coverage matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue-500" />
            Ma trận độ phủ thể thức (module × loại văn bản)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : kpis && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Module</TableHead>
                  {kpis.coverage.docTypes.map((d) => (
                    <TableHead key={d.key} className="text-center" title={d.label}>{d.key}</TableHead>
                  ))}
                  <TableHead className="text-center w-16 font-semibold">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.coverage.rows.map((row) => (
                  <TableRow key={row.module}>
                    <TableCell className="font-medium">{row.module}</TableCell>
                    {kpis.coverage.docTypes.map((d) => {
                      const c = row.counts[d.key] ?? 0;
                      return (
                        <TableCell key={d.key} className="text-center">
                          {c > 0
                            ? <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-600 text-xs font-semibold">{c}</span>
                            : <span className="text-gray-300">–</span>}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns + usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Theo module</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : kpis && <BreakdownList items={kpis.byModule} max={maxModule} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Theo nhóm nghiệp vụ</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : kpis && <BreakdownList items={kpis.byCategory} max={maxCategory} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân loại & Top sử dụng</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <Skeleton className="h-32 w-full" /> : kpis && (
              <>
                <div className="flex flex-wrap gap-2">
                  {kpis.byClassification.map((c) => (
                    <Badge key={c.key} variant="outline" className="text-xs">{c.label}: {c.count}</Badge>
                  ))}
                </div>
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Top mẫu được xuất nhiều</p>
                  {kpis.usage.topUsed.length === 0 ? (
                    <p className="text-sm text-gray-400">Chưa có lượt xuất nào</p>
                  ) : (
                    <ul className="space-y-1">
                      {kpis.usage.topUsed.map((t) => (
                        <li key={t.code} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[160px]" title={t.name}>{t.name}</span>
                          <span className="font-semibold text-gray-600">{t.exports}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
