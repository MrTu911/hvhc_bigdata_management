'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FlaskConical,
  TrendingUp,
  Award,
  GraduationCap,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIMARY_FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần KT',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const DEGREE_LABEL: Record<string, string> = {
  TSKH: 'TSKH',
  TS:   'TS',
  ThS:  'ThS',
  CN:   'CN',
  KS:   'KS',
  CK1:  'CK I',
  CK2:  'CK II',
};

const DEGREE_COLOR: Record<string, string> = {
  TSKH: 'bg-violet-100 text-violet-700',
  TS:   'bg-indigo-100 text-indigo-700',
  ThS:  'bg-sky-100 text-sky-700',
  CN:   'bg-gray-100 text-gray-600',
  KS:   'bg-gray-100 text-gray-600',
  CK1:  'bg-teal-100 text-teal-700',
  CK2:  'bg-teal-100 text-teal-700',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScientistProfile {
  id: string;
  userId: string;
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  totalPublications: number;
  primaryField?: string;
  specialization?: string;
  degree?: string;
  academicRank?: string;
  projectLeadCount: number;
  projectMemberCount: number;
  sensitivityLevel: string;
  researchKeywords?: string[];
  user: {
    id: string;
    name: string;
    rank?: string;
    militaryId?: string;
    academicTitle?: string;
    unitRelation?: { id: string; name: string; code: string };
  };
  education?: { degree: string; institution: string; yearFrom: number; yearTo: number }[];
}

interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function HIndexBadge({ value }: { value: number }) {
  const color =
    value >= 10 ? 'bg-violet-600 text-white' :
    value >= 5  ? 'bg-indigo-500 text-white' :
    value >= 1  ? 'bg-sky-500 text-white' :
    'bg-gray-200 text-gray-500';
  return (
    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${color}`}>
      {value}
    </span>
  );
}

// ─── Profile card ──────────────────────────────────────────────────────────────

function ScientistCard({ scientist, onClick }: { scientist: ScientistProfile; onClick: () => void }) {
  const highestDegree = scientist.education?.[0]?.degree ?? scientist.degree;
  const keywords = scientist.researchKeywords?.slice(0, 3) ?? [];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-base shrink-0">
          {scientist.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {highestDegree && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEGREE_COLOR[highestDegree] ?? 'bg-gray-100 text-gray-600'}`}>
                {DEGREE_LABEL[highestDegree] ?? highestDegree}
              </span>
            )}
            {scientist.user.academicTitle && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                {scientist.user.academicTitle}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mt-0.5 truncate">
            {scientist.user.rank && <span className="text-gray-400 font-normal">{scientist.user.rank} </span>}
            {scientist.user.name}
          </p>
          {scientist.user.unitRelation && (
            <p className="text-[11px] text-gray-400 truncate">{scientist.user.unitRelation.name}</p>
          )}
        </div>
      </div>

      {/* Primary field */}
      {scientist.primaryField && (
        <div className="mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {PRIMARY_FIELD_LABELS[scientist.primaryField] ?? scientist.primaryField}
          </span>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {keywords.map((kw) => (
            <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-0.5"><HIndexBadge value={scientist.hIndex} /></div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">H-Index</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-800">{scientist.totalCitations}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Trích dẫn</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-800">{scientist.totalPublications}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Công bố</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-800">{scientist.projectLeadCount}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Đề tài</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScienceScientistsPage() {
  const router = useRouter();
  const [scientists, setScientists] = useState<ScientistProfile[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterField, setFilterField] = useState('');

  const hasActiveFilter = !!(keyword || filterField);

  // aggregate stats
  const totalHIndex    = scientists.reduce((a, s) => a + s.hIndex, 0);
  const totalCitations = scientists.reduce((a, s) => a + s.totalCitations, 0);
  const totalPubs      = scientists.reduce((a, s) => a + s.totalPublications, 0);

  const fetchScientists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (keyword)     params.set('keyword', keyword);
      if (filterField) params.set('primaryField', filterField);

      const res = await fetch(`/api/science/scientists?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setScientists(json.data ?? []);
      setMeta(json.meta ?? { total: 0, page: 1, pageSize: 20, totalPages: 0 });
    } catch {
      toast.error('Không thể tải danh sách nhà khoa học');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, filterField]);

  useEffect(() => { fetchScientists(); }, [fetchScientists]);

  function applySearch() {
    setKeyword(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput(''); setKeyword(''); setFilterField('');
    setPage(1);
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 text-white">
              <Users className="h-5 w-5" />
            </span>
            Hồ sơ Nhà Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Hồ sơ năng lực · chỉ số khoa học · lịch sử đề tài
          </p>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Nhà khoa học',  value: meta.total,      icon: <Users className="h-5 w-5 text-indigo-600" />,     bg: 'bg-indigo-50',  color: 'text-indigo-700' },
          { label: 'Tổng H-Index',  value: totalHIndex,     icon: <TrendingUp className="h-5 w-5 text-violet-600" />, bg: 'bg-violet-50',  color: 'text-violet-700' },
          { label: 'Tổng trích dẫn', value: totalCitations, icon: <BookOpen className="h-5 w-5 text-sky-600" />,      bg: 'bg-sky-50',     color: 'text-sky-700' },
          { label: 'Tổng công bố',  value: totalPubs,       icon: <FlaskConical className="h-5 w-5 text-teal-600" />, bg: 'bg-teal-50',    color: 'text-teal-700' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, quân hàm, từ khóa..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="pl-9 border-gray-200 focus:border-indigo-400"
              />
            </div>
            <Button onClick={applySearch} variant="outline" className="gap-2 border-gray-200">
              <Filter className="h-4 w-4" /> Tìm
            </Button>

            <Select value={filterField || 'all'} onValueChange={(v) => { setFilterField(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[170px] border-gray-200">
                <SelectValue placeholder="Lĩnh vực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                {Object.entries(PRIMARY_FIELD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Lưới
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="h-3.5 w-3.5" /> Bảng
              </button>
            </div>

            {hasActiveFilter && (
              <Button variant="ghost" onClick={clearFilters} className="gap-1.5 text-gray-500 hover:text-red-600">
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : scientists.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">Chưa có hồ sơ nhà khoa học</p>
          <p className="text-sm mt-1">
            {hasActiveFilter ? 'Thử thay đổi bộ lọc' : 'Dữ liệu chưa được khởi tạo'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scientists.map((s) => (
            <ScientistCard
              key={s.id}
              scientist={s}
              onClick={() => router.push(`/dashboard/science/scientists/${s.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">Nhà khoa học</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-gray-600">Đơn vị</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-gray-600">Lĩnh vực</TableHead>
                <TableHead className="w-[80px] text-xs font-semibold text-gray-600 text-center">H-Index</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-gray-600 text-center">Trích dẫn</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-gray-600 text-center">Công bố</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-gray-600 text-center">Đề tài CĐ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scientists.map((s) => {
                const highestDegree = s.education?.[0]?.degree ?? s.degree;
                return (
                  <TableRow
                    key={s.id}
                    onClick={() => router.push(`/dashboard/science/scientists/${s.id}`)}
                    className="cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {s.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {highestDegree && (
                              <span className={`text-[10px] px-1 py-0.5 rounded font-semibold ${DEGREE_COLOR[highestDegree] ?? 'bg-gray-100 text-gray-600'}`}>
                                {DEGREE_LABEL[highestDegree] ?? highestDegree}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {s.user.rank && <span className="text-gray-400 font-normal">{s.user.rank} </span>}
                              {s.user.name}
                            </span>
                          </div>
                          {s.user.academicTitle && (
                            <span className="text-[10px] text-amber-600">{s.user.academicTitle}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{s.user.unitRelation?.code ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {s.primaryField ? (PRIMARY_FIELD_LABELS[s.primaryField] ?? s.primaryField) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <HIndexBadge value={s.hIndex} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-gray-700">{s.totalCitations}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-gray-700">{s.totalPublications}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-gray-700">{s.projectLeadCount}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {meta.total} nhà khoa học · trang {page}/{meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 border-gray-200"
            >
              <ChevronLeft className="h-4 w-4" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 border-gray-200"
            >
              Tiếp <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
