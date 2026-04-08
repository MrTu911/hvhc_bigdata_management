'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Search, ChevronRight, UserCheck, Clock,
  UserX, Star, Shield, Filter, RefreshCw, Eye,
  ChevronLeft,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface MemberRow {
  id: string;
  partyCardNumber?: string | null;
  partyCell?: string | null;
  partyRole?: string | null;
  joinDate?: string | null;
  officialDate?: string | null;
  status: string;
  user?: {
    name?: string;
    militaryId?: string;
    email?: string;
    rank?: string;
    position?: string;
    unitRelation?: { name: string; code: string } | null;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StatusStats {
  total: number;
  byStatus: Record<string, number>;
}

// ─────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: React.ElementType;
}> = {
  CHINH_THUC:   { label: 'Chính thức',  badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500', icon: UserCheck },
  DU_BI:        { label: 'Dự bị',       badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',         dotClass: 'bg-blue-500',     icon: Clock },
  QUAN_CHUNG:   { label: 'Quần chúng',  badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',      dotClass: 'bg-slate-400',    icon: Users },
  CAM_TINH:     { label: 'Cảm tình',    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',   dotClass: 'bg-violet-500',   icon: Star },
  DOI_TUONG:    { label: 'Đối tượng',   badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',      dotClass: 'bg-amber-500',    icon: Shield },
  CHUYEN_DI:    { label: 'Chuyển đi',   badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',         dotClass: 'bg-cyan-500',     icon: ChevronRight },
  KHAI_TRU:     { label: 'Khai trừ',    badgeClass: 'bg-red-100 text-red-700 border-red-200',            dotClass: 'bg-red-500',      icon: UserX },
  ACTIVE:       { label: 'Hoạt động',   badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500', icon: UserCheck },
  TRANSFERRED:  { label: 'Đã chuyển',   badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',         dotClass: 'bg-cyan-500',     icon: ChevronRight },
  SUSPENDED:    { label: 'Đình chỉ',    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',   dotClass: 'bg-orange-500',   icon: UserX },
  EXPELLED:     { label: 'Khai trừ',    badgeClass: 'bg-red-100 text-red-700 border-red-200',            dotClass: 'bg-red-500',      icon: UserX },
};

const DEFAULT_STATUS = { label: 'Không rõ', badgeClass: 'bg-gray-100 text-gray-600 border-gray-200', dotClass: 'bg-gray-400', icon: Users };

function getStatus(s: string) { return STATUS_CONFIG[s] ?? DEFAULT_STATUS; }

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────
const LIMIT = 20;

export default function PartyMembersPage() {
  const [items, setItems]         = useState<MemberRow[]>([]);
  const [pagination, setPag]      = useState<Pagination | null>(null);
  const [stats, setStats]         = useState<StatusStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [page, setPage]           = useState(1);

  const fetchData = useCallback(async (pg: number, q: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) });
      if (q)          params.set('search', q);
      if (st !== 'ALL') params.set('status', st);
      const res  = await fetch(`/api/party-members?${params}`);
      const json = await res.json();
      setItems(json?.members ?? []);
      setPag(json?.pagination ?? null);
      setStats(json?.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page, search, statusFilter); }, [fetchData, page, search, statusFilter]);

  // Debounced search
  const [draftSearch, setDraftSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(draftSearch); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [draftSearch]);

  const handleStatus = (s: string) => { setStatus(s); setPage(1); };

  // KPI from stats
  const kpis = useMemo(() => {
    const by = stats?.byStatus ?? {};
    return [
      { label: 'Tổng đảng viên', value: stats?.total ?? 0, icon: Users,      colorClass: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
      { label: 'Chính thức',     value: (by['CHINH_THUC'] ?? 0) + (by['ACTIVE'] ?? 0),  icon: UserCheck, colorClass: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
      { label: 'Dự bị',          value: by['DU_BI'] ?? 0,      icon: Clock, colorClass: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950/40' },
      { label: 'Đối tượng / Cảm tình', value: (by['DOI_TUONG'] ?? 0) + (by['CAM_TINH'] ?? 0), icon: Star, colorClass: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    ];
  }, [stats]);

  // Filter tabs
  const filterTabs = [
    { key: 'ALL',        label: 'Tất cả' },
    { key: 'CHINH_THUC', label: 'Chính thức' },
    { key: 'DU_BI',      label: 'Dự bị' },
    { key: 'CAM_TINH',   label: 'Cảm tình' },
    { key: 'DOI_TUONG',  label: 'Đối tượng' },
    { key: 'QUAN_CHUNG', label: 'Quần chúng' },
    { key: 'KHAI_TRU',   label: 'Khai trừ' },
  ];

  const total      = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">

      {/* ── Hero Banner ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-24 top-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 bottom-0 opacity-[0.04]">
          <Shield className="h-48 w-48" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-red-200 text-sm font-medium">Quản lý Đảng viên · M03</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Đảng viên</h1>
            <p className="text-red-100 text-sm mt-1">
              UC-63 · Danh sách hồ sơ toàn trình theo chuẩn biểu mẫu 2A-LLĐV
            </p>
            {stats && (
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  {stats.total} đảng viên
                </span>
                <span className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  {(stats.byStatus['CHINH_THUC'] ?? 0) + (stats.byStatus['ACTIVE'] ?? 0)} chính thức
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(page, search, statusFilter)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </Button>
            <Link href="/dashboard/party/recruitment">
              <Button size="sm" className="bg-white text-red-700 hover:bg-red-50 gap-2">
                <ChevronRight className="h-4 w-4" /> Kết nạp mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${k.bg} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${k.colorClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{k.label}</p>
                  {loading ? (
                    <Skeleton className="h-6 w-12 mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ───────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email, mã quân nhân..."
                value={draftSearch}
                onChange={e => setDraftSearch(e.target.value)}
                className="pl-9 h-9 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
              <div className="flex flex-wrap gap-1.5">
                {filterTabs.map(t => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => handleStatus(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === t.key
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Member List ───────────────────────── */}
      <Card className="border-0 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading ? 'Đang tải...' : `${total.toLocaleString()} đảng viên`}
            {statusFilter !== 'ALL' && (
              <span className="ml-2 text-xs text-gray-400">
                · lọc: {filterTabs.find(t => t.key === statusFilter)?.label}
              </span>
            )}
          </span>
          {search && (
            <span className="text-xs text-gray-400">
              Tìm kiếm: "<span className="text-gray-600 dark:text-gray-300 font-medium">{search}</span>"
            </span>
          )}
        </div>

        <CardContent className="p-0">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
            <span>Họ tên / Đơn vị</span>
            <span>Chức vụ Đảng</span>
            <span>Chi bộ</span>
            <span>Ngày vào Đảng</span>
            <span>Trạng thái</span>
            <span />
          </div>

          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 hidden md:block" />
                  <Skeleton className="h-6 w-20 hidden md:block" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy đảng viên</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {items.map(m => {
                const sc = getStatus(m.status);
                const Icon = sc.icon;
                const initials = (m.user?.name ?? '?').split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase();
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-3.5 items-center hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    {/* Name + Unit */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {m.user?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {m.user?.militaryId ?? '—'} · {m.user?.unitRelation?.name ?? m.user?.rank ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Party role */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate hidden md:block">
                      {m.partyRole ?? '—'}
                    </p>

                    {/* Party cell */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate hidden md:block">
                      {m.partyCell ?? '—'}
                    </p>

                    {/* Join date */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                      {fmtDate(m.joinDate)}
                    </p>

                    {/* Status */}
                    <div className="hidden md:flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dotClass}`} />
                      <Badge className={`${sc.badgeClass} border text-[11px] font-semibold gap-1`}>
                        <Icon className="h-3 w-3" />
                        {sc.label}
                      </Badge>
                    </div>

                    {/* Mobile status pill */}
                    <div className="flex items-center justify-between md:hidden">
                      <Badge className={`${sc.badgeClass} border text-[11px] font-semibold`}>{sc.label}</Badge>
                      <span className="text-xs text-gray-400">{fmtDate(m.joinDate)}</span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end">
                      <Link href={`/dashboard/party/members/${m.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Hồ sơ</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Trang {page}/{totalPages} · {total.toLocaleString()} bản ghi
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <Button
                    key={pg}
                    variant={pg === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pg)}
                    className={`h-7 w-7 p-0 text-xs ${pg === page ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                  >
                    {pg}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
