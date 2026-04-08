/**
 * CSDL Quân nhân - Ban Quân lực quản lý
 * Quản lý QNCN, CNVQP, HSQ-CS
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  FileText,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  AlertTriangle,
  CheckCircle,
  Activity,
  ClipboardList,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMasterData } from '@/hooks/use-master-data';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  NGHIA_VU: 'Nghĩa vụ quân sự',
  HOP_DONG: 'Hợp đồng',
  CHUYEN_NGHIEP: 'Chuyên nghiệp',
};

const CATEGORY_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];


interface SoldierProfile {
  id: string;
  soldierIdNumber: string | null;
  soldierCategory: string | null;
  currentRank: string | null;
  serviceType: string | null;
  enlistmentDate: string | null;
  healthCategory: string | null;
  personnel: {
    id: string;
    personnelCode: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    militaryRank: string | null;
    position: string | null;
    unit: { id: string; name: string; code: string } | null;
  };
  serviceRecords: Array<{
    id: string;
    eventType: string;
    eventDate: string;
  }>;
}

interface Stats {
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byServiceType: Array<{ serviceType: string; count: number }>;
  byUnit: Array<{ name: string; count: number }>;
  health: {
    byCategory: Array<{ healthCategory: string; count: number }>;
    byUnitCategory: Array<Record<string, string | number>>;
    needsFollowUp: number;
    checkedCount: number;
    recentChecks: Array<{
      name: string;
      healthCategory: string | null;
      lastHealthCheckDate: string | null;
    }>;
  };
}

// ─── Rank Management Types ────────────────────────────────────────────────────

interface ServiceRecord {
  id: string;
  soldierProfileId: string;
  eventType: string;
  eventDate: string;
  decisionNumber: string | null;
  previousRank: string | null;
  newRank: string | null;
  previousRankLabel: string | null;
  newRankLabel: string | null;
  previousUnit: string | null;
  newUnit: string | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  THANG_CAP:   'Thăng quân hàm',
  HA_CAP:      'Hạ quân hàm',
  DIEU_DONG:   'Điều động',
  XUAT_NGU:    'Xuất ngũ',
  KHAC:        'Khác',
};

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS);

export default function SoldierManagementPage() {
  const router = useRouter();

  // Master data — from MDM hook
  const { items: rankItems } = useMasterData('MD_RANK');
  const { items: personnelTypeItems } = useMasterData('MD_PERSONNEL_TYPE');
  const ranks = rankItems; // alias for existing usages
  const personnelTypes = personnelTypeItems; // alias for existing usages
  const rankLabelMap = useMemo(
    () => Object.fromEntries(rankItems.map(r => [r.code, r.nameVi])),
    [rankItems]
  );
  const categoryLabelMap = useMemo(
    () => Object.fromEntries(personnelTypeItems.map(t => [t.code, t.nameVi])),
    [personnelTypeItems]
  );

  const [soldiers, setSoldiers] = useState<SoldierProfile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  // Rank management state
  const [rankSearch, setRankSearch] = useState('');
  const [rankSoldiers, setRankSoldiers] = useState<SoldierProfile[]>([]);
  const [rankSoldiersLoading, setRankSoldiersLoading] = useState(false);
  const [selectedSoldier, setSelectedSoldier] = useState<SoldierProfile | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [serviceRecordsLoading, setServiceRecordsLoading] = useState(false);
  const [rankPage, setRankPage] = useState(1);
  const [rankTotalPages, setRankTotalPages] = useState(1);

  // Rank record dialog
  const [rrDialog, setRrDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: ServiceRecord }>({
    open: false, mode: 'create',
  });
  const [rrForm, setRrForm] = useState({
    eventType: 'THANG_CAP',
    eventDate: '',
    decisionNumber: '',
    previousRank: '',
    newRank: '',
    previousUnit: '',
    newUnit: '',
    description: '',
    notes: '',
  });
  const [rrSaving, setRrSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
      if (serviceTypeFilter && serviceTypeFilter !== 'all') params.set('serviceType', serviceTypeFilter);

      const [soldiersRes, statsRes] = await Promise.all([
        fetch(`/api/soldier-profile?${params}`),
        fetch('/api/soldier-profile/stats')
      ]);

      const soldiersData = await soldiersRes.json();
      const statsData = await statsRes.json();

      if (soldiersData.success) {
        setSoldiers(soldiersData.data);
        setTotalPages(soldiersData.pagination.totalPages);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, categoryFilter, serviceTypeFilter]);

  // ── Rank tab: fetch soldier list ─────────────────────────────────────────────
  const fetchRankSoldiers = useCallback(async () => {
    setRankSoldiersLoading(true);
    try {
      const params = new URLSearchParams({ page: rankPage.toString(), limit: '12' });
      if (rankSearch) params.set('search', rankSearch);
      const res = await fetch(`/api/soldier-profile?${params}`);
      const data = await res.json();
      if (data.success) {
        setRankSoldiers(data.data);
        setRankTotalPages(data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
    finally { setRankSoldiersLoading(false); }
  }, [rankPage, rankSearch]);

  useEffect(() => {
    if (activeTab === 'ranks') fetchRankSoldiers();
  }, [activeTab, fetchRankSoldiers]);

  // ── Rank tab: fetch service records for selected soldier ─────────────────────
  const fetchServiceRecords = useCallback(async (soldierProfileId: string) => {
    setServiceRecordsLoading(true);
    try {
      const res = await fetch(`/api/soldier-profile/service-records?soldierProfileId=${soldierProfileId}`);
      const data = await res.json();
      if (data.success) setServiceRecords(data.data);
    } catch (e) { console.error(e); }
    finally { setServiceRecordsLoading(false); }
  }, []);

  const selectSoldier = (s: SoldierProfile) => {
    setSelectedSoldier(s);
    fetchServiceRecords(s.id);
  };

  // ── Rank record CRUD ─────────────────────────────────────────────────────────
  const openCreateRrDialog = () => {
    if (!selectedSoldier) return;
    setRrForm({
      eventType: 'THANG_CAP',
      eventDate: new Date().toISOString().split('T')[0],
      decisionNumber: '',
      previousRank: selectedSoldier.currentRank || '',
      newRank: '',
      previousUnit: selectedSoldier.personnel?.unit?.name || '',
      newUnit: '',
      description: '',
      notes: '',
    });
    setRrDialog({ open: true, mode: 'create' });
  };

  const openEditRrDialog = (r: ServiceRecord) => {
    setRrForm({
      eventType: r.eventType,
      eventDate: r.eventDate.split('T')[0],
      decisionNumber: r.decisionNumber ?? '',
      previousRank: r.previousRank ?? '',
      newRank: r.newRank ?? '',
      previousUnit: r.previousUnit ?? '',
      newUnit: r.newUnit ?? '',
      description: r.description ?? '',
      notes: r.notes ?? '',
    });
    setRrDialog({ open: true, mode: 'edit', data: r });
  };

  const saveRankRecord = async () => {
    if (!selectedSoldier) return;
    setRrSaving(true);
    try {
      const isEdit = rrDialog.mode === 'edit' && rrDialog.data;
      const url = isEdit
        ? `/api/soldier-profile/service-records/${rrDialog.data!.id}`
        : '/api/soldier-profile/service-records';
      const payload = isEdit
        ? {
            eventType: rrForm.eventType,
            eventDate: rrForm.eventDate,
            decisionNumber: rrForm.decisionNumber || null,
            previousRank: rrForm.previousRank || null,
            newRank: rrForm.newRank || null,
            previousUnit: rrForm.previousUnit || null,
            newUnit: rrForm.newUnit || null,
            description: rrForm.description || null,
            notes: rrForm.notes || null,
          }
        : {
            soldierProfileId: selectedSoldier.id,
            ...Object.fromEntries(Object.entries({
              eventType: rrForm.eventType,
              eventDate: rrForm.eventDate,
              decisionNumber: rrForm.decisionNumber || null,
              previousRank: rrForm.previousRank || null,
              newRank: rrForm.newRank || null,
              previousUnit: rrForm.previousUnit || null,
              newUnit: rrForm.newUnit || null,
              description: rrForm.description || null,
              notes: rrForm.notes || null,
            })),
          };

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRrDialog({ open: false, mode: 'create' });
        fetchServiceRecords(selectedSoldier.id);
        fetchRankSoldiers(); // refresh current rank display
      } else {
        alert(data.error || 'Lỗi khi lưu');
      }
    } catch (e) { console.error(e); }
    finally { setRrSaving(false); }
  };

  const deleteRankRecord = async (id: string) => {
    if (!confirm('Xóa bản ghi quân hàm này?')) return;
    await fetch(`/api/soldier-profile/service-records/${id}`, { method: 'DELETE' });
    if (selectedSoldier) fetchServiceRecords(selectedSoldier.id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CSDL Quân nhân</h1>
          <p className="text-muted-foreground">Ban Quân lực quản lý - QNCN, CNVQP, HSQ-CS</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="health">Sức khỏe</TabsTrigger>
          <TabsTrigger value="ranks">Quản lý cấp bậc</TabsTrigger>
        </TabsList>

        {/* Tổng quan */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng quân nhân</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">Hồ sơ đang quản lý</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">QNCN</CardTitle>
                    <Shield className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.byCategory.find(c => c.category === 'QNCN')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Quân nhân chuyên nghiệp</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">CNVQP</CardTitle>
                    <FileText className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.byCategory.find(c => c.category === 'CNVQP')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Công nhân viên QP</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Đơn vị</CardTitle>
                    <Building className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.byUnit.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Đơn vị có quân nhân</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Phân bố theo loại</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.byCategory.filter(c => c.category !== 'Chưa xác định') || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${categoryLabelMap[name || ''] || name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          dataKey="count"
                          nameKey="category"
                        >
                          {stats?.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, categoryLabelMap[name as string] || name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Phân bố theo loại hình phục vụ</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.byServiceType || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="serviceType" tickFormatter={(v) => SERVICE_TYPE_LABELS[v] || v} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [value, 'Số lượng']} labelFormatter={(v) => SERVICE_TYPE_LABELS[v] || v} />
                        <Bar dataKey="count" fill="#3b82f6" name="Số lượng" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Danh sách */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Loại quân nhân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {personnelTypes.map(t => (
                  <SelectItem key={t.code} value={t.code}>{t.nameVi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã CB</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Loại hình</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Ngày nhập ngũ</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : soldiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    soldiers.map((soldier) => {
                      const catColor: Record<string, string> = {
                        QNCN:     'bg-blue-100 text-blue-800',
                        CNVQP:    'bg-purple-100 text-purple-800',
                        HSQ:      'bg-green-100 text-green-800',
                        CHIEN_SI: 'bg-orange-100 text-orange-800',
                      };
                      const healthColor: Record<string, string> = {
                        'Loại 1': 'bg-green-100 text-green-800',
                        'Loại 2': 'bg-blue-100 text-blue-800',
                        'Loại 3': 'bg-yellow-100 text-yellow-800',
                        'Loại 4': 'bg-red-100 text-red-800',
                      };
                      return (
                        <TableRow key={soldier.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/soldier-management/${soldier.id}`)}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {soldier.personnel?.personnelCode || '-'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {soldier.personnel?.fullName}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${catColor[soldier.soldierCategory || ''] || 'bg-gray-100 text-gray-800'} border-0 text-xs`}>
                              {categoryLabelMap[soldier.soldierCategory || ''] || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {rankLabelMap[soldier.currentRank || ''] || soldier.personnel?.militaryRank || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {SERVICE_TYPE_LABELS[soldier.serviceType || ''] || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {soldier.personnel?.unit?.name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(soldier.enlistmentDate)}</TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/soldier-management/${soldier.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Sức khỏe */}
        <TabsContent value="health" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Loại 1 - Tốt</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.health.byCategory.find(h => h.healthCategory === 'Loại 1')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Sức khỏe xuất sắc</p>
                    <div className="mt-2 h-1.5 rounded-full bg-green-100">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 1')?.count || 0) / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Loại 2 - Khá</CardTitle>
                    <Activity className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.health.byCategory.find(h => h.healthCategory === 'Loại 2')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Sức khỏe khá tốt</p>
                    <div className="mt-2 h-1.5 rounded-full bg-blue-100">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 2')?.count || 0) / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 dark:border-yellow-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Loại 3 - TB</CardTitle>
                    <ClipboardList className="h-5 w-5 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats?.health.byCategory.find(h => h.healthCategory === 'Loại 3')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Cần theo dõi định kỳ</p>
                    <div className="mt-2 h-1.5 rounded-full bg-yellow-100">
                      <div
                        className="h-1.5 rounded-full bg-yellow-500"
                        style={{ width: `${((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 3')?.count || 0) / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Loại 4 - Yếu</CardTitle>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {stats?.health.needsFollowUp || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Cần can thiệp y tế</p>
                    <div className="mt-2 h-1.5 rounded-full bg-red-100">
                      <div
                        className="h-1.5 rounded-full bg-red-500"
                        style={{ width: `${((stats?.health.needsFollowUp || 0) / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng đã kiểm tra</p>
                        <p className="text-2xl font-bold">{stats?.health.checkedCount || 0} / {stats?.total || 0}</p>
                      </div>
                      <Heart className="h-8 w-8 text-red-400" />
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-red-400"
                        style={{ width: `${((stats?.health.checkedCount || 0) / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(((stats?.health.checkedCount || 0) / (stats?.total || 1)) * 100).toFixed(0)}% đã được khám sức khỏe
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sức khỏe tốt (Loại 1+2)</p>
                        <p className="text-2xl font-bold text-green-600">
                          {((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 1')?.count || 0) +
                            (stats?.health.byCategory.find(h => h.healthCategory === 'Loại 2')?.count || 0))}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {(
                        (((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 1')?.count || 0) +
                          (stats?.health.byCategory.find(h => h.healthCategory === 'Loại 2')?.count || 0)) /
                          (stats?.total || 1)) * 100
                      ).toFixed(0)}% quân nhân có sức khỏe tốt
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Cần theo dõi (Loại 3+4)</p>
                        <p className="text-2xl font-bold text-red-600">
                          {((stats?.health.byCategory.find(h => h.healthCategory === 'Loại 3')?.count || 0) +
                            (stats?.health.byCategory.find(h => h.healthCategory === 'Loại 4')?.count || 0))}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Cần lên kế hoạch khám và điều trị
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Phân bố sức khỏe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.health.byCategory || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                          outerRadius={90}
                          dataKey="count"
                          nameKey="healthCategory"
                        >
                          {(stats?.health.byCategory || []).map((entry, index) => {
                            const colors: Record<string, string> = {
                              'Loại 1': '#22c55e',
                              'Loại 2': '#3b82f6',
                              'Loại 3': '#f59e0b',
                              'Loại 4': '#ef4444',
                              'Chưa kiểm tra': '#9ca3af',
                            };
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[entry.healthCategory] || '#9ca3af'}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Sức khỏe theo loại quân nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.health.byUnitCategory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          tickFormatter={(v) => categoryLabelMap[v] ? categoryLabelMap[v].split(' ')[0] : v}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(v) => categoryLabelMap[v as string] || v}
                        />
                        <Legend />
                        <Bar dataKey="Loại 1" stackId="a" fill="#22c55e" name="Loại 1" />
                        <Bar dataKey="Loại 2" stackId="a" fill="#3b82f6" name="Loại 2" />
                        <Bar dataKey="Loại 3" stackId="a" fill="#f59e0b" name="Loại 3" />
                        <Bar dataKey="Loại 4" stackId="a" fill="#ef4444" name="Loại 4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Health status table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Tình trạng sức khỏe chi tiết
                  </CardTitle>
                  <CardDescription>Tổng hợp theo loại sức khỏe và loại quân nhân</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại sức khỏe</TableHead>
                        <TableHead>Mức độ</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead className="text-right">Tỷ lệ</TableHead>
                        <TableHead>Khuyến nghị</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { cat: 'Loại 1', level: 'Tốt', color: 'bg-green-100 text-green-800', note: 'Đủ điều kiện thực hiện mọi nhiệm vụ' },
                        { cat: 'Loại 2', level: 'Khá', color: 'bg-blue-100 text-blue-800', note: 'Đủ điều kiện, theo dõi định kỳ 6 tháng' },
                        { cat: 'Loại 3', level: 'Trung bình', color: 'bg-yellow-100 text-yellow-800', note: 'Hạn chế nhiệm vụ nặng, khám lại 3 tháng' },
                        { cat: 'Loại 4', level: 'Yếu', color: 'bg-red-100 text-red-800', note: 'Cần điều trị, báo cáo y vụ ngay' },
                      ].map(({ cat, level, color, note }) => {
                        const count = stats?.health.byCategory.find(h => h.healthCategory === cat)?.count || 0;
                        const pct = stats?.total ? ((count / stats.total) * 100).toFixed(1) : '0';
                        return (
                          <TableRow key={cat}>
                            <TableCell>
                              <Badge className={color}>{cat}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{level}</TableCell>
                            <TableCell className="text-right font-bold">{count}</TableCell>
                            <TableCell className="text-right">{pct}%</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{note}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        {/* ── Quản lý cấp bậc ─────────────────────────────────────────── */}
        <TabsContent value="ranks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: soldier selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Chọn quân nhân</h3>
                <span className="text-xs text-muted-foreground">Nhấn để xem lịch sử cấp bậc</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm theo tên, mã..." value={rankSearch}
                  onChange={e => { setRankSearch(e.target.value); setRankPage(1); }} className="pl-10" />
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Cấp bậc hiện tại</TableHead>
                        <TableHead>Loại</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankSoldiersLoading ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-6">Đang tải...</TableCell></TableRow>
                      ) : rankSoldiers.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-6">Không có dữ liệu</TableCell></TableRow>
                      ) : rankSoldiers.map(s => (
                        <TableRow key={s.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedSoldier?.id === s.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                          onClick={() => selectSoldier(s)}>
                          <TableCell>
                            <div className="font-medium text-sm">{s.personnel?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{s.personnel?.personnelCode}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {rankLabelMap[s.currentRank || ''] || s.personnel?.militaryRank || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {categoryLabelMap[s.soldierCategory || ''] || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Trang {rankPage} / {rankTotalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={rankPage <= 1} onClick={() => setRankPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={rankPage >= rankTotalPages} onClick={() => setRankPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: rank history */}
            <div className="space-y-3">
              {selectedSoldier ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedSoldier.personnel?.fullName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          Hiện tại: {rankLabelMap[selectedSoldier.currentRank || ''] || 'Chưa có'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{selectedSoldier.personnel?.unit?.name}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={openCreateRrDialog}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Thêm bản ghi
                    </Button>
                  </div>

                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Lịch sử cấp bậc / sự kiện
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Loại sự kiện</TableHead>
                            <TableHead>Cấp bậc</TableHead>
                            <TableHead>Số QĐ</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceRecordsLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6">Đang tải...</TableCell></TableRow>
                          ) : serviceRecords.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              Chưa có bản ghi nào
                            </TableCell></TableRow>
                          ) : serviceRecords.map(r => (
                            <TableRow key={r.id}>
                              <TableCell className="text-sm">{formatDate(r.eventDate)}</TableCell>
                              <TableCell>
                                <Badge variant={r.eventType === 'THANG_CAP' ? 'default' : r.eventType === 'HA_CAP' ? 'destructive' : 'secondary'}
                                  className="text-xs flex items-center gap-1 w-fit">
                                  {r.eventType === 'THANG_CAP' ? <ArrowUp className="h-2.5 w-2.5" /> :
                                   r.eventType === 'HA_CAP'   ? <ArrowDown className="h-2.5 w-2.5" /> : null}
                                  {EVENT_TYPE_LABELS[r.eventType] ?? r.eventType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {r.previousRankLabel && (
                                  <span className="text-muted-foreground">{r.previousRankLabel} → </span>
                                )}
                                {r.newRankLabel && (
                                  <span className="font-semibold text-blue-600">{r.newRankLabel}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                {r.decisionNumber ?? '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditRrDialog(r)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"
                                    onClick={() => deleteRankRecord(r.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                  <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Chọn một quân nhân để xem lịch sử cấp bậc</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Rank Record Dialog ─────────────────────────────────────────────── */}
      <Dialog open={rrDialog.open} onOpenChange={o => setRrDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {rrDialog.mode === 'create' ? 'Thêm bản ghi cấp bậc' : 'Chỉnh sửa bản ghi'}
            </DialogTitle>
            <DialogDescription>
              {selectedSoldier?.personnel?.fullName} — Cấp bậc hiện tại:{' '}
              {rankLabelMap[selectedSoldier?.currentRank || ''] || 'Chưa có'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Loại sự kiện <span className="text-red-500">*</span></Label>
                <Select value={rrForm.eventType} onValueChange={v => setRrForm(f => ({ ...f, eventType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ngày hiệu lực <span className="text-red-500">*</span></Label>
                <Input type="date" value={rrForm.eventDate}
                  onChange={e => setRrForm(f => ({ ...f, eventDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cấp bậc trước</Label>
                <Select value={rrForm.previousRank || 'NONE'} onValueChange={v => setRrForm(f => ({ ...f, previousRank: v === 'NONE' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Không có</SelectItem>
                    {ranks.map(r => (
                      <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cấp bậc mới</Label>
                <Select value={rrForm.newRank || 'NONE'} onValueChange={v => setRrForm(f => ({ ...f, newRank: v === 'NONE' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Không thay đổi</SelectItem>
                    {ranks.map(r => (
                      <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Số quyết định</Label>
              <Input value={rrForm.decisionNumber}
                onChange={e => setRrForm(f => ({ ...f, decisionNumber: e.target.value }))}
                placeholder="123/QĐ-BQP" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mô tả / Lý do</Label>
              <Textarea value={rrForm.description}
                onChange={e => setRrForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Thông tin thêm..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRrDialog(p => ({ ...p, open: false }))}>Hủy</Button>
            <Button onClick={saveRankRecord} disabled={rrSaving || !rrForm.eventType || !rrForm.eventDate}>
              {rrSaving ? 'Đang lưu...' : rrDialog.mode === 'create' ? 'Thêm' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
