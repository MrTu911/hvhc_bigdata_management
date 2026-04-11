'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Wallet, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock,
  ExternalLink, TrendingUp,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Nháp',         cls: 'bg-gray-100 text-gray-600' },
  APPROVED:  { label: 'Đã duyệt',     cls: 'bg-blue-100 text-blue-700' },
  FINALIZED: { label: 'Đã quyết toán', cls: 'bg-emerald-100 text-emerald-700' },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function formatVnd(amount: number | string): string {
  const n = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n) + 'đ';
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id:            string;
  year:          number;
  status:        string;
  totalApproved: string;   // BigInt serialized as string
  totalSpent:    string;   // BigInt serialized as string
  project:       { id: string; projectCode: string; title: string } | null;
  fundSource:    { id: string; name: string; code: string } | null;
  approvedBy:    { id: string; name: string } | null;
  approvedAt:    string | null;
  createdAt:     string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function UtilizationBar({ spent, approved }: { spent: string | number; approved: string | number }) {
  const s = Number(spent);
  const a = Number(approved);
  const pct = a > 0 ? Math.min(100, (s / a) * 100) : 0;
  const over = pct >= 90;
  const warn = pct >= 75 && !over;
  const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-blue-500';
  return (
    <div className="min-w-[100px]">
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-xs font-medium ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-700'}`}>
          {pct.toFixed(0)}%
        </span>
        {over && <AlertTriangle size={11} className="text-red-500" />}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string; sub?: string; icon: typeof Wallet; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScienceBudgetsPage() {
  const [items, setItems]           = useState<BudgetItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBudgets = useCallback(async (opts: {
    year: string; status: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(opts.page));
      params.set('pageSize', '20');
      if (opts.year)   params.set('year', opts.year);
      if (opts.status) params.set('status', opts.status);

      const res = await fetch(`/api/science/budgets?${params}`);
      if (!res.ok) throw new Error('Tải danh sách thất bại');
      const json = await res.json();
      setItems(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setTotalPages(json.meta?.totalPages ?? 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets({ year: yearFilter, status: statusFilter, page });
  }, [yearFilter, statusFilter, page, fetchBudgets]);

  const onFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === 'all' ? '' : v);
    setPage(1);
  };

  const totalApproved = items.reduce((s, b) => s + Number(b.totalApproved ?? 0), 0);
  const totalSpent    = items.reduce((s, b) => s + Number(b.totalSpent    ?? 0), 0);
  const overspendCount = items.filter((b) => {
    const a = Number(b.totalApproved);
    return a > 0 && Number(b.totalSpent) / a >= 0.9;
  }).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={24} className="text-green-600" />
            Kinh phí Nghiên cứu
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi ngân sách và giải ngân đề tài</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Tổng kinh phí duyệt"
          value={formatVnd(totalApproved)}
          sub={`${items.length} ngân sách`}
          icon={Wallet}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Tổng đã giải ngân"
          value={formatVnd(totalSpent)}
          sub={totalApproved > 0 ? `${((totalSpent / totalApproved) * 100).toFixed(1)}% sử dụng` : undefined}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Cảnh báo vượt 90%"
          value={String(overspendCount)}
          sub="ngân sách cần chú ý"
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={yearFilter || 'all'} onValueChange={onFilterChange(setYearFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm</SelectItem>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={onFilterChange(setStatusFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="FINALIZED">Đã quyết toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Chưa có ngân sách nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Đề tài</TableHead>
                  <TableHead className="w-20 text-center">Năm</TableHead>
                  <TableHead className="w-24">Nguồn KP</TableHead>
                  <TableHead className="w-28 text-right">Duyệt (VNĐ)</TableHead>
                  <TableHead className="w-28 text-right">Đã chi (VNĐ)</TableHead>
                  <TableHead className="w-36">Sử dụng</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Chi tiết</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {b.project?.title ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        {b.project?.projectCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-700">{b.year}</TableCell>
                    <TableCell className="text-xs text-gray-600">{b.fundSource?.name ?? '—'}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatVnd(b.totalApproved)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-700">
                      {formatVnd(b.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <UtilizationBar spent={b.totalSpent} approved={b.totalApproved} />
                    </TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      {b.project && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/science/projects/${b.project.id}`}>
                            <ExternalLink size={14} />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Tổng: {total} ngân sách</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
