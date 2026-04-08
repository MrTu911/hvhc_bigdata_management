'use client';

import { useMemo } from 'react';
import { Plus, Minus, Equal, GitCompare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VersionSnapshot {
  version: number;
  placeholders?: string[];
}

interface VersionDiffViewerProps {
  /** Version cũ hơn (bên trái) */
  versionA: VersionSnapshot;
  /** Version mới hơn (bên phải) */
  versionB: VersionSnapshot;
}

interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

function computeDiff(a: string[], b: string[]): DiffResult {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    removed: a.filter((p) => !setB.has(p)),
    added: b.filter((p) => !setA.has(p)),
    unchanged: a.filter((p) => setB.has(p)),
  };
}

export function VersionDiffViewer({ versionA, versionB }: VersionDiffViewerProps) {
  const diff = useMemo(
    () =>
      computeDiff(
        versionA.placeholders ?? [],
        versionB.placeholders ?? [],
      ),
    [versionA, versionB],
  );

  const totalA = (versionA.placeholders ?? []).length;
  const totalB = (versionB.placeholders ?? []).length;
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitCompare className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">So sánh Placeholder</span>
        <span className="text-xs text-gray-400">
          v{versionA.version} ({totalA}) → v{versionB.version} ({totalB})
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        {diff.added.length > 0 && (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
            +{diff.added.length} thêm
          </Badge>
        )}
        {diff.removed.length > 0 && (
          <Badge className="bg-red-100 text-red-700 border-0 text-xs">
            -{diff.removed.length} bỏ
          </Badge>
        )}
        {diff.unchanged.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {diff.unchanged.length} giữ nguyên
          </Badge>
        )}
        {!hasChanges && totalA === 0 && totalB === 0 && (
          <span className="text-xs text-gray-400">Cả hai version chưa có placeholder</span>
        )}
        {!hasChanges && (totalA > 0 || totalB > 0) && (
          <span className="text-xs text-gray-500">Không có thay đổi placeholder</span>
        )}
      </div>

      {/* Diff list */}
      {(hasChanges || diff.unchanged.length > 0) && (
        <ScrollArea className="max-h-64 rounded-md border bg-gray-50 p-3">
          <div className="space-y-0.5 font-mono text-xs">
            {diff.removed.map((p) => (
              <div key={`rm-${p}`} className="flex items-center gap-1.5 text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                <Minus className="h-3 w-3 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
            {diff.added.map((p) => (
              <div key={`add-${p}`} className="flex items-center gap-1.5 text-green-700 bg-green-50 rounded px-1.5 py-0.5">
                <Plus className="h-3 w-3 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
            {diff.unchanged.map((p) => (
              <div key={`eq-${p}`} className="flex items-center gap-1.5 text-gray-400 px-1.5 py-0.5">
                <Equal className="h-3 w-3 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
