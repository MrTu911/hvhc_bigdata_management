'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { AwardTable, type AwardItem } from '@/components/party/award/award-table';
import { AwardForm, type AwardFormValues } from '@/components/party/award/award-form';
import {
  Trophy, Search, RefreshCw, Plus, Filter,
  ChevronLeft, ChevronRight, Star, Calendar, Users,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartyAwardsPage() {
  // Data
  const [items, setItems] = useState<AwardItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Sheet / form
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AwardItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AwardItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(draftSearch); setPage(1); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [draftSearch]);

  // ─── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (pg: number, q: string, df: string, dt: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) });
      if (q) params.set('search', q);
      if (df) params.set('dateFrom', df);
      if (dt) params.set('dateTo', dt);

      const res = await fetch(`/api/party/awards?${params}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');

      setItems(json.items ?? []);
      setPagination(json.pagination ?? null);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, search, dateFrom, dateTo);
  }, [fetchData, page, search, dateFrom, dateTo]);

  const refresh = () => fetchData(page, search, dateFrom, dateTo);

  // ─── KPI stats (computed from pagination + current year filter) ─────────────
  const [statsTotal, setStatsTotal] = useState<number | null>(null);
  const [statsYear, setStatsYear] = useState<number | null>(null);
  const [statsMonth, setStatsMonth] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    (async () => {
      try {
        const [rTotal, rYear, rMonth] = await Promise.all([
          fetch('/api/party/awards?limit=1&page=1').then(r => r.json()),
          fetch(`/api/party/awards?limit=1&page=1&dateFrom=${yearStart}`).then(r => r.json()),
          fetch(`/api/party/awards?limit=1&page=1&dateFrom=${monthStart}`).then(r => r.json()),
        ]);
        setStatsTotal(rTotal.pagination?.total ?? null);
        setStatsYear(rYear.pagination?.total ?? null);
        setStatsMonth(rMonth.pagination?.total ?? null);
      } catch {}
    })();
  }, []);

  const kpis = useMemo(() => [
    {
      label: 'Tổng khen thưởng',
      value: statsTotal,
      icon: Trophy,
      colorClass: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Năm nay',
      value: statsYear,
      icon: Star,
      colorClass: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Tháng này',
      value: statsMonth,
      icon: Calendar,
      colorClass: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Đang hiển thị',
      value: pagination?.total ?? null,
      icon: Users,
      colorClass: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
  ], [statsTotal, statsYear, statsMonth, pagination]);

  // ─── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload: AwardFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/party/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Tạo khen thưởng thất bại');
      toast({ title: 'Thành công', description: 'Đã tạo bản ghi khen thưởng' });
      setSheetOpen(false);
      setPage(1);
      refresh();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const handleEdit = async (payload: AwardFormValues) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/party/awards/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cập nhật thất bại');
      toast({ title: 'Thành công', description: 'Đã cập nhật bản ghi khen thưởng' });
      setSheetOpen(false);
      setEditTarget(null);
      refresh();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/party/awards/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Xóa thất bại');
      toast({ title: 'Đã xóa', description: `Đã xóa khen thưởng "${deleteTarget.title}"` });
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) setPage(p => p - 1);
      else refresh();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setSheetOpen(true); };
  const openEdit = (item: AwardItem) => { setEditTarget(item); setSheetOpen(true); };

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasActiveFilter = !!(search || dateFrom || dateTo);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-24 top-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 bottom-0 opacity-[0.06]">
          <Trophy className="h-52 w-52" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="text-amber-100 text-sm font-medium">Khen thưởng Đảng · M03</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Khen thưởng trong Đảng</h1>
            <p className="text-amber-100 text-sm mt-1">
              UC-69 · Quản lý quyết định khen thưởng theo chuẩn hồ sơ Đảng viên
            </p>
            {statsTotal !== null && (
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  {statsTotal} bản ghi
                </span>
                {statsYear !== null && (
                  <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                    {statsYear} năm nay
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="bg-white/15 border-white/25 text-white hover:bg-white/25 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </Button>
            <Button
              size="sm"
              className="bg-white text-amber-700 hover:bg-amber-50 gap-2"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" /> Thêm khen thưởng
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
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
                  {k.value === null ? (
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

      {/* ── Filters ──────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Text search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm danh hiệu, số quyết định, cấp ra quyết định, đảng viên..."
                value={draftSearch}
                onChange={e => setDraftSearch(e.target.value)}
                className="pl-9 h-9 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 w-36 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-xs"
                title="Từ ngày"
              />
              <span className="text-gray-400 text-xs">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 w-36 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-xs"
                title="Đến ngày"
              />
            </div>

            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                onClick={() => {
                  setDraftSearch('');
                  setSearch('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Award List ───────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading
              ? 'Đang tải...'
              : `${total.toLocaleString()} bản ghi khen thưởng`}
            {hasActiveFilter && !loading && (
              <span className="ml-2 text-xs text-gray-400">· đang lọc</span>
            )}
          </span>
          {search && (
            <span className="text-xs text-gray-400">
              Tìm kiếm: &ldquo;<span className="text-gray-600 dark:text-gray-300 font-medium">{search}</span>&rdquo;
            </span>
          )}
        </div>

        <CardContent className="p-0">
          <AwardTable
            items={items}
            loading={loading}
            onEdit={openEdit}
            onDelete={item => setDeleteTarget(item)}
          />
        </CardContent>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
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
                const pg = totalPages <= 7 ? i + 1
                  : page <= 4 ? i + 1
                  : page >= totalPages - 3 ? totalPages - 6 + i
                  : page - 3 + i;
                return (
                  <Button
                    key={pg}
                    variant={pg === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pg)}
                    className={`h-7 w-7 p-0 text-xs ${pg === page ? 'bg-amber-600 hover:bg-amber-700 border-amber-600' : ''}`}
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

      {/* ── Create / Edit Sheet ──────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={open => { setSheetOpen(open); if (!open) setEditTarget(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle>{editTarget ? 'Chỉnh sửa khen thưởng' : 'Thêm khen thưởng mới'}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">UC-69 · Hồ sơ khen thưởng Đảng viên</p>
              </div>
            </div>
          </SheetHeader>

          {/* Summary of award being edited */}
          {editTarget && (
            <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide mb-1">Đang chỉnh sửa</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{editTarget.title}</p>
              {editTarget.decisionDate && (
                <p className="text-xs text-gray-500 mt-0.5">Ngày {fmtDate(editTarget.decisionDate)}</p>
              )}
            </div>
          )}

          <AwardForm
            editMode={!!editTarget}
            initial={editTarget ? {
              partyMemberId: editTarget.partyMemberId,
              partyMemberName: editTarget.partyMember?.user?.name ?? '',
              partyMemberMilitaryId: editTarget.partyMember?.user?.militaryId ?? undefined,
              title: editTarget.title,
              decisionNo: editTarget.decisionNo ?? '',
              decisionDate: editTarget.decisionDate
                ? new Date(editTarget.decisionDate).toISOString().split('T')[0]
                : '',
              issuer: editTarget.issuer ?? '',
              note: editTarget.note ?? '',
              attachmentUrl: editTarget.attachmentUrl ?? '',
            } : undefined}
            submitting={submitting}
            onSubmit={editTarget ? handleEdit : handleCreate}
            onCancel={() => { setSheetOpen(false); setEditTarget(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ──────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khen thưởng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa bản ghi khen thưởng{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              {deleteTarget?.partyMember?.user?.name && (
                <> của <span className="font-semibold">{deleteTarget.partyMember.user.name}</span></>
              )}
              ? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
