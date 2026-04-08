'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus, Search, Download, Upload, BookOpen, Globe,
  FlaskConical, Award, BookMarked, FileText,
  ChevronLeft, ChevronRight, Loader2, X, Filter,
  ArrowRight, TrendingUp, Quote, FileSpreadsheet,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE:    'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO:   'Sách chuyên khảo',
  GIAO_TRINH:         'Giáo trình',
  SANG_KIEN:          'Sáng kiến',
  PATENT:             'Bằng sáng chế',
  BAO_CAO_KH:         'Báo cáo KH',
  LUAN_VAN:           'Luận văn',
  LUAN_AN:            'Luận án',
};

const PUB_TYPE_STYLE: Record<string, { pill: string; icon: React.ElementType }> = {
  BAI_BAO_QUOC_TE:    { pill: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Globe },
  BAI_BAO_TRONG_NUOC: { pill: 'bg-cyan-100 text-cyan-700 border-cyan-200',     icon: FileText },
  SACH_CHUYEN_KHAO:   { pill: 'bg-amber-100 text-amber-700 border-amber-200',  icon: BookMarked },
  GIAO_TRINH:         { pill: 'bg-orange-100 text-orange-700 border-orange-200',icon: BookOpen },
  SANG_KIEN:          { pill: 'bg-green-100 text-green-700 border-green-200',   icon: FlaskConical },
  PATENT:             { pill: 'bg-purple-100 text-purple-700 border-purple-200',icon: Award },
  BAO_CAO_KH:         { pill: 'bg-indigo-100 text-indigo-700 border-indigo-200',icon: FileText },
  LUAN_VAN:           { pill: 'bg-rose-100 text-rose-700 border-rose-200',      icon: BookOpen },
  LUAN_AN:            { pill: 'bg-pink-100 text-pink-700 border-pink-200',      icon: BookOpen },
};

// Sentinel values to avoid Radix UI empty-string constraint
const ALL_TYPE   = '__ALL_TYPE__';
const ALL_YEAR   = '__ALL_YEAR__';
const ALL_INDEX  = '__ALL_INDEX__';
const ONLY_ISI   = 'isi';
const ONLY_SCOPUS = 'scopus';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Publication {
  id: string;
  title: string;
  titleEn?: string | null;
  pubType: string;
  publishedYear: number;
  authorsText?: string | null;
  journal?: string | null;
  doi?: string | null;
  isISI: boolean;
  isScopus: boolean;
  scopusQ?: string | null;
  impactFactor?: number | null;
  ranking?: string | null;
  citationCount: number;
  status: string;
  author: { id: string; name: string; rank?: string | null };
  project?: { id: string; projectCode: string; title: string } | null;
  keywords: string[];
}

interface PubStats {
  total: number;
  byType: Record<string, number>;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function IndexBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${color}`}>
      {label}
    </span>
  );
}

function PubTypePill({ pubType }: { pubType: string }) {
  const s = PUB_TYPE_STYLE[pubType] ?? { pill: 'bg-gray-100 text-gray-600 border-gray-200', icon: FileText };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.pill} whitespace-nowrap`}>
      <Icon className="h-3 w-3" />
      {PUB_TYPE_LABELS[pubType] ?? pubType}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicationsPage() {
  const router = useRouter();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [stats, setStats] = useState<PubStats>({ total: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // ── Filter state (empty string = no filter; sentinel only for Select UI) ────
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('');   // '' = all
  const [filterYear, setFilterYear]     = useState('');   // '' = all
  const [filterIndex, setFilterIndex]   = useState('');   // '' | 'isi' | 'scopus'

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen]     = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'bqp' | 'hdcgsnn'>('csv');
  const [exporting, setExporting]       = useState(false);
  const [importOpen, setImportOpen]     = useState(false);
  const [importFormat, setImportFormat] = useState<'bibtex' | 'excel'>('bibtex');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting]       = useState(false);
  const [excelRows, setExcelRows]       = useState<Record<string, unknown>[] | null>(null);
  const [excelFileName, setExcelFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilter = !!(search || filterType || filterYear || filterIndex);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const fetchPublications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)       params.set('keyword', search);
      if (filterType)   params.set('pubType', filterType);
      if (filterYear)   params.set('year', filterYear);
      if (filterIndex === ONLY_ISI)    params.set('isISI', 'true');
      if (filterIndex === ONLY_SCOPUS) params.set('isScopus', 'true');

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/research/publications?${params}`),
        fetch('/api/research/publications/stats'),
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setPublications(data.data ?? []);
        setTotal(data.meta?.total ?? 0);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data ?? { total: 0, byType: {} });
      }
    } catch {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterYear, filterIndex]);

  useEffect(() => { fetchPublications(); }, [fetchPublications]);
  useEffect(() => { setPage(1); }, [search, filterType, filterYear, filterIndex]);

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSearch(''); setSearchInput('');
    setFilterType(''); setFilterYear(''); setFilterIndex('');
    setPage(1);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/research/publications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          pubType: filterType || undefined,
          year: filterYear ? Number(filterYear) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Export thất bại');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cong_bo_${exportFormat}_${new Date().toISOString().slice(0, 10)}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất file thành công');
      setExportOpen(false);
    } catch {
      toast.error('Xuất file thất bại');
    } finally {
      setExporting(false);
    }
  };

  const handleExcelFile = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      setExcelRows(rows);
      setExcelFileName(file.name);
    } catch {
      toast.error('Không đọc được file Excel');
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const headers = [
      'Tiêu đề', 'Tiêu đề (EN)', 'Loại công bố', 'Năm công bố', 'Danh sách tác giả',
      'DOI', 'ISSN', 'ISBN', 'Tạp chí / Hội thảo / NXB', 'Tập (Volume)', 'Số (Issue)',
      'Trang', 'Nhà xuất bản', 'ISI', 'Scopus', 'Scopus Q', 'Impact Factor',
      'Tên hội nghị', 'URL toàn văn', 'Từ khóa',
    ];
    const sampleRow = [
      'Ứng dụng AI trong quản lý hậu cần quân sự', '', 'Bài báo quốc tế', '2024',
      'Nguyễn Văn A; Trần Thị B', '10.1234/example', '', '', 'Journal of Defense Technology',
      '12', '3', '45-60', '', 'TRUE', '', 'Q2', '1.5', '', '', 'AI; quân sự; hậu cần',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Công bố KH');
    XLSX.writeFile(wb, 'template_cong_bo_KH.xlsx');
  };

  const handleImport = async () => {
    if (importFormat === 'bibtex' && !importContent.trim()) {
      toast.error('Nhập nội dung BibTeX trước khi import'); return;
    }
    if (importFormat === 'excel' && !excelRows) {
      toast.error('Chọn file Excel trước khi import'); return;
    }
    setImporting(true);
    try {
      const body = importFormat === 'bibtex'
        ? { format: 'bibtex', content: importContent }
        : { format: 'excel', rows: excelRows };
      const res = await fetch('/api/research/publications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Import thất bại');
      const { imported, failed } = data.data;
      toast.success(`Import thành công ${imported} bản ghi${failed > 0 ? `, ${failed} lỗi` : ''}`);
      setImportOpen(false);
      setImportContent('');
      setExcelRows(null);
      setExcelFileName('');
      fetchPublications();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Import thất bại');
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const intlCount  = stats.byType?.BAI_BAO_QUOC_TE ?? 0;
  const innovCount = (stats.byType?.SANG_KIEN ?? 0) + (stats.byType?.PATENT ?? 0);
  const thesisCount = (stats.byType?.LUAN_VAN ?? 0) + (stats.byType?.LUAN_AN ?? 0);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-blue-600 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            Kho Công bố Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Bài báo · Sách · Sáng kiến · Bằng sáng chế · Luận văn / Luận án
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            onClick={() => router.push('/dashboard/research/publications/new')}
          >
            <Plus className="h-4 w-4" />
            Thêm công bố
          </Button>
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng công bố',        value: stats.total,  icon: <BookOpen className="h-5 w-5 text-blue-600" />,   bg: 'bg-blue-50',    color: 'text-blue-700' },
          { label: 'Bài báo quốc tế',     value: intlCount,    icon: <Globe className="h-5 w-5 text-indigo-600" />,    bg: 'bg-indigo-50',  color: 'text-indigo-700' },
          { label: 'Sáng kiến / Bằng sáng chế', value: innovCount, icon: <Award className="h-5 w-5 text-green-600" />, bg: 'bg-green-50',   color: 'text-green-700' },
          { label: 'Luận văn / Luận án',  value: thesisCount,  icon: <BookMarked className="h-5 w-5 text-rose-600" />, bg: 'bg-rose-50',    color: 'text-rose-700' },
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

      {/* ── Type breakdown chips ─────────────────────────────────────────────── */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium">Phân loại:</span>
          {Object.entries(PUB_TYPE_LABELS).map(([key, label]) => {
            const count = stats.byType?.[key] ?? 0;
            if (count === 0) return null;
            const s = PUB_TYPE_STYLE[key];
            const active = filterType === key;
            return (
              <button
                key={key}
                onClick={() => { setFilterType(active ? '' : key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? (s?.pill ?? 'bg-gray-100 text-gray-700 border-gray-300') + ' ring-2 ring-offset-1 ring-current shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {label}
                <span className={`font-bold ${active ? '' : 'text-gray-400'}`}>{count}</span>
              </button>
            );
          })}
          {filterType && (
            <button onClick={() => { setFilterType(''); setPage(1); }} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />

            {/* Search */}
            <div className="flex items-center gap-1 flex-1 min-w-[220px]">
              <Input
                placeholder="Tiêu đề, tác giả, DOI, tạp chí..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={applySearch}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Type — sentinel ALL_TYPE prevents empty-string error */}
            <Select
              value={filterType || ALL_TYPE}
              onValueChange={(v) => { setFilterType(v === ALL_TYPE ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Loại công bố" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPE}>Tất cả loại</SelectItem>
                {Object.entries(PUB_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year — sentinel ALL_YEAR */}
            <Select
              value={filterYear || ALL_YEAR}
              onValueChange={(v) => { setFilterYear(v === ALL_YEAR ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_YEAR}>Tất cả năm</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Index filter — sentinel ALL_INDEX */}
            <Select
              value={filterIndex || ALL_INDEX}
              onValueChange={(v) => { setFilterIndex(v === ALL_INDEX ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Chỉ số" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_INDEX}>Tất cả chỉ số</SelectItem>
                <SelectItem value={ONLY_ISI}>ISI</SelectItem>
                <SelectItem value={ONLY_SCOPUS}>Scopus</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </button>
            )}

            <span className="ml-auto text-xs text-gray-400 shrink-0">{total} công bố</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin mb-3" />
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      ) : publications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BookOpen className="h-12 w-12 mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Chưa có công bố nào</p>
          {hasActiveFilter ? (
            <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
              Xóa bộ lọc
            </button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/research/publications/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm công bố đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 w-[42%]">Tiêu đề / Tác giả</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 w-[120px]">Loại</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 w-[60px] text-center">Năm</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Tạp chí / NXB</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 w-[110px] text-center">Chỉ số</TableHead>
                  <TableHead className="w-[32px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {publications.map((pub) => (
                  <TableRow
                    key={pub.id}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors group"
                    onClick={() => router.push(`/dashboard/research/publications/${pub.id}`)}
                  >
                    {/* Title + authors */}
                    <TableCell>
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                        {pub.title}
                      </p>
                      {pub.authorsText && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pub.authorsText}</p>
                      )}
                      {pub.doi && (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono text-blue-500 hover:underline mt-0.5 inline-block"
                        >
                          {pub.doi}
                        </a>
                      )}
                      {pub.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pub.keywords.slice(0, 3).map((k) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                              {k}
                            </span>
                          ))}
                          {pub.keywords.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{pub.keywords.length - 3}</span>
                          )}
                        </div>
                      )}
                      {pub.project && (
                        <div className="mt-1 text-[10px] text-violet-600">
                          ↳ {pub.project.projectCode}
                        </div>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <PubTypePill pubType={pub.pubType} />
                    </TableCell>

                    {/* Year */}
                    <TableCell className="text-center">
                      <span className="font-mono text-sm font-semibold text-gray-700">{pub.publishedYear}</span>
                    </TableCell>

                    {/* Journal */}
                    <TableCell>
                      {pub.journal && (
                        <p className="text-sm text-gray-700 line-clamp-1 font-medium">{pub.journal}</p>
                      )}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {pub.isISI && (
                          <IndexBadge label="ISI" color="bg-blue-50 text-blue-700 border-blue-200" />
                        )}
                        {pub.isScopus && (
                          <IndexBadge label="Scopus" color="bg-indigo-50 text-indigo-700 border-indigo-200" />
                        )}
                        {pub.scopusQ && (
                          <IndexBadge label={pub.scopusQ} color="bg-violet-50 text-violet-700 border-violet-200" />
                        )}
                        {pub.ranking && !pub.isISI && !pub.isScopus && (
                          <span className="text-[10px] text-gray-400">{pub.ranking}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Metrics */}
                    <TableCell className="text-center">
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {pub.impactFactor != null && (
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="font-semibold text-gray-700">IF {pub.impactFactor}</span>
                          </div>
                        )}
                        {pub.citationCount > 0 && (
                          <div className="flex items-center justify-center gap-1">
                            <Quote className="h-3 w-3 text-gray-400" />
                            <span>{pub.citationCount}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Arrow */}
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / <span className="font-medium">{total}</span> công bố
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-7 w-7 flex items-center justify-center rounded text-xs font-medium border transition-colors ${
                        page === n
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Export dialog ────────────────────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xuất danh sách công bố</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Định dạng xuất</label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Phổ thông)</SelectItem>
                  <SelectItem value="bqp">Excel – Biểu 2 BQP</SelectItem>
                  <SelectItem value="hdcgsnn">Excel – Mẫu HĐCGSNN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border">
              Sẽ xuất <span className="font-semibold">{total}</span> công bố theo bộ lọc hiện tại.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Hủy</Button>
            <Button onClick={handleExport} disabled={exporting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {exporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Download className="h-4 w-4 mr-2" />
              Xuất file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import dialog ────────────────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import công bố khoa học</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-medium">Định dạng nguồn</label>
                <Select value={importFormat} onValueChange={(v) => {
                  setImportFormat(v as typeof importFormat);
                  setExcelRows(null); setExcelFileName('');
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bibtex">BibTeX</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {importFormat === 'excel' && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownloadTemplate}>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Tải template
                </Button>
              )}
            </div>

            {importFormat === 'bibtex' ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Dán nội dung BibTeX</label>
                <Textarea
                  rows={12}
                  placeholder={'@article{key,\n  title = {Tiêu đề},\n  author = {Tác giả},\n  year = {2024},\n  journal = {Tạp chí},\n  doi = {10.xxx/yyy}\n}'}
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-500">
                  Hỗ trợ: @article, @book, @inproceedings, @phdthesis, @mastersthesis, @misc
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleExcelFile(file);
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                >
                  {excelFileName ? (
                    <div className="space-y-1">
                      <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-700">{excelFileName}</p>
                      <p className="text-xs text-muted-foreground">{excelRows?.length ?? 0} dòng dữ liệu — nhấn để đổi file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Kéo thả hoặc nhấn để chọn file .xlsx</p>
                      <p className="text-xs text-muted-foreground">Sử dụng template chuẩn để đảm bảo đúng định dạng</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportOpen(false);
              setExcelRows(null); setExcelFileName('');
            }}>Hủy</Button>
            <Button onClick={handleImport} disabled={importing} className="bg-blue-600 hover:bg-blue-700 text-white">
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
