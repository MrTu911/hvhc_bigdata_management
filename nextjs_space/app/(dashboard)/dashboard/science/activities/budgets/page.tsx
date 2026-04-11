'use client';

/**
 * M24 — Science Budgets: Danh sách ngân sách nghiên cứu
 * Actor: cán bộ tài chính, trưởng phòng KHQL, cán bộ được phân quyền
 *
 * - Danh sách tất cả ngân sách, filter theo status/year
 * - Badge cảnh báo vượt ngưỡng 90% / 100%
 * - Link tạo ngân sách mới
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  RefreshCw, Plus, AlertTriangle, CheckCircle2,
  TrendingUp, Wallet, Clock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Dự thảo',
  APPROVED:  'Đã duyệt',
  FINALIZED: 'Quyết toán',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  APPROVED:  'bg-emerald-100 text-emerald-700',
  FINALIZED: 'bg-blue-100 text-blue-700',
};

const LINE_CATEGORY_LABELS: Record<string, string> = {
  PERSONNEL: 'Nhân công',
  EQUIPMENT: 'Thiết bị',
  TRAVEL:    'Đi lại',
  OVERHEAD:  'Chi phí chung',
  OTHER:     'Khác',
};

const CURRENT_YEAR = new Date().getFullYear();

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id: string;
  year: number;
  status: string;
  totalApproved: string;
  totalSpent: string;
  project: { id: string; projectCode: string; title: string };
  fundSource: { id: string; name: string; code: string } | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  lineItems: { id: string; category: string; plannedAmount: string; spentAmount: string }[];
}

interface OverspendAlert {
  id: string;
  projectId: string;
  totalApproved: string;
  totalSpent: string;
  pct: number;
}

function spendPct(approved: string, spent: string): number {
  const a = Number(approved);
  const s = Number(spent);
  if (!a) return 0;
  return Math.round((s / a) * 100);
}

function formatVND(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} tr`;
  return n.toLocaleString('vi-VN') + ' đ';
}

function ActivityNav({ active }: { active: string }) {
  const items = [
    { key: 'proposals',  label: 'Đề xuất',    href: '/dashboard/science/activities/proposals' },
    { key: 'intake',     label: 'Tiếp nhận',  href: '/dashboard/science/activities/intake' },
    { key: 'review',     label: 'Thẩm định',  href: '/dashboard/science/activities/review' },
    { key: 'execution',  label: 'Thực hiện',  href: '/dashboard/science/activities/execution' },
    { key: 'progress',   label: 'Tiến độ',    href: '/dashboard/science/activities/progress' },
    { key: 'acceptance', label: 'Nghiệm thu', href: '/dashboard/science/activities/acceptance' },
    { key: 'archive',    label: 'Lưu trữ',    href: '/dashboard/science/activities/archive' },
    { key: 'councils',   label: 'Hội đồng',   href: '/dashboard/science/activities/councils' },
    { key: 'budgets',    label: 'Ngân sách',  href: '/dashboard/science/activities/budgets' },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto whitespace-nowrap">
      {items.map((item) => (
        <Link key={item.key} href={item.href}
          className={`px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >{item.label}</Link>
      ))}
    </div>
  );
}

// ─── Overspend alerts widget ──────────────────────────────────────────────────

function AlertsWidget() {
  const [alerts, setAlerts] = useState<{ overspent: OverspendAlert[]; nearLimit: OverspendAlert[] } | null>(null);

  useEffect(() => {
    fetch('/api/science/budgets/alerts/overspend')
      .then(r => r.json())
      .then(j => setAlerts(j.data))
      .catch(() => {/* silent */});
  }, []);

  if (!alerts || alerts.overspent.length + alerts.nearLimit.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
      <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4" /> Cảnh báo ngân sách
      </p>
      {alerts.overspent.map((a) => (
        <div key={a.id} className="flex items-center justify-between text-xs text-red-700">
          <span>Vượt 100%: {a.projectId.slice(-6)}</span>
          <Link href={`/dashboard/science/activities/budgets/${a.id}`} className="underline hover:no-underline">
            Xem chi tiết
          </Link>
        </div>
      ))}
      {alerts.nearLimit.map((a) => (
        <div key={a.id} className="flex items-center justify-between text-xs text-amber-700">
          <span>Gần ngưỡng {a.pct}%: {a.projectId.slice(-6)}</span>
          <Link href={`/dashboard/science/activities/budgets/${a.id}`} className="underline hover:no-underline">
            Xem chi tiết
          </Link>
        </div>
      ))}
    </div>
  );
}

// ─── Budget row card ──────────────────────────────────────────────────────────

function BudgetCard({ b }: { b: BudgetItem }) {
  const pct = spendPct(b.totalApproved, b.totalSpent);
  const isOver    = pct >= 100;
  const isNear    = pct >= 90 && !isOver;
  const barColor  = isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <Link href={`/dashboard/science/activities/budgets/${b.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
                {isOver && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" /> Vượt ngân sách
                  </span>
                )}
                {isNear && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" /> Gần ngưỡng {pct}%
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono">{b.project.projectCode}</span>
                <span className="text-xs text-gray-400">{b.year}</span>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{b.project.title}</p>
              {b.fundSource && (
                <p className="text-xs text-gray-400 mt-0.5">{b.fundSource.name}</p>
              )}

              {/* Progress bar */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Đã chi: {formatVND(b.totalSpent)}</span>
                  <span>Phê duyệt: {formatVND(b.totalApproved)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs font-medium ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-gray-500'}`}>
                  {pct}% sử dụng
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-gray-400 shrink-0">
              <p className="text-sm font-semibold text-gray-700">{formatVND(b.totalApproved)}</p>
              <p className="mt-0.5">{b.lineItems.length} khoản mục</p>
              {b.approvedBy && <p className="mt-0.5">Duyệt: {b.approvedBy.name}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const [budgets,  setBudgets]  = useState<BudgetItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const pageSize = 15;

  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear,   setFilterYear]   = useState(String(CURRENT_YEAR));

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filterStatus) params.set('status', filterStatus);
      if (filterYear)   params.set('year', filterYear);

      const res = await fetch(`/api/science/budgets?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBudgets(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch {
      toast.error('Không thể tải danh sách ngân sách');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterYear]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  const totalPages = Math.ceil(total / pageSize);

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  return (
    <div className="space-y-4">
      <ActivityNav active="budgets" />

      <AlertsWidget />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ngân sách nghiên cứu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi dự toán, phê duyệt và giải ngân kinh phí đề tài</p>
        </div>
        <Link href="/dashboard/science/activities/budgets/new">
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Lập dự toán mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">Tất cả năm</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={loadBudgets} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
        <span className="text-sm text-gray-400 ml-auto">{total} ngân sách</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-400 text-sm">Đang tải...</div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <Wallet className="h-10 w-10 opacity-30" />
          <p className="text-sm">Chưa có ngân sách nào</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {budgets.map((b) => <BudgetCard key={b.id} b={b} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
