'use client';

import { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreSnapshot = {
  attendanceScore:  number | null;
  assignmentScore:  number | null;
  midtermScore:     number | null;
  finalScore:       number | null;
  totalScore:       number | null;
  passFlag:         boolean | null;
  letterGrade:      string | null;
  gradeStatus:      string | null;
};

type HistoryEntry = {
  id: string;
  enrollmentId: string;
  changedBy: string | null;
  oldValues: ScoreSnapshot;
  newValues: ScoreSnapshot;
  changedAt: string;
  reason: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_FIELD_LABELS: Record<keyof ScoreSnapshot, string> = {
  attendanceScore: 'Điểm CC',
  assignmentScore: 'Điểm BT',
  midtermScore:    'Điểm GK',
  finalScore:      'Điểm CK',
  totalScore:      'Điểm TK',
  passFlag:        'Đạt/Trượt',
  letterGrade:     'Xếp loại',
  gradeStatus:     'Trạng thái',
};

function formatVal(key: keyof ScoreSnapshot, val: any): string {
  if (val === null || val === undefined) return '—';
  if (key === 'passFlag') return val ? 'Đạt' : 'Trượt';
  if (key === 'gradeStatus') return val;
  if (typeof val === 'number') return val.toFixed(2);
  return String(val);
}

function diffFields(old: ScoreSnapshot, next: ScoreSnapshot): (keyof ScoreSnapshot)[] {
  return (Object.keys(SCORE_FIELD_LABELS) as (keyof ScoreSnapshot)[]).filter(
    k => JSON.stringify(old[k]) !== JSON.stringify(next[k])
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── ScoreHistoryDrawer ───────────────────────────────────────────────────────

export function ScoreHistoryDrawer({
  open,
  onClose,
  enrollmentId,
  studentName,
  sectionCode,
}: {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentName: string;
  sectionCode: string;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !enrollmentId) return;
    setLoading(true);
    fetch(`/api/education/grades/${enrollmentId}/history`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setHistory(j.data || []);
        else throw new Error(j.error);
      })
      .catch(() => toast.error('Lỗi tải lịch sử điểm'))
      .finally(() => setLoading(false));
  }, [open, enrollmentId]);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lịch sử thay đổi điểm
          </SheetTitle>
          <SheetDescription>
            <span className="font-medium text-foreground">{studentName}</span>
            {' · '}
            <span className="font-mono text-xs">{sectionCode}</span>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Chưa có thay đổi điểm nào được ghi nhận
          </div>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-6">
            {history.map((entry, idx) => {
              const changed = diffFields(entry.oldValues, entry.newValues);
              return (
                <li key={entry.id} className="ml-4">
                  {/* Timeline dot */}
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />

                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {formatDateTime(entry.changedAt)}
                      </span>
                      {idx === 0 && (
                        <Badge variant="default" className="text-xs">Mới nhất</Badge>
                      )}
                    </div>

                    {/* Reason */}
                    {entry.reason && (
                      <p className="text-xs text-muted-foreground italic">
                        Lý do: {entry.reason}
                      </p>
                    )}

                    {/* Changed by */}
                    {entry.changedBy && (
                      <p className="text-xs text-muted-foreground">
                        Người sửa: <span className="font-mono">{entry.changedBy.slice(0, 12)}…</span>
                      </p>
                    )}

                    {/* Diff table */}
                    {changed.length > 0 ? (
                      <div className="rounded-md border bg-muted/30 divide-y text-xs">
                        {changed.map(field => (
                          <div key={field} className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-muted-foreground w-20 shrink-0">
                              {SCORE_FIELD_LABELS[field]}
                            </span>
                            <span className="text-red-600 line-through">
                              {formatVal(field, entry.oldValues[field])}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-green-700 font-medium">
                              {formatVal(field, entry.newValues[field])}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Không có thay đổi điểm (ghi chú hoặc trạng thái)
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </SheetContent>
    </Sheet>
  );
}
