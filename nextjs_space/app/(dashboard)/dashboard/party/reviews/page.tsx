'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ReviewForm, REVIEW_GRADES, type ReviewFormPayload } from '@/components/party/review/review-form';
import { ReviewTable, type ReviewRow } from '@/components/party/review/review-table';
import {
  Plus, Search, RefreshCw, Trophy, TrendingUp, Minus, XCircle, Users,
  ChevronLeft, ChevronRight, Send, CheckCircle2, Clock,
} from 'lucide-react';

// ─── Grade KPI config ─────────────────────────────────
const GRADE_KPI = [
  {
    value: 'HTXSNV',
    label: 'Hoàn thành xuất sắc',
    short: 'HTXSNV',
    icon: Trophy,
    cardClass: 'border-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-600',
    countClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
  {
    value: 'HTTNV',
    label: 'Hoàn thành tốt',
    short: 'HTTNV',
    icon: TrendingUp,
    cardClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-600',
    countClass: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  {
    value: 'HTNV',
    label: 'Hoàn thành NV',
    short: 'HTNV',
    icon: Minus,
    cardClass: 'border-slate-200 bg-slate-50',
    iconClass: 'text-slate-500',
    countClass: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
  },
  {
    value: 'KHNV',
    label: 'Không hoàn thành',
    short: 'KHNV',
    icon: XCircle,
    cardClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-500',
    countClass: 'text-red-700',
    badgeClass: 'bg-red-100 text-red-800 border border-red-300',
  },
];

// ─── Types ────────────────────────────────────────────
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Year options ─────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = ['', ...Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - i))];

// ─── Page ─────────────────────────────────────────────
export default function PartyReviewsPage() {
  const { data: session } = useSession();
  const scope = (session?.user as any)?.scope as string | undefined;
  // Derive user role from session scope for UI behavior
  const userRole: 'unit' | 'dept' | 'academy' =
    scope === 'UNIT' ? 'unit' :
    scope === 'DEPARTMENT' ? 'dept' :
    'academy';

  const [items, setItems]           = useState<ReviewRow[]>([]);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState('');
  const [yearFilter, setYearFilter] = useState('2025');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [byGrade, setByGrade]       = useState<Record<string, number>>({});

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReviewRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [submitTarget, setSubmitTarget] = useState<ReviewRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReviewRow | null>(null);
  const [rejectNote, setRejectNote]     = useState('');

  // ── fetch ──────────────────────────────────────────
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', page: String(page) });
      if (search)       params.set('search', search);
      if (yearFilter)   params.set('year', yearFilter);
      if (gradeFilter)  params.set('grade', gradeFilter);
      if (statusFilter) params.set('submissionStatus', statusFilter);

      const res = await fetch(`/api/party/evaluations?${params}`);
      if (!res.ok) throw new Error('Không thể tải danh sách đánh giá');
      const data = await res.json();

      const rows: ReviewRow[] = (data.evaluations || []).map((x: any) => ({
        ...x,
        partyMemberName: x.partyMember?.user?.name ?? '',
      }));

      setItems(rows);
      setPagination(data.pagination ?? { total: rows.length, page, limit: 20, totalPages: 1 });
      setByGrade(data.stats?.byGrade ?? {});
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, yearFilter, gradeFilter, statusFilter]);

  useEffect(() => { fetchData(1); }, [yearFilter, gradeFilter, statusFilter]);

  // ── create ─────────────────────────────────────────
  async function handleCreate(payload: ReviewFormPayload) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/party/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo đánh giá thất bại');
      toast({ title: 'Đã tạo', description: 'Bản đánh giá đảng viên đã được lưu.' });
      setCreateOpen(false);
      fetchData(1);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── edit ───────────────────────────────────────────
  async function handleEdit(payload: ReviewFormPayload) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/party/evaluations/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
      toast({ title: 'Đã cập nhật', description: 'Bản đánh giá đã được cập nhật.' });
      setEditTarget(null);
      fetchData(pagination.page);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── delete ─────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/party/evaluations/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      toast({ title: 'Đã xóa', description: 'Bản đánh giá đã được xóa.' });
      setDeleteTarget(null);
      fetchData(pagination.page);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  }

  // ── submit to political dept ────────────────────────
  async function handleSubmitToDept(item: ReviewRow) {
    try {
      const res = await fetch(`/api/party/evaluations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nộp thất bại');
      toast({ title: 'Đã nộp', description: `Đánh giá của ${item.partyMemberName || 'đảng viên'} đã được nộp lên ban chính trị.` });
      setSubmitTarget(null);
      fetchData(pagination.page);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  }

  // ── approve ────────────────────────────────────────
  async function handleApprove(item: ReviewRow) {
    try {
      const res = await fetch(`/api/party/evaluations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duyệt thất bại');
      toast({ title: 'Đã duyệt', description: `Đánh giá của ${item.partyMemberName || 'đảng viên'} đã được phê duyệt.` });
      fetchData(pagination.page);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  }

  // ── reject ─────────────────────────────────────────
  async function handleReject() {
    if (!rejectTarget) return;
    try {
      const res = await fetch(`/api/party/evaluations/${rejectTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reviewNote: rejectNote || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trả lại thất bại');
      toast({ title: 'Đã trả lại', description: `Đánh giá đã được trả về đơn vị để bổ sung.` });
      setRejectTarget(null);
      setRejectNote('');
      fetchData(pagination.page);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  }

  const totalReviewed = Object.values(byGrade).reduce((a, b) => a + b, 0);
  const byStatus = (items as any[]).reduce((acc: Record<string, number>, x: any) => {
    const s = x.submissionStatus ?? 'DRAFT';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đánh giá phân loại đảng viên</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hồ sơ đánh giá hàng năm — UC-68 &nbsp;·&nbsp; HTXSNV / HTTNV / HTNV / KHNV
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm đánh giá
        </Button>
      </div>

      {/* ── Submission banner (dept/academy) ────────── */}
      {userRole === 'dept' && (byStatus['SUBMITTED'] ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Có <strong>{byStatus['SUBMITTED']}</strong> bản đánh giá đang chờ phê duyệt từ các đơn vị
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Lọc "Đã nộp" để xem và xét duyệt</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
            onClick={() => setStatusFilter('SUBMITTED')}
          >
            Xem ngay
          </Button>
        </div>
      )}

      {/* ── KPI cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total */}
        <Card className="border-violet-200 bg-violet-50 lg:col-span-1">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Tổng đánh giá</p>
              <p className="text-3xl font-bold text-violet-700 mt-1">{totalReviewed}</p>
              {yearFilter && <p className="text-xs text-violet-500 mt-0.5">Năm {yearFilter}</p>}
            </div>
            <Users className="h-8 w-8 text-violet-400 mt-1" />
          </CardContent>
        </Card>

        {/* Grade cards */}
        {GRADE_KPI.map(({ value, label, short, icon: Icon, cardClass, iconClass, countClass }) => {
          const count = byGrade[value] ?? 0;
          const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
          return (
            <Card key={value} className={`${cardClass} cursor-pointer transition-shadow hover:shadow-md`}
              onClick={() => setGradeFilter(gradeFilter === value ? '' : value)}
              style={{ outline: gradeFilter === value ? '2px solid currentColor' : undefined }}
            >
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${iconClass}`}>{short}</p>
                  <p className={`text-3xl font-bold mt-1 ${countClass}`}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  {totalReviewed > 0 && <p className="text-xs font-medium mt-0.5">{pct}%</p>}
                </div>
                <Icon className={`h-8 w-8 mt-1 opacity-60 ${iconClass}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Year */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Năm:</span>
              <select
                title="Lọc theo năm"
                aria-label="Lọc theo năm"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y || 'Tất cả năm'}</option>
                ))}
              </select>
            </div>

            {/* Grade filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Xếp loại:</span>
              <button
                type="button"
                onClick={() => setGradeFilter('')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  !gradeFilter
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                Tất cả
              </button>
              {REVIEW_GRADES.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => setGradeFilter(gradeFilter === g.value ? '' : g.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    gradeFilter === g.value ? g.badgeClass : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {g.short}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2 ml-auto w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}
                  placeholder="Tên, mã quân nhân..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchData(1)} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Submission status filter — shown for dept/academy */}
          {userRole !== 'unit' && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t">
              <span className="text-sm font-medium text-muted-foreground shrink-0">Trạng thái:</span>
              {[
                { value: '', label: 'Tất cả', cls: '' },
                { value: 'DRAFT', label: 'Nháp', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
                { value: 'SUBMITTED', label: 'Đã nộp', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
                { value: 'APPROVED', label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                { value: 'REJECTED', label: 'Trả lại', cls: 'bg-red-100 text-red-700 border-red-300' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s.value
                      ? (s.cls || 'bg-foreground text-background border-foreground')
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Active filters summary */}
          {(gradeFilter || yearFilter || statusFilter) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">Đang lọc:</span>
              {yearFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Năm {yearFilter}
                  <button type="button" onClick={() => setYearFilter('')} className="ml-0.5 hover:text-foreground">×</button>
                </Badge>
              )}
              {gradeFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {REVIEW_GRADES.find(g => g.value === gradeFilter)?.short || gradeFilter}
                  <button type="button" onClick={() => setGradeFilter('')} className="ml-0.5 hover:text-foreground">×</button>
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {statusFilter}
                  <button type="button" onClick={() => setStatusFilter('')} className="ml-0.5 hover:text-foreground">×</button>
                </Badge>
              )}
              <button
                type="button"
                onClick={() => { setYearFilter(''); setGradeFilter(''); setSearch(''); setStatusFilter(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Table card ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Danh sách đánh giá
            {pagination.total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({pagination.total} bản ghi)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ReviewTable
            items={items}
            loading={loading}
            userRole={userRole}
            onEdit={(item) => setEditTarget(item)}
            onDelete={(item) => setDeleteTarget(item)}
            onSubmit={(item) => setSubmitTarget(item)}
            onApprove={handleApprove}
            onReject={(item) => { setRejectTarget(item); setRejectNote(''); }}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Trang {pagination.page} / {pagination.totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchData(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchData(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create dialog ───────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo đánh giá phân loại mới</DialogTitle>
          </DialogHeader>
          <ReviewForm
            onSubmit={handleCreate}
            submitting={submitting}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ─────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa đánh giá
              {editTarget?.partyMemberName && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  — {editTarget.partyMemberName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ReviewForm
              onSubmit={handleEdit}
              submitting={submitting}
              mode="edit"
              initialValues={{
                partyMemberId: editTarget.partyMember ? '' : '',
                reviewYear: editTarget.reviewYear,
                grade: editTarget.grade,
                comments: editTarget.comments ?? '',
                evidenceUrl: editTarget.evidenceUrl ?? '',
                partyMemberName: editTarget.partyMemberName,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ──────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang xóa đánh giá năm <strong>{deleteTarget?.reviewYear}</strong> của{' '}
              <strong>{deleteTarget?.partyMemberName || 'đảng viên này'}</strong>.
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Submit to political dept confirm ─────────── */}
      <AlertDialog open={!!submitTarget} onOpenChange={(open) => !open && setSubmitTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-600" />
              Nộp báo cáo lên Ban chính trị
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang nộp đánh giá năm <strong>{submitTarget?.reviewYear}</strong> của{' '}
              <strong>{submitTarget?.partyMemberName || 'đảng viên'}</strong>{' '}
              lên Ban chính trị để xét duyệt. Sau khi nộp, bản đánh giá không thể chỉnh sửa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitTarget && handleSubmitToDept(submitTarget)}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Xác nhận nộp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject (return for revision) dialog ─────── */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Trả lại để bổ sung
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Trả lại đánh giá của{' '}
              <strong>{rejectTarget?.partyMemberName || 'đảng viên'}</strong>{' '}
              về đơn vị để bổ sung, chỉnh sửa.
            </p>
            <div className="space-y-1.5">
              <Label>Lý do / yêu cầu bổ sung</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Ghi rõ lý do trả lại hoặc nội dung cần bổ sung..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
            >
              Trả lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
