'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  FlaskConical,
  BookOpen,
  Users,
  Zap,
  Clock,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SearchEntityType = 'project' | 'work' | 'scientist';

interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  ensembleScore: number;
  tsScore: number;
  trgmScore: number;
  semanticScore: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: SearchEntityType | 'all';
  processingMs: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'all',       label: 'Tất cả',        icon: <Search className="h-3.5 w-3.5" /> },
  { value: 'project',   label: 'Đề tài',         icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { value: 'work',      label: 'Công bố KH',     icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: 'scientist', label: 'Nhà khoa học',   icon: <Users className="h-3.5 w-3.5" /> },
] as const;

const TYPE_ICON: Record<SearchEntityType, React.ReactNode> = {
  project:   <FlaskConical className="h-4 w-4 text-violet-500" />,
  work:      <BookOpen className="h-4 w-4 text-sky-500" />,
  scientist: <Users className="h-4 w-4 text-indigo-500" />,
};

const TYPE_LABEL: Record<SearchEntityType, string> = {
  project:   'Đề tài',
  work:      'Công bố KH',
  scientist: 'Nhà khoa học',
};

const TYPE_BADGE: Record<SearchEntityType, string> = {
  project:   'bg-violet-50 text-violet-700 border-violet-100',
  work:      'bg-sky-50 text-sky-700 border-sky-100',
  scientist: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const DETAIL_PATH: Record<SearchEntityType, string> = {
  project:   '/dashboard/science/projects',
  work:      '/dashboard/science/works',
  scientist: '/dashboard/science/scientists',
};

const SUGGESTED_QUERIES = [
  'hậu cần quân sự', 'trí tuệ nhân tạo', 'y học quân sự',
  'mạng máy tính', 'vũ khí kỹ thuật', 'quản lý nhà nước',
];

// ─── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[9px] text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-gray-500 w-6 text-right">{pct}</span>
    </div>
  );
}

// ─── Result item ───────────────────────────────────────────────────────────────

function ResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const score = Math.round(result.ensembleScore * 100);
  const scoreColor =
    score >= 70 ? 'text-emerald-600' :
    score >= 40 ? 'text-amber-600'   :
    'text-gray-500';

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="mt-0.5 shrink-0">{TYPE_ICON[result.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
              {result.title}
            </p>
            <span className={`text-sm font-bold shrink-0 ${scoreColor}`}>{score}%</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_BADGE[result.type]}`}>
              {TYPE_LABEL[result.type]}
            </span>
          </div>

          {/* Score breakdown */}
          <div className="space-y-0.5">
            <ScoreBar label="Full-text" value={result.tsScore}       color="bg-blue-400" />
            <ScoreBar label="Trigram"   value={result.trgmScore}     color="bg-violet-400" />
            <ScoreBar label="Semantic"  value={result.semanticScore} color="bg-teal-400" />
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 shrink-0 mt-0.5 transition-colors" />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScienceSearchPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [queryInput, setQueryInput] = useState('');
  const [entityType, setEntityType] = useState<'all' | SearchEntityType>('all');
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeSearch = useCallback(async (q: string, type: string) => {
    if (q.trim().length < 2) {
      toast.error('Từ khóa phải có ít nhất 2 ký tự');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), type, limit: '30' });
      const res = await fetch(`/api/science/search?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.formErrors?.[0] ?? 'Lỗi tìm kiếm');
      }
      const json = await res.json();
      setResponse(json.data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Không thể thực hiện tìm kiếm');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch() {
    executeSearch(queryInput, entityType);
  }

  function handleSuggest(q: string) {
    setQueryInput(q);
    executeSearch(q, entityType);
  }

  function handleResultClick(result: SearchResult) {
    startTransition(() => {
      router.push(`${DETAIL_PATH[result.type]}/${result.id}`);
    });
  }

  // Group results by type
  const grouped = response?.results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {}) ?? {};

  const groupOrder: SearchEntityType[] = ['project', 'work', 'scientist'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white mb-4 shadow-lg">
          <BrainCircuit className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Tìm kiếm Khoa học thông minh</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kết hợp tìm kiếm toàn văn · trigram · ngữ nghĩa (pgvector) với điểm ensemble BM25
        </p>
      </div>

      {/* ── Search box ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-5">
          {/* Type selector */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEntityType(opt.value as typeof entityType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  entityType === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Input + button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Nhập từ khóa tìm kiếm (VD: hậu cần kỹ thuật, AI, y học...)"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11 border-gray-200 focus:border-indigo-400 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Tìm
            </Button>
          </div>

          {/* Suggested queries */}
          {!searched && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wide font-medium">Gợi ý tìm kiếm</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggest(q)}
                    className="text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && response && (
        <>
          {/* Meta bar */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              <span className="font-semibold text-gray-800">{response.total}</span> kết quả
              {response.query && (
                <> cho <span className="font-semibold text-indigo-600">"{response.query}"</span></>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {response.processingMs}ms
            </span>
          </div>

          {/* Score legend */}
          <div className="flex items-center gap-4 text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>Điểm ensemble = 40% full-text + 30% trigram + 30% ngữ nghĩa</span>
            <span className="flex items-center gap-2 ml-auto">
              <span className="flex items-center gap-1"><span className="h-2 w-4 bg-blue-400 rounded-full inline-block" /> Full-text</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 bg-violet-400 rounded-full inline-block" /> Trigram</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 bg-teal-400 rounded-full inline-block" /> Ngữ nghĩa</span>
            </span>
          </div>

          {response.total === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">Không tìm thấy kết quả</p>
              <p className="text-sm mt-1">Thử từ khóa khác hoặc chọn loại thực thể khác</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entityType === 'all' ? (
                groupOrder.map((type) => {
                  const items = grouped[type];
                  if (!items?.length) return null;
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        {TYPE_ICON[type]}
                        <h2 className="text-sm font-semibold text-gray-700">{TYPE_LABEL[type]}</h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((r) => (
                          <ResultItem key={r.id} result={r} onClick={() => handleResultClick(r)} />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-2">
                  {response.results.map((r) => (
                    <ResultItem key={r.id} result={r} onClick={() => handleResultClick(r)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
