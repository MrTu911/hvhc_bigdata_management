'use client';

/**
 * M20 Finance — Tổng quan Tài chính NCKH
 * KPI: tổng ngân sách, đã chi, còn lại, số PO/Invoice/Expense đang chờ duyệt
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  ShoppingCart,
  Receipt,
  Coins,
  HandCoins,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AcademySummary {
  year: number;
  budgets: { count: number; totalApproved: string; totalSpent: string };
  invoicesPaid: { count: number; total: string };
  expensesApproved: { count: number; total: string };
  grants: { count: number; total: string };
}

function formatVND(val: string | number): string {
  const n = typeof val === 'string' ? Number(val) : val;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
  return n.toLocaleString('vi-VN');
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function ScienceFinancePage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [summary, setSummary] = useState<AcademySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/finance/summary?year=${year}`);
      const json = await res.json();
      if (json.success) setSummary(json.data);
      else toast.error('Không tải được dữ liệu');
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [year]);

  const spentPct = summary
    ? Math.min(
        100,
        Math.round((Number(summary.budgets.totalSpent) / Math.max(1, Number(summary.budgets.totalApproved))) * 100)
      )
    : 0;

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tài chính NCKH</h1>
          <p className="text-sm text-muted-foreground mt-1">Tổng hợp ngân sách, chi tiêu và tài trợ</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-gray-100 rounded" /></Card>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Tổng ngân sách duyệt"
              value={`${formatVND(summary.budgets.totalApproved)} ₫`}
              subtitle={`${summary.budgets.count} đề tài`}
              icon={Wallet}
              color="bg-emerald-600"
              href="/dashboard/science/budgets"
            />
            <KpiCard
              title="Đã chi (Invoice + Expense)"
              value={`${formatVND(summary.budgets.totalSpent)} ₫`}
              subtitle={`${spentPct}% ngân sách`}
              icon={TrendingUp}
              color="bg-blue-600"
            />
            <KpiCard
              title="Hóa đơn đã thanh toán"
              value={`${formatVND(summary.invoicesPaid.total)} ₫`}
              subtitle={`${summary.invoicesPaid.count} hóa đơn`}
              icon={Receipt}
              color="bg-cyan-600"
              href="/dashboard/science/finance/invoices"
            />
            <KpiCard
              title="Tài trợ / Grant"
              value={`${formatVND(summary.grants.total)} ₫`}
              subtitle={`${summary.grants.count} grant`}
              icon={HandCoins}
              color="bg-green-600"
              href="/dashboard/science/finance/grants"
            />
          </div>

          {/* Budget progress bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mức sử dụng ngân sách</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Đã chi</span>
                <span className={spentPct > 90 ? 'text-red-600 font-semibold' : 'font-medium'}>
                  {spentPct}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    spentPct > 90 ? 'bg-red-500' : spentPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>
              {spentPct > 85 && (
                <p className="flex items-center gap-1 text-sm text-amber-600 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  Ngân sách đã sử dụng &gt; 85% — kiểm tra trước khi phê duyệt thêm
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Không có dữ liệu</CardContent></Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Đề nghị Mua sắm', href: '/dashboard/science/finance/purchase-orders', icon: ShoppingCart, desc: 'PO theo đề tài' },
          { label: 'Hóa đơn', href: '/dashboard/science/finance/invoices', icon: Receipt, desc: 'Thanh toán hóa đơn' },
          { label: 'Chi tiêu', href: '/dashboard/science/finance/expenses', icon: Coins, desc: 'Khoản chi thực tế' },
          { label: 'Tài trợ', href: '/dashboard/science/finance/grants', icon: HandCoins, desc: 'Grant & giải ngân' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <item.icon className="h-8 w-8 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
