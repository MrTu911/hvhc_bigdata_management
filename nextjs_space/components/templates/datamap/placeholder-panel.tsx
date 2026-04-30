'use client';

import { AlertTriangle, CheckCircle2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PlaceholderItem {
  name: string;
  mapped: boolean;
  mappedTo?: string;
}

interface PlaceholderPanelProps {
  placeholders: PlaceholderItem[];
  selectedPlaceholder?: string;
  onSelect?: (name: string) => void;
}

export function PlaceholderPanel({ placeholders, selectedPlaceholder, onSelect }: PlaceholderPanelProps) {
  const unmapped = placeholders.filter((p) => !p.mapped);
  const mapped = placeholders.filter((p) => p.mapped);

  if (placeholders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Chưa có placeholder — hãy upload file template
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unmapped.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-amber-600 mb-1">
            <AlertTriangle className="h-3 w-3" />
            Chưa ánh xạ ({unmapped.length})
          </div>
          <div className="space-y-1">
            {unmapped.map((p) => (
              <button
                key={p.name}
                onClick={() => onSelect?.(p.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                  selectedPlaceholder === p.name
                    ? 'bg-amber-50 border border-amber-200'
                    : 'hover:bg-muted',
                )}
              >
                <Tag className="h-3 w-3 text-amber-500 shrink-0" />
                <code className="font-mono text-xs">{`{${p.name}}`}</code>
                <Badge variant="secondary" className="ml-auto text-xs">chưa map</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {mapped.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 mb-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã ánh xạ ({mapped.length})
          </div>
          <div className="space-y-1">
            {mapped.map((p) => (
              <button
                key={p.name}
                onClick={() => onSelect?.(p.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                  selectedPlaceholder === p.name
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-muted',
                )}
              >
                <Tag className="h-3 w-3 text-green-500 shrink-0" />
                <code className="font-mono text-xs">{`{${p.name}}`}</code>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                  → {p.mappedTo}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
