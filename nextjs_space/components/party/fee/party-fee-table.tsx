'use client';

import { CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeeItem {
  id: string;
  paymentMonth: string;
  partyMemberName?: string;
  organizationName?: string;
  expectedAmount?: number;
  actualAmount?: number;
  debtAmount?: number;
  status?: string;
  paymentDate?: string | null;
  note?: string | null;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface PartyFeeTableProps {
  items: FeeItem[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PAID: {
    label: 'Đã nộp đủ',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  PARTIAL: {
    label: 'Nộp thiếu',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  UNPAID: {
    label: 'Chưa nộp',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-50 text-red-600 border border-red-200',
  },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status || ''] || STATUS_CONFIG.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function fmt(v?: number) {
  return Number(v || 0).toLocaleString('vi-VN') + ' đ';
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export function PartyFeeTable({ items, pagination, onPageChange }: PartyFeeTableProps) {
  const { page = 1, totalPages = 1, total = 0 } = pagination || {};

  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-slate-400 font-medium text-sm">Chưa có dữ liệu đảng phí</p>
        <p className="text-slate-300 text-xs">Thử thay đổi bộ lọc hoặc tạo phí tự động</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tháng</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Đảng viên</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổ chức</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Phải nộp</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Đã nộp</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Còn nợ</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày nộp</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((x) => (
                <tr key={x.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                      {x.paymentMonth}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {x.partyMemberName?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-slate-800 text-sm">{x.partyMemberName || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm">{x.organizationName || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-700 text-sm">{fmt(x.expectedAmount)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-green-600 font-semibold text-sm">{fmt(x.actualAmount)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-red-500 text-sm">
                    {Number(x.debtAmount || 0) > 0 ? fmt(x.debtAmount) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-sm">{fmtDate(x.paymentDate)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={x.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-400">
            Trang <strong className="text-slate-600">{page}</strong> / {totalPages}
            &nbsp;·&nbsp;
            <strong className="text-slate-600">{total}</strong> bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-200"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p =
                totalPages <= 5
                  ? i + 1
                  : page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                  ? totalPages - 4 + i
                  : page - 2 + i;
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 w-8 p-0 text-xs ${
                    page === p ? 'bg-red-600 hover:bg-red-700 border-red-600' : 'border-slate-200'
                  }`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-200"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
