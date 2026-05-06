'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Search, Users, BookOpen, Award, ExternalLink,
  Filter, X, Download, FileSpreadsheet, FileText, FileDown,
  Edit, UserPlus, Save, CheckCircle, GraduationCap, Building2,
  FlaskConical, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle,
  ArrowRight, UserCheck, Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacultyProfile {
  id: string;
  userId: string;
  academicRank: string | null;
  academicDegree: string | null;
  specialization: string | null;
  researchProjects: number;
  publications: number;
  citations: number;
  teachingExperience: number | null;
  industryExperience: number | null;
  biography: string | null;
  linkedinUrl: string | null;
  googleScholarUrl: string | null;
  researchGateUrl: string | null;
  isActive: boolean;
  homeInstitution: string | null;
  contractEndDate: string | null; // ISO string từ API
  user: { id: string; name: string; email: string; militaryId: string | null; rank: string | null; phone: string | null } | null;
  unit: { id: string; name: string; code: string } | null;
}

interface Unit { id: string; name: string; code: string }
interface StaffUser {
  id: string; name: string; email: string;
  militaryId: string | null; rank: string | null;
  role?: string | null;
  personnelType?: string | null;
  unit: { id: string; name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = [
    'bg-indigo-600', 'bg-violet-600', 'bg-purple-600', 'bg-sky-600',
    'bg-teal-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

function rankBadgeClass(rank: string | null): string {
  if (!rank) return 'bg-slate-100 text-slate-600';
  if (rank.startsWith('GS')) return 'bg-amber-100 text-amber-800';
  if (rank.startsWith('PGS')) return 'bg-violet-100 text-violet-800';
  return 'bg-indigo-100 text-indigo-800';
}

function degreeBadgeClass(deg: string | null): string {
  if (!deg) return 'bg-slate-100 text-slate-600';
  if (deg === 'TS' || deg.includes('Tiến sĩ')) return 'bg-sky-100 text-sky-800';
  if (deg === 'ThS' || deg.includes('Thạc sĩ')) return 'bg-teal-100 text-teal-800';
  return 'bg-slate-100 text-slate-600';
}

async function safeFetch(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

interface EditDrawerProps {
  faculty: FacultyProfile | null;
  units: Unit[];
  academicRanks: { id: string; name: string; shortName: string }[];
  educationLevels: { id: string; name: string; shortName: string }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditDrawer({ faculty, units, academicRanks, educationLevels, open, onClose, onSaved }: EditDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<FacultyProfile>>({});

  useEffect(() => { if (faculty) setForm(faculty); }, [faculty]);

  const set = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!faculty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/faculty/${faculty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: (form as Record<string, unknown>).unitId || faculty.unit?.id,
          academicRank: form.academicRank,
          academicDegree: form.academicDegree,
          specialization: form.specialization,
          teachingExperience: form.teachingExperience,
          industryExperience: form.industryExperience,
          biography: form.biography,
          linkedinUrl: form.linkedinUrl,
          googleScholarUrl: form.googleScholarUrl,
          researchGateUrl: form.researchGateUrl,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');
      toast.success('Đã cập nhật thông tin giảng viên');
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setSaving(false);
    }
  };

  if (!faculty) return null;
  const name = faculty.user?.name || 'N/A';

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${avatarColor(name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {initials(name)}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base leading-tight">{name}</SheetTitle>
              <SheetDescription className="text-xs truncate">
                {faculty.user?.militaryId ? `#${faculty.user.militaryId} · ` : ''}{faculty.user?.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Đơn vị */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khoa / Bộ môn</Label>
            <Select
              value={(form as Record<string, unknown>).unitId as string || faculty.unit?.id || '__none__'}
              onValueChange={v => set('unitId', v === '__none__' ? null : v)}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="Chọn khoa/bộ môn" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Chưa phân công —</SelectItem>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Học hàm + Học vị */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Học hàm</Label>
              <Select
                value={form.academicRank || '__none__'}
                onValueChange={v => set('academicRank', v === '__none__' ? null : v)}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không có —</SelectItem>
                  {academicRanks.map(r => <SelectItem key={r.id} value={r.name}>{r.shortName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Học vị</Label>
              <Select
                value={form.academicDegree || '__none__'}
                onValueChange={v => set('academicDegree', v === '__none__' ? null : v)}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không có —</SelectItem>
                  {educationLevels.map(d => <SelectItem key={d.id} value={d.name}>{d.shortName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chuyên môn */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chuyên môn</Label>
            <Input
              value={form.specialization || ''}
              onChange={e => set('specialization', e.target.value)}
              placeholder="Ví dụ: Kỹ thuật quân sự, CNTT..."
              className="h-9"
            />
          </div>

          {/* Kinh nghiệm */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">KN giảng dạy (năm)</Label>
              <Input type="number" min={0} className="h-9"
                value={form.teachingExperience ?? 0}
                onChange={e => set('teachingExperience', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">KN thực tế (năm)</Label>
              <Input type="number" min={0} className="h-9"
                value={form.industryExperience ?? 0}
                onChange={e => set('industryExperience', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Tiểu sử */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tiểu sử</Label>
            <Textarea rows={3}
              value={form.biography || ''}
              onChange={e => set('biography', e.target.value)}
              placeholder="Quá trình công tác, đào tạo..."
              className="resize-none"
            />
          </div>

          {/* Links học thuật */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Liên kết học thuật</p>
            <Input value={form.googleScholarUrl || ''} onChange={e => set('googleScholarUrl', e.target.value)}
              placeholder="Google Scholar URL" className="h-8 text-xs" />
            <Input value={form.researchGateUrl || ''} onChange={e => set('researchGateUrl', e.target.value)}
              placeholder="ResearchGate URL" className="h-8 text-xs" />
            <Input value={form.linkedinUrl || ''} onChange={e => set('linkedinUrl', e.target.value)}
              placeholder="LinkedIn URL" className="h-8 text-xs" />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <Label className="text-sm font-medium">Trạng thái hoạt động</Label>
            <Select
              value={form.isActive ? 'active' : 'inactive'}
              onValueChange={v => set('isActive', v === 'active')}
            >
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">✅ Đang hoạt động</SelectItem>
                <SelectItem value="inactive">⛔ Vô hiệu hóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Teaching Position Config ─────────────────────────────────────────────────

const TEACHING_POSITIONS = [
  {
    value: 'GV_GIANG_DAY',
    label: 'Giảng viên',
    desc: 'Giảng viên giảng dạy thông thường',
    icon: '🎓',
    color: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    activeColor: 'border-indigo-500 bg-indigo-600 text-white shadow-indigo-200',
    hours: 16,
  },
  {
    value: 'GV_CHINH',
    label: 'Giảng viên chính',
    desc: 'Giảng viên có kinh nghiệm, dạy nhiều môn chính',
    icon: '⭐',
    color: 'border-violet-200 bg-violet-50 text-violet-700',
    activeColor: 'border-violet-500 bg-violet-600 text-white shadow-violet-200',
    hours: 18,
  },
  {
    value: 'GV_CAO_CAP',
    label: 'Giảng viên cao cấp',
    desc: 'Chuyên gia đầu ngành, GS/PGS',
    icon: '🏆',
    color: 'border-amber-200 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-600 text-white shadow-amber-200',
    hours: 12,
  },
  {
    value: 'GV_THINH_GIANG',
    label: 'Giảng viên thỉnh giảng',
    desc: 'GV từ bên ngoài, dạy theo hợp đồng',
    icon: '🔗',
    color: 'border-sky-200 bg-sky-50 text-sky-700',
    activeColor: 'border-sky-500 bg-sky-600 text-white shadow-sky-200',
    hours: 8,
  },
  {
    value: 'GV_CO_HUU',
    label: 'Giảng viên cơ hữu',
    desc: 'Biên chế chính thức của học viện',
    icon: '🏛️',
    color: 'border-teal-200 bg-teal-50 text-teal-700',
    activeColor: 'border-teal-500 bg-teal-600 text-white shadow-teal-200',
    hours: 16,
  },
] as const;

type TeachingPositionValue = typeof TEACHING_POSITIONS[number]['value'];

// ─── Shared Academic Form ─────────────────────────────────────────────────────
// Dùng chung cho cả 2 tab (internal + external)

interface AcademicFormProps {
  units: Unit[];
  academicRanks: { id: string; name: string; shortName: string }[];
  educationLevels: { id: string; name: string; shortName: string }[];
  unitId: string; setUnitId: (v: string) => void;
  academicRank: string; setAcademicRank: (v: string) => void;
  academicDegree: string; setAcademicDegree: (v: string) => void;
  specialization: string; setSpecialization: (v: string) => void;
  teachingExperience: number; setTeachingExperience: (v: number) => void;
  weeklyHoursLimit: number; setWeeklyHoursLimit: (v: number) => void;
  teachingStart: string; setTeachingStart: (v: string) => void;
  locked?: boolean; // khi external mode khóa một số field
}

function AcademicForm({
  units, academicRanks, educationLevels,
  unitId, setUnitId, academicRank, setAcademicRank,
  academicDegree, setAcademicDegree, specialization, setSpecialization,
  teachingExperience, setTeachingExperience, weeklyHoursLimit, setWeeklyHoursLimit,
  teachingStart, setTeachingStart,
}: AcademicFormProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
        <GraduationCap className="h-3.5 w-3.5" />Thông tin học thuật
      </p>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600">Khoa / Bộ môn</Label>
        <Select value={unitId || '__none__'} onValueChange={v => setUnitId(v === '__none__' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Chưa phân công" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Chưa phân công —</SelectItem>
            {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Học hàm</Label>
          <Select value={academicRank || '__none__'} onValueChange={v => setAcademicRank(v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Không có" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Không có —</SelectItem>
              {academicRanks.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Học vị</Label>
          <Select value={academicDegree || '__none__'} onValueChange={v => setAcademicDegree(v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Không có" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Không có —</SelectItem>
              {educationLevels.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600">Chuyên môn</Label>
        <Input className="h-8 text-xs bg-white" value={specialization}
          onChange={e => setSpecialization(e.target.value)} placeholder="VD: Kỹ thuật quân sự, CNTT..." />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">KN giảng (năm)</Label>
          <Input type="number" min={0} className="h-8 text-xs bg-white"
            value={teachingExperience} onChange={e => setTeachingExperience(parseInt(e.target.value) || 0)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Định mức (h/tuần)</Label>
          <Input type="number" min={0} max={40} className="h-8 text-xs bg-white"
            value={weeklyHoursLimit} onChange={e => setWeeklyHoursLimit(parseFloat(e.target.value) || 8)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Bắt đầu giảng</Label>
          <Input type="date" className="h-8 text-xs bg-white"
            value={teachingStart} onChange={e => setTeachingStart(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── Add Faculty Dialog ───────────────────────────────────────────────────────

type DialogMode = 'internal' | 'external';

interface AddFacultyDialogProps {
  units: Unit[];
  academicRanks: { id: string; name: string; shortName: string }[];
  educationLevels: { id: string; name: string; shortName: string }[];
  preselected?: StaffUser | null;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

function AddFacultyDialog({ units, academicRanks, educationLevels, preselected, open, onClose, onAssigned }: AddFacultyDialogProps) {
  const [mode, setMode] = useState<DialogMode>('internal');

  // Internal mode state
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [teachingPosition, setTeachingPosition] = useState<TeachingPositionValue | ''>('');

  // External mode state
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [extPhone, setExtPhone] = useState('');
  const [homeInstitution, setHomeInstitution] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');

  // Shared academic fields
  const [unitId, setUnitId] = useState('');
  const [academicRank, setAcademicRank] = useState('');
  const [academicDegree, setAcademicDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [teachingExperience, setTeachingExperience] = useState(0);
  const [weeklyHoursLimit, setWeeklyHoursLimit] = useState(16);
  const [teachingStart, setTeachingStart] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Fetch staff candidates — realtime debounce (chỉ internal mode)
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const qs = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/faculty/assign?limit=100${qs}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch { setStaff([]); }
    finally { setStaffLoading(false); }
  }, [search]);

  useEffect(() => {
    if (!open || mode !== 'internal') return;
    const t = setTimeout(fetchStaff, 250);
    return () => clearTimeout(t);
  }, [open, mode, fetchStaff]);

  useEffect(() => {
    if (open && preselected) { setSelected(preselected); setMode('internal'); }
  }, [open, preselected]);

  const handlePositionSelect = (val: TeachingPositionValue) => {
    setTeachingPosition(val);
    const pos = TEACHING_POSITIONS.find(p => p.value === val);
    if (pos) setWeeklyHoursLimit(pos.hours);
  };

  const switchMode = (m: DialogMode) => {
    setMode(m);
    setSelected(null);
    setTeachingPosition(m === 'external' ? 'GV_THINH_GIANG' : '');
    setWeeklyHoursLimit(m === 'external' ? 8 : 16);
  };

  const canSubmitInternal = !!selected && !!teachingPosition;
  const canSubmitExternal = !!extName.trim() && !!homeInstitution.trim();
  const canSubmit = mode === 'internal' ? canSubmitInternal : canSubmitExternal;

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const sharedFields = {
        unitId: unitId || undefined,
        academicRank: academicRank || undefined,
        academicDegree: academicDegree || undefined,
        specialization: specialization || undefined,
        teachingExperience: teachingExperience || 0,
        weeklyHoursLimit,
        teachingStart: teachingStart || undefined,
      };

      let body: Record<string, unknown>;
      let successMsg: string;

      if (mode === 'internal') {
        if (!selected || !teachingPosition) return;
        const posLabel = TEACHING_POSITIONS.find(p => p.value === teachingPosition)?.label ?? '';
        body = { userId: selected.id, teachingPosition, ...sharedFields };
        successMsg = `Đã gán ${selected.name} làm ${posLabel}`;
      } else {
        body = {
          isExternalGuest: true,
          externalName: extName.trim(),
          externalEmail: extEmail.trim() || undefined,
          externalPhone: extPhone.trim() || undefined,
          homeInstitution: homeInstitution.trim(),
          contractEndDate: contractEndDate || undefined,
          teachingPosition: 'GV_THINH_GIANG',
          ...sharedFields,
        };
        successMsg = `Đã thêm ${extName.trim()} (thỉnh giảng · ${homeInstitution.trim()})`;
      }

      const res = await fetch('/api/faculty/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm giảng viên');
      toast.success(successMsg);
      onAssigned();
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally { setAssigning(false); }
  };

  const handleClose = () => {
    setMode('internal'); setSearch(''); setSelected(null);
    setTeachingPosition(''); setUnitId('');
    setAcademicRank(''); setAcademicDegree('');
    setSpecialization(''); setTeachingExperience(0);
    setWeeklyHoursLimit(16); setTeachingStart('');
    setExtName(''); setExtEmail(''); setExtPhone('');
    setHomeInstitution(''); setContractEndDate('');
    onClose();
  };

  const selectedPos = TEACHING_POSITIONS.find(p => p.value === teachingPosition);

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden gap-0 h-[90vh] max-h-[720px] flex flex-col">
        <DialogTitle className="sr-only">Thêm Giảng viên mới</DialogTitle>
        <DialogDescription className="sr-only">Thêm giảng viên nội bộ hoặc thỉnh giảng ngoài học viện</DialogDescription>

        {/* ── Header ── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b bg-gradient-to-r from-indigo-900 to-violet-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2 shrink-0">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Thêm Giảng viên mới</h2>
                <p className="text-xs text-white/60 mt-0.5">Học viện Hậu cần — Phòng Đào tạo</p>
              </div>
            </div>
            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/20 shrink-0 mt-0.5">
              <button
                type="button"
                onClick={() => switchMode('internal')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  mode === 'internal' ? 'bg-white text-indigo-800' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-3.5 w-3.5" />Cán bộ trong HV
              </button>
              <button
                type="button"
                onClick={() => switchMode('external')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 border-l border-white/20 ${
                  mode === 'external' ? 'bg-white text-indigo-800' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />Thỉnh giảng ngoài HV
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ════ INTERNAL MODE ════ */}
          {mode === 'internal' && (
            <>
              {/* LEFT: Staff list */}
              <div className="w-64 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="px-3 pt-3 pb-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      className="pl-8 h-8 text-xs border-slate-200 bg-white focus:border-indigo-400"
                      placeholder="Tìm tên, số quân, email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                    />
                    {search && (
                      <button onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">
                    {staffLoading ? 'Đang tìm...' : `${staff.length} cán bộ chưa là GV`}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                  {staffLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    </div>
                  ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-3">
                      <UserCheck className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500">
                        {search ? 'Không tìm thấy kết quả' : 'Tất cả cán bộ đã là GV'}
                      </p>
                    </div>
                  ) : (
                    staff.map(s => {
                      const isSel = selected?.id === s.id;
                      return (
                        <button key={s.id} type="button"
                          onClick={() => setSelected(isSel ? null : s)}
                          className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all ${
                            isSel ? 'bg-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg ${avatarColor(s.name)} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                            {initials(s.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className={`text-xs font-semibold truncate ${isSel ? 'text-white' : 'text-slate-800'}`}>{s.name}</p>
                              {s.role && ROLE_LABELS[s.role] && (
                                <span className={`text-[9px] font-medium rounded px-1 py-0.5 leading-none shrink-0 ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {ROLE_LABELS[s.role]}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] truncate mt-0.5 ${isSel ? 'text-white/70' : 'text-slate-400'}`}>
                              {[s.militaryId ? `#${s.militaryId}` : null, s.rank, s.unit?.name].filter(Boolean).join(' · ') || s.email}
                            </p>
                          </div>
                          {isSel && <CheckCircle className="h-4 w-4 text-white shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT: Form internal */}
              <div className="flex-1 min-w-0 overflow-y-auto">
                {!selected ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <ArrowRight className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Chọn cán bộ từ danh sách bên trái</p>
                    <p className="text-xs text-slate-400 mt-1">Tìm kiếm theo tên, số quân hoặc email</p>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    {/* Banner người đã chọn */}
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-3">
                      <div className={`h-10 w-10 rounded-xl ${avatarColor(selected.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {initials(selected.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">{selected.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[selected.militaryId ? `#${selected.militaryId}` : null, selected.rank, selected.unit?.name].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button onClick={() => setSelected(null)}
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Loại GV */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-600">Loại Giảng viên</Label>
                        <span className="text-red-500 text-sm">*</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {TEACHING_POSITIONS.map(pos => {
                          const isAct = teachingPosition === pos.value;
                          return (
                            <button key={pos.value} type="button" onClick={() => handlePositionSelect(pos.value)}
                              className={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all shadow-sm ${
                                isAct ? `${pos.activeColor} shadow-md` : `${pos.color} hover:shadow`
                              }`}
                            >
                              <span className="text-xl shrink-0">{pos.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${isAct ? 'text-white' : ''}`}>{pos.label}</p>
                                <p className={`text-[11px] truncate ${isAct ? 'text-white/75' : 'text-slate-500'}`}>{pos.desc}</p>
                              </div>
                              <span className={`shrink-0 text-xs font-mono rounded-md px-2 py-0.5 ${isAct ? 'bg-white/20 text-white' : 'bg-white/60 text-slate-500'}`}>
                                {pos.hours}h/tuần
                              </span>
                              {isAct && <CheckCircle className="h-4 w-4 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {teachingPosition && (
                      <AcademicForm
                        units={units} academicRanks={academicRanks} educationLevels={educationLevels}
                        unitId={unitId} setUnitId={setUnitId}
                        academicRank={academicRank} setAcademicRank={setAcademicRank}
                        academicDegree={academicDegree} setAcademicDegree={setAcademicDegree}
                        specialization={specialization} setSpecialization={setSpecialization}
                        teachingExperience={teachingExperience} setTeachingExperience={setTeachingExperience}
                        weeklyHoursLimit={weeklyHoursLimit} setWeeklyHoursLimit={setWeeklyHoursLimit}
                        teachingStart={teachingStart} setTeachingStart={setTeachingStart}
                      />
                    )}

                    {canSubmitInternal && selectedPos && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-xs text-emerald-700 font-medium">
                          Sẵn sàng gán <span className="font-bold">{selected.name}</span> làm{' '}
                          <span className="font-bold">{selectedPos.icon} {selectedPos.label}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ EXTERNAL MODE ════ */}
          {mode === 'external' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Info chip */}
              <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3">
                <ExternalLink className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-sky-800">Giảng viên thỉnh giảng từ đơn vị ngoài</p>
                  <p className="text-[11px] text-sky-600 mt-0.5">
                    Hệ thống sẽ tạo tài khoản tạm thời — giảng viên <strong>không thể đăng nhập</strong> vào hệ thống.
                    Dùng để quản lý phân công và theo dõi hợp đồng.
                  </p>
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />Thông tin Giảng viên
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9 bg-white text-sm"
                    placeholder="VD: PGS.TS Nguyễn Văn Anh"
                    value={extName}
                    onChange={e => setExtName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Email liên hệ</Label>
                    <Input className="h-8 text-xs bg-white" type="email"
                      placeholder="email@truong.edu.vn (tuỳ chọn)"
                      value={extEmail} onChange={e => setExtEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Số điện thoại</Label>
                    <Input className="h-8 text-xs bg-white" type="tel"
                      placeholder="0912 345 678 (tuỳ chọn)"
                      value={extPhone} onChange={e => setExtPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Thông tin hợp đồng */}
              <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />Thông tin Hợp đồng Thỉnh giảng
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">
                    Đơn vị công tác gốc <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9 bg-white text-sm"
                    placeholder="VD: Học viện Kỹ thuật Quân sự, ĐH Bách Khoa HN..."
                    value={homeInstitution}
                    onChange={e => setHomeInstitution(e.target.value)}
                    list="institution-suggestions"
                  />
                  <datalist id="institution-suggestions">
                    {['Học viện Kỹ thuật Quân sự', 'Học viện Quốc phòng', 'Học viện Chính trị', 'Đại học Bách Khoa Hà Nội', 'Đại học Kinh tế Quốc dân', 'Đại học Quốc gia Hà Nội', 'Học viện Tài chính'].map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Ngày hết hạn hợp đồng</Label>
                  <Input className="h-8 text-xs bg-white" type="date"
                    value={contractEndDate} onChange={e => setContractEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {contractEndDate && (
                    <p className="text-[10px] text-amber-600">
                      Hợp đồng hiệu lực đến {new Date(contractEndDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>

                {/* Loại GV — cố định Thỉnh giảng */}
                <div className="flex items-center gap-2 rounded-lg bg-sky-100 border border-sky-200 px-3 py-2">
                  <span className="text-lg">🔗</span>
                  <div>
                    <p className="text-xs font-bold text-sky-800">Giảng viên thỉnh giảng</p>
                    <p className="text-[10px] text-sky-600">Loại GV được gán tự động cho trường hợp này</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-sky-600 ml-auto shrink-0" />
                </div>
              </div>

              {/* Thông tin học thuật */}
              <AcademicForm
                units={units} academicRanks={academicRanks} educationLevels={educationLevels}
                unitId={unitId} setUnitId={setUnitId}
                academicRank={academicRank} setAcademicRank={setAcademicRank}
                academicDegree={academicDegree} setAcademicDegree={setAcademicDegree}
                specialization={specialization} setSpecialization={setSpecialization}
                teachingExperience={teachingExperience} setTeachingExperience={setTeachingExperience}
                weeklyHoursLimit={weeklyHoursLimit} setWeeklyHoursLimit={setWeeklyHoursLimit}
                teachingStart={teachingStart} setTeachingStart={setTeachingStart}
              />

              {/* Summary */}
              {canSubmitExternal && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Sẵn sàng thêm <span className="font-bold">{extName}</span> từ{' '}
                    <span className="font-bold">{homeInstitution}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-t bg-slate-50">
          <p className="text-xs text-slate-400">
            {mode === 'internal'
              ? (!selected ? 'Chọn cán bộ để bắt đầu' : !teachingPosition ? 'Chọn loại giảng viên' : 'Sẵn sàng xác nhận')
              : (!extName.trim() ? 'Nhập họ tên giảng viên' : !homeInstitution.trim() ? 'Nhập đơn vị công tác gốc' : 'Sẵn sàng xác nhận')
            }
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="border-slate-200 h-9 text-sm">Hủy</Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || !canSubmit}
              className={`h-9 text-sm min-w-[150px] transition-all ${
                canSubmit
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {assigning
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang thêm...</>
                : <><CheckCircle className="h-4 w-4 mr-2" />Xác nhận thêm GV</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Faculty Card ─────────────────────────────────────────────────────────────

function FacultyCard({ faculty, onEdit }: { faculty: FacultyProfile; onEdit: (f: FacultyProfile) => void }) {
  const router = useRouter();
  const name = faculty.user?.name || 'N/A';

  return (
    <div
      className={`group rounded-2xl border bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${!faculty.isActive ? 'opacity-60' : 'border-slate-100 hover:border-indigo-200'}`}
      onClick={() => router.push(`/dashboard/faculty/profile?userId=${faculty.userId}`)}
    >
      {/* Card top */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`h-12 w-12 rounded-xl ${avatarColor(name)} flex items-center justify-center text-white font-bold text-base shrink-0`}>
            {initials(name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate leading-tight group-hover:text-indigo-700 transition-colors">
              {name}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {faculty.user?.militaryId ? `#${faculty.user.militaryId} · ` : ''}{faculty.user?.rank || faculty.user?.email}
            </p>
          </div>
          <button
            type="button"
            title="Chỉnh sửa"
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            onClick={e => { e.stopPropagation(); onEdit(faculty); }}
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {faculty.academicRank && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${rankBadgeClass(faculty.academicRank)}`}>
              {faculty.academicRank}
            </span>
          )}
          {faculty.academicDegree && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${degreeBadgeClass(faculty.academicDegree)}`}>
              {faculty.academicDegree}
            </span>
          )}
          {!faculty.isActive && (
            <span className="rounded-md px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700">Vô hiệu</span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pb-3 space-y-1.5 border-t border-slate-50 pt-2.5">
        {/* Badge thỉnh giảng ngoài HV */}
        {faculty.homeInstitution && (() => {
          const expDate = faculty.contractEndDate ? new Date(faculty.contractEndDate) : null;
          const daysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / 86400000) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
          const isExpired = daysLeft !== null && daysLeft < 0;
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                <span className="text-xs text-sky-700 font-semibold truncate">
                  Thỉnh giảng · {faculty.homeInstitution}
                </span>
              </div>
              {isExpired && (
                <div className="flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-1">
                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="text-[10px] text-red-700 font-semibold">
                    HĐ đã hết hạn {expDate!.toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              {isExpiringSoon && !isExpired && (
                <div className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-amber-700 font-semibold">
                    HĐ hết hạn sau {daysLeft} ngày · {expDate!.toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {faculty.unit && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{faculty.unit.name}</span>
          </div>
        )}
        {faculty.specialization && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{faculty.specialization}</span>
          </div>
        )}
      </div>

      {/* Research metrics */}
      {(faculty.publications > 0 || faculty.researchProjects > 0 || faculty.citations > 0) && (
        <div className="grid grid-cols-3 gap-0 border-t border-slate-100">
          {[
            { v: faculty.researchProjects, l: 'Dự án' },
            { v: faculty.publications, l: 'Công bố' },
            { v: faculty.citations, l: 'Trích dẫn' },
          ].map((m, i) => (
            <div key={i} className={`py-2 text-center ${i < 2 ? 'border-r border-slate-100' : ''}`}>
              <p className="text-sm font-bold text-indigo-700">{m.v}</p>
              <p className="text-[10px] text-slate-400">{m.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* External links */}
      {(faculty.googleScholarUrl || faculty.researchGateUrl || faculty.linkedinUrl) && (
        <div className="flex gap-3 px-4 py-2 border-t border-slate-50">
          {faculty.googleScholarUrl && (
            <a href={faculty.googleScholarUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-sky-600 hover:underline flex items-center gap-0.5 font-medium">
              Scholar <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          {faculty.researchGateUrl && (
            <a href={faculty.researchGateUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-teal-600 hover:underline flex items-center gap-0.5 font-medium">
              ResGate <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          {faculty.linkedinUrl && (
            <a href={faculty.linkedinUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              LinkedIn <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staff Candidate Card (cán bộ chưa là GV) ────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị',
  QUAN_TRI_HE_THONG: 'QT hệ thống',
  CHI_HUY_HOC_VIEN: 'Chỉ huy HV',
  CHI_HUY_KHOA_PHONG: 'Chỉ huy KP',
  CHI_HUY_HE: 'Chỉ huy hệ',
  CHI_HUY_TIEU_DOAN: 'Chỉ huy TĐ',
  CHI_HUY_BAN: 'Chỉ huy ban',
  CHI_HUY_BO_MON: 'Chỉ huy BM',
  CHU_NHIEM_BO_MON: 'Chủ nhiệm BM',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  TRO_LY: 'Trợ lý',
  NHAN_VIEN: 'Nhân viên',
  KY_THUAT_VIEN: 'Kỹ thuật viên',
};

function StaffCandidateCard({ staff, onAdd }: { staff: StaffUser; onAdd: (s: StaffUser) => void }) {
  const name = staff.name;
  const roleLabel = staff.role ? (ROLE_LABELS[staff.role] ?? staff.role) : null;
  const subInfo = [
    staff.militaryId ? `#${staff.militaryId}` : null,
    staff.rank,
    staff.unit?.name,
  ].filter(Boolean).join(' · ') || staff.email;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
      <div className={`h-8 w-8 rounded-lg ${avatarColor(name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{name}</p>
          {roleLabel && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 leading-none">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{subInfo}</p>
      </div>
      <button
        type="button"
        onClick={() => onAdd(staff)}
        className="shrink-0 h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title="Thêm làm giảng viên"
      >
        <UserPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FacultyListPage() {
  const { status } = useSession() || {};
  const router = useRouter();

  // Faculty list state
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  // Master data
  const [academicRanks, setAcademicRanks] = useState<{ id: string; name: string; shortName: string }[]>([]);
  const [educationLevels, setEducationLevels] = useState<{ id: string; name: string; shortName: string }[]>([]);

  // Staff candidates (chưa là GV)
  const [staffCandidates, setStaffCandidates] = useState<StaffUser[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffTotal, setStaffTotal] = useState(0);

  // Modals
  const [editTarget, setEditTarget] = useState<FacultyProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPreselected, setAddPreselected] = useState<StaffUser | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  // Fetch units + master data
  useEffect(() => {
    safeFetch('/api/units?type=KHOA,BOMON')
      .then(d => setUnits(d?.units || d?.data || []));
    Promise.all([
      safeFetch('/api/master-data/academic-titles'),
      safeFetch('/api/master-data/education-levels'),
    ]).then(([r, e]) => {
      if (r?.data) setAcademicRanks(r.data);
      if (e?.data) setEducationLevels(e.data);
    });
  }, []);

  // Fetch faculty list
  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: LIMIT.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedUnit !== 'all' && { unitId: selectedUnit }),
        ...(selectedRank !== 'all' && { academicRank: selectedRank }),
        ...(selectedDegree !== 'all' && { academicDegree: selectedDegree }),
      });
      const res = await fetch(`/api/faculty/list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách');
      setFaculty(data.faculty || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi hệ thống');
    } finally { setLoading(false); }
  }, [page, searchTerm, selectedUnit, selectedRank, selectedDegree]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  // Fetch staff candidates
  const fetchStaffCandidates = useCallback(async () => {
    setStaffLoading(true);
    try {
      const qs = staffSearch ? `&search=${encodeURIComponent(staffSearch)}` : '';
      const res = await fetch(`/api/faculty/assign?limit=200${qs}`);
      const data = await res.json();
      const list: StaffUser[] = data.staff || [];
      setStaffCandidates(list);
      setStaffTotal(list.length);
    } catch { setStaffCandidates([]); }
    finally { setStaffLoading(false); }
  }, [staffSearch]);

  useEffect(() => {
    const t = setTimeout(fetchStaffCandidates, 300);
    return () => clearTimeout(t);
  }, [fetchStaffCandidates]);

  const clearFilters = () => {
    setSearchTerm(''); setSelectedUnit('all');
    setSelectedRank('all'); setSelectedDegree('all'); setPage(1);
  };

  const hasActiveFilters = searchTerm || selectedUnit !== 'all' || selectedRank !== 'all' || selectedDegree !== 'all';

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedUnit !== 'all' && { unitId: selectedUnit }),
        ...(selectedRank !== 'all' && { academicRank: selectedRank }),
        ...(selectedDegree !== 'all' && { academicDegree: selectedDegree }),
      });
      const res = await fetch(`/api/faculty/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-sach-giang-vien-${Date.now()}.${format}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Lỗi khi xuất file'); }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text('DANH SACH GIANG VIEN', 105, 18, { align: 'center' });
      doc.setFontSize(10); doc.text(`Tong so: ${total}`, 105, 26, { align: 'center' });
      autoTable(doc, {
        head: [['STT', 'Ho ten', 'Don vi', 'Hoc ham', 'Hoc vi', 'De tai', 'Cong bo']],
        body: faculty.map((f, i) => [i + 1, f.user?.name || 'N/A', f.unit?.name || 'N/A',
          f.academicRank || '—', f.academicDegree || '—', f.researchProjects, f.publications]),
        startY: 32,
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`danh-sach-giang-vien-${Date.now()}.pdf`);
    } catch { toast.error('Lỗi khi xuất PDF'); }
  };

  const handleAddFromCandidate = (s: StaffUser) => {
    setAddPreselected(s);
    setAddOpen(true);
  };

  const handleAddAssigned = () => {
    setAddOpen(false);
    setAddPreselected(null);
    fetchFaculty();
    fetchStaffCandidates();
  };

  const activeFilterCount = [
    searchTerm, selectedUnit !== 'all', selectedRank !== 'all', selectedDegree !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* ── Page Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-700 px-6 py-5 text-white shadow-lg mb-5">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-sm shrink-0">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  Phòng Đào tạo · Học viện Hậu cần
                </p>
                <h1 className="text-xl font-extrabold tracking-tight">Danh sách Giảng viên</h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {total > 0 ? `${total} giảng viên` : 'Đang tải...'}
                  {staffTotal > 0 ? ` · ${staffTotal} cán bộ chưa là GV` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-white text-indigo-700 font-semibold hover:bg-white/90 shadow"
                onClick={() => { setAddPreselected(null); setAddOpen(true); }}>
                <UserPlus className="mr-1.5 h-4 w-4" />Thêm Giảng viên
              </Button>
              <Button size="sm" variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel
              </Button>
              <Button size="sm" variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={handleExportPDF}>
                <FileDown className="mr-1.5 h-4 w-4" />PDF
              </Button>
              <Button size="sm" variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={fetchFaculty}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-5 items-start">

          {/* ════════════════════════════════════════
              LEFT PANEL: Faculty List
          ════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Search + Filter bar */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên, email, số quân..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 h-9 border-slate-200"
                  />
                </div>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  className={`shrink-0 h-9 px-3 gap-1.5 ${showFilters ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-slate-200'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Lọc
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-white text-indigo-700 text-[10px] font-bold px-1.5">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <Select value={selectedUnit} onValueChange={v => { setSelectedUnit(v); setPage(1); }}>
                    <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Khoa/Bộ môn" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả đơn vị</SelectItem>
                      {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRank} onValueChange={v => { setSelectedRank(v); setPage(1); }}>
                    <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Học hàm" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả học hàm</SelectItem>
                      {academicRanks.map(r => <SelectItem key={r.id} value={r.name}>{r.name} ({r.shortName})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDegree} onValueChange={v => { setSelectedDegree(v); setPage(1); }}>
                    <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Học vị" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả học vị</SelectItem>
                      {educationLevels.map(d => <SelectItem key={d.id} value={d.name}>{d.name} ({d.shortName})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <div className="sm:col-span-3">
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-red-600 h-8">
                        <X className="h-3.5 w-3.5 mr-1.5" />Xóa bộ lọc
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchFaculty} className="border-red-300 text-red-600 hover:bg-red-100">
                  <RefreshCw className="mr-1.5 h-3 w-3" />Thử lại
                </Button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : faculty.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 py-16 text-center">
                <GraduationCap className="h-14 w-14 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Không tìm thấy giảng viên</p>
                <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc thêm giảng viên mới</p>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setAddPreselected(null); setAddOpen(true); }}>
                  <UserPlus className="h-4 w-4 mr-2" />Thêm giảng viên đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {faculty.map(f => (
                  <FacultyCard
                    key={f.id}
                    faculty={f}
                    onEdit={t => { setEditTarget(t); setEditOpen(true); }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
                  &nbsp;·&nbsp;{total} giảng viên
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    className="border-slate-200 h-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                    className="border-slate-200 h-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              RIGHT PANEL: Cán bộ chưa là GV
          ════════════════════════════════════════ */}
          <div className="w-80 shrink-0 sticky top-4 space-y-3">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-1">
                      <Users className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-amber-800">Cán bộ chưa là GV</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {staffTotal > 0 && (
                      <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
                        {staffTotal}
                      </span>
                    )}
                    <button onClick={fetchStaffCandidates} className="text-amber-500 hover:text-amber-700 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-amber-600">Nhấn <UserPlus className="h-3 w-3 inline" /> để thêm làm giảng viên</p>
              </div>

              {/* Search */}
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Tìm cán bộ..."
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    className="pl-8 h-8 text-xs border-slate-200"
                  />
                </div>
              </div>

              {/* List */}
              <div className="px-3 pb-3 space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  </div>
                ) : staffCandidates.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <UserCheck className="h-10 w-10 text-emerald-300 mx-auto" />
                    <p className="text-xs text-slate-500">
                      {staffSearch ? 'Không tìm thấy cán bộ' : 'Tất cả cán bộ đã là giảng viên'}
                    </p>
                  </div>
                ) : (
                  staffCandidates.map(s => (
                    <StaffCandidateCard
                      key={s.id}
                      staff={s}
                      onAdd={handleAddFromCandidate}
                    />
                  ))
                )}
              </div>

              {/* Add all button */}
              {staffCandidates.length > 0 && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-8 text-xs"
                    onClick={() => { setAddPreselected(null); setAddOpen(true); }}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Mở giao diện thêm GV
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>{/* end two-column */}
      </div>

      {/* ── Modals ── */}
      <EditDrawer
        faculty={editTarget}
        units={units}
        academicRanks={academicRanks}
        educationLevels={educationLevels}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSaved={fetchFaculty}
      />

      <AddFacultyDialog
        units={units}
        academicRanks={academicRanks}
        educationLevels={educationLevels}
        preselected={addPreselected}
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddPreselected(null); }}
        onAssigned={handleAddAssigned}
      />
    </div>
  );
}
