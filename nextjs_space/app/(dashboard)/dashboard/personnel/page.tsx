'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  Shield,
  Star,
  Search,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Building2,
  UserCheck,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PersonnelItem {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  militaryId?: string;
  rank?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  workStatus?: string;
  personnelType?: string;
  educationLevel?: string;
  specialization?: string;
  placeOfOrigin?: string;
  dateOfBirth?: string;
  gender?: string;
  joinDate?: string;
  startDate?: string;
  unitId?: string;
  unitRelation?: { id: string; name: string; code: string; type: string };
  scientificProfile?: { id: string };
}

interface PersonnelStats {
  summary: {
    total: number;
    active: number;
    retired: number;
    transferred: number;
    officerCount: number;
    soldierCount: number;
    partyMemberCount: number;
    totalUnits: number;
  };
  typeStats?: {
    OFFICER: number;
    SOLDIER: number;
    CIVILIAN: number;
    TOTAL: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WORK_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang công tác',
  TRANSFERRED: 'Chuyển công tác',
  RETIRED: 'Nghỉ hưu',
  SUSPENDED: 'Tạm đình chỉ',
  RESIGNED: 'Thôi việc',
};

const WORK_STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRANSFERRED: 'bg-blue-100 text-blue-700 border-blue-200',
  RETIRED: 'bg-gray-100 text-gray-600 border-gray-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
  RESIGNED: 'bg-red-100 text-red-600 border-red-200',
};

const PERSONNEL_TYPE_LABELS: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Sĩ quan',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'NC viên',
  QUAN_NHAN_CHUYEN_NGHIEP: 'QNCN',
  CONG_NHAN_VIEN: 'CNV',
  HOC_VIEN_QUAN_SU: 'Học viên',
};

const PERSONNEL_TYPE_STYLE: Record<string, string> = {
  CAN_BO_CHI_HUY: 'bg-red-50 text-red-700 border-red-200',
  GIANG_VIEN: 'bg-blue-50 text-blue-700 border-blue-200',
  NGHIEN_CUU_VIEN: 'bg-purple-50 text-purple-700 border-purple-200',
  QUAN_NHAN_CHUYEN_NGHIEP: 'bg-amber-50 text-amber-700 border-amber-200',
  CONG_NHAN_VIEN: 'bg-teal-50 text-teal-700 border-teal-200',
  HOC_VIEN_QUAN_SU: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-red-500 to-red-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-amber-500 to-amber-600',
    'from-teal-500 to-teal-600',
    'from-indigo-500 to-indigo-600',
    'from-rose-500 to-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subLabel?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute inset-0 opacity-5 ${color}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            )}
            {subLabel && !loading && (
              <p className="text-xs text-gray-400">{subLabel}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-').replace('-600', '-500')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PersonnelAvatar({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PersonnelPage() {
  const router = useRouter();

  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [stats, setStats] = useState<PersonnelStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [typeStats, setTypeStats] = useState<{ OFFICER: number; SOLDIER: number; CIVILIAN: number; TOTAL: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorkStatus, setFilterWorkStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/personnel/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // stats non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch list ───────────────────────────────────────────────────────────
  const fetchPersonnel = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(filterWorkStatus !== 'ALL' && { workStatus: filterWorkStatus }),
        ...(filterType !== 'ALL' && { type: filterType }),
      });

      const res = await fetch(`/api/personnel?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi tải danh sách');
      }
      const data = await res.json();
      setPersonnel(data.data || []);
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 });
      if (data.typeStats) setTypeStats(data.typeStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterWorkStatus, filterType]);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchPersonnel(1), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [fetchPersonnel]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePageChange = (newPage: number) => fetchPersonnel(newPage);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterWorkStatus('ALL');
    setFilterType('ALL');
  };

  const hasActiveFilters = searchQuery || filterWorkStatus !== 'ALL' || filterType !== 'ALL';

  // ── Derived stats for cards ───────────────────────────────────────────────
  const summaryStats = stats?.summary;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-screen-2xl mx-auto p-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Quản lý Hồ sơ Cán bộ
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  CSDL quân nhân theo QĐ 144/BQP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-100"
                onClick={() => fetchPersonnel(pagination.page)}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Xuất Excel
              </Button>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Tổng cán bộ"
              value={summaryStats?.total ?? 0}
              subLabel={`${summaryStats?.totalUnits ?? 0} đơn vị`}
              color="bg-blue-600"
              loading={statsLoading}
            />
            <StatCard
              icon={UserCheck}
              label="Đang công tác"
              value={summaryStats?.active ?? 0}
              subLabel={summaryStats ? `${Math.round((summaryStats.active / Math.max(summaryStats.total, 1)) * 100)}% tổng số` : ''}
              color="bg-emerald-600"
              loading={statsLoading}
            />
            <StatCard
              icon={Award}
              label="Sĩ quan / HSQ-BS"
              value={summaryStats ? `${summaryStats.officerCount} / ${summaryStats.soldierCount}` : '—'}
              subLabel="Theo diện quản lý"
              color="bg-red-600"
              loading={statsLoading}
            />
            <StatCard
              icon={Star}
              label="Đảng viên"
              value={summaryStats?.partyMemberCount ?? 0}
              subLabel={summaryStats ? `${Math.round((summaryStats.partyMemberCount / Math.max(summaryStats.total, 1)) * 100)}% tổng số` : ''}
              color="bg-purple-600"
              loading={statsLoading}
            />
          </div>

          {/* ── Type quick-filter chips (from typeStats) ── */}
          {typeStats && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'Tất cả', count: typeStats.TOTAL, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                { key: 'OFFICER', label: 'Sĩ quan', count: typeStats.OFFICER, color: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
                { key: 'SOLDIER', label: 'HSQ-BS', count: typeStats.SOLDIER, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
                { key: 'CIVILIAN', label: 'Dân sự', count: typeStats.CIVILIAN, color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' },
              ].map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setFilterType(chip.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${chip.color} ${filterType === chip.key ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                >
                  {chip.label}
                  <span className="ml-1.5 font-bold">{chip.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── List Card ── */}
          <Card className="border-0 shadow-sm overflow-hidden">
            {/* Search & filter bar */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Tìm theo tên, mã CB, số quân..."
                      className="pl-9 bg-gray-50 border-gray-200 focus:bg-white text-sm"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 shrink-0 ${showFilters ? 'bg-gray-100' : ''}`}
                    onClick={() => setShowFilters(v => !v)}
                  >
                    <Filter className="h-4 w-4" />
                    Lọc
                    <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 shrink-0"
                      onClick={handleClearFilters}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Xóa lọc
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 shrink-0">
                  <span className="font-semibold text-gray-700">{pagination.total}</span> cán bộ
                </p>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">Trạng thái:</span>
                    <Select value={filterWorkStatus} onValueChange={setFilterWorkStatus}>
                      <SelectTrigger className="h-8 w-44 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                        {Object.entries(WORK_STATUS_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-50/80">
                    <TableHead className="w-[280px] font-semibold text-gray-700 py-3">Cán bộ</TableHead>
                    <TableHead className="font-semibold text-gray-700">Cấp bậc</TableHead>
                    <TableHead className="font-semibold text-gray-700">Chức vụ</TableHead>
                    <TableHead className="font-semibold text-gray-700">Đơn vị</TableHead>
                    <TableHead className="font-semibold text-gray-700">Loại CB</TableHead>
                    <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 pr-5">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : personnel.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="p-4 rounded-full bg-gray-100">
                            <Users className="h-8 w-8" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-500">Không tìm thấy cán bộ</p>
                            <p className="text-sm mt-1">
                              {hasActiveFilters ? 'Thử thay đổi điều kiện tìm kiếm' : 'Chưa có dữ liệu trong hệ thống'}
                            </p>
                          </div>
                          {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={handleClearFilters}>
                              Xóa bộ lọc
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    personnel.map(person => (
                      <TableRow
                        key={person.id}
                        className="group cursor-pointer hover:bg-blue-50/40 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(`/dashboard/personnel/${person.id}`)}
                      >
                        {/* Name + meta */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <PersonnelAvatar name={person.name} avatar={person.avatar} />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-blue-700 transition-colors">
                                {person.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {[person.employeeId, person.militaryId].filter(Boolean).join(' · ') || person.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Rank */}
                        <TableCell>
                          {person.rank ? (
                            <span className="text-sm font-medium text-gray-700">{person.rank}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </TableCell>

                        {/* Position */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-sm text-gray-600 max-w-[180px] truncate block">
                                {person.position || <span className="text-gray-300">—</span>}
                              </span>
                            </TooltipTrigger>
                            {person.position && (
                              <TooltipContent>
                                <p>{person.position}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>

                        {/* Unit */}
                        <TableCell>
                          {person.unitRelation ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-sm text-gray-600 max-w-[160px] truncate block">
                                    {person.unitRelation.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{person.unitRelation.name}</p>
                                  <p className="text-xs opacity-70">{person.unitRelation.code}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Personnel type */}
                        <TableCell>
                          {person.personnelType ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${PERSONNEL_TYPE_STYLE[person.personnelType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {PERSONNEL_TYPE_LABELS[person.personnelType] || person.personnelType}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Work status */}
                        <TableCell>
                          {person.workStatus ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${WORK_STATUS_STYLE[person.workStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${person.workStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              {WORK_STATUS_LABELS[person.workStatus] || person.workStatus}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/personnel/${person.id}`); }}
                          >
                            <Eye className="h-4 w-4" />
                            Hồ sơ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  Trang <span className="font-medium text-gray-700">{pagination.page}</span> / {pagination.totalPages}
                  &nbsp;·&nbsp;
                  Hiển thị <span className="font-medium text-gray-700">{personnel.length}</span> / {pagination.total} cán bộ
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* Page number buttons */}
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, pagination.page - 2);
                    const pageNum = start + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-8 w-8 p-0 text-xs ${pageNum === pagination.page ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* ── Bottom meta row ── */}
          {!loading && personnel.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Dữ liệu cập nhật theo thời gian thực
              </span>
              <span>CSDL cán bộ · QĐ 144/BQP</span>
            </div>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
}
