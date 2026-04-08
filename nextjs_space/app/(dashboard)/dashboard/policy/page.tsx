'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, ArrowRight, Bell, Shield, Folder, TrendingUp,
  ChevronRight, BarChart2, ListFilter,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  DRAFT:        { label: 'Nháp',           color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200',  dot: '#94A3B8' },
  SUBMITTED:    { label: 'Đã trình',        color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: '#3B82F6' },
  UNDER_REVIEW: { label: 'Đang xét duyệt', color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: '#F59E0B' },
  APPROVED:     { label: 'Đã duyệt',        color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200',dot: '#10B981' },
  REJECTED:     { label: 'Từ chối',         color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    dot: '#EF4444' },
  CANCELLED:    { label: 'Đã hủy',          color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200',  dot: '#94A3B8' },
  COMPLETED:    { label: 'Hoàn thành',      color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',   dot: '#14B8A6' },
};

const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const BAR_COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316'];

// ── Types ──────────────────────────────────────────────────────────────────

interface ApiData {
  year: number;
  summary: {
    totalCategories: number;
    totalRequests: number;
    totalRequestedAmount: number;
    totalApprovedAmount: number;
  };
  requestsByStatus: { status: string; label: string; count: number }[];
  requestsByCategory: { categoryId: string; categoryName: string; count: number }[];
  monthlyData: { month: number; total: number; byStatus: Record<string, number> }[];
  recentRequests: {
    id: string; requestNumber: string; title: string;
    status: string; statusLabel: string;
    requester: { name: string };
    category: { name: string };
    createdAt: string;
  }[];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PolicyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiData | null>(null);
  const [insuranceCount, setInsuranceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  async function fetchData(year = activeYear) {
    setLoading(true);
    try {
      const [statsRes, insRes] = await Promise.all([
        fetch(`/api/policy/stats?year=${year}`),
        fetch('/api/insurance/stats'),
      ]);
      if (statsRes.ok) setData(await statsRes.json());
      if (insRes.ok) {
        const ins = await insRes.json();
        setInsuranceCount(ins.summary?.totalInsuranceInfo ?? 0);
      }
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(activeYear); }, [activeYear]);

  // ── Derived values ─────────────────────────────────────────────────────

  const statusMap = Object.fromEntries((data?.requestsByStatus ?? []).map(s => [s.status, s.count]));
  const totalRequests   = data?.summary.totalRequests ?? 0;
  const submittedCount  = (statusMap['SUBMITTED'] ?? 0) + (statusMap['UNDER_REVIEW'] ?? 0);
  const approvedCount   = statusMap['APPROVED'] ?? 0;
  const rejectedCount   = statusMap['REJECTED'] ?? 0;
  const approvalRate    = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;

  const pieData = (data?.requestsByStatus ?? []).map(s => ({
    name: STATUS_CONFIG[s.status]?.label ?? s.label,
    value: s.count,
    color: STATUS_CONFIG[s.status]?.dot ?? '#94A3B8',
  })).filter(d => d.value > 0);

  const barMonthData = (data?.monthlyData ?? []).map(m => ({
    name: MONTH_LABELS[m.month - 1],
    total: m.total,
  })).filter(m => m.total > 0);

  const categoryData = (data?.requestsByCategory ?? [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-72" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 shadow-md shadow-blue-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">CSDL Chính sách</h1>
              <p className="text-sm text-slate-500">Quản lý yêu cầu chính sách, chế độ và phúc lợi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Year tabs */}
            <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              {yearOptions.map(y => (
                <button key={y} onClick={() => setActiveYear(y)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeYear === y ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  {y}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9 border-slate-200 bg-white" onClick={() => fetchData(activeYear)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 shadow-sm"
              onClick={() => router.push('/dashboard/policy/requests/new')}>
              <Plus className="h-4 w-4 mr-1.5" /> Tạo yêu cầu
            </Button>
          </div>
        </div>

        {/* ── Pending alert banner ────────────────────────────────────── */}
        {submittedCount > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-amber-100">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-amber-800">
                Có <strong>{submittedCount}</strong> yêu cầu đang chờ xét duyệt
              </p>
            </div>
            <Button variant="outline" size="sm"
              className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100 text-xs flex-shrink-0"
              onClick={() => router.push('/dashboard/policy/approval')}>
              Duyệt ngay <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        {/* ── KPI cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Tổng yêu cầu', value: totalRequests, sub: `Năm ${activeYear}`,
              icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              accent: 'border-l-4 border-blue-500',
            },
            {
              label: 'Chờ xét duyệt', value: submittedCount, sub: 'Cần xử lý',
              icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
              accent: 'border-l-4 border-amber-500',
            },
            {
              label: 'Đã phê duyệt', value: approvedCount, sub: `Tỷ lệ ${approvalRate}%`,
              icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              accent: 'border-l-4 border-emerald-500',
            },
            {
              label: 'BHXH quản lý', value: insuranceCount, sub: 'Người tham gia',
              icon: Shield, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600',
              accent: 'border-l-4 border-cyan-500',
            },
          ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, accent }) => (
            <Card key={label} className={`bg-white shadow-sm border-slate-200 ${accent} rounded-xl`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{value.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Charts row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Status donut */}
          <Card className="bg-white shadow-md border-slate-200 rounded-xl">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-slate-400" /> Trạng thái yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                        formatter={(v: any, n: any) => [`${v} yêu cầu`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-slate-600">{d.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>

          {/* Monthly bar */}
          <Card className="bg-white shadow-md border-slate-200 rounded-xl">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" /> Yêu cầu theo tháng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {barMonthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barMonthData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                      formatter={(v: any) => [`${v} yêu cầu`, 'Số lượng']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3B82F6" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu theo tháng</div>
              )}
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card className="bg-white shadow-md border-slate-200 rounded-xl">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-slate-400" /> Theo danh mục
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {categoryData.length > 0 ? (
                <div className="space-y-3 mt-1">
                  {categoryData.map((c, i) => {
                    const pct = totalRequests > 0 ? Math.round((c.count / totalRequests) * 100) : 0;
                    return (
                      <div key={c.categoryId}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 truncate max-w-[70%]">{c.categoryName}</span>
                          <span className="font-semibold text-slate-700 flex-shrink-0">{c.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom row: recent requests + quick links ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent requests */}
          <Card className="lg:col-span-2 bg-white shadow-md border-slate-200 rounded-xl">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">Yêu cầu gần đây</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-slate-500 h-7"
                onClick={() => router.push('/dashboard/policy/requests')}>
                Xem tất cả <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {(data?.recentRequests ?? []).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Chưa có yêu cầu nào</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(data?.recentRequests ?? []).slice(0, 6).map(req => {
                    const st = STATUS_CONFIG[req.status] ?? STATUS_CONFIG['DRAFT'];
                    return (
                      <div key={req.id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/policy/requests`)}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                          {req.status === 'APPROVED'  && <CheckCircle className={`h-4 w-4 ${st.color}`} />}
                          {req.status === 'REJECTED'  && <XCircle className={`h-4 w-4 ${st.color}`} />}
                          {req.status === 'SUBMITTED' && <Clock className={`h-4 w-4 ${st.color}`} />}
                          {!['APPROVED','REJECTED','SUBMITTED'].includes(req.status) && <FileText className={`h-4 w-4 ${st.color}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{req.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {req.requestNumber} · {req.category?.name} · {req.requester?.name}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${st.color} ${st.bg} ${st.border}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card className="bg-white shadow-md border-slate-200 rounded-xl">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 space-y-2">
              {[
                { label: 'Danh mục chính sách',  href: '/dashboard/policy/categories', icon: Folder,       color: 'text-blue-500',    bg: 'bg-blue-50',    count: data?.summary.totalCategories },
                { label: 'Đề nghị chính sách',   href: '/dashboard/policy/requests',   icon: FileText,     color: 'text-indigo-500',  bg: 'bg-indigo-50',  count: totalRequests },
                { label: 'Phê duyệt yêu cầu',    href: '/dashboard/policy/approval',   icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50', count: submittedCount, urgent: submittedCount > 0 },
                { label: 'Kỷ luật',               href: '/dashboard/policy/discipline', icon: AlertCircle,  color: 'text-rose-500',    bg: 'bg-rose-50' },
                { label: 'Thi đua khen thưởng',   href: '/dashboard/emulation',         icon: CheckCircle,  color: 'text-amber-500',   bg: 'bg-amber-50' },
                { label: 'Bảo hiểm xã hội',       href: '/dashboard/insurance',         icon: Shield,       color: 'text-cyan-500',    bg: 'bg-cyan-50',    count: insuranceCount },
              ].map(({ label, href, icon: Icon, color, bg, count, urgent }) => (
                <button key={href} onClick={() => router.push(href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group text-left">
                  <div className={`p-1.5 rounded-lg ${bg} flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium flex-1">{label}</span>
                  {count !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
