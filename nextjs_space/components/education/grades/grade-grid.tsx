'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Check, Edit, History, Lock, Loader2, RotateCcw, X,
} from 'lucide-react';
import { ScoreHistoryDrawer } from './score-history-drawer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Enrollment = {
  id: string;
  hocVienId: string;
  hocVien: { id: string; maHocVien: string | null; hoTen: string };
  classSection: { id: string; code: string; name: string };
  attendanceScore:  number | null;
  assignmentScore:  number | null;
  midtermScore:     number | null;
  finalScore:       number | null;
  totalScore:       number | null;
  passFlag:         boolean | null;
  letterGrade:      string | null;
  gradeStatus:      string;
  _count: { scoreHistories: number };
};

type EditForm = {
  attendanceScore:  string;
  assignmentScore:  string;
  midtermScore:     string;
  finalScore:       string;
  totalScore:       string;
  letterGrade:      string;
  passFlag:         string;   // 'true' | 'false' | ''
  reason:           string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_STATUS_LABELS: Record<string, string> = {
  PENDING:   'Chưa nhập',
  GRADED:    'Đã nhập',
  FINALIZED: 'Đã khóa',
};

const GRADE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING:   'outline',
  GRADED:    'default',
  FINALIZED: 'secondary',
};

const LETTER_GRADES = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(1);
}

function toNum(s: string): number | null {
  const n = parseFloat(s);
  return s.trim() === '' || isNaN(n) ? null : n;
}

function enrollmentToForm(e: Enrollment): EditForm {
  return {
    attendanceScore:  e.attendanceScore  != null ? String(e.attendanceScore)  : '',
    assignmentScore:  e.assignmentScore  != null ? String(e.assignmentScore)  : '',
    midtermScore:     e.midtermScore     != null ? String(e.midtermScore)     : '',
    finalScore:       e.finalScore       != null ? String(e.finalScore)       : '',
    totalScore:       e.totalScore       != null ? String(e.totalScore)       : '',
    letterGrade:      e.letterGrade      ?? '',
    passFlag:         e.passFlag         != null ? String(e.passFlag)         : '',
    reason:           '',
  };
}

// ─── ScoreCell ────────────────────────────────────────────────────────────────

function ScoreCell({
  value, editing, field, form, onChange,
}: {
  value: number | null;
  editing: boolean;
  field: keyof EditForm;
  form: EditForm;
  onChange: (f: keyof EditForm, v: string) => void;
}) {
  if (!editing) {
    return (
      <span className={value === null ? 'text-muted-foreground text-xs' : 'font-mono text-sm'}>
        {fmt(value)}
      </span>
    );
  }
  return (
    <Input
      type="number"
      min={0}
      max={10}
      step={0.1}
      className="h-7 w-16 text-xs text-center px-1"
      value={form[field] as string}
      onChange={e => onChange(field, e.target.value)}
    />
  );
}

// ─── GradeGrid ────────────────────────────────────────────────────────────────

export function GradeGrid({
  enrollments: initialEnrollments,
  onRefresh,
}: {
  enrollments: Enrollment[];
  onRefresh?: () => void;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ enrollmentId: string; studentName: string; sectionCode: string } | null>(null);

  // ─── Edit helpers ─────────────────────────────────────────────────────

  const startEdit = (e: Enrollment) => {
    setEditingId(e.id);
    setEditForm(enrollmentToForm(e));
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const setField = (f: keyof EditForm, v: string) =>
    setEditForm(prev => prev ? { ...prev, [f]: v } : prev);

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async (enrollmentId: string) => {
    if (!editForm) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      const att = toNum(editForm.attendanceScore);
      const ass = toNum(editForm.assignmentScore);
      const mid = toNum(editForm.midtermScore);
      const fin = toNum(editForm.finalScore);
      const tot = toNum(editForm.totalScore);

      if (att !== null) payload.attendanceScore = att;
      if (ass !== null) payload.assignmentScore  = ass;
      if (mid !== null) payload.midtermScore     = mid;
      if (fin !== null) payload.finalScore       = fin;
      if (tot !== null) payload.totalScore       = tot;
      if (editForm.letterGrade && editForm.letterGrade !== '__none__')
        payload.letterGrade = editForm.letterGrade;
      if (editForm.passFlag !== '')
        payload.passFlag = editForm.passFlag === 'true';
      if (editForm.reason.trim())
        payload.reason = editForm.reason.trim();

      if (Object.keys(payload).length === 0) {
        toast.warning('Không có thay đổi nào để lưu');
        cancelEdit();
        return;
      }

      const res = await fetch(`/api/education/grades/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi cập nhật điểm');

      // Optimistic local update
      setEnrollments(prev =>
        prev.map(e =>
          e.id === enrollmentId
            ? {
                ...e,
                ...json.data,
                _count: {
                  ...e._count,
                  scoreHistories: e._count.scoreHistories + 1,
                },
              }
            : e
        )
      );
      toast.success('Đã lưu điểm');
      cancelEdit();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (enrollments.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        Chưa có học viên nào được ghi danh vào lớp này
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead className="w-24">Mã HV</TableHead>
              <TableHead className="min-w-[160px]">Họ và tên</TableHead>
              <TableHead className="text-center w-20">CC</TableHead>
              <TableHead className="text-center w-20">BT</TableHead>
              <TableHead className="text-center w-20">GK</TableHead>
              <TableHead className="text-center w-20">CK</TableHead>
              <TableHead className="text-center w-20">TK</TableHead>
              <TableHead className="text-center w-20">Loại</TableHead>
              <TableHead className="text-center w-16">Đạt</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="text-right w-32">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e, idx) => {
              const isEditing   = editingId === e.id;
              const isFinalized = e.gradeStatus === 'FINALIZED';
              const form        = isEditing && editForm ? editForm : null;

              return (
                <TableRow
                  key={e.id}
                  className={isFinalized ? 'bg-muted/30' : isEditing ? 'bg-blue-50/50' : ''}
                >
                  {/* # */}
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>

                  {/* Mã HV */}
                  <TableCell>
                    <span className="font-mono text-xs">{e.hocVien.maHocVien ?? '—'}</span>
                  </TableCell>

                  {/* Họ tên */}
                  <TableCell>
                    <span className="font-medium text-sm">{e.hocVien.hoTen}</span>
                  </TableCell>

                  {/* Score cells */}
                  {(['attendanceScore', 'assignmentScore', 'midtermScore', 'finalScore', 'totalScore'] as const).map(field => (
                    <TableCell key={field} className="text-center">
                      <ScoreCell
                        value={e[field]}
                        editing={isEditing}
                        field={field}
                        form={form ?? enrollmentToForm(e)}
                        onChange={setField}
                      />
                    </TableCell>
                  ))}

                  {/* Letter grade */}
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Select
                        value={form!.letterGrade || '__none__'}
                        onValueChange={v => setField('letterGrade', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="h-7 w-20 text-xs px-1">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {LETTER_GRADES.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-mono text-sm font-medium">{e.letterGrade ?? '—'}</span>
                    )}
                  </TableCell>

                  {/* passFlag */}
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Select
                        value={form!.passFlag || '__none__'}
                        onValueChange={v => setField('passFlag', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="h-7 w-20 text-xs px-1">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          <SelectItem value="true">Đạt</SelectItem>
                          <SelectItem value="false">Trượt</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : e.passFlag === true ? (
                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                    ) : e.passFlag === false ? (
                      <X className="h-4 w-4 text-destructive mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Grade status */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isFinalized && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <Badge variant={GRADE_STATUS_VARIANTS[e.gradeStatus] || 'outline'} className="text-xs">
                        {GRADE_STATUS_LABELS[e.gradeStatus] || e.gradeStatus}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="space-y-1">
                        {/* Reason input */}
                        <Input
                          className="h-6 text-xs"
                          placeholder="Lý do sửa..."
                          value={form!.reason}
                          onChange={e => setField('reason', e.target.value)}
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-muted-foreground"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleSave(e.id)}
                            disabled={saving}
                          >
                            {saving
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        {/* History */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground relative"
                          onClick={() => setHistoryTarget({
                            enrollmentId: e.id,
                            studentName: e.hocVien.hoTen,
                            sectionCode: e.classSection.code,
                          })}
                          title="Lịch sử điểm"
                        >
                          <History className="h-4 w-4" />
                          {e._count.scoreHistories > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center leading-none">
                              {e._count.scoreHistories > 9 ? '9+' : e._count.scoreHistories}
                            </span>
                          )}
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => startEdit(e)}
                          disabled={isFinalized}
                          title={isFinalized ? 'Điểm đã khóa, không thể sửa' : 'Sửa điểm'}
                        >
                          {isFinalized
                            ? <Lock className="h-4 w-4 text-muted-foreground" />
                            : <Edit className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Score History Drawer */}
      {historyTarget && (
        <ScoreHistoryDrawer
          open={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          enrollmentId={historyTarget.enrollmentId}
          studentName={historyTarget.studentName}
          sectionCode={historyTarget.sectionCode}
        />
      )}
    </>
  );
}
