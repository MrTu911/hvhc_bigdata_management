'use client';

import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';

interface DebtSummary {
  expectedTotal?: number;
  actualTotal?: number;
  debtTotal?: number;
  paidCount?: number;
  partialCount?: number;
  unpaidCount?: number;
}

export function DebtSummaryCard({ summary }: { summary: DebtSummary | null }) {
  const s = summary || {};
  const expected = Number(s.expectedTotal || 0);
  const actual = Number(s.actualTotal || 0);
  const debt = Number(s.debtTotal || 0);
  const paid = Number(s.paidCount || 0);
  const partial = Number(s.partialCount || 0);
  const unpaid = Number(s.unpaidCount || 0);
  const total = paid + partial + unpaid;
  const collectionRate = expected > 0 ? Math.round((actual / expected) * 100) : 0;

  const fmt = (v: number) => v.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tổng phải thu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phải thu</span>
          <div className="p-1.5 rounded-lg bg-blue-50">
            <Users className="h-3.5 w-3.5 text-blue-500" />
          </div>
        </div>
        <p className="text-xl font-bold text-slate-800">{fmt(expected)}</p>
        <p className="text-xs text-slate-400 mt-1">{total} bản ghi trong kỳ</p>
      </div>

      {/* Đã thu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Đã thu</span>
          <div className="p-1.5 rounded-lg bg-green-50">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          </div>
        </div>
        <p className="text-xl font-bold text-green-600">{fmt(actual)}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ '--collection-rate': `${Math.min(collectionRate, 100)}%`, width: 'var(--collection-rate)' } as React.CSSProperties}
            />
          </div>
          <span className="text-xs font-semibold text-green-600">{collectionRate}%</span>
        </div>
      </div>

      {/* Tổng nợ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Còn nợ</span>
          <div className="p-1.5 rounded-lg bg-red-50">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
        <p className="text-xl font-bold text-red-600">{fmt(debt)}</p>
        <p className="text-xs text-slate-400 mt-1">{unpaid + partial} đảng viên chưa nộp đủ</p>
      </div>

      {/* Trạng thái đóng phí */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</span>
          <div className="p-1.5 rounded-lg bg-slate-50">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-600">{paid}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5 text-green-500" /> Đã nộp
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-amber-600">{partial}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 text-amber-500" /> Thiếu
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-red-500">{unpaid}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5 text-red-500" /> Chưa nộp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
