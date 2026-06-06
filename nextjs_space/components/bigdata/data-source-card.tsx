'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { StatusTag } from './status-tag';
import { formatShort } from './format';
import {
  SOURCE_STATUS_KIND,
  SOURCE_STATUS_LABEL,
  SOURCE_TYPE_ICON,
  SOURCE_TYPE_LABEL,
} from './source-helpers';
import type { DataSourceVM } from './types';

interface DataSourceCardProps {
  source: DataSourceVM;
  onOpen: (source: DataSourceVM) => void;
  className?: string;
}

/** Data source catalog card (template DataSourceGrid item equivalent). */
export function DataSourceCard({ source, onOpen, className }: DataSourceCardProps) {
  const TypeIcon = SOURCE_TYPE_ICON[source.type];

  return (
    <button
      type="button"
      onClick={() => onOpen(source)}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm',
        'transition-colors hover:border-primary/40 hover:bg-muted/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{source.title}</p>
            <p className="font-mono text-xs text-muted-foreground">{source.name}</p>
          </div>
        </div>
        <StatusTag status={SOURCE_STATUS_KIND[source.status]} label={SOURCE_STATUS_LABEL[source.status]} />
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{source.description}</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Bản ghi</p>
          <p className="font-semibold text-foreground">
            {source.recordCount > 0 ? formatShort(source.recordCount) : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Dung lượng</p>
          <p className="font-semibold text-foreground">{source.size}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bảng</p>
          <p className="font-semibold text-foreground">{source.tableCount}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{SOURCE_TYPE_LABEL[source.type]} · {source.engine}</span>
          <span className="font-medium text-foreground">{source.health}%</span>
        </div>
        <Progress value={source.health} className="h-1.5" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{source.owner}</span>
        <span>Cập nhật: {source.updated}</span>
      </div>
    </button>
  );
}
