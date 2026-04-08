/**
 * Insurance Overview Dashboard - Tổng quan BHXH
 * Thống kê toàn diện về Bảo hiểm Xã hội của toàn học viện
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Heart,
  FileText,
  Calendar,
  AlertCircle,
  Building2,
  UserCheck,
  Clock,
  ChevronRight,
  Gift,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import Link from 'next/link';

interface InsuranceStats {
  year: number;
  summary: {
    totalInsuranceInfo: number;
    totalContributions: { amount: number; employeeShare: number; employerShare: number; count: number };
    totalBenefits: { amount: number; count: number };
    totalDependents: number;
    totalClaims: number;
    pendingClaims: number;
    medicalFacilities: number;
    expiringInsurance: number;
  };
  monthlyContributions: { month: number; amount: number; count: number }[];
  benefitsByType: { type: string; label: string; amount: number; count: number }[];
  dependentsByRelationship: { relationship: string; label: string; count: number }[];
  claimsByStatus: { status: string; label: string; count: number; amount: number }[];
  claimsByType: { type: string; label: string; count: number; amount: number }[];
  byUnit: { unitName: string; unitId: string; insuranceCount: number; dependentCount: number; totalContributions: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNumber = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function InsuranceOverviewPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<InsuranceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchStats(); }, [year]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/insurance/stats?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}</div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const s = stats?.summary;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Tổng quan Bảo hiểm Xã hội"
        description="Thống kê và quản lý BHXH toàn học viện"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>Năm {y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchStats}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        }
      />

      {/* Alert Banner */}
      {s && s.pendingClaims > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-100">
                Có {s.pendingClaims} yêu cầu chế độ đang chờ xử lý
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/insurance/claims?status=PENDING">Xem ngay <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {s && s.expiringInsurance > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-100">
                Có {s.expiringInsurance} thẻ BHYT sắp hết hạn (trong 30 ngày)
              </span>
            </div>
            <Button variant="outline" size="sm">Kiểm tra <ChevronRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Đối tượng tham gia</p>
                <p className="text-3xl font-bold">{formatNumber(s?.totalInsuranceInfo || 0)}</p>
              </div>
              <UserCheck className="h-10 w-10 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng đóng góp</p>
                <p className="text-2xl font-bold">{formatCurrency(s?.totalContributions.amount || 0)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Tổng quyền lợi</p>
                <p className="text-2xl font-bold">{formatCurrency(s?.totalBenefits.amount || 0)}</p>
              </div>
              <Gift className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Người phụ thuộc</p>
                <p className="text-3xl font-bold">{formatNumber(s?.totalDependents || 0)}</p>
              </div>
              <Users className="h-10 w-10 text-pink-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Yêu cầu chế độ</p>
                <p className="text-3xl font-bold">{formatNumber(s?.totalClaims || 0)}</p>
              </div>
              <FileText className="h-10 w-10 text-amber-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Cơ sở KCB</p>
                <p className="text-3xl font-bold">{formatNumber(s?.medicalFacilities || 0)}</p>
              </div>
              <Building2 className="h-10 w-10 text-teal-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="contributions">Đóng góp</TabsTrigger>
          <TabsTrigger value="benefits">Quyền lợi</TabsTrigger>
          <TabsTrigger value="units">Đơn vị</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dependents by Relationship */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Người phụ thuộc theo quan hệ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.dependentsByRelationship || []}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="count" nameKey="label" label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(stats?.dependentsByRelationship || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Claims by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Yêu cầu chế độ theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.claimsByStatus || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="label" width={100} />
                      <Tooltip formatter={(v: any) => formatNumber(v)} />
                      <Bar dataKey="count" fill="#3b82f6" name="Số lượng" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/insurance/contributions">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <DollarSign className="h-10 w-10 text-blue-500 mb-2" />
                  <p className="font-medium">Quản lý Đóng góp</p>
                  <p className="text-sm text-muted-foreground">{s?.totalContributions.count || 0} bản ghi</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/insurance/benefits">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <Gift className="h-10 w-10 text-purple-500 mb-2" />
                  <p className="font-medium">Quyền lợi BHXH</p>
                  <p className="text-sm text-muted-foreground">{s?.totalBenefits.count || 0} lượt hưởng</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/insurance/dependents">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <Users className="h-10 w-10 text-pink-500 mb-2" />
                  <p className="font-medium">Người phụ thuộc</p>
                  <p className="text-sm text-muted-foreground">{s?.totalDependents || 0} người</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/insurance/claims">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <FileText className="h-10 w-10 text-amber-500 mb-2" />
                  <p className="font-medium">Yêu cầu Chế độ</p>
                  <p className="text-sm text-muted-foreground">{s?.pendingClaims || 0} chờ duyệt</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đóng góp BHXH theo tháng - Năm {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyContributions || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(v) => `T${v}`} />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={(v) => `Tháng ${v}`} />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#93c5fd" name="Số tiền" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Phần người lao động (10.5%)</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(s?.totalContributions.employeeShare || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Phần đơn vị (21.5%)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(s?.totalContributions.employerShare || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Tổng cộng (32%)</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(s?.totalContributions.amount || 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benefits by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quyền lợi theo loại chế độ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.benefitsByType || []}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="amount" nameKey="label"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(stats?.benefitsByType || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Claims by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Yêu cầu theo loại chế độ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.claimsByType || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v: any) => formatNumber(v)} />
                      <Bar dataKey="count" fill="#f59e0b" name="Số yêu cầu" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết quyền lợi theo loại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(stats?.benefitsByType || []).map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="font-medium">{b.label}</span>
                      <Badge variant="outline">{b.count} lượt</Badge>
                    </div>
                    <span className="font-semibold text-green-600">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thống kê BHXH theo Đơn vị</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Đơn vị</th>
                      <th className="text-right py-3 px-2">Đối tượng BH</th>
                      <th className="text-right py-3 px-2">Người PT</th>
                      <th className="text-right py-3 px-2">Tổng đóng góp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.byUnit || []).map((u, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{u.unitName}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(u.insuranceCount)}</td>
                        <td className="py-3 px-2 text-right">{formatNumber(u.dependentCount)}</td>
                        <td className="py-3 px-2 text-right font-semibold text-green-600">{formatCurrency(u.totalContributions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
