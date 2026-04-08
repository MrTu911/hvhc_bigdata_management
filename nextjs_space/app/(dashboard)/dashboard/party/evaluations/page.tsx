'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import {
  Plus, Search, Star, Users, ChevronLeft, ChevronRight,
  X, TrendingUp, RefreshCw, Pencil, Trash2, Loader2, User,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { REVIEW_GRADES, REVIEW_GRADE_MAP } from '@/lib/constants/party.labels';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRADES = REVIEW_GRADES;
const GRADE_MAP = REVIEW_GRADE_MAP;
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
const LIMIT = 15;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Evaluation {
  id: string;
  partyMemberId: string;
  reviewYear: number;
  grade: string;
  comments?: string | null;
  approvedBy?: string | null;
  evidenceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  partyMember: {
    id: string;
    user: {
      id: string;
      name: string;
      militaryId?: string;
      rank?: string;
      position?: string;
      unitRelation?: { id: string; name: string; code: string };
    };
  };
}

interface MemberSuggestion {
  id: string;
  user: { id: string; name: string; militaryId?: string | null; rank?: string | null };
}

// ─── MemberSearch component ───────────────────────────────────────────────────
function MemberSearch({
  value, displayName, onSelect, disabled,
}: {
  value: string; displayName: string;
  onSelect: (id: string, name: string) => void; disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/party-members?search=${encodeURIComponent(query)}&limit=8&status=CHINH_THUC`);
        const json = await res.json();
        setResults(json?.members ?? []);
        setOpen(true);
      } finally { setFetching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  if (value && displayName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-3 py-2">
        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
        </div>
        {!disabled && (
          <button type="button" onClick={() => onSelect('', '')} title="Xóa chọn" aria-label="Xóa chọn đảng viên" className="text-gray-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {fetching
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
        <Input
          placeholder="Tìm tên, mã quân nhân đảng viên..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-52 overflow-y-auto">
          {results.map(m => (
            <button key={m.id} type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              onClick={() => { onSelect(m.id, m.user.name); setQuery(''); setOpen(false); }}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(m.user.name ?? '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.user.name}</p>
                <p className="text-xs text-gray-400 truncate">{m.user.militaryId ?? ''}{m.user.rank ? ` · ${m.user.rank}` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !fetching && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-3 text-sm text-gray-400">
          Không tìm thấy đảng viên
        </div>
      )}
    </div>
  );
}

// ─── EvaluationForm ──────────────────────────────────────────────────────────
interface FormState {
  partyMemberId: string;
  partyMemberName: string;
  reviewYear: string;
  grade: string;
  comments: string;
}

function EvaluationForm({
  initial, editMode, submitting, onSubmit, onCancel,
}: {
  initial?: Partial<FormState>;
  editMode?: boolean;
  submitting?: boolean;
  onSubmit: (form: Omit<FormState, 'partyMemberName'>) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    partyMemberId: initial?.partyMemberId ?? '',
    partyMemberName: initial?.partyMemberName ?? '',
    reviewYear: initial?.reviewYear ?? String(currentYear),
    grade: initial?.grade ?? 'HTTNV',
    comments: initial?.comments ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const set = (key: keyof FormState, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.partyMemberId) errs.partyMemberId = 'Vui lòng chọn đảng viên';
    if (!form.reviewYear) errs.reviewYear = 'Năm đánh giá là bắt buộc';
    if (!form.grade) errs.grade = 'Phân loại là bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const { partyMemberName: _, ...payload } = form;
    await onSubmit(payload);
  };

  return (
    <div className="space-y-5">
      {/* Member */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Đảng viên {!editMode && <span className="text-red-500">*</span>}
        </Label>
        {editMode ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{form.partyMemberName || '—'}</span>
          </div>
        ) : (
          <MemberSearch
            value={form.partyMemberId}
            displayName={form.partyMemberName}
            onSelect={(id, name) => { set('partyMemberId', id); set('partyMemberName', name); }}
          />
        )}
        {errors.partyMemberId && <p className="text-xs text-red-500 mt-1">{errors.partyMemberId}</p>}
      </div>

      {/* Year */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Năm đánh giá <span className="text-red-500">*</span>
        </Label>
        <Select value={form.reviewYear} onValueChange={v => set('reviewYear', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.reviewYear && <p className="text-xs text-red-500 mt-1">{errors.reviewYear}</p>}
      </div>

      {/* Grade */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Phân loại <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          {GRADES.map(g => (
            <button key={g.key} type="button"
              onClick={() => set('grade', g.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                form.grade === g.key
                  ? `${g.bg} ${g.border} ${g.text}`
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
              <span className="flex-1 truncate">{g.label}</span>
              {form.grade === g.key && (
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{g.short}</span>
              )}
            </button>
          ))}
        </div>
        {errors.grade && <p className="text-xs text-red-500 mt-1">{errors.grade}</p>}
      </div>

      {/* Comments */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Nhận xét của chi bộ</Label>
        <Textarea
          rows={3} placeholder="Nhập nhận xét, đánh giá của chi bộ về đảng viên..."
          value={form.comments}
          onChange={e => set('comments', e.target.value)}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Hủy</Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          {editMode ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}
        </Button>
      </div>
    </div>
  );
}

// ─── Table row skeleton ───────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <tr>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-4 text-center"><Skeleton className="h-7 w-12 mx-auto rounded-lg" /></td>
      <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
      <td className="px-4 py-4"><Skeleton className="h-7 w-16" /></td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PartyEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [year, setYear] = useState(String(currentYear - 1));
  const [grade, setGrade] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Sheet / form
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Evaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(draftSearch); setPage(1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [draftSearch]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (pg: number, yr: string, gr: string, sq: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) });
      if (yr) params.set('year', yr);
      if (gr) params.set('grade', gr);
      if (sq) params.set('search', sq);
      const res = await fetch(`/api/party/evaluations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu');
      setEvaluations(data.evaluations ?? []);
      setStats(data.stats?.byGrade ?? {});
      setTotal(data.stats?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page, year, grade, search); }, [fetchData, page, year, grade, search]);

  const refresh = () => fetchData(page, year, grade, search);

  // ─── Grade filter toggle ─────────────────────────────────────────────────────
  const toggleGrade = (key: string) => {
    setGrade(g => g === key ? '' : key);
    setPage(1);
  };

  // ─── Stats derived ───────────────────────────────────────────────────────────
  const totalMembers = Object.values(stats).reduce((a, b) => a + b, 0);
  const barData = GRADES.map(g => ({
    name: g.short,
    label: g.label,
    value: stats[g.key] || 0,
    color: g.color,
    pct: totalMembers > 0 ? Math.round(((stats[g.key] || 0) / totalMembers) * 100) : 0,
  }));

  // ─── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (form: Omit<FormState, 'partyMemberName'>) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/party/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reviewYear: parseInt(form.reviewYear) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ghi nhận đánh giá thất bại');
      toast({ title: 'Thành công', description: 'Đã ghi nhận đánh giá phân loại' });
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
  const handleEdit = async (form: Omit<FormState, 'partyMemberName'>) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/party/evaluations/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reviewYear: parseInt(form.reviewYear) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cập nhật thất bại');
      toast({ title: 'Thành công', description: 'Đã cập nhật đánh giá' });
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
      const res = await fetch(`/api/party/evaluations/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Xóa thất bại');
      toast({ title: 'Đã xóa', description: 'Đã xóa bản ghi đánh giá' });
      setDeleteTarget(null);
      if (evaluations.length === 1 && page > 1) setPage(p => p - 1);
      else refresh();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setSheetOpen(true); };
  const openEdit = (ev: Evaluation) => { setEditTarget(ev); setSheetOpen(true); };
  const hasFilter = !!(search || grade);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-24 top-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-0 bottom-0 opacity-[0.05]">
          <Star className="h-52 w-52" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Star className="h-4 w-4" />
              </div>
              <span className="text-red-200 text-sm font-medium">Đánh giá Đảng viên · M03</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Đánh giá Phân loại Đảng viên</h1>
            <p className="text-red-100 text-sm mt-1">
              Kết quả phân loại chất lượng đảng viên hàng năm theo Điều lệ Đảng
            </p>
            {totalMembers > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  {totalMembers} đảng viên · Năm {year}
                </span>
                {stats['HTXSNV'] > 0 && (
                  <span className="bg-emerald-500/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-emerald-100">
                    {stats['HTXSNV']} Xuất sắc
                  </span>
                )}
                {stats['KHNV'] > 0 && (
                  <span className="bg-red-900/40 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-red-200">
                    {stats['KHNV']} Không HT
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Year tabs */}
            <div className="flex gap-1 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 p-1">
              {yearOptions.slice(0, 5).map(y => (
                <button key={y} type="button"
                  onClick={() => { setYear(String(y)); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    year === String(y)
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-red-100 hover:bg-white/20'
                  }`}>
                  {y}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={refresh}
              className="bg-white/15 border-white/25 text-white hover:bg-white/25 gap-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-white text-red-700 hover:bg-red-50 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Thêm đánh giá
            </Button>
          </div>
        </div>
      </div>

      {/* ── Grade Cards + Bar Chart ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Grade filter cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {GRADES.map(g => {
              const count = stats[g.key] || 0;
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              const active = grade === g.key;
              return (
                <button key={g.key} type="button"
                  onClick={() => toggleGrade(g.key)}
                  className={`group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                    active
                      ? `${g.bg} ${g.border} shadow-md scale-[1.02]`
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'
                  }`}>
                  {active && (
                    <span className="absolute top-2 right-2">
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  )}
                  {loading ? (
                    <>
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-3 w-8 mt-1" />
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{count}</span>
                      <span className={`text-xs font-bold mt-0.5 ${active ? g.text : 'text-gray-400'}`}>
                        {pct}%
                      </span>
                    </>
                  )}
                  <div className="w-full h-1 rounded-full mt-2 bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                  </div>
                  <span className={`text-[11px] font-semibold mt-2 leading-tight ${active ? g.text : 'text-gray-500 dark:text-gray-400'}`}>
                    {g.short}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>
                Tổng <strong className="text-gray-700 dark:text-gray-300">{totalMembers}</strong> đảng viên
                {' · '}Năm <strong className="text-gray-700 dark:text-gray-300">{year}</strong>
              </span>
            </div>
            {grade && GRADE_MAP[grade as keyof typeof GRADE_MAP] && (
              <Badge className={`text-xs border ${GRADE_MAP[grade as keyof typeof GRADE_MAP].badge}`}>
                Lọc: {GRADE_MAP[grade as keyof typeof GRADE_MAP].label}
              </Badge>
            )}
          </div>
        </div>

        {/* Bar chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              Phân bổ theo phân loại
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {totalMembers > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={barData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: any, _: any, p: any) => [`${v} người (${p.payload.pct}%)`, p.payload.label]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.color} fillOpacity={grade && grade !== GRADES[i]?.key ? 0.25 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[170px] flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-2">
                <TrendingUp className="h-10 w-10" />
                <span className="text-sm">Chưa có dữ liệu</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 h-9 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                placeholder="Tìm theo tên đảng viên, mã quân nhân..."
                value={draftSearch}
                onChange={e => setDraftSearch(e.target.value)}
              />
            </div>
            {hasFilter && (
              <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-400 hover:text-gray-600"
                onClick={() => { setDraftSearch(''); setSearch(''); setGrade(''); setPage(1); }}>
                <X className="h-3.5 w-3.5 mr-1" /> Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Evaluation Table ─────────────────────────────────── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading ? 'Đang tải...' : `${total.toLocaleString()} bản ghi đánh giá · Năm ${year}`}
            {hasFilter && !loading && <span className="ml-2 text-xs text-gray-400">· đang lọc</span>}
          </span>
          {search && (
            <span className="text-xs text-gray-400">
              &ldquo;<span className="text-gray-600 dark:text-gray-300 font-medium">{search}</span>&rdquo;
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Đảng viên</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Đơn vị</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">Năm</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Phân loại</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Nhận xét chi bộ</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Star className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 font-medium">Không có kết quả</p>
                    <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
                      Thử thay đổi bộ lọc hoặc chọn năm khác
                    </p>
                  </td>
                </tr>
              ) : (
                evaluations.map(ev => {
                  const g = GRADE_MAP[ev.grade as keyof typeof GRADE_MAP];
                  const initials = (ev.partyMember?.user?.name ?? '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
                  return (
                    <tr key={ev.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors group">
                      {/* Member */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                              {ev.partyMember?.user?.name ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {ev.partyMember?.user?.rank && <span>{ev.partyMember.user.rank}</span>}
                              {ev.partyMember?.user?.militaryId && (
                                <span className="font-mono ml-1">· {ev.partyMember.user.militaryId}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Unit */}
                      <td className="px-4 py-3.5">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {ev.partyMember?.user?.unitRelation?.name ?? '—'}
                        </span>
                      </td>
                      {/* Year */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-13 h-7 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold font-mono">
                          {ev.reviewYear ?? '—'}
                        </span>
                      </td>
                      {/* Grade */}
                      <td className="px-4 py-3.5">
                        {g ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${g.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                            {g.short}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">{ev.grade ?? '—'}</span>
                        )}
                      </td>
                      {/* Notes */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                          {ev.comments || <span className="text-gray-300 dark:text-gray-600 italic">Không có nhận xét</span>}
                        </p>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => openEdit(ev)} title="Chỉnh sửa">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => setDeleteTarget(ev)} title="Xóa">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Trang <strong className="text-gray-600 dark:text-gray-300">{page}</strong> / {totalPages}
              &nbsp;·&nbsp;{total.toLocaleString()} kết quả
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1
                  : page <= 4 ? i + 1
                  : page >= totalPages - 3 ? totalPages - 6 + i
                  : page - 3 + i;
                return (
                  <Button key={pg} variant={page === pg ? 'default' : 'outline'} size="sm"
                    className={`h-7 w-7 p-0 text-xs ${page === pg ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                    onClick={() => setPage(pg)}>
                    {pg}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Create / Edit Sheet ──────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={open => { setSheetOpen(open); if (!open) setEditTarget(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[500px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle>
                  {editTarget ? 'Chỉnh sửa đánh giá' : 'Ghi nhận đánh giá mới'}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Phân loại chất lượng đảng viên hàng năm
                </p>
              </div>
            </div>
          </SheetHeader>

          {editTarget && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-4 py-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide mb-1">Đang chỉnh sửa</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {editTarget.partyMember?.user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Năm {editTarget.reviewYear}
                {editTarget.grade && GRADE_MAP[editTarget.grade as keyof typeof GRADE_MAP] && (
                  <span className="ml-2">· {GRADE_MAP[editTarget.grade as keyof typeof GRADE_MAP].short}</span>
                )}
              </p>
            </div>
          )}

          <EvaluationForm
            editMode={!!editTarget}
            initial={editTarget ? {
              partyMemberId: editTarget.partyMemberId,
              partyMemberName: editTarget.partyMember?.user?.name ?? '',
              reviewYear: String(editTarget.reviewYear ?? currentYear),
              grade: editTarget.grade ?? 'HTTNV',
              comments: editTarget.comments ?? '',
            } : undefined}
            submitting={submitting}
            onSubmit={editTarget ? handleEdit : handleCreate}
            onCancel={() => { setSheetOpen(false); setEditTarget(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ───────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa bản ghi đánh giá năm{' '}
              <strong>{deleteTarget?.reviewYear}</strong> của{' '}
              <strong>{deleteTarget?.partyMember?.user?.name}</strong>?
              {' '}Hành động này không thể hoàn tác.
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
