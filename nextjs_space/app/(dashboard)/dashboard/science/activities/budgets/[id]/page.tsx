'use client';

/**
 * M24 — Science Budgets: Chi tiết ngân sách
 *
 * Tabs:
 *   1. Dự toán   — xem/sửa khoản mục, tổng kinh phí
 *   2. Phê duyệt — DRAFT → APPROVED → FINALIZED workflow
 *   3. Giải ngân — ghi nhận chi tiêu từng khoản mục
 *   4. Theo dõi  — planned vs actual chart, cảnh báo ngưỡng
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2,
  TrendingUp, Wallet, Edit2, Save, X, Plus, Trash2,
  ShoppingCart, Receipt, Landmark,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  category: string;
  description: string;
  plannedAmount: string;
  spentAmount: string;
  period: string | null;
}

interface BudgetDetail {
  id: string;
  year: number;
  status: string;
  totalApproved: string;
  totalSpent: string;
  approvedAt: string | null;
  createdAt: string;
  project: { id: string; projectCode: string; title: string };
  fundSource: { id: string; name: string; code: string } | null;
  approvedBy: { id: string; name: string } | null;
  lineItems: LineItem[];
}

type TabKey = 'plan' | 'approval' | 'disbursement' | 'tracking' | 'purchase-orders' | 'expenses' | 'grants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} triệu`;
  return n.toLocaleString('vi-VN') + ' đ';
}

function spendPct(approved: string, spent: string): number {
  const a = Number(approved); const s = Number(spent);
  if (!a) return 0;
  return Math.round((s / a) * 100);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-500 w-36 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const items: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
    { key: 'plan',           label: 'Dự toán' },
    { key: 'approval',       label: 'Phê duyệt' },
    { key: 'disbursement',   label: 'Giải ngân' },
    { key: 'tracking',       label: 'Theo dõi' },
    { key: 'purchase-orders',label: 'Mua sắm',  icon: <ShoppingCart className="h-3.5 w-3.5" /> },
    { key: 'expenses',       label: 'Chi tiêu',  icon: <Receipt className="h-3.5 w-3.5" /> },
    { key: 'grants',         label: 'Tài trợ',   icon: <Landmark className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
      {items.map((item) => (
        <button key={item.key} onClick={() => onChange(item.key)}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === item.key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab 1: Dự toán ───────────────────────────────────────────────────────────

function PlanTab({ budget, onRefresh }: { budget: BudgetDetail; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [lines,   setLines]   = useState<Array<Partial<LineItem> & { _new?: boolean }>>([]);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setLines(budget.lineItems.map((l) => ({ ...l })));
  }, [budget.lineItems]);

  const isLocked = budget.status === 'FINALIZED';

  const addLine = () => {
    setLines([...lines, {
      _new: true,
      category: 'OTHER',
      description: '',
      plannedAmount: '0',
      spentAmount: '0',
      period: '',
    }]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: string) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const lineItems = lines.map((l) => ({
        id:            l._new ? undefined : l.id,
        category:      l.category ?? 'OTHER',
        description:   l.description ?? '',
        plannedAmount: Number(l.plannedAmount ?? 0),
        spentAmount:   Number(l.spentAmount ?? 0),
        period:        l.period ?? undefined,
      }));

      const res = await fetch(`/api/science/budgets/${budget.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lineItems }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Lỗi cập nhật');
      }
      toast.success('Đã cập nhật dự toán');
      setEditing(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const totalPlanned = lines.reduce((s, l) => s + Number(l.plannedAmount ?? 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Khoản mục dự toán</CardTitle>
            {!isLocked && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
                <Edit2 className="h-3.5 w-3.5" /> Chỉnh sửa
              </Button>
            )}
            {editing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addLine} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Thêm dòng
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 bg-violet-600 hover:bg-violet-700 text-white">
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setLines(budget.lineItems.map(l => ({...l}))); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Hạng mục</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Mô tả</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Giai đoạn</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Dự toán</th>
                {editing && <th className="px-4 py-2.5 w-10" />}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id ?? `new-${i}`} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    {editing ? (
                      <select value={l.category ?? 'OTHER'} onChange={(e) => updateLine(i, 'category', e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-violet-400">
                        {Object.entries(LINE_CATEGORY_LABELS).map(([v, lab]) => (
                          <option key={v} value={v}>{lab}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                        {LINE_CATEGORY_LABELS[l.category ?? ''] ?? l.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editing ? (
                      <Input value={l.description ?? ''} onChange={(e) => updateLine(i, 'description', e.target.value)}
                        className="text-xs h-7" placeholder="Mô tả..." />
                    ) : l.description}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">
                    {editing ? (
                      <Input value={l.period ?? ''} onChange={(e) => updateLine(i, 'period', e.target.value)}
                        className="text-xs h-7 w-24" placeholder="Q1-2026" />
                    ) : (l.period || '—')}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {editing ? (
                      <Input type="number" value={l.plannedAmount ?? '0'} onChange={(e) => updateLine(i, 'plannedAmount', e.target.value)}
                        className="text-xs h-7 text-right w-32 ml-auto" />
                    ) : formatVND(l.plannedAmount ?? '0')}
                  </td>
                  {editing && (
                    <td className="px-2 py-2">
                      <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-gray-50 font-semibold">
                <td colSpan={3} className="px-4 py-2.5 text-sm text-gray-600">Tổng dự toán</td>
                <td className="px-4 py-2.5 text-right text-violet-700">{formatVND(totalPlanned)}</td>
                {editing && <td />}
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Tổng quan</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          <Row label="Năm ngân sách"  value={String(budget.year)} />
          <Row label="Nguồn kinh phí" value={budget.fundSource?.name ?? '—'} />
          <Row label="Tổng phê duyệt" value={formatVND(budget.totalApproved)} />
          <Row label="Đã chi"         value={formatVND(budget.totalSpent)} />
          <Row label="Trạng thái"     value={STATUS_LABELS[budget.status] ?? budget.status} />
          {budget.approvedBy  && <Row label="Người duyệt" value={budget.approvedBy.name} />}
          {budget.approvedAt  && <Row label="Ngày duyệt"  value={new Date(budget.approvedAt).toLocaleDateString('vi-VN')} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: Phê duyệt ─────────────────────────────────────────────────────────

function ApprovalTab({ budget, onRefresh }: { budget: BudgetDetail; onRefresh: () => void }) {
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async (status: 'APPROVED' | 'FINALIZED') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/science/budgets/${budget.id}?action=approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status, note }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Lỗi phê duyệt');
      }
      toast.success(status === 'APPROVED' ? 'Đã phê duyệt ngân sách' : 'Đã quyết toán ngân sách');
      setNote('');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phê duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  const isDraft     = budget.status === 'DRAFT';
  const isApproved  = budget.status === 'APPROVED';
  const isFinalized = budget.status === 'FINALIZED';

  return (
    <div className="space-y-4">
      {/* Status timeline */}
      <div className="flex items-center gap-0">
        {(['DRAFT', 'APPROVED', 'FINALIZED'] as const).map((s, i) => {
          const passed = ['DRAFT', 'APPROVED', 'FINALIZED'].indexOf(budget.status) >= i;
          return (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                passed ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {passed && <CheckCircle2 className="h-3.5 w-3.5" />}
                {STATUS_LABELS[s]}
              </div>
              {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {isFinalized ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          Ngân sách đã quyết toán
          {budget.approvedBy && ` — ${budget.approvedBy.name}`}
          {budget.approvedAt && ` (${new Date(budget.approvedAt).toLocaleDateString('vi-VN')})`}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hành động</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600">Ghi chú (tùy chọn)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Ghi chú phê duyệt, điều kiện, v.v..."
                className="text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <Button
                  onClick={() => handleApprove('APPROVED')}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Đang phê duyệt...' : 'Phê duyệt ngân sách'}
                </Button>
              )}
              {isApproved && (
                <Button
                  onClick={() => handleApprove('FINALIZED')}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Đang quyết toán...' : 'Quyết toán'}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isDraft ? 'Phê duyệt = xác nhận dự toán hợp lệ và phân bổ kinh phí.' : ''}
              {isApproved ? 'Quyết toán = kết thúc chu kỳ sử dụng kinh phí đề tài.' : ''}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 3: Giải ngân ─────────────────────────────────────────────────────────

function DisbursementTab({ budget, onRefresh }: { budget: BudgetDetail; onRefresh: () => void }) {
  const [selectedLine, setSelectedLine] = useState('');
  const [amount,       setAmount]       = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const isLocked = budget.status === 'FINALIZED';

  const handleRecord = async () => {
    if (!selectedLine || !amount) {
      toast.error('Chọn khoản mục và nhập số tiền');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/science/budgets/${budget.id}?action=spend`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lineItemId: selectedLine, spentAmount: Number(amount) }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Lỗi ghi nhận');
      }
      toast.success('Đã ghi nhận chi tiêu');
      setSelectedLine('');
      setAmount('');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi ghi nhận');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current spend per line */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Chi tiêu theo khoản mục</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Khoản mục</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Dự toán</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Đã chi</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Còn lại</th>
                <th className="px-4 py-2.5 w-20 text-center font-medium text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {budget.lineItems.map((l) => {
                const planned  = Number(l.plannedAmount);
                const spent    = Number(l.spentAmount);
                const remain   = planned - spent;
                const pct      = planned > 0 ? Math.round((spent / planned) * 100) : 0;
                const isOver   = pct >= 100;
                const isNear   = pct >= 90 && !isOver;
                return (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                        {LINE_CATEGORY_LABELS[l.category] ?? l.category}
                      </span>
                      <span className="ml-2 text-gray-600 text-xs">{l.description}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{formatVND(l.plannedAmount)}</td>
                    <td className="px-4 py-2 text-right">{formatVND(l.spentAmount)}</td>
                    <td className={`px-4 py-2 text-right ${remain < 0 ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                      {formatVND(Math.abs(remain))}{remain < 0 ? ' (vượt)' : ''}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-gray-500'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Record spend form */}
      {!isLocked && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ghi nhận chi tiêu</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Khoản mục *</label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="">Chọn khoản mục...</option>
                  {budget.lineItems.map((l) => (
                    <option key={l.id} value={l.id}>
                      {LINE_CATEGORY_LABELS[l.category] ?? l.category} — {l.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Số tiền đã chi (VNĐ) *</label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập tổng số tiền đã chi..."
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRecord}
                disabled={submitting || !selectedLine || !amount}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Đang lưu...' : 'Cập nhật chi tiêu'}
              </Button>
              <p className="text-xs text-gray-400">* Cập nhật tổng số tiền đã chi của khoản mục (không phải cộng thêm)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 4: Theo dõi ──────────────────────────────────────────────────────────

function TrackingTab({ budget }: { budget: BudgetDetail }) {
  const totalApproved = Number(budget.totalApproved);
  const totalSpent    = Number(budget.totalSpent);
  const pct           = spendPct(budget.totalApproved, budget.totalSpent);
  const remaining     = totalApproved - totalSpent;

  const isOver = pct >= 100;
  const isNear = pct >= 90 && !isOver;

  const barColor = isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';

  // Line item breakdown for bar chart
  const lineData = budget.lineItems.map((l) => ({
    label:   LINE_CATEGORY_LABELS[l.category] ?? l.category,
    planned: Number(l.plannedAmount),
    spent:   Number(l.spentAmount),
  }));
  const maxVal = Math.max(...lineData.map((d) => Math.max(d.planned, d.spent)), 1);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Tổng phê duyệt"  value={formatVND(totalApproved)} color="violet" />
        <KPICard label="Đã sử dụng"      value={formatVND(totalSpent)}    color={isOver ? 'red' : isNear ? 'amber' : 'emerald'} />
        <KPICard label="Còn lại"         value={remaining >= 0 ? formatVND(remaining) : `(${formatVND(-remaining)})`} color={remaining < 0 ? 'red' : 'gray'} />
        <KPICard label="% sử dụng"       value={`${pct}%`}                color={isOver ? 'red' : isNear ? 'amber' : 'emerald'} />
      </div>

      {/* Alert */}
      {(isOver || isNear) && (
        <div className={`rounded-lg border p-3 flex items-start gap-2 ${isOver ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${isOver ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="text-sm">
            <p className={`font-semibold ${isOver ? 'text-red-700' : 'text-amber-700'}`}>
              {isOver ? 'Đã vượt ngân sách' : `Đã sử dụng ${pct}% ngân sách`}
            </p>
            <p className={`text-xs mt-0.5 ${isOver ? 'text-red-600' : 'text-amber-600'}`}>
              {isOver
                ? `Vượt ${formatVND(-remaining)} so với phê duyệt.`
                : `Chỉ còn ${formatVND(remaining)} chưa sử dụng.`}
            </p>
          </div>
        </div>
      )}

      {/* Overall progress bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="font-medium text-gray-700">Tiến độ sử dụng ngân sách</span>
            <span>{formatVND(totalApproved)}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className={`font-semibold ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pct}% — {formatVND(totalSpent)} đã chi
            </span>
            <span className="text-gray-400">{formatVND(remaining >= 0 ? remaining : 0)} còn lại</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-line bar chart (horizontal) */}
      {lineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Chi tiêu theo khoản mục</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {lineData.map((d, i) => {
              const plannedW = (d.planned / maxVal) * 100;
              const spentW   = (d.spent   / maxVal) * 100;
              const linePct  = d.planned > 0 ? Math.round((d.spent / d.planned) * 100) : 0;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{d.label}</span>
                    <span className={`font-medium ${linePct >= 100 ? 'text-red-600' : linePct >= 90 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {linePct}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-14 shrink-0">Dự toán</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div className="h-full bg-violet-300 rounded-full" style={{ width: `${plannedW}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right shrink-0">{formatVND(d.planned)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-14 shrink-0">Thực chi</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div className={`h-full rounded-full ${linePct >= 100 ? 'bg-red-400' : linePct >= 90 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${spentW}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right shrink-0">{formatVND(d.spent)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 5: Mua sắm (Purchase Orders) ────────────────────────────────────────

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  description?: string | null;
  totalAmount: string;
  status: string;
  createdAt: string;
}

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Dự thảo',
  SUBMITTED: 'Đã nộp',
  APPROVED:  'Đã duyệt',
  RECEIVED:  'Đã nhận',
  CANCELLED: 'Huỷ',
};

const PO_STATUS_BADGE: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED:  'bg-emerald-100 text-emerald-700',
  RECEIVED:  'bg-violet-100 text-violet-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

function PurchaseOrdersTab({ projectId }: { projectId: string }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/finance/purchase-orders?projectId=${projectId}&pageSize=50`)
      .then(r => r.json())
      .then((res) => setOrders(res.success ? (res.data?.items ?? res.data ?? []) : []))
      .catch(() => toast.error('Lỗi tải đơn mua sắm'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-8 text-gray-400 text-sm">Đang tải...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{orders.length > 0 ? `${orders.length} đơn mua sắm` : 'Chưa có đơn mua sắm'}</p>
        <Link href={`/dashboard/science/finance/purchase-orders/new?projectId=${projectId}`}
          className="text-xs text-violet-600 hover:underline flex items-center gap-1">
          <Plus className="h-3 w-3" /> Tạo đơn mới
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
          <ShoppingCart className="h-8 w-8 opacity-30" />
          <p className="text-sm">Chưa có đơn mua sắm nào cho đề tài này.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Số PO</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Nhà cung cấp</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Mô tả</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Giá trị</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-violet-700 font-medium">{po.poNumber}</td>
                    <td className="px-4 py-2.5 text-gray-800">{po.vendor}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{po.description ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatVND(po.totalAmount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PO_STATUS_BADGE[po.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {PO_STATUS_LABELS[po.status] ?? po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 6: Chi tiêu (Expenses) ───────────────────────────────────────────────

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: string;
  status: string;
  expenseDate: string;
}

const EXPENSE_STATUS_LABELS: Record<string, string> = {
  DRAFT:      'Dự thảo',
  SUBMITTED:  'Đã nộp',
  APPROVED:   'Đã duyệt',
  REJECTED:   'Từ chối',
  REIMBURSED: 'Đã hoàn trả',
};

const EXPENSE_STATUS_BADGE: Record<string, string> = {
  DRAFT:      'bg-gray-100 text-gray-600',
  SUBMITTED:  'bg-blue-100 text-blue-700',
  APPROVED:   'bg-emerald-100 text-emerald-700',
  REJECTED:   'bg-red-100 text-red-600',
  REIMBURSED: 'bg-violet-100 text-violet-700',
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  PERSONNEL: 'Nhân công',
  EQUIPMENT: 'Thiết bị',
  TRAVEL:    'Đi lại',
  OVERHEAD:  'Chi phí chung',
  PRINTING:  'In ấn',
  OTHER:     'Khác',
};

function ExpensesTab({ projectId }: { projectId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/finance/expenses?projectId=${projectId}&pageSize=50`)
      .then(r => r.json())
      .then((res) => setExpenses(res.success ? (res.data?.items ?? res.data ?? []) : []))
      .catch(() => toast.error('Lỗi tải chi tiêu'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const totalApproved = expenses
    .filter((e) => ['APPROVED', 'REIMBURSED'].includes(e.status))
    .reduce((s, e) => s + Number(e.amount), 0);

  if (loading) return <div className="flex justify-center py-8 text-gray-400 text-sm">Đang tải...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {expenses.length > 0 ? `${expenses.length} khoản chi tiêu` : 'Chưa có khoản chi tiêu'}
          {totalApproved > 0 && <span className="ml-2 text-emerald-600 font-medium">· Đã duyệt: {formatVND(totalApproved)}</span>}
        </p>
        <Link href={`/dashboard/science/finance/expenses?projectId=${projectId}`}
          className="text-xs text-violet-600 hover:underline flex items-center gap-1">
          Xem tất cả →
        </Link>
      </div>
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
          <Receipt className="h-8 w-8 opacity-30" />
          <p className="text-sm">Chưa có khoản chi tiêu nào cho đề tài này.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tiêu đề</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Hạng mục</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Ngày</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Số tiền</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">{e.title}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{new Date(e.expenseDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatVND(e.amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EXPENSE_STATUS_BADGE[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {EXPENSE_STATUS_LABELS[e.status] ?? e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 7: Tài trợ (Grants) ──────────────────────────────────────────────────

interface Grant {
  id: string;
  grantCode: string;
  grantor: string;
  title: string;
  amount: string;
  disbursedAmount: string;
  status: string;
}

const GRANT_STATUS_LABELS: Record<string, string> = {
  PENDING:   'Chờ duyệt',
  ACTIVE:    'Đang hoạt động',
  CLOSED:    'Đã đóng',
  CANCELLED: 'Huỷ',
};

const GRANT_STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  CLOSED:    'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

function GrantsTab({ projectId }: { projectId: string }) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/finance/grants?projectId=${projectId}&pageSize=50`)
      .then(r => r.json())
      .then((res) => setGrants(res.success ? (res.data?.items ?? res.data ?? []) : []))
      .catch(() => toast.error('Lỗi tải tài trợ'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-8 text-gray-400 text-sm">Đang tải...</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{grants.length > 0 ? `${grants.length} khoản tài trợ` : 'Chưa có khoản tài trợ'}</p>
      {grants.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
          <Landmark className="h-8 w-8 opacity-30" />
          <p className="text-sm">Chưa có khoản tài trợ nào cho đề tài này.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Mã tài trợ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Nhà tài trợ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tên gói</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Tổng trị giá</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Đã giải ngân</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-violet-700 font-medium">{g.grantCode}</td>
                    <td className="px-4 py-2.5 text-gray-800">{g.grantor}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs max-w-[200px] truncate">{g.title}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatVND(g.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{formatVND(g.disbursedAmount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRANT_STATUS_BADGE[g.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {GRANT_STATUS_LABELS[g.status] ?? g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClass =
    color === 'violet'  ? 'text-violet-700' :
    color === 'emerald' ? 'text-emerald-600' :
    color === 'amber'   ? 'text-amber-600' :
    color === 'red'     ? 'text-red-600' :
    'text-gray-600';
  return (
    <div className="rounded-lg border bg-white p-3 text-center">
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [budget,    setBudget]    = useState<BudgetDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('plan');

  const loadBudget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/budgets/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBudget(json.data);
    } catch {
      toast.error('Không thể tải thông tin ngân sách');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  if (loading) return <div className="flex justify-center py-16 text-gray-400 text-sm">Đang tải...</div>;
  if (!budget) return <div className="flex justify-center py-16 text-red-400 text-sm">Không tìm thấy ngân sách</div>;

  const pct = spendPct(budget.totalApproved, budget.totalSpent);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/science/activities/budgets" className="hover:text-violet-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Danh sách ngân sách
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{budget.project.projectCode}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[budget.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[budget.status] ?? budget.status}
            </span>
            <span className="text-xs text-gray-400">{budget.year}</span>
            {pct >= 100 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> Vượt ngân sách
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mt-1">{budget.project.title}</h1>
          <p className="text-sm text-gray-500">{budget.project.projectCode}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadBudget} className="gap-1 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      <Tabs active={activeTab} onChange={setActiveTab} />

      <div className="pt-1">
        {activeTab === 'plan'           && <PlanTab           budget={budget} onRefresh={loadBudget} />}
        {activeTab === 'approval'       && <ApprovalTab       budget={budget} onRefresh={loadBudget} />}
        {activeTab === 'disbursement'   && <DisbursementTab   budget={budget} onRefresh={loadBudget} />}
        {activeTab === 'tracking'       && <TrackingTab       budget={budget} />}
        {activeTab === 'purchase-orders'&& <PurchaseOrdersTab projectId={budget.project.id} />}
        {activeTab === 'expenses'       && <ExpensesTab       projectId={budget.project.id} />}
        {activeTab === 'grants'         && <GrantsTab         projectId={budget.project.id} />}
      </div>
    </div>
  );
}
