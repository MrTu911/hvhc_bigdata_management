'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PartyKpiCards } from '@/components/party/dashboard/party-kpi-cards';
import { PartyTrendCharts } from '@/components/party/dashboard/party-trend-charts';
import { PartyOrgSummary } from '@/components/party/dashboard/party-org-summary';
import { toast } from '@/components/ui/use-toast';
import {
  Star, RefreshCw, AlertTriangle, Network, Filter,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-64 rounded-xl xl:col-span-2" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PartyDashboardOpsPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [orgId, setOrgId] = useState('ALL');
  const [orgs, setOrgs] = useState<{ id: string; name: string; code: string }[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Fetch org list for the dropdown filter
  useEffect(() => {
    fetch('/api/party/orgs?limit=100')
      .then((r) => r.json())
      .then((d) => setOrgs(d.data || []))
      .catch(() => {});
  }, []);

  const range = useMemo(() => ({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }), [year]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsParams = new URLSearchParams({ year: String(year) });
      if (orgId !== 'ALL') statsParams.set('orgId', orgId);

      const trendParams = new URLSearchParams({ from: range.from, to: range.to });
      if (orgId !== 'ALL') trendParams.set('orgId', orgId);

      const [statsRes, trendsRes] = await Promise.all([
        fetch(`/api/party/dashboard/stats?${statsParams}`),
        fetch(`/api/party/dashboard/trends?${trendParams}`),
      ]);

      const statsJson = await statsRes.json().catch(() => ({}));
      const trendsJson = await trendsRes.json().catch(() => ({}));

      if (!statsRes.ok) throw new Error(statsJson.error || `Lỗi ${statsRes.status}`);
      if (!trendsRes.ok) throw new Error(trendsJson.error || `Lỗi ${trendsRes.status}`);

      setStats(statsJson);
      setTrends(trendsJson.trends || []);
      setLastFetched(new Date());
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Lỗi tải dashboard', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [year, orgId, range]);

  // Initial load
  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedOrg = orgs.find((o) => o.id === orgId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-6 text-white shadow-lg">
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-12 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

              {/* Title block */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-red-200 text-xs font-semibold uppercase tracking-widest">
                    Học viện Hậu cần · M03
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Điều hành Công tác Đảng</h1>
                <p className="text-red-200 text-sm mt-1">
                  KPI · Xu hướng · Phân bố · Tài chính Đảng phí
                </p>
              </div>

              {/* Interactive filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Year toggle group */}
                <div className="flex rounded-lg overflow-hidden border border-white/20">
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        year === y
                          ? 'bg-white text-red-700'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>

                {/* Org filter */}
                <Select value={orgId} onValueChange={setOrgId}>
                  <SelectTrigger className="w-52 h-9 border-white/20 bg-white/10 text-white text-sm [&>svg]:text-white">
                    <Network className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-white" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toàn học viện</SelectItem>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  size="sm"
                  onClick={fetchData}
                  disabled={loading}
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-9 gap-1.5"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Đang tải…' : 'Tải lại'}
                </Button>
              </div>
            </div>

            {/* Active filter pills + last updated */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <Filter className="h-3.5 w-3.5 text-red-200 flex-shrink-0" />
              <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25">
                Năm {year}
              </Badge>
              {orgId !== 'ALL' && selectedOrg && (
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25">
                  {selectedOrg.name}
                </Badge>
              )}
              {lastFetched && (
                <span className="text-xs text-red-200 ml-auto">
                  Cập nhật: {lastFetched.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-red-700 hover:text-red-900 h-7"
              onClick={fetchData}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Dashboard content ─────────────────────────────────────────── */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <PartyKpiCards stats={stats} year={year} />
            <PartyTrendCharts trends={trends} />
            <PartyOrgSummary stats={stats} />
          </>
        )}
      </div>
    </div>
  );
}
