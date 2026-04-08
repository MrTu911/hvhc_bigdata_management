'use client';

import { AlertTriangle, CheckCircle, Loader2, Users, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConflictType = 'FACULTY_CONFLICT' | 'ROOM_CONFLICT';

export type ConflictItem = {
  type: ConflictType;
  severity: 'ERROR';
  message: string;
  conflictingSectionId: string;
  conflictingSectionCode: string;
  conflictingDayOfWeek: number;
  conflictingStartPeriod: number;
  conflictingEndPeriod: number;
};

export type ConflictResult = {
  hasConflict: boolean;
  conflicts: ConflictItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4',
  4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7',
};

function conflictIcon(type: ConflictType) {
  return type === 'FACULTY_CONFLICT'
    ? <Users className="h-4 w-4 text-destructive shrink-0" />
    : <DoorOpen className="h-4 w-4 text-destructive shrink-0" />;
}

function conflictLabel(type: ConflictType) {
  return type === 'FACULTY_CONFLICT' ? 'Xung đột giảng viên' : 'Xung đột phòng học';
}

// ─── ConflictPanel ────────────────────────────────────────────────────────────

export function ConflictPanel({
  result,
  loading,
}: {
  result: ConflictResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-4 rounded-md border bg-muted/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang kiểm tra xung đột lịch học...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-3 px-4 rounded-md border border-dashed text-sm text-muted-foreground">
        Điền đầy đủ <strong>Học kỳ</strong>, <strong>Thứ</strong>, <strong>Tiết bắt đầu</strong> và <strong>Tiết kết thúc</strong> rồi nhấn <em>Kiểm tra xung đột</em>.
      </div>
    );
  }

  if (!result.hasConflict) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-md border border-green-200 bg-green-50 text-green-800 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>Không phát hiện xung đột lịch học. Có thể tạo lớp học phần này.</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Phát hiện {result.conflicts.length} xung đột lịch học
      </div>

      <div className="space-y-2">
        {result.conflicts.map((c, i) => (
          <div key={i} className="rounded-md border border-destructive/20 bg-background px-3 py-2 text-sm">
            <div className="flex items-start gap-2">
              {conflictIcon(c.type)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="destructive" className="text-xs font-normal">
                    {conflictLabel(c.type)}
                  </Badge>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {c.conflictingSectionCode}
                  </span>
                </div>
                <p className="text-muted-foreground leading-snug">{c.message}</p>
                <p className="text-xs text-muted-foreground">
                  Lịch trùng: {DAY_LABELS[c.conflictingDayOfWeek] ?? `Thứ ${c.conflictingDayOfWeek}`},
                  tiết {c.conflictingStartPeriod}–{c.conflictingEndPeriod}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
        Vẫn có thể tạo lớp nếu xung đột được chấp nhận, nhưng cần xác nhận rõ lý do.
      </p>
    </div>
  );
}
