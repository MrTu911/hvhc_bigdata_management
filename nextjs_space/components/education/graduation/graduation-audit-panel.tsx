'use client';

/**
 * M10 – UC-60: Graduation Audit Panel
 * Reusable components extracted from the graduation management page.
 *
 * Exports:
 *   - ConditionDot          — indicator for a single graduation condition
 *   - GraduationRunEngineDialog — self-contained dialog to run the engine for one student
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, PlayCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FailureReason { code: string; message: string }

export interface GraduationAuditResult {
  id: string;
  hocVienId: string;
  auditDate: string;
  totalCreditsEarned: number | null;
  gpa: number | null;
  conductEligible: boolean;
  thesisEligible: boolean;
  languageEligible: boolean;
  graduationEligible: boolean;
  failureReasonsJson: FailureReason[] | null;
  status: string;
  hocVien: { id: string; maHocVien: string; hoTen: string };
}

const FAILURE_REASON_LABELS: Record<string, string> = {
  INSUFFICIENT_CREDITS: 'Thiếu tín chỉ',
  LOW_GPA:              'GPA chưa đạt',
  CONDUCT_INELIGIBLE:   'Rèn luyện chưa đạt',
  THESIS_NOT_DEFENDED:  'Chưa bảo vệ khóa luận',
  LANGUAGE_INELIGIBLE:  'Ngoại ngữ chưa đạt',
};

// ─── ConditionDot ─────────────────────────────────────────────────────────────

/** Small badge showing pass/fail for a single graduation condition. */
export function ConditionDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${ok ? 'Đạt' : 'Chưa đạt'}`}
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full
        ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ─── RunEngineResultPreview ───────────────────────────────────────────────────

function RunEngineResultPreview({ result }: { result: GraduationAuditResult }) {
  const reasons = (result.failureReasonsJson ?? []) as FailureReason[];
  return (
    <div className={`p-3 rounded-md border text-sm ${
      result.graduationEligible
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-red-200 bg-red-50 text-red-800'
    }`}>
      <div className="font-medium mb-1">
        {result.graduationEligible ? '✓ Đủ điều kiện tốt nghiệp' : '✗ Chưa đủ điều kiện'}
      </div>
      <div className="text-xs space-y-1">
        <div>GPA: {result.gpa?.toFixed(2)} · Tín chỉ: {result.totalCreditsEarned}</div>
        <div className="flex gap-1 flex-wrap">
          <ConditionDot ok={result.conductEligible}  label="Rèn luyện" />
          <ConditionDot ok={result.thesisEligible}   label="Khóa luận" />
          <ConditionDot ok={result.languageEligible} label="Ngoại ngữ" />
        </div>
        {reasons.map((r, i) => (
          <div key={i}>• {FAILURE_REASON_LABELS[r.code] ?? r.message}</div>
        ))}
      </div>
    </div>
  );
}

// ─── GraduationRunEngineDialog ────────────────────────────────────────────────

/**
 * Self-contained dialog for running the Graduation Rule Engine on a single student.
 * Caller receives the result via `onComplete` and can refresh its list accordingly.
 */
export function GraduationRunEngineDialog({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after a successful engine run with the resulting audit record. */
  onComplete: (result: GraduationAuditResult) => void;
}) {
  const [hocVienId, setHocVienId]       = useState('');
  const [searchText, setSearchText]     = useState('');
  const [students, setStudents]         = useState<{ id: string; maHocVien: string; hoTen: string }[]>([]);
  const [notes, setNotes]               = useState('');
  const [running, setRunning]           = useState(false);
  const [lastResult, setLastResult]     = useState<GraduationAuditResult | null>(null);

  const reset = () => {
    setHocVienId('');
    setSearchText('');
    setStudents([]);
    setNotes('');
    setLastResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const searchStudents = async (q: string) => {
    if (!q || q.length < 2) { setStudents([]); return; }
    try {
      const res = await fetch(`/api/education/students?search=${encodeURIComponent(q)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch { /* silent — not critical */ }
  };

  const handleRunEngine = async () => {
    if (!hocVienId) { toast.error('Chọn học viên trước khi chạy engine'); return; }

    const confirmed = window.confirm(
      '⚠️ Xác nhận chạy Graduation Rule Engine?\n\n' +
      'Kết quả sẽ được ghi vào hệ thống và ảnh hưởng đến quyết định cấp văn bằng.\n' +
      'Chỉ chạy khi dữ liệu học viên đã đầy đủ và chính xác.'
    );
    if (!confirmed) return;

    try {
      setRunning(true);
      const res = await fetch('/api/education/graduation/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hocVienId, notes: notes || null }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLastResult(data.data);
        toast.success('Đã chạy xét tốt nghiệp thành công');
        onComplete(data.data);
      } else {
        toast.error(data.error || 'Lỗi chạy engine');
      }
    } catch { toast.error('Lỗi kết nối server'); }
    finally   { setRunning(false); }
  };

  const selectedStudent = students.find(s => s.id === hocVienId);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" /> Chạy Graduation Rule Engine
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-800">
            Kết quả sẽ được lưu vĩnh viễn. Đảm bảo dữ liệu học viên đã hoàn chỉnh trước khi chạy.
          </div>

          <div className="space-y-2">
            <Label>Tìm học viên <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Nhập tên hoặc mã học viên..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); searchStudents(e.target.value); }}
            />
            {students.length > 0 && (
              <Select value={hocVienId} onValueChange={v => setHocVienId(v)}>
                <SelectTrigger><SelectValue placeholder="Chọn học viên" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.maHocVien} – {s.hoTen}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedStudent && (
              <p className="text-xs text-green-600">✓ Đã chọn: {selectedStudent.hoTen}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="VD: Xét đợt tháng 6/2026"
            />
          </div>

          {lastResult && <RunEngineResultPreview result={lastResult} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Đóng</Button>
          <Button
            onClick={handleRunEngine}
            disabled={running || !hocVienId}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {running
              ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              : <PlayCircle className="h-4 w-4 mr-2" />
            }
            {running ? 'Đang chạy...' : 'Xác nhận & Chạy Engine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
