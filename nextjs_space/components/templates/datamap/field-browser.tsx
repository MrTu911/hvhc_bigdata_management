'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FieldEntry {
  key: string;
  label: string;
  group: string;
  example: string;
  type: 'text' | 'date' | 'list';
}

interface FieldBrowserProps {
  entityType: string;
  onSelect?: (fieldKey: string) => void;
  selectedKey?: string;
}

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-50 text-blue-700',
  date: 'bg-purple-50 text-purple-700',
  list: 'bg-orange-50 text-orange-700',
};

export function FieldBrowser({ entityType, onSelect, selectedKey }: FieldBrowserProps) {
  const [fields, setFields] = useState<FieldEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    async function fetchFields() {
      setLoading(true);
      try {
        const res = await fetch(`/api/templates/fields?entityType=${encodeURIComponent(entityType)}`);
        const json = await res.json();
        if (!res.ok || !json.success) return;
        const catalog = json.data as Record<string, FieldEntry[]>;
        setFields(Object.values(catalog).flat());
      } catch {
        // silently fail — field list is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchFields();
  }, [entityType]);

  const filtered = useMemo(() => {
    if (!keyword) return fields;
    const q = keyword.toLowerCase();
    return fields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.group.toLowerCase().includes(q),
    );
  }, [fields, keyword]);

  // Group fields
  const grouped = useMemo(() => {
    const map = new Map<string, FieldEntry[]>();
    for (const f of filtered) {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push(f);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Đang tải danh sách field...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Tìm field..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {grouped.size === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6">Không tìm thấy field</div>
      )}

      {Array.from(grouped.entries()).map(([group, groupFields]) => (
        <div key={group}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {group}
          </div>
          <div className="space-y-0.5">
            {groupFields.map((f) => (
              <button
                key={f.key}
                onClick={() => onSelect?.(f.key)}
                className={cn(
                  'w-full flex items-start gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                  selectedKey === f.key
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted',
                )}
              >
                <span className={cn('text-xs px-1 rounded mt-0.5 shrink-0', TYPE_COLORS[f.type])}>
                  {f.type}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{f.key}</div>
                  <div className="text-xs text-muted-foreground truncate">{f.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
