'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  PARTY_HISTORY_TYPE_LABELS,
  PARTY_HISTORY_TYPE_COLORS,
} from '@/lib/constants/party.labels';
import {
  UserCheck, UserPlus, ArrowLeftRight, Award, ShieldOff,
  ShieldAlert, RefreshCw, RotateCcw, Star, Plus, Search,
  FileText, Calendar, Building2, ChevronLeft, ChevronRight,
  GitBranch, Minus,
} from 'lucide-react';

// ── Tab metadata ──────────────────────────────────────────────────────────────
const HISTORY_TYPES = [
  'ALL',
  'ADMITTED',
  'OFFICIAL_CONFIRMED',
  'APPOINTED',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'SUSPENDED',
  'EXPELLED',
  'RESTORED',
  'STATUS_CHANGED',
  'REMOVED_POSITION',
] as const;

type HistoryType = typeof HISTORY_TYPES[number];

const TYPE_META: Record<string, {
  label: string; color: string; bg: string; border: string;
  textCls: string; icon: React.ElementType;
}> = {
  ALL: { label: 'Tất cả', color: '#6b7280', bg: 'bg-slate-50', border: 'border-slate-200', textCls: 'text-slate-600', icon: FileText },
  ADMITTED: { label: 'Kết nạp Đảng', color: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', textCls: 'text-emerald-700', icon: UserPlus },
  OFFICIAL_CONFIRMED: { label: 'Xác nhận chính thức', color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200', textCls: 'text-blue-700', icon: UserCheck },
  APPOINTED: { label: 'Bổ nhiệm', color: '#7c3aed', bg: 'bg-violet-50', border: 'border-violet-200', textCls: 'text-violet-700', icon: Award },
  TRANSFER_IN: { label: 'Chuyển đến', color: '#0891b2', bg: 'bg-cyan-50', border: 'border-cyan-200', textCls: 'text-cyan-700', icon: ArrowLeftRight },
  TRANSFER_OUT: { label: 'Chuyển đi', color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200', textCls: 'text-orange-700', icon: ArrowLeftRight },
  SUSPENDED: { label: 'Đình chỉ', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200', textCls: 'text-amber-700', icon: ShieldOff },
  EXPELLED: { label: 'Khai trừ', color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200', textCls: 'text-red-700', icon: ShieldAlert },
  RESTORED: { label: 'Phục hồi', color: '#059669', bg: 'bg-teal-50', border: 'border-teal-200', textCls: 'text-teal-700', icon: RotateCcw },
  STATUS_CHANGED: { label: 'Đổi trạng thái', color: '#6b7280', bg: 'bg-slate-50', border: 'border-slate-200', textCls: 'text-slate-600', icon: RefreshCw },
  REMOVED_POSITION: { label: 'Miễn chức vụ', color: '#9333ea', bg: 'bg-purple-50', border: 'border-purple-200', textCls: 'text-purple-700', icon: Minus },
};

function fmtDate(d?: string | Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
  'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-orange-500',
];
function avatarColor(name?: string | null) {
  if (!name) return AVATAR_COLORS[0];
  const code = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({
  counts, activeType, onSelect,
}: {
  counts: Record<string, number>;
  activeType: string;
  onSelect: (t: string) => void;
}) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const tabs: Array<[string, number]> = [
    ['ALL', total],
    ...Object.entries(counts).sort(([, a], [, b]) => b - a),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(([type, count]) => {
        const meta = TYPE_META[type] ?? TYPE_META.ALL;
        const Icon = meta.icon;
        const active = activeType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              active
                ? `${meta.bg} ${meta.border} ${meta.textCls} shadow-sm`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{meta.label}</span>
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/70' : 'bg-slate-100'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Admission row card ────────────────────────────────────────────────────────
function AdmissionCard({ item }: { item: any }) {
  const meta = TYPE_META[item.historyType] ?? TYPE_META.ALL;
  const Icon = meta.icon;
  const name = item.partyMember?.user?.name;
  const milId = item.partyMember?.user?.militaryId;
  const rank = item.partyMember?.user?.rank;
  const unit = item.partyMember?.user?.unitRelation?.name;

  return (
    <div className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b last:border-b-0`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${avatarColor(name)}`}>
        {initials(name)}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-semibold text-slate-900">{name ?? '—'}</span>
          {milId && <code className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 font-mono">{milId}</code>}
          {rank && <span className="text-xs text-muted-foreground">{rank}</span>}
        </div>
        {unit && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{unit}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.decisionNumber && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="font-mono font-medium text-slate-700">{item.decisionNumber}</span>
            </span>
          )}
          {item.decisionDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              QĐ: {fmtDate(item.decisionDate)}
            </span>
          )}
          {item.effectiveDate && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400" />
              HiL: {fmtDate(item.effectiveDate)}
            </span>
          )}
          {item.organization?.name && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-violet-400" />
              {item.organization.name}
            </span>
          )}
        </div>
        {item.reason && (
          <p className="text-xs text-slate-500 mt-1 truncate italic">{item.reason}</p>
        )}
      </div>

      {/* Type badge */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${meta.bg} ${meta.border} ${meta.textCls}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {fmtDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Create admission dialog ───────────────────────────────────────────────────
const HISTORY_TYPE_OPTIONS = Object.entries(PARTY_HISTORY_TYPE_LABELS).filter(
  ([k]) => k !== 'OTHER',
);

const DEFAULT_FORM = {
  partyMemberId: '',
  historyType: 'ADMITTED',
  decisionNumber: '',
  decisionDate: '',
  effectiveDate: '',
  reason: '',
  notes: '',
};

function CreateAdmissionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [members, setMembers] = useState<{ id: string; user: { name: string; militaryId?: string } }[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/party/members?limit=500')
      .then(r => r.json())
      .then(d => setMembers(d.data ?? d.members ?? []))
      .catch(() => {});
  }, [open]);

  const filtered = memberSearch.trim()
    ? members.filter(m =>
        m.user?.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.user?.militaryId ?? '').includes(memberSearch),
      )
    : members;

  const f = (field: keyof typeof DEFAULT_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.partyMemberId || !form.historyType) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/party/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          decisionDate: form.decisionDate || null,
          effectiveDate: form.effectiveDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Lỗi ghi nhận');
      }
      toast({ title: 'Đã ghi nhận', description: 'Bước lịch sử Đảng đã được lưu.' });
      setForm(DEFAULT_FORM);
      setMemberSearch('');
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi nhận bước lịch sử Đảng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Member picker */}
          <div className="space-y-1.5">
            <Label>Đảng viên <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Tìm theo tên hoặc mã quân nhân…"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
            />
            {memberSearch.trim() && (
              <div className="max-h-40 overflow-y-auto rounded-lg border shadow-sm divide-y">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy</p>
                ) : (
                  filtered.slice(0, 8).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, partyMemberId: m.id }));
                        setMemberSearch(m.user?.name ?? '');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium">{m.user?.name}</span>
                      {m.user?.militaryId && (
                        <span className="text-muted-foreground ml-2">({m.user.militaryId})</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {form.partyMemberId && (
              <p className="text-xs text-emerald-600 font-medium">
                Đã chọn: {members.find(m => m.id === form.partyMemberId)?.user?.name}
              </p>
            )}
          </div>

          {/* History type */}
          <div className="space-y-1.5">
            <Label>Loại bước <span className="text-red-500">*</span></Label>
            <Select value={form.historyType} onValueChange={v => setForm(prev => ({ ...prev, historyType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HISTORY_TYPE_OPTIONS.map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số quyết định</Label>
              <Input placeholder="VD: KN-001/2025" value={form.decisionNumber} onChange={f('decisionNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày quyết định</Label>
              <Input type="date" value={form.decisionDate} onChange={f('decisionDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ngày hiệu lực</Label>
            <Input type="date" value={form.effectiveDate} onChange={f('effectiveDate')} />
          </div>

          <div className="space-y-1.5">
            <Label>Lý do / Căn cứ</Label>
            <Input placeholder="Lý do ban hành quyết định…" value={form.reason} onChange={f('reason')} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.partyMemberId}
          >
            {submitting ? 'Đang lưu…' : 'Ghi nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PartyAdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  // Fetch counts for all types (once on mount)
  const fetchCounts = useCallback(async () => {
    const types = HISTORY_TYPES.filter(t => t !== 'ALL');
    const results = await Promise.all(
      types.map(t =>
        fetch(`/api/party/admissions?historyType=${t}&limit=1&page=1`)
          .then(r => r.json())
          .then(d => [t, d.pagination?.total ?? 0] as [string, number])
          .catch(() => [t, 0] as [string, number]),
      ),
    );
    setCounts(Object.fromEntries(results.filter(([, c]) => (c as number) > 0)));
  }, []);

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (activeType !== 'ALL') params.set('historyType', activeType);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/party/admissions?${params}`);
      const data = await res.json();
      setAdmissions(data.admissions ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeType, page, search]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchAdmissions(); }, [activeType, page]);

  const handleSearch = () => { setPage(1); fetchAdmissions(); };
  const handleTypeChange = (t: string) => { setActiveType(t); setPage(1); };
  const handleCreated = () => { fetchCounts(); fetchAdmissions(); };

  const activeMeta = TYPE_META[activeType] ?? TYPE_META.ALL;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-10 h-28 w-28 rounded-full bg-white/5" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-semibold uppercase tracking-widest">
                  M03 · Lịch sử & Quyết định Đảng
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Biên bản & Quyết định kết nạp</h1>
              <p className="text-emerald-200 text-sm mt-1">
                Ghi nhận các quyết định chính thức: kết nạp, bổ nhiệm, chuyển sinh, khai trừ…
              </p>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Kết nạp ĐV', value: counts['ADMITTED'] ?? 0, icon: UserPlus },
                { label: 'Bổ nhiệm', value: counts['APPOINTED'] ?? 0, icon: Award },
                { label: 'Chuyển sinh', value: (counts['TRANSFER_IN'] ?? 0) + (counts['TRANSFER_OUT'] ?? 0), icon: ArrowLeftRight },
                { label: 'Đình chỉ/Khai trừ', value: (counts['SUSPENDED'] ?? 0) + (counts['EXPELLED'] ?? 0), icon: ShieldAlert },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-white/10 px-4 py-2.5 text-center min-w-[80px]">
                  <Icon className="h-3.5 w-3.5 text-emerald-200 mx-auto mb-0.5" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-emerald-100">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="relative mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowCreate(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 font-semibold"
            >
              <Plus className="h-4 w-4" /> Ghi nhận quyết định
            </Button>
            <Link href="/dashboard/party/recruitment">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5">
                <GitBranch className="h-4 w-4" /> Pipeline kết nạp
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => { fetchCounts(); fetchAdmissions(); }}
              disabled={loading}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5 ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ── Type tabs strip ──────────────────────────────────────────────── */}
        <StatsStrip counts={counts} activeType={activeType} onSelect={handleTypeChange} />

        {/* ── Search + list ────────────────────────────────────────────────── */}
        <Card>
          {/* Search bar */}
          <div className={`px-5 py-3 border-b flex items-center gap-3 ${activeMeta.bg} rounded-t-xl`}>
            <div className={`rounded-lg p-1.5 bg-white/70 border ${activeMeta.border}`}>
              <ActiveIcon className={`h-4 w-4 ${activeMeta.textCls}`} />
            </div>
            <span className={`text-sm font-semibold ${activeMeta.textCls}`}>
              {activeMeta.label}
              {total > 0 && (
                <span className={`ml-2 text-xs font-normal ${activeMeta.textCls} opacity-70`}>
                  {total} bản ghi
                </span>
              )}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, mã QN…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8 h-8 text-sm w-52 bg-white"
                />
              </div>
              <Button type="button" size="sm" variant="outline" className="h-8" onClick={handleSearch}>
                Tìm
              </Button>
            </div>
          </div>

          {/* List */}
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : admissions.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Chưa có bản ghi nào</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? 'Thử thay đổi từ khóa tìm kiếm' : 'Nhấn "Ghi nhận quyết định" để thêm mới'}
                </p>
              </div>
            ) : (
              <div>
                {admissions.map(item => (
                  <AdmissionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages} · {total} bản ghi
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="h-8 gap-1"
                >
                  Sau <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Create dialog ────────────────────────────────────────────────── */}
        <CreateAdmissionDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={handleCreated}
        />
      </div>
    </div>
  );
}
