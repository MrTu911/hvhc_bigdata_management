'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { CheckCheck, Loader2, Save, RotateCcw, UserCheck } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

type EnrollmentRow = {
  id: string;               // ClassEnrollment.id
  hocVienId: string;
  maHocVien: string | null;
  hoTen: string;
  lop: string | null;
};

type AttendanceState = {
  type: AttendanceType;
  notes: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTENDANCE_OPTIONS: { value: AttendanceType; label: string }[] = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'LATE',    label: 'Muộn' },
  { value: 'EXCUSED', label: 'Vắng phép' },
  { value: 'ABSENT',  label: 'Vắng không phép' },
];

const TYPE_BADGE_VARIANTS: Record<AttendanceType, {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
}> = {
  PRESENT: { variant: 'default',     color: 'text-green-700 bg-green-50 border-green-200' },
  LATE:    { variant: 'secondary',   color: 'text-amber-700 bg-amber-50 border-amber-200' },
  EXCUSED: { variant: 'outline',     color: 'text-blue-700 bg-blue-50 border-blue-200' },
  ABSENT:  { variant: 'destructive', color: 'text-red-700 bg-red-50 border-red-200' },
};

const ROW_BG: Record<AttendanceType, string> = {
  PRESENT: '',
  LATE:    'bg-amber-50/40',
  EXCUSED: 'bg-blue-50/40',
  ABSENT:  'bg-red-50/40',
};

// ─── AttendanceSheet ──────────────────────────────────────────────────────────

export function AttendanceSheet({
  sessionId,
  classSectionId,
  sessionLabel,
}: {
  sessionId: string;
  classSectionId: string;
  sessionLabel: string;
}) {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // ─── Load data ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollRes, attRes] = await Promise.all([
        fetch(`/api/education/enrollments?classSectionId=${classSectionId}&status=ENROLLED`),
        fetch(`/api/education/attendance?sessionId=${sessionId}`),
      ]);

      // Enrollments → rows
      const enrollJson = await enrollRes.json();
      const rawEnrollments: any[] = Array.isArray(enrollJson) ? enrollJson : [];
      const rows: EnrollmentRow[] = rawEnrollments.map(e => ({
        id: e.id,
        hocVienId: e.hocVienId,
        maHocVien: e.hocVien?.maHocVien ?? null,
        hoTen: e.hocVien?.hoTen ?? '—',
        lop: e.hocVien?.lop ?? null,
      }));
      rows.sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi'));
      setEnrollments(rows);

      // Existing attendance → pre-fill map
      const attJson = await attRes.json();
      const existing: any[] = attJson.success ? attJson.data : [];

      const map = new Map<string, AttendanceState>();
      // Default: PRESENT for all enrolled students
      for (const row of rows) {
        map.set(row.id, { type: 'PRESENT', notes: '' });
      }
      // Override with existing records
      for (const rec of existing) {
        const enrollmentId = rec.enrollment?.id ?? rec.enrollmentId;
        if (enrollmentId && map.has(enrollmentId)) {
          map.set(enrollmentId, {
            type: (rec.attendanceType as AttendanceType) ?? 'PRESENT',
            notes: rec.notes ?? '',
          });
        }
      }
      setAttendance(map);
      setDirty(false);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  }, [sessionId, classSectionId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Edit helpers ───────────────────────────────────────────────────────

  const setType = (enrollmentId: string, type: AttendanceType) => {
    setAttendance(prev => {
      const next = new Map(prev);
      next.set(enrollmentId, { ...next.get(enrollmentId)!, type });
      return next;
    });
    setDirty(true);
  };

  const setNotes = (enrollmentId: string, notes: string) => {
    setAttendance(prev => {
      const next = new Map(prev);
      next.set(enrollmentId, { ...next.get(enrollmentId)!, notes });
      return next;
    });
    setDirty(true);
  };

  const setAll = (type: AttendanceType) => {
    setAttendance(prev => {
      const next = new Map(prev);
      for (const [k, v] of next) next.set(k, { ...v, type });
      return next;
    });
    setDirty(true);
  };

  const resetToLoaded = () => loadData();

  // ─── Stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
    for (const v of attendance.values()) counts[v.type]++;
    const total = enrollments.length;
    const attended = counts.PRESENT + counts.LATE;
    return { ...counts, total, attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0 };
  }, [attendance, enrollments]);

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (enrollments.length === 0) return;
    setSaving(true);
    try {
      const records = enrollments.map(row => {
        const state = attendance.get(row.id) ?? { type: 'PRESENT' as AttendanceType, notes: '' };
        return {
          sessionId,
          enrollmentId: row.id,
          attendanceType: state.type,
          notes: state.notes || undefined,
        };
      });

      const res = await fetch('/api/education/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi lưu điểm danh');

      toast.success(`Đã lưu điểm danh ${sessionLabel} – ${json.data.upserted} bản ghi`);
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Đang tải danh sách học viên...</span>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Chưa có học viên nào đăng ký lớp này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Tổng: <strong>{stats.total}</strong></span>
        <span className="text-muted-foreground">|</span>
        <span className="text-green-700">Có mặt: <strong>{stats.PRESENT}</strong></span>
        <span className="text-amber-700">Muộn: <strong>{stats.LATE}</strong></span>
        <span className="text-blue-700">Vắng phép: <strong>{stats.EXCUSED}</strong></span>
        <span className="text-red-700">Vắng KP: <strong>{stats.ABSENT}</strong></span>
        <span className="ml-auto text-muted-foreground">
          Tỷ lệ chuyên cần: <strong className={stats.attendanceRate < 80 ? 'text-destructive' : 'text-green-700'}>
            {stats.attendanceRate}%
          </strong>
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAll('PRESENT')}
          className="text-green-700 border-green-200 hover:bg-green-50"
        >
          <CheckCheck className="h-4 w-4 mr-1" /> Điểm danh tất cả có mặt
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAll('ABSENT')}
          className="text-red-700 border-red-200 hover:bg-red-50"
        >
          Vắng tất cả
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToLoaded}
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Đặt lại
        </Button>

        <div className="ml-auto">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            size="sm"
          >
            {saving
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Save className="h-4 w-4 mr-2" />}
            {dirty ? 'Lưu điểm danh' : 'Đã lưu'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead className="w-28">Mã HV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead className="w-20">Lớp</TableHead>
              <TableHead className="w-44">Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((row, idx) => {
              const state = attendance.get(row.id) ?? { type: 'PRESENT' as AttendanceType, notes: '' };
              return (
                <TableRow key={row.id} className={ROW_BG[state.type]}>
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{row.maHocVien ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">{row.hoTen}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{row.lop ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={state.type}
                      onValueChange={v => setType(row.id, v as AttendanceType)}
                    >
                      <SelectTrigger className={`h-8 text-xs border ${TYPE_BADGE_VARIANTS[state.type].color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-sm">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Ghi chú..."
                      value={state.notes}
                      onChange={e => setNotes(row.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
