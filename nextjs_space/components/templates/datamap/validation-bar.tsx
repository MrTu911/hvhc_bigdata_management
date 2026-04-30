'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationBarProps {
  unmappedCount: number;
  mappedCount: number;
  errors?: string[];
  warnings?: string[];
}

export function ValidationBar({ unmappedCount, mappedCount, errors = [], warnings = [] }: ValidationBarProps) {
  const total = unmappedCount + mappedCount;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0 || unmappedCount > 0;
  const allMapped = unmappedCount === 0 && total > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border',
        hasErrors
          ? 'bg-red-50 border-red-200 text-red-700'
          : hasWarnings
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-green-50 border-green-200 text-green-700',
      )}
    >
      {hasErrors ? (
        <XCircle className="h-4 w-4 shrink-0" />
      ) : hasWarnings ? (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {hasErrors ? (
          <span>{errors[0]}{errors.length > 1 && ` (+${errors.length - 1} lỗi khác)`}</span>
        ) : unmappedCount > 0 ? (
          <span>
            Còn <strong>{unmappedCount}</strong> placeholder chưa ánh xạ
            {warnings.length > 0 && ` · ${warnings[0]}`}
          </span>
        ) : allMapped ? (
          <span>Tất cả <strong>{mappedCount}</strong> placeholder đã được ánh xạ — sẵn sàng lưu</span>
        ) : (
          <span>Chưa có placeholder nào — hãy upload file template</span>
        )}
      </div>

      <span className="shrink-0 text-xs opacity-70">
        {mappedCount}/{total} đã map
      </span>
    </div>
  );
}
