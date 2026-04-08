'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CalendarSearch, Loader2, ShieldAlert } from 'lucide-react';
import { ConflictPanel, type ConflictResult } from './conflict-panel';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ nhật' },
];

const PERIOD_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// ─── SectionSchedulerDialog ───────────────────────────────────────────────────

export function SectionSchedulerDialog({
  open,
  onClose,
  onSaved,
  section,
  terms,
  faculties,
  rooms,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  section?: any;            // provided → edit mode
  terms: any[];
  faculties: any[];
  rooms: any[];
}) {
  const isEdit = !!section;
  const [saving, setSaving] = useState(false);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [conflictChecked, setConflictChecked] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    termId: '',
    facultyId: '',
    roomId: '',
    curriculumCourseCode: '',   // display-only hint, not sent directly
    maxStudents: '50',
    dayOfWeek: '',
    startPeriod: '',
    endPeriod: '',
    startDate: '',
    endDate: '',
  });

  const set = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    // Invalidate previous conflict check when schedule fields change
    if (['termId', 'dayOfWeek', 'startPeriod', 'endPeriod', 'facultyId', 'roomId'].includes(k)) {
      setConflictResult(null);
      setConflictChecked(false);
    }
  };

  useEffect(() => {
    if (section) {
      setForm({
        code: section.code || '',
        name: section.name || '',
        termId: section.termId || '',
        facultyId: section.facultyId || '',
        roomId: section.roomId || '',
        curriculumCourseCode: section.curriculumCourse?.subjectCode || '',
        maxStudents: String(section.maxStudents ?? 50),
        dayOfWeek: section.dayOfWeek != null ? String(section.dayOfWeek) : '',
        startPeriod: section.startPeriod != null ? String(section.startPeriod) : '',
        endPeriod: section.endPeriod != null ? String(section.endPeriod) : '',
        startDate: section.startDate ? section.startDate.slice(0, 10) : '',
        endDate: section.endDate ? section.endDate.slice(0, 10) : '',
      });
    } else {
      setForm({
        code: '', name: '', termId: '', facultyId: '', roomId: '',
        curriculumCourseCode: '', maxStudents: '50',
        dayOfWeek: '', startPeriod: '', endPeriod: '',
        startDate: '', endDate: '',
      });
    }
    setConflictResult(null);
    setConflictChecked(false);
  }, [section, open]);

  // ─── Conflict Check ──────────────────────────────────────────────────────

  const canCheckConflict = !!(
    form.termId && form.termId !== '__none__' &&
    form.dayOfWeek !== '' &&
    form.startPeriod !== '' &&
    form.endPeriod !== ''
  );

  const handleConflictCheck = async () => {
    if (!canCheckConflict) return;
    setConflictLoading(true);
    setConflictResult(null);
    try {
      const res = await fetch('/api/education/class-sections/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termId: form.termId,
          dayOfWeek: parseInt(form.dayOfWeek),
          startPeriod: parseInt(form.startPeriod),
          endPeriod: parseInt(form.endPeriod),
          facultyId: (form.facultyId && form.facultyId !== '__none__') ? form.facultyId : null,
          roomId: (form.roomId && form.roomId !== '__none__') ? form.roomId : null,
          excludeSectionId: isEdit ? section.id : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi kiểm tra xung đột');
      setConflictResult(json.data);
      setConflictChecked(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConflictLoading(false);
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.termId || form.termId === '__none__') {
      toast.error('Mã lớp, tên lớp và học kỳ là bắt buộc');
      return;
    }
    if (form.startPeriod && form.endPeriod && parseInt(form.startPeriod) > parseInt(form.endPeriod)) {
      toast.error('Tiết bắt đầu phải ≤ tiết kết thúc');
      return;
    }
    // Warn if schedule filled but conflict not checked
    if (canCheckConflict && !conflictChecked) {
      toast.warning('Chưa kiểm tra xung đột. Hãy nhấn "Kiểm tra xung đột" trước khi lưu.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        termId: form.termId,
        facultyId: (form.facultyId && form.facultyId !== '__none__') ? form.facultyId : null,
        roomId: (form.roomId && form.roomId !== '__none__') ? form.roomId : null,
        maxStudents: parseInt(form.maxStudents) || 50,
        dayOfWeek: form.dayOfWeek !== '' ? parseInt(form.dayOfWeek) : null,
        startPeriod: form.startPeriod ? parseInt(form.startPeriod) : null,
        endPeriod: form.endPeriod ? parseInt(form.endPeriod) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const method = isEdit ? 'PUT' : 'POST';
      if (isEdit) payload.id = section.id;

      const res = await fetch('/api/education/class-sections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi lưu lớp học phần');

      toast.success(isEdit ? `Đã cập nhật lớp "${form.name}"` : `Đã tạo lớp "${form.name}"`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSearch className="h-5 w-5" />
            {isEdit ? 'Chỉnh sửa lớp học phần' : 'Tạo lớp học phần mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mã lớp học phần <span className="text-destructive">*</span></Label>
              <Input
                placeholder="VD: CS101-01"
                value={form.code}
                onChange={e => set('code', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Sĩ số tối đa</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={form.maxStudents}
                onChange={e => set('maxStudents', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tên lớp học phần <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VD: Lớp Giải tích – K45A"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Học kỳ <span className="text-destructive">*</span></Label>
            <Select
              value={form.termId || '__none__'}
              onValueChange={v => set('termId', v === '__none__' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Chọn học kỳ —</SelectItem>
                {terms.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.academicYear ? ` (${t.academicYear.name})` : ''}
                    {t.isCurrent ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Giảng viên</Label>
              <Select
                value={form.facultyId || '__none__'}
                onValueChange={v => set('facultyId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chưa phân công —</SelectItem>
                  {faculties.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.user?.name || f.name || f.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Phòng học</Label>
              <Select
                value={form.roomId || '__none__'}
                onValueChange={v => set('roomId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chưa xếp phòng —</SelectItem>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} – {r.name}
                      {r.building ? ` (${r.building})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lịch học & Kiểm tra xung đột
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Thứ trong tuần</Label>
              <Select
                value={form.dayOfWeek !== '' ? form.dayOfWeek : '__none__'}
                onValueChange={v => set('dayOfWeek', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Chọn thứ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chọn —</SelectItem>
                  {DAY_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tiết bắt đầu</Label>
              <Select
                value={form.startPeriod !== '' ? form.startPeriod : '__none__'}
                onValueChange={v => set('startPeriod', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Tiết" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {PERIOD_OPTIONS.map(p => (
                    <SelectItem key={p} value={String(p)}>Tiết {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tiết kết thúc</Label>
              <Select
                value={form.endPeriod !== '' ? form.endPeriod : '__none__'}
                onValueChange={v => set('endPeriod', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Tiết" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {PERIOD_OPTIONS.map(p => (
                    <SelectItem key={p} value={String(p)}>Tiết {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Conflict check trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleConflictCheck}
            disabled={!canCheckConflict || conflictLoading}
            className="w-full border-dashed"
          >
            {conflictLoading
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <ShieldAlert className="h-4 w-4 mr-2" />}
            Kiểm tra xung đột lịch học
          </Button>

          {/* Conflict results */}
          <ConflictPanel result={conflictResult} loading={conflictLoading} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo lớp học phần'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
