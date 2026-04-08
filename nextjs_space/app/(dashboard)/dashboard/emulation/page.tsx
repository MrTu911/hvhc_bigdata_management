/**
 * Emulation & Rewards Overview Dashboard
 * Tổng quan CSDL Thi đua Khen thưởng
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Trophy,
  Medal,
  Star,
  Award,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  Calendar,
  Crown,
  Target,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

interface RewardStats {
  totalRewards: number;
  bangKhen: number;
  giayKhen: number;
  chienSiThiDua: number;
  chienSiTienTien: number;
  byUnit: { unitName: string; count: number; level: number }[];
  byYear: { year: number; count: number }[];
  byType: { name: string; value: number; color: string }[];
  recentRewards: {
    id: string;
    userId: string;
    userName: string;
    unitName: string;
    rewardType: string;
    year: number;
    decisionDate: string;
  }[];
  topUnits: { unitName: string; count: number; percentage: number }[];
}

interface Unit {
  id: string;
  name: string;
  code: string;
  level: number;
}

const REWARD_TYPES = [
  { value: 'BANG_KHEN', label: 'Bằng khen', color: '#f59e0b' },
  { value: 'GIAY_KHEN', label: 'Giấy khen', color: '#3b82f6' },
  { value: 'CHIEN_SI_THI_DUA', label: 'Chiến sĩ thi đua', color: '#ef4444' },
  { value: 'CHIEN_SI_TIEN_TIEN', label: 'Chiến sĩ tiên tiến', color: '#10b981' },
];

const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

const defaultStats: RewardStats = {
  totalRewards: 0,
  bangKhen: 0,
  giayKhen: 0,
  chienSiThiDua: 0,
  chienSiTienTien: 0,
  byUnit: [],
  byYear: [],
  byType: [],
  recentRewards: [],
  topUnits: [],
};

export default function EmulationOverviewPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<RewardStats>(defaultStats);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitLevel, setSelectedUnitLevel] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();
    fetchUnits();
  }, [selectedYear, selectedUnitLevel]);

  async function fetchUnits() {
    try {
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedUnitLevel !== 'all' && { unitLevel: selectedUnitLevel })
      });

      const res = await fetch(`/api/emulation/stats?${params}`);

      if (res.ok) {
        const data = await res.json();
        setStats({
          ...defaultStats,
          ...data.data,
        });
      } else {
        // Use demo data if API not available
        setStats({
          totalRewards: 156,
          bangKhen: 25,
          giayKhen: 45,
          chienSiThiDua: 38,
          chienSiTienTien: 48,
          byUnit: [
            { unitName: 'Khoa CNTT', count: 28, level: 2 },
            { unitName: 'Khoa KTĐT', count: 22, level: 2 },
            { unitName: 'Khoa QTKD', count: 18, level: 2 },
            { unitName: 'Phòng ĐT', count: 15, level: 2 },
            { unitName: 'Phòng TCHC', count: 12, level: 2 },
          ],
          byYear: [
            { year: 2023, count: 120 },
            { year: 2024, count: 145 },
            { year: 2025, count: 156 },
            { year: 2026, count: 65 },
          ],
          byType: [
            { name: 'Bằng khen', value: 25, color: '#f59e0b' },
            { name: 'Giấy khen', value: 45, color: '#3b82f6' },
            { name: 'CS Thi đua', value: 38, color: '#ef4444' },
            { name: 'CS Tiên tiến', value: 48, color: '#10b981' },
          ],
          recentRewards: [
            { id: '1', userId: 'u1', userName: 'Nguyễn Văn A', unitName: 'Khoa CNTT', rewardType: 'CHIEN_SI_THI_DUA', year: 2026, decisionDate: '2026-01-15' },
            { id: '2', userId: 'u2', userName: 'Trần Văn B', unitName: 'Khoa KTĐT', rewardType: 'BANG_KHEN', year: 2026, decisionDate: '2026-01-20' },
            { id: '3', userId: 'u3', userName: 'Lê Thị C', unitName: 'Phòng ĐT', rewardType: 'GIAY_KHEN', year: 2026, decisionDate: '2026-02-01' },
          ],
          topUnits: [
            { unitName: 'Khoa CNTT', count: 28, percentage: 18 },
            { unitName: 'Khoa KTĐT', count: 22, percentage: 14 },
            { unitName: 'Khoa QTKD', count: 18, percentage: 12 },
            { unitName: 'Phòng ĐT', count: 15, percentage: 10 },
            { unitName: 'Phòng TCHC', count: 12, percentage: 8 },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const getRewardTypeLabel = (type: string) => {
    const found = REWARD_TYPES.find(r => r.value === type);
    return found?.label || type;
  };

  const getRewardTypeBadge = (type: string) => {
    const found = REWARD_TYPES.find(r => r.value === type);
    const colorMap: Record<string, string> = {
      'BANG_KHEN': 'bg-amber-100 text-amber-800',
      'GIAY_KHEN': 'bg-blue-100 text-blue-800',
      'CHIEN_SI_THI_DUA': 'bg-red-100 text-red-800',
      'CHIEN_SI_TIEN_TIEN': 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-100 text-gray-800'} border-0`}>
        {found?.label || type}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            Tổng quan CSDL Thi đua Khen thưởng
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và thống kê các hình thức khen thưởng theo đơn vị
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/dashboard/emulation/rewards/create')} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Thêm khen thưởng
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Tổng khen thưởng</p>
                <p className="text-3xl font-bold">{stats.totalRewards}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Bằng khen</p>
                <p className="text-3xl font-bold">{stats.bangKhen}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Giấy khen</p>
                <p className="text-3xl font-bold">{stats.giayKhen}</p>
              </div>
              <Medal className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">CS Thi đua</p>
                <p className="text-3xl font-bold">{stats.chienSiThiDua}</p>
              </div>
              <Star className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">CS Tiên tiến</p>
                <p className="text-3xl font-bold">{stats.chienSiTienTien}</p>
              </div>
              <Award className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="by-unit">Theo đơn vị</TabsTrigger>
          <TabsTrigger value="by-type">Theo loại</TabsTrigger>
          <TabsTrigger value="recent">Gần đây</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart - By Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phân bố theo loại hình</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byType}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {stats.byType.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Truy cập nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/emulation/rewards')}>
                  <Medal className="h-4 w-4 mr-2 text-amber-500" />
                  Danh sách Khen thưởng
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/emulation/rewards/create')}>
                  <Plus className="h-4 w-4 mr-2 text-green-500" />
                  Thêm Khen thưởng mới
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/emulation/stats')}>
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                  Thống kê theo Đơn vị
                </Button>
              </CardContent>
            </Card>

            {/* Top Units */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  Top Đơn vị Khen thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topUnits.slice(0, 5).map((unit, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium">{unit.unitName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{unit.count}</span>
                        <Badge variant="outline" className="text-xs">{unit.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-unit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thống kê theo Đơn vị</CardTitle>
                <Select value={selectedUnitLevel} onValueChange={setSelectedUnitLevel}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Cấp đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả cấp</SelectItem>
                    <SelectItem value="1">Cấp 1 - Học viện</SelectItem>
                    <SelectItem value="2">Cấp 2 - Khoa/Phòng</SelectItem>
                    <SelectItem value="3">Cấp 3 - Bộ môn/Tiểu đoàn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byUnit} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="unitName" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số khen thưởng" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-type" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo Hình thức</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byType}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng theo Năm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byYear}>
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Số khen thưởng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Khen thưởng gần đây</CardTitle>
                <CardDescription>Các quyết định khen thưởng mới nhất</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/emulation/rewards')}>
                Xem tất cả <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentRewards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có khen thưởng nào
                  </div>
                ) : (
                  stats.recentRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/emulation/rewards/${reward.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-amber-100">
                          <Trophy className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{reward.userName}</span>
                            {getRewardTypeBadge(reward.rewardType)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {reward.unitName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Năm {reward.year}</p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(reward.decisionDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
