'use client';

import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info, Tag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export type TemplateFormat = 'DOCX' | 'XLSX' | 'HTML';

export interface PlaceholderScanResultProps {
  format: TemplateFormat;
  placeholders: string[];
  /** true = kết quả chính xác; false = STUB hoặc không parse được */
  reliable: boolean;
  /** Lý do nếu reliable = false */
  note?: string;
  /** Gọi khi admin xác nhận kết quả và muốn sang bước Data Map */
  onProceed?: () => void;
}

interface GroupedPlaceholders {
  simple: string[];   // {fieldName}
  nested: string[];   // {parent.child}
  list: string[];     // {name[]}
}

function groupPlaceholders(placeholders: string[]): GroupedPlaceholders {
  const result: GroupedPlaceholders = { simple: [], nested: [], list: [] };
  for (const p of placeholders) {
    const inner = p.replace(/^\{|\}$/g, '');
    if (inner.endsWith('[]')) {
      result.list.push(p);
    } else if (inner.includes('.')) {
      result.nested.push(p);
    } else {
      result.simple.push(p);
    }
  }
  return result;
}

export function PlaceholderScanResult({
  format,
  placeholders,
  reliable,
  note,
  onProceed,
}: PlaceholderScanResultProps) {
  const grouped = useMemo(() => groupPlaceholders(placeholders), [placeholders]);
  const total = placeholders.length;

  // XLSX không dùng placeholder text — trạng thái đặc biệt
  if (format === 'XLSX') {
    return (
      <div className="space-y-3">
        <ScanHeader reliable={true} total={0} />
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            XLSX dùng data binding — không có placeholder text trong file.
            Sang bước Data Map để cấu hình cột ↔ field trực tiếp.
          </span>
        </div>
        {onProceed && (
          <Button size="sm" onClick={onProceed} className="w-full">
            Sang Data Map <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ScanHeader reliable={reliable} total={total} />

      {/* Unreliable warning */}
      {!reliable && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {note ?? 'Kết quả scan chưa chắc chắn — kiểm tra lại thủ công trước khi cấu hình Data Map.'}
          </span>
        </div>
      )}

      {/* No placeholders */}
      {total === 0 && (
        <div className="text-center py-5 text-sm text-gray-400">
          <Tag className="h-5 w-5 mx-auto mb-1.5 opacity-30" />
          Không tìm thấy placeholder nào trong file.
          <br />
          <span className="text-xs">Convention: <code className="font-mono bg-gray-100 px-1 rounded">&#123;fieldName&#125;</code></span>
        </div>
      )}

      {/* Grouped placeholder list */}
      {total > 0 && (
        <ScrollArea className="max-h-56 rounded-md border bg-gray-50 p-3">
          <div className="space-y-3">
            <PlaceholderGroup
              label="Trường đơn"
              items={grouped.simple}
              badgeClass="bg-blue-100 text-blue-700"
            />
            <PlaceholderGroup
              label="Trường lồng nhau"
              items={grouped.nested}
              badgeClass="bg-purple-100 text-purple-700"
            />
            <PlaceholderGroup
              label="Danh sách (list)"
              items={grouped.list}
              badgeClass="bg-orange-100 text-orange-700"
            />
          </div>
        </ScrollArea>
      )}

      {onProceed && total > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {reliable
                ? 'Kết quả chính xác — sẵn sàng cấu hình Data Map.'
                : 'Xem xét kết quả trước khi tiếp tục.'}
            </p>
            <Button size="sm" onClick={onProceed}>
              Sang Data Map <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScanHeader({ reliable, total }: { reliable: boolean; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {reliable ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      )}
      <span className="text-sm font-semibold text-gray-700">Kết quả scan Placeholder</span>
      <Badge
        className={
          total > 0
            ? 'bg-blue-100 text-blue-700 border-0 text-xs'
            : 'bg-gray-100 text-gray-500 border-0 text-xs'
        }
      >
        {total} placeholder
      </Badge>
      {!reliable && (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Chưa chắc chắn</Badge>
      )}
    </div>
  );
}

function PlaceholderGroup({
  label,
  items,
  badgeClass,
}: {
  label: string;
  items: string[];
  badgeClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium">{label} ({items.length})</p>
      <div className="flex flex-wrap gap-1">
        {items.map((p) => (
          <span
            key={p}
            className={`font-mono text-xs px-1.5 py-0.5 rounded ${badgeClass}`}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
