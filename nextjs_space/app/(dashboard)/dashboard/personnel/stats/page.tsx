'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCheck,
  UserMinus,
  Building2,
  GraduationCap,
  RefreshCw,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';

// Custom label render for PieChart - Hiển thị đẹp hơn
const renderCustomLabel = (entry: any) => {
  const name = entry.label || entry.name || entry.gender || '';
  const pct = entry.percent ? (entry.percent * 100).toFixed(0) : '0';
  // Chỉ hiển thị nếu phần trăm > 5% để tránh chồng chéo
  if (parseFloat(pct) < 5) return '';
  return `${name} (${pct}%)`;
};

// Custom label cho Bar Chart - Không bị cắt
const renderBarLabel = (entry: any) => {
  return entry.count > 0 ? entry.count : '';
};

// Custom tooltip formatter - Hiển thị rõ ràng tiếng Việt
const tooltipFormatter = (value: any) => {
  return [`${value} người`, 'Số lượng'];
};

// Tooltip content cho biểu đồ với tiêu đề đầy đủ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold">{payload[0].value} người</p>
      </div>
    );
  }
  return null;
};

interface StatsData {
  summary: {
    total: number;
    active: number;
    retired: number;
    transferred: number;
    suspended: number;
    resigned: number;
    totalUnits: number;
  };
  byWorkStatus: { status: string; count: number; label: string }[];
  byPersonnelType: { type: string; count: number; label: string }[];
  byRank: { rank: string; count: number }[];
  byEducationLevel: { level: string; count: number }[];
  byGender: { gender: string; count: number }[];
  byUnit: { unitId: string; unitName: string; unitCode: string; count: number }[];
  byRole: { role: string; count: number; label: string }[];
  ageDistribution: { range: string; count: number }[];
}

// Enhanced color palette with better contrast
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  RETIRED: '#6b7280',
  TRANSFERRED: '#3b82f6',
  SUSPENDED: '#f59e0b',
  RESIGNED: '#ef4444',
};

// Enhanced dark mode compatible colors
const CHART_THEME = {
  grid: 'rgba(148, 163, 184, 0.2)',
  text: 'hsl(var(--foreground))',
  background: 'hsl(var(--card))',
};

export default function PersonnelStatsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/personnel/stats');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi tải dữ liệu');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router, fetchStats]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const lines: string[] = [];
      
      lines.push('THỐNG KÊ CƠ CẤU CÁN BỘ HVHC');
      lines.push('');
      lines.push('TỔNG QUAN');
      lines.push(`Tổng số cán bộ,${stats?.summary.total}`);
      lines.push(`Đang công tác,${stats?.summary.active}`);
      lines.push(`Nghỉ hưu,${stats?.summary.retired}`);
      lines.push(`Đã chuyển,${stats?.summary.transferred}`);
      lines.push(`Tạm nghỉ,${stats?.summary.suspended}`);
      lines.push(`Đã nghỉ việc,${stats?.summary.resigned}`);
      lines.push('');
      
      lines.push('THEO LOẠI CÁN BỘ');
      stats?.byPersonnelType.forEach(item => {
        lines.push(`${item.label},${item.count}`);
      });
      lines.push('');
      
      lines.push('THEO CẤP BẬC');
      stats?.byRank.forEach(item => {
        lines.push(`${item.rank},${item.count}`);
      });
      lines.push('');
      
      lines.push('THEO HỌC VỊ');
      stats?.byEducationLevel.forEach(item => {
        lines.push(`${item.level},${item.count}`);
      });
      lines.push('');
      
      lines.push('THEO ĐƠN VỊ (TOP 10)');
      stats?.byUnit.forEach(item => {
        lines.push(`${item.unitName},${item.count}`);
      });
      
      const BOM = '\uFEFF';
      const csvContent = BOM + lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ThongKe_CanBo_HVHC_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchStats} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/personnel">
            <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-slate-100 dark:via-slate-300 dark:to-slate-200 bg-clip-text text-transparent">
              Thống kê Cơ cấu Cán bộ
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Phân tích chi tiết cơ cấu nhân sự HVHC</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStats} variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button 
            onClick={handleExportExcel} 
            size="sm" 
            disabled={exporting}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {exporting ? 'Xuất...' : 'Xuất Excel'}
          </Button>
        </div>
      </div>

      {/* Enhanced KPI Cards with better contrast */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.summary.total}</span>
            </div>
            <p className="text-xs mt-2 font-medium opacity-90">Tổng cán bộ</p>
          </CardContent>
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        </Card>
        
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <UserCheck className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.summary.active}</span>
            </div>
            <p className="text-xs mt-2 font-medium opacity-90">Đang công tác</p>
          </CardContent>
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        </Card>
        
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <UserMinus className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.summary.retired}</span>
            </div>
            <p className="text-xs mt-2 font-medium opacity-90">Nghỉ hưu</p>
          </CardContent>
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        </Card>
        
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.summary.totalUnits}</span>
            </div>
            <p className="text-xs mt-2 font-medium opacity-90">Đơn vị</p>
          </CardContent>
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        </Card>
        
        {stats.byEducationLevel.slice(0, 4).map((edu, idx) => {
          const gradients = [
            'from-violet-500 to-violet-600 shadow-violet-500/20',
            'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
            'from-cyan-500 to-cyan-600 shadow-cyan-500/20',
            'from-teal-500 to-teal-600 shadow-teal-500/20'
          ];
          return (
            <Card key={edu.level} className={`relative overflow-hidden border-0 bg-gradient-to-br ${gradients[idx]} text-white shadow-lg`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-8 h-8 opacity-80" />
                  <span className="text-2xl font-bold">{edu.count}</span>
                </div>
                <p className="text-xs mt-2 font-medium opacity-90 truncate" title={edu.level}>{edu.level}</p>
              </CardContent>
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 - Enhanced with dark mode support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 shadow-lg">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Phân bố theo Loại cán bộ</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Sĩ quan, QNCN, CNVCQP, Giảng viên...</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byPersonnelType}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {stats.byPersonnelType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={tooltipFormatter} 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 shadow-lg">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Trạng thái công tác</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Đang làm, nghỉ hưu, chuyển đơn vị...</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byWorkStatus}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {stats.byWorkStatus.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[item.status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={tooltipFormatter} 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố theo Cấp bậc</CardTitle>
            <CardDescription>Từ Tướng đến Binh sĩ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byRank} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="rank" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố theo Học vị</CardTitle>
            <CardDescription>Tiến sĩ, Thạc sĩ, Cử nhân...</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byEducationLevel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Đơn vị theo Quân số</CardTitle>
            <CardDescription>Những đơn vị có nhiều cán bộ nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.byUnit} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="unitName" 
                  type="category" 
                  width={180}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) => {
                    // Rút gọn nếu quá dài
                    return value.length > 25 ? value.substring(0, 22) + '...' : value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố theo Độ tuổi</CardTitle>
            <CardDescription>Cơ cấu tuổi cán bộ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gender & Role Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố theo Giới tính</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byGender}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={renderCustomLabel}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố theo Vai trò Hệ thống</CardTitle>
            <CardDescription>Quyền truy cập trong hệ thống BigData</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byRole} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
