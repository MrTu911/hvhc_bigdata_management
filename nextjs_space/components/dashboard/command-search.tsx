'use client';

/**
 * Global Cmd+K / Ctrl+K command search
 * Searches across research projects, publications, scientists
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  FlaskConical,
  BookOpen,
  UserSquare2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultItem {
  id: string;
  type: 'project' | 'publication' | 'scientist';
  title: string;
  code?: string;
  meta?: string;
  href: string;
}

const TYPE_ICON = {
  project:     FlaskConical,
  publication: BookOpen,
  scientist:   UserSquare2,
} as const;

const TYPE_COLOR = {
  project:     'text-violet-600',
  publication: 'text-blue-600',
  scientist:   'text-emerald-600',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResultItem[]>([]);
  const [selected, setSelected] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setItems([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/research/repository?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      if (!data.success) return;

      const flat: ResultItem[] = [
        ...data.data.projects.items.map((p: any) => ({
          id: p.id, type: 'project' as const,
          title: p.title, code: p.code, meta: p.meta, href: p.href,
        })),
        ...data.data.publications.items.map((p: any) => ({
          id: p.id, type: 'publication' as const,
          title: p.title, code: p.code, meta: p.meta, href: p.href,
        })),
        ...data.data.scientists.items.map((s: any) => ({
          id: s.id, type: 'scientist' as const,
          title: s.title, code: s.code, meta: s.meta, href: s.href,
        })),
      ];
      setItems(flat);
      setSelected(0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Keyboard navigation
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && items[selected]) {
      navigate(items[selected].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Trigger button in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors min-w-[180px]"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left text-xs">Tìm kiếm NCKH...</span>
        <kbd className="text-[10px] font-mono bg-background border rounded px-1 py-0.5 leading-none">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 border-b">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tìm đề tài, công bố, nhà khoa học..."
              className="h-12 border-0 shadow-none focus-visible:ring-0 text-sm px-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.trim() && items.length === 0 && !loading && (
              <p className="text-sm text-center text-muted-foreground py-8">
                Không tìm thấy kết quả
              </p>
            )}

            {!query.trim() && (
              <div className="px-4 py-4 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Truy cập nhanh
                </p>
                {[
                  { label: 'Tất cả đề tài NCKH', href: '/dashboard/research/projects', icon: FlaskConical, color: 'text-violet-600' },
                  { label: 'Kho công bố khoa học', href: '/dashboard/research/publications', icon: BookOpen, color: 'text-blue-600' },
                  { label: 'Hồ sơ nhà khoa học', href: '/dashboard/research/scientists', icon: UserSquare2, color: 'text-emerald-600' },
                  { label: 'Kho nghiên cứu (tìm hợp nhất)', href: '/dashboard/research/repository', icon: Search, color: 'text-gray-600' },
                ].map((s) => (
                  <button
                    key={s.href}
                    onClick={() => navigate(s.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                  >
                    <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                    <span className="text-sm">{s.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="px-2 py-2 space-y-0.5">
                {items.map((item, i) => {
                  const Icon = TYPE_ICON[item.type];
                  const color = TYPE_COLOR[item.type];
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        i === selected ? 'bg-muted' : 'hover:bg-muted/60'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                        {item.meta && (
                          <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                        )}
                      </div>
                      {item.code && (
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{item.code}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span><kbd className="font-mono border rounded px-1">↑↓</kbd> điều hướng</span>
            <span><kbd className="font-mono border rounded px-1">↵</kbd> chọn</span>
            <span><kbd className="font-mono border rounded px-1">Esc</kbd> đóng</span>
            <span className="ml-auto">
              Tìm trong{' '}
              <a href="/dashboard/research/repository" onClick={() => setOpen(false)} className="text-primary hover:underline">
                Kho nghiên cứu
              </a>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
