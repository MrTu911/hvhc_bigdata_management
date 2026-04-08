'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
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
  Search,
  FlaskConical,
  BookOpen,
  UserSquare2,
  ArrowRight,
  Loader2,
  LayoutGrid,
  X,
  Download,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultItem {
  id: string;
  type: 'project' | 'publication' | 'scientist';
  code: string;
  title: string;
  year: number | null;
  field: string;
  status: string;
  meta: string;
  badges: string[];
  href: string;
}

interface ResultSection {
  total: number;
  items: ResultItem[];
}

interface SearchResult {
  projects: ResultSection;
  publications: ResultSection;
  scientists: ResultSection;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { key: 'all',         label: 'Tất cả',        icon: LayoutGrid  },
  { key: 'project',     label: 'Đề tài',         icon: FlaskConical },
  { key: 'publication', label: 'Công bố KH',     icon: BookOpen    },
  { key: 'scientist',   label: 'Nhà khoa học',   icon: UserSquare2 },
] as const;

type TabKey = typeof TYPE_TABS[number]['key'];

const FIELD_OPTIONS = [
  { value: 'all', label: 'Tất cả lĩnh vực' },
  { value: 'HOC_THUAT_QUAN_SU', label: 'Học thuật quân sự' },
  { value: 'HAU_CAN_KY_THUAT',  label: 'Hậu cần kỹ thuật' },
  { value: 'KHOA_HOC_XA_HOI',   label: 'KHXH & NV' },
  { value: 'KHOA_HOC_TU_NHIEN', label: 'KH tự nhiên' },
  { value: 'CNTT',               label: 'CNTT' },
  { value: 'Y_DUOC',             label: 'Y dược' },
  { value: 'KHAC',               label: 'Khác' },
];

const TYPE_COLORS: Record<ResultItem['type'], { card: string; badge: string; dot: string }> = {
  project:     { card: 'border-l-violet-400', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  publication: { card: 'border-l-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  scientist:   { card: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const TYPE_LABEL: Record<ResultItem['type'], string> = {
  project:     'Đề tài',
  publication: 'Công bố',
  scientist:   'Nhà KH',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => currentYear - i);

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ item }: { item: ResultItem }) {
  const color = TYPE_COLORS[item.type];
  return (
    <Card className={`border-l-4 ${color.card} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type + code */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color.badge}`}>
                {TYPE_LABEL[item.type]}
              </span>
              {item.code && (
                <span className="text-xs text-muted-foreground font-mono truncate">{item.code}</span>
              )}
              {item.year && (
                <span className="text-xs text-muted-foreground">{item.year}</span>
              )}
            </div>

            {/* Title */}
            <Link href={item.href} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2 leading-snug">
              {item.title}
            </Link>

            {/* Meta */}
            {item.meta && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{item.meta}</p>
            )}

            {/* Badges */}
            {item.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.badges.slice(0, 4).map((b, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status + action */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {item.status && (
              <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground whitespace-nowrap">
                {item.status}
              </span>
            )}
            <Link href={item.href}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section block ─────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  section,
  dotColor,
}: {
  title: string;
  icon: React.ElementType;
  section: ResultSection;
  dotColor: string;
}) {
  if (section.items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          ({section.total > section.items.length ? `${section.items.length}/${section.total}` : section.total})
        </span>
      </div>
      <div className="grid gap-2">
        {section.items.map((item) => (
          <ResultCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchRepositoryPage() {
  const [query, setQuery]   = useState('');
  const [tab, setTab]       = useState<TabKey>('all');
  const [field, setField]   = useState('all');
  const [year, setYear]     = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, t: TabKey, f: string, y: string) => {
    if (!q.trim() && f === 'all' && y === 'all') {
      setResults(null);
      setTotalFound(0);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (t !== 'all') params.set('type', t);
      if (f !== 'all') params.set('field', f);
      if (y !== 'all') params.set('year', y);
      params.set('limit', '15');

      const res = await fetch(`/api/research/repository?${params}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setTotalFound(data.meta.total ?? 0);
      }
    } catch {
      // silently fail - user sees empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doSearch(query, tab, field, year);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tab, field, year, doSearch]);

  const hasResults = results && (
    results.projects.items.length > 0 ||
    results.publications.items.length > 0 ||
    results.scientists.items.length > 0
  );

  const isFiltered = query.trim() || field !== 'all' || year !== 'all';

  function clearFilters() {
    setQuery('');
    setField('all');
    setYear('all');
    setTab('all');
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: tab === 'all' ? 'all' : tab });
      if (field !== 'all') params.set('field', field);
      if (year !== 'all') params.set('year', year);
      const res = await fetch(`/api/research/export?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nckh_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // toast is not imported here — silent fail, user can retry
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Search className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Kho Nghiên cứu</h1>
              <p className="text-xs text-muted-foreground">
                Tìm kiếm thống nhất đề tài · công bố khoa học · nhà khoa học
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5 text-xs shrink-0"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Xuất Excel
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, tác giả, mã đề tài, từ khóa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          {/* Type tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {TYPE_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  tab === key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Field filter */}
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year filter */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả năm</SelectItem>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
          {isFiltered && (
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Đang tìm kiếm...</span>
          </div>
        )}

        {/* Empty start state */}
        {!loading && !isFiltered && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="p-4 rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Nhập từ khóa để tìm kiếm</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Kho nghiên cứu hợp nhất dữ liệu từ{' '}
              <Link href="/dashboard/research/projects" className="text-primary hover:underline">đề tài NCKH</Link>,{' '}
              <Link href="/dashboard/research/publications" className="text-primary hover:underline">công bố khoa học</Link> và{' '}
              <Link href="/dashboard/research/scientists" className="text-primary hover:underline">hồ sơ nhà khoa học</Link>.
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && isFiltered && results && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Search className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Không tìm thấy kết quả</p>
            <p className="text-xs text-muted-foreground">Thử thay đổi từ khóa hoặc bộ lọc</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tìm thấy <span className="font-semibold text-foreground">{totalFound}</span> kết quả
                {query.trim() && <> cho <span className="font-semibold text-foreground">&ldquo;{query.trim()}&rdquo;</span></>}
              </p>
              {totalFound > 15 && (
                <p className="text-xs text-muted-foreground">Hiển thị 15 kết quả đầu tiên mỗi loại</p>
              )}
            </div>

            {/* Project section */}
            {(tab === 'all' || tab === 'project') && results.projects && (
              <Section
                title="Đề tài nghiên cứu"
                icon={FlaskConical}
                section={results.projects}
                dotColor="bg-violet-500"
              />
            )}

            {/* Publication section */}
            {(tab === 'all' || tab === 'publication') && results.publications && (
              <Section
                title="Công bố khoa học"
                icon={BookOpen}
                section={results.publications}
                dotColor="bg-blue-500"
              />
            )}

            {/* Scientist section */}
            {(tab === 'all' || tab === 'scientist') && results.scientists && (
              <Section
                title="Nhà khoa học"
                icon={UserSquare2}
                section={results.scientists}
                dotColor="bg-emerald-500"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
