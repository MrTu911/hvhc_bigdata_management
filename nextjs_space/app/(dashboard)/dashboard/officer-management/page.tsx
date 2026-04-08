/**
 * CSDL Cán bộ - Ban Cán bộ quản lý
 * Quản lý sĩ quan, lịch sử thăng cấp, bổ nhiệm, và hạn thăng quân hàm
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
  Star,
  TrendingUp,
  Award,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Pencil,
  Trash2,
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
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMasterData } from '@/hooks/use-master-data';

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SPECIAL_CASE_TYPES = [
  { value: 'CHIEN_SI_THI_DUA_TOAN_QUAN', label: 'Chiến sĩ thi đua toàn quân' },
  { value: 'TIEN_SI',                    label: 'Tiến sĩ' },
  { value: 'THANH_TICH_DAC_BIET',        label: 'Thành tích đặc biệt' },
  { value: 'NGHI_QUYET_CAP_TREN',        label: 'Theo nghị quyết cấp trên' },
  { value: 'KHAC',                        label: 'Khác' },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  OVERDUE:  { label: 'Quá hạn',      color: 'bg-red-100 text-red-800 border-red-300',       icon: <AlertCircle className="h-3 w-3" /> },
  CRITICAL: { label: 'Sắp đến hạn',  color: 'bg-orange-100 text-orange-800 border-orange-300', icon: <AlertTriangle className="h-3 w-3" /> },
  WARNING:  { label: 'Chú ý',        color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
  UPCOMING: { label: 'Sắp đến',      color: 'bg-blue-100 text-blue-800 border-blue-300',    icon: <Info className="h-3 w-3" /> },
  NOT_YET:  { label: 'Chưa đến hạn', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  MAX_RANK: { label: 'Cấp cao nhất', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Star className="h-3 w-3" /> },
  NO_DATA:  { label: 'Thiếu dữ liệu', color: 'bg-gray-100 text-gray-600 border-gray-300',   icon: <Info className="h-3 w-3" /> },
};

// ─── Types ────────────────────────────────────────────────────────────────────


interface OfficerCareer {
  id: string;
  officerIdNumber: string | null;
  currentRank: string | null;
  currentPosition: string | null;
  commissionedDate: string | null;
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
  promotions: Array<{
    id: string;
    promotionType: string;
    effectiveDate: string;
    newRank: string | null;
    newPosition: string | null;
  }>;
}

interface Stats {
  total: number;
  byRank: Array<{ rank: string; count: number }>;
  byUnit: Array<{ name: string; count: number }>;
  recentPromotions: Array<{
    id: string;
    officerName: string;
    promotionType: string;
    effectiveDate: string;
    newRank: string;
    newPosition: string;
  }>;
}

interface DeadlineItem {
  id: string;
  personnelId: string;
  personnelCode: string;
  fullName: string;
  unit: string | null;
  rankType: 'OFFICER' | 'SOLDIER';
  currentRank: string | null;
  currentRankLabel: string | null;
  nextRank: string | null;
  nextRankLabel: string | null;
  standardMonths: number | null;
  totalReductionMonths: number;
  effectiveMonths: number | null;
  lastRankDate: string | null;
  eligibilityDate: string | null;
  daysUntilEligible: number | null;
  status: string;
  ageWarning: boolean;
  specialCaseCount: number;
}

interface DeadlineSummary {
  total: number;
  overdue: number;
  critical: number;
  warning: number;
  upcoming: number;
  notYet: number;
  ageWarnings: number;
}

interface SpecialCase {
  id: string;
  officerCareerId: string | null;
  soldierProfileId: string | null;
  caseType: string;
  caseTypeLabel: string;
  title: string;
  description: string | null;
  reductionMonths: number;
  decisionNumber: string | null;
  decisionDate: string | null;
  issuedBy: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OfficerManagementPage() {
  const router = useRouter();

  // Master data — ranks from MDM
  const { items: rankItems } = useMasterData('MD_RANK');
  const ranks = rankItems; // alias for existing usages
  const rankLabelMap = useMemo(
    () => Object.fromEntries(rankItems.map(r => [r.code, r.nameVi])),
    [rankItems]
  );

  // Officers list
  const [officers, setOfficers] = useState<OfficerCareer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  // Deadlines tab
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [deadlineSummary, setDeadlineSummary] = useState<DeadlineSummary | null>(null);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineTypeFilter, setDeadlineTypeFilter] = useState('ALL');
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState('ALL');
  const [deadlinePage, setDeadlinePage] = useState(1);
  const [deadlineTotalPages, setDeadlineTotalPages] = useState(1);

  // Special cases
  const [specialCases, setSpecialCases] = useState<SpecialCase[]>([]);
  const [specialCasesLoading, setSpecialCasesLoading] = useState(false);
  const [showAllCases, setShowAllCases] = useState(false);

  // Special case dialog
  const [scDialog, setScDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: SpecialCase }>({
    open: false, mode: 'create',
  });
  const [scForm, setScForm] = useState({
    officerCareerId: '',
    soldierProfileId: '',
    caseType: '',
    title: '',
    description: '',
    reductionMonths: '',
    decisionNumber: '',
    decisionDate: '',
    issuedBy: '',
    notes: '',
    isActive: true,
  });
  const [scSaving, setScSaving] = useState(false);

  // ── Fetch officers ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (rankFilter && rankFilter !== 'all') params.set('rank', rankFilter);

      const [officersRes, statsRes] = await Promise.all([
        fetch(`/api/officer-career?${params}`),
        fetch('/api/officer-career/stats'),
      ]);

      const officersData = await officersRes.json();
      const statsData = await statsRes.json();

      if (officersData.success) {
        setOfficers(officersData.data);
        setTotalPages(officersData.pagination.totalPages);
      }
      if (statsData.success) setStats(statsData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, rankFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch deadlines ──────────────────────────────────────────────────────────

  const fetchDeadlines = useCallback(async () => {
    setDeadlineLoading(true);
    try {
      const params = new URLSearchParams({
        type: deadlineTypeFilter,
        status: deadlineStatusFilter,
        page: deadlinePage.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/officer-career/promotion-deadlines?${params}`);
      const data = await res.json();
      if (data.success) {
        setDeadlines(data.data);
        setDeadlineSummary(data.summary);
        setDeadlineTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeadlineLoading(false);
    }
  }, [deadlineTypeFilter, deadlineStatusFilter, deadlinePage]);

  useEffect(() => {
    if (activeTab === 'deadlines') fetchDeadlines();
  }, [activeTab, fetchDeadlines]);

  // ── Fetch all special cases ──────────────────────────────────────────────────

  const fetchAllSpecialCases = useCallback(async () => {
    setSpecialCasesLoading(true);
    try {
      const res = await fetch(
        `/api/officer-career/special-cases?activeOnly=${!showAllCases}`,
      );
      const data = await res.json();
      if (data.success) setSpecialCases(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSpecialCasesLoading(false);
    }
  }, [showAllCases]);

  useEffect(() => {
    if (activeTab === 'special-cases') fetchAllSpecialCases();
  }, [activeTab, fetchAllSpecialCases]);

  // ── Special case save ────────────────────────────────────────────────────────

  const saveSpecialCase = async () => {
    setScSaving(true);
    try {
      const isEdit = scDialog.mode === 'edit' && scDialog.data;
      const url = isEdit
        ? `/api/officer-career/special-cases/${scDialog.data!.id}`
        : '/api/officer-career/special-cases';

      const payload: Record<string, unknown> = {
        caseType: scForm.caseType,
        title: scForm.title,
        description: scForm.description || null,
        reductionMonths: parseInt(scForm.reductionMonths) || 1,
        decisionNumber: scForm.decisionNumber || null,
        decisionDate: scForm.decisionDate || null,
        issuedBy: scForm.issuedBy || null,
        notes: scForm.notes || null,
        ...(isEdit && { isActive: scForm.isActive }),
      };
      if (!isEdit) {
        payload.officerCareerId = scForm.officerCareerId || null;
        payload.soldierProfileId = scForm.soldierProfileId || null;
      }

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setScDialog({ open: false, mode: 'create' });
        fetchAllSpecialCases();
        fetchDeadlines();
      } else {
        alert(data.error || 'Lỗi khi lưu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScSaving(false);
    }
  };

  const deleteSpecialCase = async (id: string) => {
    if (!confirm('Xóa trường hợp đặc biệt này?')) return;
    await fetch(`/api/officer-career/special-cases/${id}`, { method: 'DELETE' });
    fetchAllSpecialCases();
    fetchDeadlines();
  };

  const openCreateDialog = () => {
    setScForm({
      officerCareerId: '', soldierProfileId: '', caseType: '', title: '',
      description: '', reductionMonths: '', decisionNumber: '',
      decisionDate: '', issuedBy: '', notes: '', isActive: true,
    });
    setScDialog({ open: true, mode: 'create' });
  };

  const openEditDialog = (sc: SpecialCase) => {
    setScForm({
      officerCareerId: sc.officerCareerId ?? '',
      soldierProfileId: sc.soldierProfileId ?? '',
      caseType: sc.caseType,
      title: sc.title,
      description: sc.description ?? '',
      reductionMonths: sc.reductionMonths.toString(),
      decisionNumber: sc.decisionNumber ?? '',
      decisionDate: sc.decisionDate ? sc.decisionDate.split('T')[0] : '',
      issuedBy: sc.issuedBy ?? '',
      notes: sc.notes ?? '',
      isActive: sc.isActive,
    });
    setScDialog({ open: true, mode: 'edit', data: sc });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const formatDays = (days: number | null) => {
    if (days === null) return '-';
    if (days < 0) return `Quá ${Math.abs(days)} ngày`;
    if (days === 0) return 'Hôm nay';
    return `Còn ${days} ngày`;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CSDL Cán bộ</h1>
          <p className="text-muted-foreground">Ban Cán bộ quản lý - Hồ sơ sĩ quan</p>
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
          <TabsTrigger value="promotions">Thăng cấp/Bổ nhiệm</TabsTrigger>
          <TabsTrigger value="deadlines" className="relative">
            Hạn thăng quân hàm
            {deadlineSummary && (deadlineSummary.overdue + deadlineSummary.critical) > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">
                {deadlineSummary.overdue + deadlineSummary.critical}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="special-cases">Trường hợp đặc biệt</TabsTrigger>
        </TabsList>

        {/* ── Tổng quan ───────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng sĩ quan</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">Hồ sơ đang quản lý</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cấp tá</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.byRank.filter(r => r.rank.includes('TA')).reduce((a, b) => a + b.count, 0) || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Đại tá, Thượng tá, Trung tá, Thiếu tá</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cấp úy</CardTitle>
                    <Award className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.byRank.filter(r => r.rank.includes('UY')).reduce((a, b) => a + b.count, 0) || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Đại úy, Thượng úy, Trung úy, Thiếu úy</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Đơn vị</CardTitle>
                    <Building className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.byUnit.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Đơn vị có sĩ quan</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Phân bố theo cấp bậc</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.byRank.filter(r => r.rank !== 'Chưa xác định').slice(0, 6) || []}
                          cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${rankLabelMap[name || ''] || name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={100} dataKey="count" nameKey="rank"
                        >
                          {stats?.byRank.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={RANK_COLORS[index % RANK_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, rankLabelMap[name as string] || name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Top 10 đơn vị</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.byUnit.slice(0, 10) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Số sĩ quan" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Danh sách ───────────────────────────────────────────────────── */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên, mã..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cấp bậc" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                {ranks.map(r => (
                  <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã CB</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Số hiệu SQ</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">Đang tải...</TableCell></TableRow>
                  ) : officers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">Không có dữ liệu</TableCell></TableRow>
                  ) : officers.map((officer) => {
                    const rank = officer.currentRank || '';
                    const rankColor =
                      ['DAI_TUONG','THUONG_TUONG','TRUNG_TUONG','THIEU_TUONG'].includes(rank)
                        ? 'bg-red-100 text-red-800'
                        : ['DAI_TA','THUONG_TA','TRUNG_TA','THIEU_TA'].includes(rank)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800';
                    return (
                      <TableRow key={officer.id} className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/officer-management/${officer.id}`)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {officer.personnel?.personnelCode || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">{officer.personnel?.fullName}</TableCell>
                        <TableCell>
                          <Badge className={`${rankColor} border-0 text-xs`}>
                            {rankLabelMap[rank] || officer.personnel?.militaryRank || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{officer.currentPosition || officer.personnel?.position || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{officer.personnel?.unit?.name || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{officer.officerIdNumber || '-'}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm"
                            onClick={() => router.push(`/dashboard/officer-management/${officer.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Thăng cấp/Bổ nhiệm ─────────────────────────────────────────── */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quá trình thăng cấp/Bổ nhiệm gần đây
              </CardTitle>
              <CardDescription>10 quyết định gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentPromotions && stats.recentPromotions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sĩ quan</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Ngày hiệu lực</TableHead>
                      <TableHead>Cấp bậc mới</TableHead>
                      <TableHead>Chức vụ mới</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentPromotions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.officerName}</TableCell>
                        <TableCell><Badge>{p.promotionType}</Badge></TableCell>
                        <TableCell>{formatDate(p.effectiveDate)}</TableCell>
                        <TableCell>{rankLabelMap[p.newRank] || p.newRank || '-'}</TableCell>
                        <TableCell>{p.newPosition || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-10 text-muted-foreground">Chưa có dữ liệu thăng cấp/bổ nhiệm</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Hạn thăng quân hàm ─────────────────────────────────────────── */}
        <TabsContent value="deadlines" className="space-y-4">
          {/* Summary cards */}
          {deadlineSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Tổng', value: deadlineSummary.total, color: 'text-foreground' },
                { label: 'Quá hạn', value: deadlineSummary.overdue, color: 'text-red-600' },
                { label: 'Sắp đến hạn (≤30 ngày)', value: deadlineSummary.critical, color: 'text-orange-600' },
                { label: 'Chú ý (≤90 ngày)', value: deadlineSummary.warning, color: 'text-yellow-600' },
                { label: 'Sắp đến (≤180 ngày)', value: deadlineSummary.upcoming, color: 'text-blue-600' },
                { label: 'Chưa đến hạn', value: deadlineSummary.notYet, color: 'text-green-600' },
                { label: 'Cảnh báo tuổi', value: deadlineSummary.ageWarnings, color: 'text-purple-600' },
              ].map((c) => (
                <Card key={c.label} className="text-center p-3">
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={deadlineTypeFilter} onValueChange={v => { setDeadlineTypeFilter(v); setDeadlinePage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="OFFICER">Sĩ quan</SelectItem>
                <SelectItem value="SOLDIER">Chiến sĩ/HSQ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deadlineStatusFilter} onValueChange={v => { setDeadlineStatusFilter(v); setDeadlinePage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="OVERDUE">Quá hạn</SelectItem>
                <SelectItem value="CRITICAL">Sắp đến hạn (≤30 ngày)</SelectItem>
                <SelectItem value="WARNING">Chú ý (≤90 ngày)</SelectItem>
                <SelectItem value="UPCOMING">Sắp đến (≤180 ngày)</SelectItem>
                <SelectItem value="NOT_YET">Chưa đến hạn</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDeadlines}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tải lại
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Cấp bậc hiện tại</TableHead>
                    <TableHead>Cấp bậc tiếp theo</TableHead>
                    <TableHead>Hạn chuẩn (tháng)</TableHead>
                    <TableHead>Rút ngắn (tháng)</TableHead>
                    <TableHead>Ngày đủ hạn</TableHead>
                    <TableHead>Thời gian còn lại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadlineLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10">Đang tải...</TableCell></TableRow>
                  ) : deadlines.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10">Không có dữ liệu</TableCell></TableRow>
                  ) : deadlines.map((d) => {
                    const sc = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.NO_DATA;
                    return (
                      <TableRow key={d.id} className={d.ageWarning ? 'bg-purple-50' : ''}>
                        <TableCell>
                          <div className="font-semibold">{d.fullName}</div>
                          <div className="text-xs text-muted-foreground">{d.personnelCode}</div>
                        </TableCell>
                        <TableCell className="text-sm">{d.unit ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{d.currentRankLabel ?? '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          {d.nextRankLabel
                            ? <Badge variant="secondary" className="text-xs">{d.nextRankLabel}</Badge>
                            : <span className="text-xs text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {d.standardMonths ?? '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {d.totalReductionMonths > 0
                            ? <span className="text-green-600 font-semibold">-{d.totalReductionMonths}</span>
                            : <span className="text-muted-foreground text-xs">0</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{formatDate(d.eligibilityDate)}</div>
                          {d.ageWarning && (
                            <div className="text-xs text-purple-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> Vượt tuổi đề bạt
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm font-medium ${
                          d.status === 'OVERDUE' ? 'text-red-600' :
                          d.status === 'CRITICAL' ? 'text-orange-600' :
                          d.status === 'WARNING' ? 'text-yellow-700' : 'text-muted-foreground'
                        }`}>
                          {formatDays(d.daysUntilEligible)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sc.color} border text-xs flex items-center gap-1 w-fit`}>
                            {sc.icon} {sc.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Trang {deadlinePage} / {deadlineTotalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={deadlinePage <= 1}
                onClick={() => setDeadlinePage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={deadlinePage >= deadlineTotalPages}
                onClick={() => setDeadlinePage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Trường hợp đặc biệt ─────────────────────────────────────────── */}
        <TabsContent value="special-cases" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Trường hợp đặc biệt rút ngắn hạn thăng quân hàm</h2>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={showAllCases}
                  onChange={e => setShowAllCases(e.target.checked)} className="rounded" />
                Hiện cả đã hủy
              </label>
            </div>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm trường hợp
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quân nhân</TableHead>
                    <TableHead>Loại đặc biệt</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Số tháng rút ngắn</TableHead>
                    <TableHead>Số quyết định</TableHead>
                    <TableHead>Ngày QĐ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialCasesLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10">Đang tải...</TableCell></TableRow>
                  ) : specialCases.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Chưa có trường hợp đặc biệt nào
                    </TableCell></TableRow>
                  ) : specialCases.map((sc) => {
                    const person =
                      (sc as any).officerCareer?.personnel ||
                      (sc as any).soldierProfile?.personnel;
                    return (
                      <TableRow key={sc.id}>
                        <TableCell>
                          {person ? (
                            <>
                              <div className="font-medium">{person.fullName}</div>
                              <div className="text-xs text-muted-foreground">{person.personnelCode}</div>
                            </>
                          ) : <span className="text-muted-foreground text-xs">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{sc.caseTypeLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{sc.title}</TableCell>
                        <TableCell className="text-center font-semibold text-green-600">
                          -{sc.reductionMonths} tháng
                        </TableCell>
                        <TableCell className="text-sm font-mono">{sc.decisionNumber ?? '-'}</TableCell>
                        <TableCell className="text-sm">{formatDate(sc.decisionDate)}</TableCell>
                        <TableCell>
                          {sc.isActive
                            ? <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs">Đang áp dụng</Badge>
                            : <Badge variant="secondary" className="text-xs">Đã hủy</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(sc)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"
                              onClick={() => deleteSpecialCase(sc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Special Case Dialog ───────────────────────────────────────────── */}
      <Dialog open={scDialog.open} onOpenChange={(o) => setScDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {scDialog.mode === 'create' ? 'Thêm trường hợp đặc biệt' : 'Chỉnh sửa trường hợp đặc biệt'}
            </DialogTitle>
            <DialogDescription>
              Trường hợp đặc biệt sẽ rút ngắn thời gian chờ thăng quân hàm tiêu chuẩn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {scDialog.mode === 'create' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ID Hồ sơ sĩ quan (officerCareerId)</Label>
                  <Input value={scForm.officerCareerId}
                    onChange={e => setScForm(f => ({ ...f, officerCareerId: e.target.value }))}
                    placeholder="cuid..." className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ID Hồ sơ chiến sĩ (soldierProfileId)</Label>
                  <Input value={scForm.soldierProfileId}
                    onChange={e => setScForm(f => ({ ...f, soldierProfileId: e.target.value }))}
                    placeholder="cuid..." className="text-xs" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Loại trường hợp đặc biệt <span className="text-red-500">*</span></Label>
              <Select value={scForm.caseType} onValueChange={v => setScForm(f => ({ ...f, caseType: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                <SelectContent>
                  {SPECIAL_CASE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tiêu đề / Tên trường hợp <span className="text-red-500">*</span></Label>
              <Input value={scForm.title} onChange={e => setScForm(f => ({ ...f, title: e.target.value }))}
                placeholder="VD: Tiến sĩ Khoa học quân sự 2023" />
            </div>

            <div className="space-y-1">
              <Label>Số tháng rút ngắn <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} max={24} value={scForm.reductionMonths}
                onChange={e => setScForm(f => ({ ...f, reductionMonths: e.target.value }))}
                placeholder="VD: 6" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Số quyết định</Label>
                <Input value={scForm.decisionNumber}
                  onChange={e => setScForm(f => ({ ...f, decisionNumber: e.target.value }))}
                  placeholder="123/QĐ-BQP" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ngày quyết định</Label>
                <Input type="date" value={scForm.decisionDate}
                  onChange={e => setScForm(f => ({ ...f, decisionDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cơ quan ban hành</Label>
              <Input value={scForm.issuedBy}
                onChange={e => setScForm(f => ({ ...f, issuedBy: e.target.value }))}
                placeholder="Bộ Quốc phòng / Học viện..." />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mô tả / Ghi chú</Label>
              <Textarea value={scForm.description}
                onChange={e => setScForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Thông tin bổ sung..." rows={2} />
            </div>

            {scDialog.mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive"
                  checked={scForm.isActive}
                  onChange={e => setScForm(f => ({ ...f, isActive: e.target.checked }))} />
                <Label htmlFor="isActive" className="text-sm cursor-pointer">Đang áp dụng</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScDialog(prev => ({ ...prev, open: false }))}>
              Hủy
            </Button>
            <Button onClick={saveSpecialCase} disabled={scSaving || !scForm.caseType || !scForm.title || !scForm.reductionMonths}>
              {scSaving ? 'Đang lưu...' : scDialog.mode === 'create' ? 'Thêm' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
