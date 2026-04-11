'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  Download,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Briefcase,
  FlaskConical,
  Award,
  User,
  BookOpen,
  TrendingUp,
  ExternalLink,
  Globe,
  Shield,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEGREE_LABEL: Record<string, string> = {
  TSKH: 'Tiến sĩ Khoa học',
  TS:   'Tiến sĩ',
  ThS:  'Thạc sĩ',
  CN:   'Cử nhân',
  KS:   'Kỹ sư',
  CK1:  'Chuyên khoa I',
  CK2:  'Chuyên khoa II',
};

const DEGREE_SHORT: Record<string, string> = {
  TSKH: 'TSKH',
  TS:   'TS',
  ThS:  'ThS',
  CN:   'CN',
  KS:   'KS',
  CK1:  'CK I',
  CK2:  'CK II',
};

const DEGREE_COLOR: Record<string, string> = {
  TSKH: 'bg-violet-100 text-violet-700 border-violet-200',
  TS:   'bg-indigo-100 text-indigo-700 border-indigo-200',
  ThS:  'bg-sky-100 text-sky-700 border-sky-200',
  CN:   'bg-gray-100 text-gray-600 border-gray-200',
  KS:   'bg-gray-100 text-gray-600 border-gray-200',
  CK1:  'bg-teal-100 text-teal-700 border-teal-200',
  CK2:  'bg-teal-100 text-teal-700 border-teal-200',
};

const AWARD_LEVEL_LABEL: Record<string, string> = {
  INTERNATIONAL: 'Quốc tế',
  MINISTRY:      'Cấp Bộ',
  ACADEMY:       'Cấp Học viện',
  DEPARTMENT:    'Cấp Đơn vị',
};

const AWARD_LEVEL_COLOR: Record<string, string> = {
  INTERNATIONAL: 'bg-amber-100 text-amber-700',
  MINISTRY:      'bg-violet-100 text-violet-700',
  ACADEMY:       'bg-indigo-100 text-indigo-700',
  DEPARTMENT:    'bg-sky-100 text-sky-700',
};

const PRIMARY_FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần KT',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const DEGREE_VALUES = ['TSKH', 'TS', 'ThS', 'CN', 'KS', 'CK1', 'CK2'] as const;
const AWARD_LEVEL_VALUES = ['INTERNATIONAL', 'MINISTRY', 'ACADEMY', 'DEPARTMENT'] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EducationRecord {
  id: string;
  degree: string;
  major: string;
  institution: string;
  country: string;
  yearFrom: number;
  yearTo: number;
  thesisTitle?: string | null;
}

interface CareerRecord {
  id: string;
  position: string;
  unitName: string;
  yearFrom: number;
  yearTo?: number | null;
  isCurrent: boolean;
}

interface AwardRecord {
  id: string;
  awardName: string;
  level: string;
  year: number;
  description?: string | null;
  projectId?: string | null;
}

interface ScientistDetail {
  id: string;
  userId: string;
  maso?: string | null;
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  totalPublications: number;
  primaryField?: string | null;
  secondaryFields?: string[];
  researchKeywords?: string[];
  researchFields?: string[];
  specialization?: string | null;
  orcidId?: string | null;
  scopusAuthorId?: string | null;
  googleScholarId?: string | null;
  bio?: string | null;
  academicRank?: string | null;
  degree?: string | null;
  projectLeadCount: number;
  projectMemberCount: number;
  sensitivityLevel: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    rank?: string | null;
    militaryId?: string | null;
    email?: string | null;
    phone?: string | null;
    academicTitle?: string | null;
    unitRelation?: { id: string; name: string; code: string } | null;
  };
  education: EducationRecord[];
  career: CareerRecord[];
  scientistAwards: AwardRecord[];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionEmpty({ label }: { label: string }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <p className="text-sm">{label}</p>
    </div>
  );
}

function MetricCard({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ─── Education Tab ─────────────────────────────────────────────────────────────

interface EducationTabProps {
  scientistId: string;
  items: EducationRecord[];
  onRefresh: () => void;
}

function EducationTab({ scientistId, items, onRefresh }: EducationTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EducationRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    degree: 'TS',
    major: '',
    institution: '',
    country: 'Việt Nam',
    yearFrom: new Date().getFullYear() - 4,
    yearTo: new Date().getFullYear(),
    thesisTitle: '',
  });

  function openAdd() {
    setEditing(null);
    setForm({ degree: 'TS', major: '', institution: '', country: 'Việt Nam', yearFrom: new Date().getFullYear() - 4, yearTo: new Date().getFullYear(), thesisTitle: '' });
    setOpen(true);
  }

  function openEdit(item: EducationRecord) {
    setEditing(item);
    setForm({ degree: item.degree, major: item.major, institution: item.institution, country: item.country, yearFrom: item.yearFrom, yearTo: item.yearTo, thesisTitle: item.thesisTitle ?? '' });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.major || !form.institution) {
      toast.error('Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/science/scientists/${scientistId}?sub=education&subId=${editing.id}`
        : `/api/science/scientists/${scientistId}?sub=education`;
      const method = editing ? 'PATCH' : 'POST';
      const body = {
        degree: form.degree,
        major: form.major.trim(),
        institution: form.institution.trim(),
        country: form.country.trim() || 'Việt Nam',
        yearFrom: Number(form.yearFrom),
        yearTo: Number(form.yearTo),
        thesisTitle: form.thesisTitle.trim() || undefined,
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success(editing ? 'Đã cập nhật học vị' : 'Đã thêm học vị');
      setOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu học vị');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: EducationRecord) {
    if (!confirm(`Xóa học vị ${DEGREE_SHORT[item.degree] ?? item.degree} - ${item.institution}?`)) return;
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}?sub=education&subId=${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success('Đã xóa học vị');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa học vị');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Thêm học vị
        </Button>
      </div>

      {items.length === 0 ? (
        <SectionEmpty label="Chưa có thông tin học vị" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${DEGREE_COLOR[item.degree] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {DEGREE_SHORT[item.degree] ?? item.degree}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{item.major}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{item.institution}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.country} · {item.yearFrom}–{item.yearTo}
                      </p>
                      {item.thesisTitle && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Luận án: {item.thesisTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật học vị' : 'Thêm học vị'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Học vị *</label>
              <Select value={form.degree} onValueChange={(v) => setForm((f) => ({ ...f, degree: v }))}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_VALUES.map((d) => (
                    <SelectItem key={d} value={d}>{DEGREE_LABEL[d] ?? d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Chuyên ngành *</label>
              <Input value={form.major} onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))} placeholder="Kỹ thuật quân sự..." className="border-gray-200" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cơ sở đào tạo *</label>
              <Input value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} placeholder="Học viện Kỹ thuật Quân sự..." className="border-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Quốc gia</label>
                <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="border-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Từ năm *</label>
                <Input type="number" value={form.yearFrom} onChange={(e) => setForm((f) => ({ ...f, yearFrom: Number(e.target.value) }))} className="border-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Đến năm *</label>
                <Input type="number" value={form.yearTo} onChange={(e) => setForm((f) => ({ ...f, yearTo: Number(e.target.value) }))} className="border-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tên luận án</label>
              <Input value={form.thesisTitle} onChange={(e) => setForm((f) => ({ ...f, thesisTitle: e.target.value }))} placeholder="Tên đề tài luận án..." className="border-gray-200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Career Tab ────────────────────────────────────────────────────────────────

interface CareerTabProps {
  scientistId: string;
  items: CareerRecord[];
  onRefresh: () => void;
}

function CareerTab({ scientistId, items, onRefresh }: CareerTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CareerRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    position: '',
    unitName: '',
    yearFrom: new Date().getFullYear() - 2,
    yearTo: '',
    isCurrent: false,
  });

  function openAdd() {
    setEditing(null);
    setForm({ position: '', unitName: '', yearFrom: new Date().getFullYear() - 2, yearTo: '', isCurrent: false });
    setOpen(true);
  }

  function openEdit(item: CareerRecord) {
    setEditing(item);
    setForm({ position: item.position, unitName: item.unitName, yearFrom: item.yearFrom, yearTo: item.yearTo ? String(item.yearTo) : '', isCurrent: item.isCurrent });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.position || !form.unitName) {
      toast.error('Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/science/scientists/${scientistId}?sub=career&subId=${editing.id}`
        : `/api/science/scientists/${scientistId}?sub=career`;
      const method = editing ? 'PATCH' : 'POST';
      const body = {
        position: form.position.trim(),
        unitName: form.unitName.trim(),
        yearFrom: Number(form.yearFrom),
        yearTo: form.isCurrent ? undefined : (form.yearTo ? Number(form.yearTo) : undefined),
        isCurrent: form.isCurrent,
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success(editing ? 'Đã cập nhật vị trí công tác' : 'Đã thêm vị trí công tác');
      setOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu vị trí công tác');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CareerRecord) {
    if (!confirm(`Xóa vị trí "${item.position}" tại "${item.unitName}"?`)) return;
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}?sub=career&subId=${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success('Đã xóa vị trí công tác');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa vị trí công tác');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Thêm vị trí
        </Button>
      </div>

      {items.length === 0 ? (
        <SectionEmpty label="Chưa có thông tin quá trình công tác" />
      ) : (
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-gray-100" />
          {items.map((item) => (
            <div key={item.id} className="relative flex items-start gap-4 pb-5">
              {/* Dot */}
              <div className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${item.isCurrent ? 'bg-emerald-100 border-2 border-emerald-400' : 'bg-gray-100 border-2 border-gray-200'}`}>
                <Briefcase className={`h-4 w-4 ${item.isCurrent ? 'text-emerald-600' : 'text-gray-400'}`} />
              </div>
              <Card className="flex-1 border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{item.position}</span>
                        {item.isCurrent && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{item.unitName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.yearFrom} – {item.isCurrent ? 'nay' : (item.yearTo ?? '...')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật vị trí công tác' : 'Thêm vị trí công tác'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Chức vụ *</label>
              <Input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="Giảng viên, Phó Chủ nhiệm bộ môn..." className="border-gray-200" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Đơn vị / Tổ chức *</label>
              <Input value={form.unitName} onChange={(e) => setForm((f) => ({ ...f, unitName: e.target.value }))} placeholder="Học viện Hậu cần..." className="border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Từ năm *</label>
                <Input type="number" value={form.yearFrom} onChange={(e) => setForm((f) => ({ ...f, yearFrom: Number(e.target.value) }))} className="border-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Đến năm</label>
                <Input type="number" value={form.yearTo} disabled={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, yearTo: e.target.value }))} placeholder="Để trống nếu vẫn đương nhiệm" className="border-gray-200" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked, yearTo: e.target.checked ? '' : f.yearTo }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">Đang đương nhiệm (hiện tại)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Award Tab ─────────────────────────────────────────────────────────────────

interface AwardTabProps {
  scientistId: string;
  items: AwardRecord[];
  onRefresh: () => void;
}

function AwardTab({ scientistId, items, onRefresh }: AwardTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AwardRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    awardName: '',
    level: 'ACADEMY',
    year: new Date().getFullYear(),
    description: '',
  });

  function openAdd() {
    setEditing(null);
    setForm({ awardName: '', level: 'ACADEMY', year: new Date().getFullYear(), description: '' });
    setOpen(true);
  }

  function openEdit(item: AwardRecord) {
    setEditing(item);
    setForm({ awardName: item.awardName, level: item.level, year: item.year, description: item.description ?? '' });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.awardName) {
      toast.error('Vui lòng nhập tên giải thưởng');
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/science/scientists/${scientistId}?sub=award&subId=${editing.id}`
        : `/api/science/scientists/${scientistId}?sub=award`;
      const method = editing ? 'PATCH' : 'POST';
      const body = {
        awardName: form.awardName.trim(),
        level: form.level,
        year: Number(form.year),
        description: form.description.trim() || undefined,
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success(editing ? 'Đã cập nhật giải thưởng' : 'Đã thêm giải thưởng');
      setOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu giải thưởng');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: AwardRecord) {
    if (!confirm(`Xóa giải thưởng "${item.awardName}"?`)) return;
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}?sub=award&subId=${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success('Đã xóa giải thưởng');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa giải thưởng');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Thêm giải thưởng
        </Button>
      </div>

      {items.length === 0 ? (
        <SectionEmpty label="Chưa có thông tin giải thưởng / khen thưởng" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${AWARD_LEVEL_COLOR[item.level] ?? 'bg-gray-100 text-gray-600'}`}>
                          {AWARD_LEVEL_LABEL[item.level] ?? item.level}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{item.awardName}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Năm {item.year}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật giải thưởng' : 'Thêm giải thưởng'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tên giải thưởng / khen thưởng *</label>
              <Input value={form.awardName} onChange={(e) => setForm((f) => ({ ...f, awardName: e.target.value }))} placeholder="Chiến sĩ thi đua toàn quân..." className="border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Cấp giải thưởng *</label>
                <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AWARD_LEVEL_VALUES.map((l) => (
                      <SelectItem key={l} value={l}>{AWARD_LEVEL_LABEL[l] ?? l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Năm *</label>
                <Input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className="border-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả</label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ghi chú thêm về giải thưởng..." className="border-gray-200 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Research Tab ──────────────────────────────────────────────────────────────

function ResearchTab({ profile }: { profile: ScientistDetail }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value={profile.hIndex}            label="H-Index"         color="text-violet-700" />
        <MetricCard value={profile.i10Index}          label="i10-Index"       color="text-indigo-700" />
        <MetricCard value={profile.totalCitations}    label="Trích dẫn"       color="text-sky-700" />
        <MetricCard value={profile.totalPublications} label="Công bố KH"      color="text-teal-700" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard value={profile.projectLeadCount}  label="Đề tài Chủ nhiệm"   color="text-indigo-700" />
        <MetricCard value={profile.projectMemberCount} label="Đề tài Tham gia"  color="text-sky-700" />
      </div>

      {/* External IDs */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Mã định danh học thuật</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {profile.orcidId ? (
            <a
              href={`https://orcid.org/${profile.orcidId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:underline"
            >
              <Globe className="h-4 w-4" />
              ORCID: {profile.orcidId}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="text-sm text-gray-400">ORCID chưa được khai báo</p>
          )}
          {profile.scopusAuthorId && (
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <BookOpen className="h-4 w-4 text-gray-400" />
              Scopus Author ID: <span className="font-mono">{profile.scopusAuthorId}</span>
            </p>
          )}
          {profile.googleScholarId && (
            <a
              href={`https://scholar.google.com/citations?user=${profile.googleScholarId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Globe className="h-4 w-4" />
              Google Scholar: {profile.googleScholarId}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!profile.scopusAuthorId && !profile.googleScholarId && !profile.orcidId && (
            <p className="text-sm text-gray-400">Chưa có mã định danh học thuật</p>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => router.push('/dashboard/science/projects')}
          >
            <FlaskConical className="h-4 w-4" /> Xem đề tài nghiên cứu
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-sky-200 text-sky-700 hover:bg-sky-50"
            onClick={() => router.push('/dashboard/science/works')}
          >
            <BookOpen className="h-4 w-4" /> Xem công trình khoa học
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Info Tab ──────────────────────────────────────────────────────────────────

function InfoTab({ profile }: { profile: ScientistDetail }) {
  return (
    <div className="space-y-5">
      {/* Bio */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Tiểu sử / Giới thiệu</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.bio ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Chưa có tiểu sử</p>
          )}
        </CardContent>
      </Card>

      {/* Research areas */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Lĩnh vực nghiên cứu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.primaryField && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Lĩnh vực chính</p>
              <span className="inline-block text-sm px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {PRIMARY_FIELD_LABELS[profile.primaryField] ?? profile.primaryField}
              </span>
            </div>
          )}
          {profile.secondaryFields && profile.secondaryFields.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Lĩnh vực phụ</p>
              <div className="flex flex-wrap gap-2">
                {profile.secondaryFields.map((f) => (
                  <span key={f} className="text-sm px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                    {PRIMARY_FIELD_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.specialization && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Chuyên sâu</p>
              <p className="text-sm text-gray-700">{profile.specialization}</p>
            </div>
          )}
          {!profile.primaryField && !profile.specialization && (
            <p className="text-sm text-gray-400 italic">Chưa khai báo lĩnh vực nghiên cứu</p>
          )}
        </CardContent>
      </Card>

      {/* Research keywords */}
      {profile.researchKeywords && profile.researchKeywords.length > 0 && (
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Từ khóa nghiên cứu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.researchKeywords.map((kw) => (
                <span key={kw} className="text-sm px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                  {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact / identity */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {profile.user.militaryId && (
                <TableRow>
                  <TableCell className="text-xs text-gray-500 font-medium w-[140px]">Số quân / Mã NV</TableCell>
                  <TableCell className="text-sm font-mono text-gray-800">{profile.user.militaryId}</TableCell>
                </TableRow>
              )}
              {profile.maso && (
                <TableRow>
                  <TableCell className="text-xs text-gray-500 font-medium">Mã số KH</TableCell>
                  <TableCell className="text-sm font-mono text-gray-800">{profile.maso}</TableCell>
                </TableRow>
              )}
              {profile.user.email && (
                <TableRow>
                  <TableCell className="text-xs text-gray-500 font-medium">Email</TableCell>
                  <TableCell className="text-sm text-gray-800">{profile.user.email}</TableCell>
                </TableRow>
              )}
              {profile.user.phone && (
                <TableRow>
                  <TableCell className="text-xs text-gray-500 font-medium">Điện thoại</TableCell>
                  <TableCell className="text-sm text-gray-800">{profile.user.phone}</TableCell>
                </TableRow>
              )}
              {profile.user.unitRelation && (
                <TableRow>
                  <TableCell className="text-xs text-gray-500 font-medium">Đơn vị</TableCell>
                  <TableCell className="text-sm text-gray-800">{profile.user.unitRelation.name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="text-xs text-gray-500 font-medium">Cập nhật lần cuối</TableCell>
                <TableCell className="text-sm text-gray-800">
                  {new Date(profile.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScientistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const scientistId = params.id;

  const [profile, setProfile] = useState<ScientistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Không tìm thấy hồ sơ');
      setProfile(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ nhà khoa học');
    } finally {
      setLoading(false);
    }
  }, [scientistId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSyncOrcid() {
    if (!profile?.orcidId) {
      toast.error('Hồ sơ chưa có ORCID ID. Hãy cập nhật orcidId trước.');
      return;
    }
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}/sync-orcid`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      toast.success('ORCID sync đã được đưa vào hàng đợi. Dữ liệu sẽ được cập nhật sau vài phút.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể đồng bộ ORCID');
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/science/scientists/${scientistId}/export?format=json`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định');
      // Download as JSON file
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ho-so-nha-khoa-hoc-${scientistId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất hồ sơ thành công');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xuất hồ sơ');
    } finally {
      setExportLoading(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="text-center py-20 text-gray-400">
        <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-base font-medium text-gray-600">{error ?? 'Không tìm thấy hồ sơ'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  const highestDegree = profile.education?.[0]?.degree ?? profile.degree;
  const displayName = [profile.user.rank, profile.user.name].filter(Boolean).join(' ');

  // ── Full page ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Back bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/science/scientists')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Hồ sơ Nhà Khoa học
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncOrcid}
            disabled={syncLoading || !profile.orcidId}
            className="gap-1.5 border-gray-200 text-gray-600"
            title={!profile.orcidId ? 'Hồ sơ chưa có ORCID ID' : 'Đồng bộ ORCID'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Đang đồng bộ...' : 'Sync ORCID'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
            className="gap-1.5 border-gray-200 text-gray-600"
          >
            <Download className="h-3.5 w-3.5" />
            {exportLoading ? 'Đang xuất...' : 'Xuất hồ sơ'}
          </Button>
        </div>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-6 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shrink-0 border border-white/30">
            {profile.user.name.charAt(0).toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {highestDegree && (
                <span className="text-xs font-bold bg-white/20 border border-white/30 px-2 py-0.5 rounded">
                  {DEGREE_SHORT[highestDegree] ?? highestDegree}
                </span>
              )}
              {profile.user.academicTitle && (
                <span className="text-xs font-medium bg-amber-400/30 border border-amber-400/40 text-amber-100 px-2 py-0.5 rounded">
                  {profile.user.academicTitle}
                </span>
              )}
              {profile.sensitivityLevel === 'CONFIDENTIAL' ? (
                <span className="flex items-center gap-1 text-[10px] bg-red-500/30 border border-red-400/40 text-red-100 px-2 py-0.5 rounded">
                  <ShieldAlert className="h-3 w-3" /> Hồ sơ mật
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-white/10 border border-white/20 text-white/70 px-2 py-0.5 rounded">
                  <Shield className="h-3 w-3" /> Thường
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white">{displayName}</h1>

            {profile.user.unitRelation && (
              <p className="text-sm text-indigo-200 mt-0.5">{profile.user.unitRelation.name}</p>
            )}

            {profile.primaryField && (
              <p className="text-xs text-indigo-300 mt-1">
                {PRIMARY_FIELD_LABELS[profile.primaryField] ?? profile.primaryField}
                {profile.specialization && ` · ${profile.specialization}`}
              </p>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div className="relative mt-5 grid grid-cols-4 gap-1">
          {[
            { value: profile.hIndex,            label: 'H-Index',     highlight: true },
            { value: profile.totalCitations,    label: 'Trích dẫn',   highlight: false },
            { value: profile.totalPublications, label: 'Công bố',     highlight: false },
            { value: profile.projectLeadCount,  label: 'Đề tài CĐ',  highlight: false },
          ].map((m) => (
            <div key={m.label} className={`text-center p-2 rounded-xl ${m.highlight ? 'bg-white/20' : 'bg-white/10'}`}>
              <p className="text-xl font-bold text-white">{m.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-indigo-200">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="info">
        <TabsList className="w-full grid grid-cols-5 bg-gray-100 rounded-xl h-auto p-1">
          <TabsTrigger value="info" className="flex items-center gap-1.5 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tổng quan</span>
            <span className="sm:hidden">TQ</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-1.5 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Học vấn</span>
            <span className="sm:hidden">HV</span>
            {profile.education.length > 0 && (
              <span className="ml-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 rounded-full">
                {profile.education.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="career" className="flex items-center gap-1.5 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sự nghiệp</span>
            <span className="sm:hidden">SN</span>
            {profile.career.length > 0 && (
              <span className="ml-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 rounded-full">
                {profile.career.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-1.5 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">NCKH</span>
            <span className="sm:hidden">NC</span>
          </TabsTrigger>
          <TabsTrigger value="awards" className="flex items-center gap-1.5 py-2 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Award className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Giải thưởng</span>
            <span className="sm:hidden">GT</span>
            {profile.scientistAwards.length > 0 && (
              <span className="ml-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 rounded-full">
                {profile.scientistAwards.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <InfoTab profile={profile} />
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <EducationTab
            scientistId={scientistId}
            items={profile.education}
            onRefresh={fetchProfile}
          />
        </TabsContent>

        <TabsContent value="career" className="mt-4">
          <CareerTab
            scientistId={scientistId}
            items={profile.career}
            onRefresh={fetchProfile}
          />
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <ResearchTab profile={profile} />
        </TabsContent>

        <TabsContent value="awards" className="mt-4">
          <AwardTab
            scientistId={scientistId}
            items={profile.scientistAwards}
            onRefresh={fetchProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
