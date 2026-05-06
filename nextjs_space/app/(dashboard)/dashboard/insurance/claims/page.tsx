'use client';

/**
 * /dashboard/insurance/claims
 * Quản lý Yêu cầu Chế độ BHXH — dành cho quản lý CSDL BHXH.
 *
 * Workflow: DRAFT → PENDING → UNDER_REVIEW → APPROVED → PAID
 *                                          ↘ REJECTED
 *
 * Chức năng:
 *  - Danh sách yêu cầu với filter, search, phân trang
 *  - Badge ưu tiên yêu cầu tự gửi từ cán bộ (submittedAt ≠ null)
 *  - Xét duyệt workflow: tiếp nhận → duyệt/từ chối → chi trả
 *  - Tạo yêu cầu mới thay mặt cán bộ
 *  - Xem chi tiết + lịch sử timeline
 *  - Xóa mềm yêu cầu DRAFT/PENDING
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield, FileCheck, Plus, RefreshCw, Search, Eye, Trash2,
  CheckCircle2, XCircle, DollarSign, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, CheckCheck, X, Send, Filter,
  Calendar, Building2, User, FileText, Loader2, Info,
  SlidersHorizontal, ArrowUpRight, MoreHorizontal, Ban,
  ClipboardCheck, Hourglass, BadgeCheck, Banknote, Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────

type ClaimStatus = 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
type ClaimType =
  | 'SICK_LEAVE' | 'MATERNITY' | 'OCCUPATIONAL_DISEASE' | 'WORK_ACCIDENT'
  | 'RETIREMENT' | 'SURVIVORSHIP' | 'UNEMPLOYMENT' | 'MEDICAL_EXPENSE' | 'OTHER';

interface ClaimRecord {
  id: string;
  claimType: ClaimType; claimTypeLabel: string;
  status: ClaimStatus; statusLabel: string;
  amount: number | null; calculatedAmount: number | null;
  benefitDays: number | null;
  startDate: string | null; endDate: string | null;
  reason: string | null; description: string | null;
  hospitalName: string | null; diagnosisCode: string | null; diagnosis: string | null;
  rejectReason: string | null;
  documentNumber: string | null; documentDate: string | null;
  paymentReference: string | null;
  submittedAt: string | null; submittedBy: string | null;
  reviewedAt: string | null; reviewedBy: string | null;
  approvedAt: string | null; approvedBy: string | null;
  rejectedAt: string | null; rejectedBy: string | null;
  paidAt: string | null; paidBy: string | null;
  createdAt: string; updatedAt: string;
  insuranceInfo: {
    id: string;
    user: {
      id: string; name: string;
      militaryId: string | null; rank: string | null; position: string | null;
      unitRelation: { id: string; name: string } | null;
    };
  };
}

interface StatsItem { status: ClaimStatus; label: string; count: number; amount: number }
interface InsuranceUser { id: string; user: { name: string; militaryId: string | null; rank: string | null } }

// ─── Constants ─────────────────────────────────────────────────────────────

const CLAIM_TYPES: { value: ClaimType; label: string; icon: string }[] = [
  { value: 'SICK_LEAVE',            label: 'Ốm đau',                 icon: '🤒' },
  { value: 'MATERNITY',             label: 'Thai sản',               icon: '🤱' },
  { value: 'OCCUPATIONAL_DISEASE',  label: 'Bệnh nghề nghiệp',       icon: '🏭' },
  { value: 'WORK_ACCIDENT',         label: 'Tai nạn lao động',       icon: '⚠️' },
  { value: 'RETIREMENT',            label: 'Hưu trí',                icon: '🏠' },
  { value: 'SURVIVORSHIP',          label: 'Tử tuất',                icon: '📋' },
  { value: 'UNEMPLOYMENT',          label: 'Thất nghiệp',            icon: '📉' },
  { value: 'MEDICAL_EXPENSE',       label: 'Chi phí KCB',            icon: '🏥' },
  { value: 'OTHER',                 label: 'Khác',                   icon: '📄' },
];

const STATUS_CFG: Record<ClaimStatus, {
  label: string; short: string;
  bg: string; text: string; border: string;
  dot: string; icon: React.ElementType;
}> = {
  DRAFT:        { label: 'Nháp',              short: 'Nháp',    bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-200', dot: 'bg-slate-400',   icon: FileText },
  PENDING:      { label: 'Chờ tiếp nhận',     short: 'Đã gửi',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-500',    icon: Inbox },
  UNDER_REVIEW: { label: 'Đang xét duyệt',    short: 'Đang xét',bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-500',   icon: Hourglass },
  APPROVED:     { label: 'Đã phê duyệt',      short: 'Duyệt',   bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500', icon: BadgeCheck },
  REJECTED:     { label: 'Từ chối',           short: 'Từ chối', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',   dot: 'bg-red-500',     icon: XCircle },
  PAID:         { label: 'Đã chi trả',        short: 'Chi trả', bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200',dot: 'bg-purple-500',  icon: Banknote },
  CANCELLED:    { label: 'Đã hủy',            short: 'Hủy',     bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200',  dot: 'bg-gray-400',    icon: Ban },
};

const WORKFLOW_STEPS: ClaimStatus[] = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID'];

const fmtMoney = (v: number | null | undefined) =>
  v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v) : '—';
const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('vi-VN') : '—';
const fmtDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }: { status: ClaimStatus; size?: 'sm' | 'md' }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium border',
      cfg.bg, cfg.text, cfg.border,
      size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
    )}>
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {size === 'md' ? cfg.label : cfg.short}
    </span>
  );
}

// ─── Self-submitted indicator ───────────────────────────────────────────────

function SelfBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
      <Send className="h-2.5 w-2.5" /> Tự gửi
    </span>
  );
}

// ─── Workflow Timeline ──────────────────────────────────────────────────────

function WorkflowTimeline({ record }: { record: ClaimRecord }) {
  const stepDates: Record<string, string | null> = {
    PENDING:      record.submittedAt,
    UNDER_REVIEW: record.reviewedAt,
    APPROVED:     record.status === 'REJECTED' ? record.rejectedAt : record.approvedAt,
    PAID:         record.paidAt,
  };
  const stepLabels: Record<string, string> = {
    PENDING:      'Đã gửi — Chờ tiếp nhận',
    UNDER_REVIEW: 'Tiếp nhận — Đang xét duyệt',
    APPROVED:     record.status === 'REJECTED' ? 'Từ chối' : 'Phê duyệt',
    PAID:         'Chi trả',
  };

  const currentIdx = WORKFLOW_STEPS.indexOf(
    record.status === 'REJECTED' ? 'APPROVED' : record.status,
  );

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-100" />
      <div className="space-y-4">
        {/* Created */}
        <div className="flex items-start gap-3 relative">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center z-10 flex-shrink-0">
            <CheckCheck className="h-4 w-4 text-white" />
          </div>
          <div className="pt-0.5">
            <p className="text-sm font-medium">Tạo yêu cầu</p>
            <p className="text-xs text-muted-foreground">{fmtDateTime(record.createdAt)}</p>
          </div>
        </div>

        {WORKFLOW_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx && record.status !== 'REJECTED';
          const rejected = record.status === 'REJECTED' && step === 'APPROVED';
          const future = i > currentIdx && !rejected;

          return (
            <div key={step} className="flex items-start gap-3 relative">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 transition-all',
                done        ? 'bg-emerald-500' :
                rejected    ? 'bg-red-400' :
                active      ? 'bg-blue-500 ring-4 ring-blue-100' :
                              'bg-slate-200',
              )}>
                {done     ? <CheckCheck className="h-4 w-4 text-white" /> :
                 rejected ? <X className="h-4 w-4 text-white" /> :
                 active   ? <Clock className="h-4 w-4 text-white" /> :
                            <div className="h-2 w-2 rounded-full bg-slate-400" />}
              </div>
              <div className="pt-0.5 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  future ? 'text-muted-foreground' : 'text-foreground',
                )}>
                  {stepLabels[step]}
                </p>
                {stepDates[step] && (
                  <p className="text-xs text-muted-foreground">{fmtDateTime(stepDates[step])}</p>
                )}
                {step === 'APPROVED' && record.status === 'REJECTED' && record.rejectReason && (
                  <div className="mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">
                    <p className="text-xs text-red-600">{record.rejectReason}</p>
                  </div>
                )}
                {step === 'PAID' && record.paymentReference && (
                  <p className="text-xs text-muted-foreground mt-0.5">CT: {record.paymentReference}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Pill ───────────────────────────────────────────────────────────────

function StatusPill({
  status, count, active, onClick,
}: { status: ClaimStatus; count: number; active: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[status];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
        active
          ? cn(cfg.bg, cfg.text, cfg.border, 'shadow-sm ring-1', cfg.border)
          : 'bg-white text-muted-foreground border-slate-200 hover:bg-slate-50',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', active ? cfg.dot : 'bg-slate-300')} />
      {cfg.short}
      <span className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
        active ? cn(cfg.text, 'bg-white/70') : 'bg-slate-100 text-slate-500',
      )}>
        {count}
      </span>
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InsuranceClaimsPage() {
  const searchParams = useSearchParams();

  const [records, setRecords] = useState<ClaimRecord[]>([]);
  const [statsArr, setStatsArr] = useState<StatsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterType, setFilterType]     = useState('');
  const [year, setYear]                 = useState(new Date().getFullYear().toString());
  const [page, setPage]                 = useState(1);
  const [showFilters, setShowFilters]   = useState(false);

  // Dialogs
  const [detailRecord, setDetailRecord]     = useState<ClaimRecord | null>(null);
  const [actionTarget, setActionTarget]     = useState<{ action: string; record: ClaimRecord } | null>(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  // Insurance users for create dropdown
  const [insuranceUsers, setInsuranceUsers] = useState<InsuranceUser[]>([]);

  // Create form
  const [createForm, setCreateForm] = useState({
    insuranceInfoId: '',
    claimType: '' as ClaimType | '',
    amount: '', benefitDays: '',
    startDate: '', endDate: '',
    reason: '', description: '',
    hospitalName: '', diagnosis: '',
  });

  // Action form
  const [actionForm, setActionForm] = useState({
    calculatedAmount: '', documentNumber: '', documentDate: '',
    rejectReason: '', paymentReference: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', year });
      if (search)       params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType)   params.set('claimType', filterType);

      const res = await fetch(`/api/insurance/claims?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data.records || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalCount(data.pagination?.total ?? 0);
      setStatsArr(data.stats?.byStatus || []);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/insurance?limit=500')
      .then((r) => r.json())
      .then((d) => setInsuranceUsers(d.records || []));
  }, []);

  // ── Workflow action ───────────────────────────────────────────────────────

  async function handleWorkflowAction(action: string, record: ClaimRecord) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, action, ...actionForm }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Thao tác thất bại'); return; }
      const labelMap: Record<string, string> = {
        review:  'Đã tiếp nhận yêu cầu',
        approve: 'Đã phê duyệt',
        reject:  'Đã từ chối',
        pay:     'Đã xác nhận chi trả',
        cancel:  'Đã hủy yêu cầu',
      };
      toast.success(labelMap[action] ?? 'Cập nhật thành công');
      setActionTarget(null);
      setActionForm({ calculatedAmount: '', documentNumber: '', documentDate: '', rejectReason: '', paymentReference: '' });
      fetchData();
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Quick action (review) without dialog ─────────────────────────────────

  async function quickAction(action: string, record: ClaimRecord) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, action }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Thao tác thất bại'); return; }
      toast.success('Đã tiếp nhận — chuyển sang Đang xét duyệt');
      fetchData();
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('Xóa yêu cầu này? Hành động không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/insurance/claims?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Đã xóa yêu cầu'); fetchData(); }
      else toast.error('Không thể xóa');
    } catch { toast.error('Lỗi kết nối server'); }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!createForm.insuranceInfoId || !createForm.claimType) {
      toast.error('Vui lòng chọn cán bộ và loại chế độ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, submitNow: true }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Tạo thất bại'); return; }
      toast.success('Đã tạo và gửi yêu cầu');
      setShowCreate(false);
      setCreateForm({ insuranceInfoId: '', claimType: '', amount: '', benefitDays: '', startDate: '', endDate: '', reason: '', description: '', hospitalName: '', diagnosis: '' });
      fetchData();
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const pendingCount     = statsArr.find((s) => s.status === 'PENDING')?.count ?? 0;
  const underReviewCount = statsArr.find((s) => s.status === 'UNDER_REVIEW')?.count ?? 0;
  const approvedCount    = statsArr.find((s) => s.status === 'APPROVED')?.count ?? 0;
  const paidCount        = statsArr.find((s) => s.status === 'PAID')?.count ?? 0;
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <FileCheck className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Quản lý Yêu cầu Chế độ BHXH</h1>
              <p className="text-sm text-muted-foreground">Tiếp nhận · Xét duyệt · Chi trả — theo dõi toàn bộ quy trình</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo yêu cầu mới
            </Button>
          </div>
        </div>

        {/* ── Urgent banner: yêu cầu cán bộ tự gửi chờ tiếp nhận ────────── */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-5 py-3.5 shadow-md shadow-blue-200">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                {pendingCount} yêu cầu đang chờ tiếp nhận
              </p>
              <p className="text-blue-100 text-xs mt-0.5">Bao gồm yêu cầu cán bộ tự gửi qua hệ thống</p>
            </div>
            <Button
              size="sm" variant="secondary"
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-white/30 gap-1.5"
              onClick={() => { setFilterStatus('PENDING'); setPage(1); }}
            >
              Xem ngay <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* ── KPI summary row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Chờ tiếp nhận', value: pendingCount,     icon: Inbox,         gradient: 'from-blue-500 to-blue-600',    shadow: 'shadow-blue-200' },
            { label: 'Đang xét duyệt',value: underReviewCount, icon: Hourglass,     gradient: 'from-amber-400 to-amber-500',  shadow: 'shadow-amber-200' },
            { label: 'Đã phê duyệt',  value: approvedCount,    icon: BadgeCheck,    gradient: 'from-emerald-500 to-emerald-600',shadow:'shadow-emerald-200'},
            { label: 'Đã chi trả',    value: paidCount,        icon: Banknote,      gradient: 'from-purple-500 to-purple-600',shadow: 'shadow-purple-200' },
          ].map(({ label, value, icon: Icon, gradient, shadow }) => (
            <Card key={label} className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-4">
                  <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0', gradient, shadow)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Status pills row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground mr-1">Lọc:</span>
              <button
                onClick={() => { setFilterStatus(''); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                  filterStatus === ''
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-muted-foreground border-slate-200 hover:bg-slate-50',
                )}
              >
                Tất cả <span className="ml-1 font-bold">{totalCount}</span>
              </button>
              {statsArr.map((s) => (
                <StatusPill
                  key={s.status}
                  status={s.status}
                  count={s.count}
                  active={filterStatus === s.status}
                  onClick={() => { setFilterStatus(filterStatus === s.status ? '' : s.status); setPage(1); }}
                />
              ))}
            </div>

            {/* Search + advanced filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, mã quân nhân…"
                  className="pl-9 h-8 text-sm"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={filterType || '__ALL__'} onValueChange={(v) => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Loại chế độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Tất cả loại</SelectItem>
                  {CLAIM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={y}>Năm {y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Records list ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải dữ liệu…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileCheck className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-medium text-muted-foreground">Không có yêu cầu nào</p>
            <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc tạo yêu cầu mới</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const selfSubmitted = !!r.submittedBy && r.status !== 'DRAFT';
              const urgentPending = r.status === 'PENDING';

              return (
                <Card
                  key={r.id}
                  className={cn(
                    'border shadow-sm hover:shadow-md transition-all duration-200',
                    urgentPending && 'border-blue-200 bg-blue-50/30',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">

                      {/* Left: status indicator */}
                      <div className={cn(
                        'mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        STATUS_CFG[r.status].bg,
                      )}>
                        {(() => { const Icon = STATUS_CFG[r.status].icon; return <Icon className={cn('h-5 w-5', STATUS_CFG[r.status].text)} />; })()}
                      </div>

                      {/* Center: main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {CLAIM_TYPES.find(c => c.value === r.claimType)?.icon}{' '}
                            {r.claimTypeLabel}
                          </span>
                          <StatusBadge status={r.status} />
                          {selfSubmitted && <SelfBadge />}
                        </div>

                        {/* Person info */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-foreground">{r.insuranceInfo.user.name}</span>
                          </span>
                          {r.insuranceInfo.user.militaryId && (
                            <span className="text-xs text-muted-foreground">{r.insuranceInfo.user.militaryId}</span>
                          )}
                          {r.insuranceInfo.user.rank && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.insuranceInfo.user.rank}
                            </span>
                          )}
                          {r.insuranceInfo.user.unitRelation && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {r.insuranceInfo.user.unitRelation.name}
                            </span>
                          )}
                        </div>

                        {/* Details row */}
                        <div className="flex gap-4 mt-1.5 flex-wrap">
                          {r.startDate && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {fmtDate(r.startDate)}
                              {r.endDate && ` — ${fmtDate(r.endDate)}`}
                            </span>
                          )}
                          {r.hospitalName && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {r.hospitalName}
                            </span>
                          )}
                          {r.reason && (
                            <span className="text-xs text-muted-foreground truncate max-w-xs">{r.reason}</span>
                          )}
                        </div>

                        {/* Amount + reject reason */}
                        {(r.calculatedAmount || r.amount) && (
                          <p className="mt-1.5 text-sm font-semibold text-emerald-700">
                            {fmtMoney(r.calculatedAmount ?? r.amount)}
                          </p>
                        )}
                        {r.status === 'REJECTED' && r.rejectReason && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                            <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {r.rejectReason}
                          </div>
                        )}

                        {/* Submit time */}
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          {r.submittedAt ? `Gửi lúc ${fmtDateTime(r.submittedAt)}` : `Tạo ${fmtDate(r.createdAt)}`}
                        </p>
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setDetailRecord(r)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Chi tiết
                        </Button>

                        {/* Workflow action buttons */}
                        {r.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
                            disabled={submitting}
                            onClick={() => quickAction('review', r)}
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> Tiếp nhận
                          </Button>
                        )}
                        {r.status === 'UNDER_REVIEW' && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                              onClick={() => setActionTarget({ action: 'approve', record: r })}
                            >
                              <BadgeCheck className="h-3.5 w-3.5" /> Phê duyệt
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setActionTarget({ action: 'reject', record: r })}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Từ chối
                            </Button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 bg-purple-500 hover:bg-purple-600 text-white border-0"
                            onClick={() => setActionTarget({ action: 'pay', record: r })}
                          >
                            <Banknote className="h-3.5 w-3.5" /> Chi trả
                          </Button>
                        )}
                        {['DRAFT', 'PENDING'].includes(r.status) && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs gap-1 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!['CANCELLED', 'DRAFT'].includes(r.status) && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          {WORKFLOW_STEPS.map((step, i) => {
                            const stepIdx  = WORKFLOW_STEPS.indexOf(r.status === 'REJECTED' ? 'APPROVED' : r.status as ClaimStatus);
                            const done     = i < stepIdx;
                            const active   = i === stepIdx && r.status !== 'REJECTED';
                            const rejected = r.status === 'REJECTED' && step === 'APPROVED';
                            return (
                              <div key={step} className="flex items-center flex-1 gap-1">
                                <div className={cn(
                                  'h-1.5 flex-1 rounded-full transition-all',
                                  done    ? 'bg-emerald-400' :
                                  active  ? 'bg-blue-400' :
                                  rejected? 'bg-red-300' :
                                            'bg-slate-200',
                                )} />
                                {i < WORKFLOW_STEPS.length - 1 && (
                                  <div className={cn(
                                    'h-2.5 w-2.5 rounded-full flex-shrink-0',
                                    done || active ? 'bg-emerald-400' :
                                    rejected ? 'bg-red-300' : 'bg-slate-200',
                                  )} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Đã gửi', 'Đang xét', 'Duyệt', 'Chi trả'].map((l) => (
                            <span key={l} className="text-[10px] text-muted-foreground">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Trang <span className="font-medium">{page}</span> / {totalPages}
                  {' '}· {totalCount} yêu cầu
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Dialog: Chi tiết yêu cầu ════════════════════════════════════════ */}
      <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-blue-600" />
              </div>
              Chi tiết yêu cầu chế độ
            </DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-5">
              {/* Person card */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {detailRecord.insuranceInfo.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{detailRecord.insuranceInfo.user.name}</p>
                  <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {detailRecord.insuranceInfo.user.militaryId && <span>{detailRecord.insuranceInfo.user.militaryId}</span>}
                    {detailRecord.insuranceInfo.user.rank && <span className="bg-slate-200 px-1.5 rounded">{detailRecord.insuranceInfo.user.rank}</span>}
                    {detailRecord.insuranceInfo.user.unitRelation && <span>{detailRecord.insuranceInfo.user.unitRelation.name}</span>}
                  </div>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={detailRecord.status} size="md" />
                </div>
              </div>

              {/* Claim details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailRow label="Loại chế độ"       value={detailRecord.claimTypeLabel} />
                {detailRecord.startDate && (
                  <DetailRow label="Thời gian"
                    value={`${fmtDate(detailRecord.startDate)}${detailRecord.endDate ? ` — ${fmtDate(detailRecord.endDate)}` : ''}`}
                  />
                )}
                {detailRecord.benefitDays && (
                  <DetailRow label="Số ngày hưởng"   value={`${detailRecord.benefitDays} ngày`} />
                )}
                {detailRecord.hospitalName && (
                  <DetailRow label="Cơ sở y tế"      value={detailRecord.hospitalName} />
                )}
                {detailRecord.diagnosis && (
                  <DetailRow label="Chẩn đoán"       value={detailRecord.diagnosis} />
                )}
                {(detailRecord.amount || detailRecord.calculatedAmount) && (
                  <DetailRow
                    label="Số tiền"
                    value={
                      <span className="font-bold text-emerald-600">
                        {fmtMoney(detailRecord.calculatedAmount ?? detailRecord.amount)}
                      </span>
                    }
                  />
                )}
                {detailRecord.documentNumber && (
                  <DetailRow label="Số quyết định"   value={detailRecord.documentNumber} />
                )}
                {detailRecord.documentDate && (
                  <DetailRow label="Ngày quyết định" value={fmtDate(detailRecord.documentDate)} />
                )}
                {detailRecord.paymentReference && (
                  <DetailRow label="Số chứng từ chi" value={detailRecord.paymentReference} />
                )}
              </div>

              {detailRecord.reason && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Lý do</p>
                  <p className="text-sm bg-slate-50 rounded-lg p-3">{detailRecord.reason}</p>
                </div>
              )}
              {detailRecord.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Mô tả chi tiết</p>
                  <p className="text-sm bg-slate-50 rounded-lg p-3">{detailRecord.description}</p>
                </div>
              )}
              {detailRecord.status === 'REJECTED' && detailRecord.rejectReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Lý do từ chối
                  </p>
                  <p className="text-sm text-red-600">{detailRecord.rejectReason}</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Lịch sử xử lý
                </p>
                <WorkflowTimeline record={detailRecord} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {detailRecord?.status === 'PENDING' && (
              <Button
                className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white border-0"
                disabled={submitting}
                onClick={() => { quickAction('review', detailRecord!); setDetailRecord(null); }}
              >
                <ClipboardCheck className="h-3.5 w-3.5" /> Tiếp nhận ngay
              </Button>
            )}
            {detailRecord?.status === 'UNDER_REVIEW' && (
              <>
                <Button
                  className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                  onClick={() => { setActionTarget({ action: 'approve', record: detailRecord! }); setDetailRecord(null); }}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> Phê duyệt
                </Button>
                <Button
                  variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { setActionTarget({ action: 'reject', record: detailRecord! }); setDetailRecord(null); }}
                >
                  <XCircle className="h-3.5 w-3.5" /> Từ chối
                </Button>
              </>
            )}
            {detailRecord?.status === 'APPROVED' && (
              <Button
                className="gap-1.5 bg-purple-500 hover:bg-purple-600 text-white border-0"
                onClick={() => { setActionTarget({ action: 'pay', record: detailRecord! }); setDetailRecord(null); }}
              >
                <Banknote className="h-3.5 w-3.5" /> Xác nhận chi trả
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailRecord(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Phê duyệt / Từ chối / Chi trả ══════════════════════════ */}
      <Dialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionTarget?.action === 'approve' && (
                <><div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BadgeCheck className="h-4 w-4 text-emerald-600" /></div> Phê duyệt yêu cầu</>
              )}
              {actionTarget?.action === 'reject' && (
                <><div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center"><XCircle className="h-4 w-4 text-red-600" /></div> Từ chối yêu cầu</>
              )}
              {actionTarget?.action === 'pay' && (
                <><div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center"><Banknote className="h-4 w-4 text-purple-600" /></div> Xác nhận chi trả</>
              )}
            </DialogTitle>
            {actionTarget && (
              <DialogDescription>
                Yêu cầu {actionTarget.record.claimTypeLabel} của{' '}
                <span className="font-semibold text-foreground">{actionTarget.record.insuranceInfo.user.name}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {actionTarget?.action === 'approve' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Số tiền phê duyệt <span className="text-red-500">*</span></Label>
                  <Input
                    type="number" placeholder="VD: 2500000"
                    value={actionForm.calculatedAmount}
                    onChange={(e) => setActionForm((f) => ({ ...f, calculatedAmount: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Số quyết định</Label>
                    <Input
                      placeholder="Số QĐ…"
                      value={actionForm.documentNumber}
                      onChange={(e) => setActionForm((f) => ({ ...f, documentNumber: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Ngày quyết định</Label>
                    <Input
                      type="date"
                      value={actionForm.documentDate}
                      onChange={(e) => setActionForm((f) => ({ ...f, documentDate: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-2 text-xs text-emerald-700">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Sau khi phê duyệt, yêu cầu chuyển sang trạng thái <strong>Đã phê duyệt</strong> và chờ xác nhận chi trả.
                </div>
              </>
            )}

            {actionTarget?.action === 'reject' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Lý do từ chối <span className="text-red-500">*</span></Label>
                  <Textarea
                    placeholder="Nêu rõ lý do từ chối để cán bộ biết và điều chỉnh…"
                    value={actionForm.rejectReason}
                    onChange={(e) => setActionForm((f) => ({ ...f, rejectReason: e.target.value }))}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Cán bộ sẽ nhìn thấy lý do từ chối này trong hồ sơ của họ.
                </div>
              </>
            )}

            {actionTarget?.action === 'pay' && (
              <>
                <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền đã duyệt</span>
                    <span className="font-bold text-emerald-600">
                      {fmtMoney(actionTarget.record.calculatedAmount ?? actionTarget.record.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cán bộ</span>
                    <span className="font-medium">{actionTarget.record.insuranceInfo.user.name}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Số chứng từ chi</Label>
                  <Input
                    placeholder="Số phiếu chi / mã giao dịch…"
                    value={actionForm.paymentReference}
                    onChange={(e) => setActionForm((f) => ({ ...f, paymentReference: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-start gap-2 text-xs text-purple-700">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Thao tác này sẽ ghi nhận vào lịch sử hưởng chế độ BHXH của cán bộ.
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionTarget(null)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              disabled={submitting ||
                (actionTarget?.action === 'approve' && !actionForm.calculatedAmount) ||
                (actionTarget?.action === 'reject'  && !actionForm.rejectReason)}
              onClick={() => handleWorkflowAction(actionTarget!.action, actionTarget!.record)}
              className={cn(
                'gap-1.5 text-white border-0',
                actionTarget?.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' :
                actionTarget?.action === 'reject'  ? 'bg-red-500 hover:bg-red-600' :
                                                     'bg-purple-500 hover:bg-purple-600',
              )}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
               actionTarget?.action === 'approve' ? <BadgeCheck className="h-3.5 w-3.5" /> :
               actionTarget?.action === 'reject'  ? <XCircle className="h-3.5 w-3.5" /> :
                                                    <Banknote className="h-3.5 w-3.5" />}
              {actionTarget?.action === 'approve' ? 'Xác nhận phê duyệt' :
               actionTarget?.action === 'reject'  ? 'Xác nhận từ chối' :
                                                    'Xác nhận chi trả'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Tạo yêu cầu mới ════════════════════════════════════════ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
              Tạo yêu cầu chế độ BHXH
            </DialogTitle>
            <DialogDescription>
              Tạo yêu cầu thay mặt cán bộ. Yêu cầu sẽ được gửi vào quy trình xét duyệt ngay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Cán bộ <span className="text-red-500">*</span></Label>
              <Select
                value={createForm.insuranceInfoId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, insuranceInfoId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cán bộ…" />
                </SelectTrigger>
                <SelectContent>
                  {insuranceUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.user.name}
                      {u.user.militaryId && ` — ${u.user.militaryId}`}
                      {u.user.rank && ` (${u.user.rank})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Loại chế độ <span className="text-red-500">*</span></Label>
              <Select
                value={createForm.claimType}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, claimType: v as ClaimType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại chế độ…" />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Từ ngày</Label>
                <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Đến ngày</Label>
                <Input type="date" value={createForm.endDate} onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Số ngày hưởng</Label>
                <Input type="number" min="0" value={createForm.benefitDays} onChange={(e) => setCreateForm((f) => ({ ...f, benefitDays: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Số tiền yêu cầu (VNĐ)</Label>
                <Input type="number" min="0" placeholder="0" value={createForm.amount} onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Cơ sở y tế</Label>
                <Input placeholder="Bệnh viện / phòng khám…" value={createForm.hospitalName} onChange={(e) => setCreateForm((f) => ({ ...f, hospitalName: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Chẩn đoán</Label>
                <Input placeholder="Tên bệnh / chẩn đoán…" value={createForm.diagnosis} onChange={(e) => setCreateForm((f) => ({ ...f, diagnosis: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lý do</Label>
              <Textarea
                placeholder="Lý do yêu cầu chế độ…"
                value={createForm.reason}
                onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mô tả chi tiết</Label>
              <Textarea
                placeholder="Thông tin bổ sung…"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !createForm.insuranceInfoId || !createForm.claimType}
              className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Tạo & gửi vào quy trình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
