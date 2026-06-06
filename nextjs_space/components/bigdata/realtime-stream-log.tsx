'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { StreamLine, StreamLevel } from './types';

interface RealtimeStreamLogProps {
  lines: StreamLine[];
  maxLines?: number;
  className?: string;
}

const LEVEL_STYLE: Record<StreamLevel, string> = {
  OK: 'text-success',
  I: 'text-info',
  W: 'text-warning',
  E: 'text-destructive',
};

const LEVEL_LABEL: Record<StreamLevel, string> = {
  OK: 'OK',
  I: 'INFO',
  W: 'WARN',
  E: 'ERR',
};

/** Scrolling realtime log stream (template RealtimeStream equivalent). */
export function RealtimeStreamLog({ lines, maxLines = 9, className }: RealtimeStreamLogProps) {
  const visible = lines.slice(0, maxLines);

  return (
    <ScrollArea className={cn('h-[280px] rounded-lg border border-border bg-muted/30', className)}>
      <div className="space-y-1 p-3 font-mono text-xs">
        {visible.map((line) => (
          <div key={line.id} className="flex items-start gap-2 leading-relaxed">
            <span className="shrink-0 text-muted-foreground">{line.t}</span>
            <span className={cn('shrink-0 font-semibold', LEVEL_STYLE[line.lv])}>
              {LEVEL_LABEL[line.lv]}
            </span>
            <span className="text-foreground/80">{line.msg}</span>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground">Chưa có hoạt động…</p>
        )}
      </div>
    </ScrollArea>
  );
}
