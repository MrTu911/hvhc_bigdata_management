/**
 * M10 – UC-54: Wizard "Sinh lịch huấn luyện học kỳ" (bán tự động)
 *
 * 2 bước: (1) chọn tùy chọn → "Xem trước" (POST /api/education/schedule/generate);
 * (2) duyệt kế hoạch + xung đột → "Ghi lịch" (POST /api/education/schedule/commit).
 *
 * Component thuần UI: gọi API, hiển thị preview/xung đột, không chứa business logic.
 */

'use client';

import { useState } from 'react';
import {
  CalendarClock, AlertTriangle, CheckCircle2, RefreshCw, Loader2, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const SESSION_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'THEORY', label: 'Lý thuyết' },
  { value: 'PRACTICE', label: 'Thực hành' },
  { value: 'SEMINAR', label: 'Xêmina' },
  { value: 'LAB', label: 'Thực hành PTN' },
  { value: 'REVIEW', label: 'Ôn tập' },
];

const SKIP_REASON_LABELS: Record<string, string> = {
  NO_PATTERN: 'Thiếu khung lịch (thứ/tiết)',
  HAS_CONFLICT: 'Có xung đột',
  ALREADY_GENERATED: 'Đã có buổi học',
};

interface ConflictItem {
  type: string;
  message: string;
}

interface SectionPlan {
  classSectionId: string;
  sectionCode: string;
  sectionName: string;
  startTime: string | null;
  endTime: string | null;
  roomName: string | null;
  facultyName: string | null;
  plannedCount: number;
  existingCount: number;
  conflicts: ConflictItem[];
  skipReason?: 'NO_PATTERN' | 'HAS_CONFLICT' | 'ALREADY_GENERATED';
}

interface SchedulePreview {
  termName: string;
  totalSections: number;
  schedulableSections: number;
  totalPlannedSessions: number;
  totalConflicts: number;
  sections: SectionPlan[];
}

interface Props {
  termId: string;
  termName?: string;
  disabled?: boolean;
  /** Gọi lại sau khi ghi lịch thành công để trang refresh KPI/danh sách */
  onCommitted?: () => void;
}

export function ScheduleGeneratorWizard({ termId, termName, disabled, onCommitted }: Props) {
  const [open, setOpen] = useState(false);
  const [sessionType, setSessionType] = useState('THEORY');
  const [includeConflicting, setIncludeConflicting] = useState(false);
  const [regenerate, setRegenerate] = useState(false);

  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);

  const resetState = () => {
    setPreview(null);
    setSessionType('THEORY');
    setIncludeConflicting(false);
    setRegenerate(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  const runPreview = async () => {
    if (!termId) return;
    try {
      setPreviewing(true);
      const res = await fetch('/api/education/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId, sessionType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreview(data.data);
      } else {
        toast.error(data.error || 'Không tính được kế hoạch xếp lịch');
      }
    } catch {
      toast.error('Lỗi kết nối khi xem trước lịch');
    } finally {
      setPreviewing(false);
    }
  };

  const runCommit = async () => {
    if (!termId) return;
    try {
      setCommitting(true);
      const res = await fetch('/api/education/schedule/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId, sessionType, includeConflicting, regenerate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Đã sinh ${data.data.createdSessions} buổi học cho ${data.data.affectedSections} lớp` +
          (data.data.skippedSections.length ? ` (bỏ qua ${data.data.skippedSections.length} lớp)` : ''),
        );
        handleOpenChange(false);
        onCommitted?.();
      } else {
        toast.error(data.error || 'Lỗi khi ghi lịch huấn luyện');
      }
    } catch {
      toast.error('Lỗi kết nối khi ghi lịch');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Wand2 className="h-4 w-4 mr-2" /> Sinh lịch học kỳ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Sinh lịch huấn luyện học kỳ {termName ? `— ${termName}` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* ── Bước 1: tùy chọn ── */}
        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Loại buổi học mặc định</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={includeConflicting}
                  onCheckedChange={(v) => setIncludeConflicting(Boolean(v))}
                />
                Vẫn ghi cả lớp đang xung đột
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={regenerate}
                  onCheckedChange={(v) => setRegenerate(Boolean(v))}
                />
                Sinh lại lớp đã có buổi (giữ buổi đã điểm danh)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={runPreview} disabled={previewing || !termId} variant="secondary">
              {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Xem trước kế hoạch
            </Button>
            <span className="text-xs text-muted-foreground">
              Bước 1: tính kế hoạch & kiểm xung đột (chưa ghi). Bước 2: duyệt rồi ghi lịch.
            </span>
          </div>
        </div>

        {/* ── Bước 2: preview ── */}
        {preview && (
          <div className="space-y-3">
            {/* KPI tổng hợp */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SummaryTile label="Tổng lớp" value={preview.totalSections} />
              <SummaryTile label="Lớp xếp được" value={preview.schedulableSections} tone="green" />
              <SummaryTile label="Buổi dự kiến" value={preview.totalPlannedSessions} tone="blue" />
              <SummaryTile label="Xung đột" value={preview.totalConflicts} tone={preview.totalConflicts > 0 ? 'red' : 'gray'} />
            </div>

            <ScrollArea className="h-64 rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Lớp HP</th>
                    <th className="px-3 py-2 font-medium">Giờ</th>
                    <th className="px-3 py-2 font-medium">Phòng/GV</th>
                    <th className="px-3 py-2 font-medium text-center">Dự kiến</th>
                    <th className="px-3 py-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sections.map((s) => {
                    const blocked = !!s.skipReason && !(s.skipReason === 'HAS_CONFLICT' && includeConflicting) && !(s.skipReason === 'ALREADY_GENERATED' && regenerate);
                    return (
                      <tr key={s.classSectionId} className="border-t align-top">
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs font-medium">{s.sectionCode}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{s.sectionName}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          <div>{s.roomName ?? '—'}</div>
                          <div>{s.facultyName ?? '—'}</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-semibold">{s.plannedCount}</span>
                          {s.existingCount > 0 && (
                            <span className="block text-[10px] text-muted-foreground">đã có {s.existingCount}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {s.conflicts.length > 0 ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="border-red-300 text-red-600 bg-red-50 gap-1 text-[11px]">
                                <AlertTriangle className="h-3 w-3" /> {s.conflicts.length} xung đột
                              </Badge>
                              <ul className="text-[11px] text-red-600/80">
                                {s.conflicts.slice(0, 2).map((c, i) => (
                                  <li key={i} className="line-clamp-1">• {c.message}</li>
                                ))}
                              </ul>
                            </div>
                          ) : blocked ? (
                            <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300 bg-amber-50">
                              {s.skipReason ? SKIP_REASON_LABELS[s.skipReason] : 'Bỏ qua'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-green-600 border-green-300 bg-green-50 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Sẵn sàng
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {preview.sections.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Không có lớp học phần trong học kỳ này</td></tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>

            {preview.totalConflicts > 0 && !includeConflicting && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Lớp có xung đột sẽ bị bỏ qua. Tích "Vẫn ghi cả lớp đang xung đột" nếu muốn ghi đè.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Đóng</Button>
          <Button onClick={runCommit} disabled={!preview || committing || preview.schedulableSections === 0}>
            {committing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-2" />}
            Ghi lịch ({preview?.schedulableSections ?? 0} lớp)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({ label, value, tone = 'gray' }: { label: string; value: number; tone?: 'gray' | 'green' | 'blue' | 'red' }) {
  const toneClass: Record<string, string> = {
    gray: 'text-foreground',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
  };
  return (
    <div className="rounded-lg border p-2.5 text-center">
      <p className={`text-xl font-bold ${toneClass[tone]}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
