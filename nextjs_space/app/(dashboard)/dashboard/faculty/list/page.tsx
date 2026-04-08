'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Search, Users, BookOpen, Award, ExternalLink,
  Filter, X, Download, FileSpreadsheet, FileText, FileDown,
  Edit, UserPlus, Save, CheckCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/components/providers/language-provider';
import toast from 'react-hot-toast';

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
  user: {
    id: string;
    name: string;
    email: string;
    militaryId: string | null;
    rank: string | null;
    phone: string | null;
  } | null;
  unit: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  militaryId: string | null;
  rank: string | null;
  unit: { id: string; name: string } | null;
}

// ─── Edit Drawer ────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (faculty) setForm(faculty);
  }, [faculty]);

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!faculty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/faculty/${faculty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: (form as any).unit?.id || (form as any).unitId || faculty.unit?.id,
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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!faculty) return null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Chỉnh sửa thông tin giảng viên
          </SheetTitle>
          <SheetDescription>
            {faculty.user?.name} — {faculty.user?.militaryId || faculty.user?.email}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Khoa/Bộ môn */}
          <div className="space-y-1">
            <Label>Khoa / Bộ môn</Label>
            <Select
              value={(form as any).unitId || faculty.unit?.id || '__none__'}
              onValueChange={v => set('unitId', v === '__none__' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Chọn khoa/bộ môn" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Chưa phân công —</SelectItem>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Học hàm */}
          <div className="space-y-1">
            <Label>Học hàm</Label>
            <Select
              value={form.academicRank || '__none__'}
              onValueChange={v => set('academicRank', v === '__none__' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Chọn học hàm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Không có —</SelectItem>
                {academicRanks.map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name} ({r.shortName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Học vị */}
          <div className="space-y-1">
            <Label>Học vị</Label>
            <Select
              value={form.academicDegree || '__none__'}
              onValueChange={v => set('academicDegree', v === '__none__' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Chọn học vị" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Không có —</SelectItem>
                {educationLevels.map(d => (
                  <SelectItem key={d.id} value={d.name}>{d.name} ({d.shortName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chuyên môn */}
          <div className="space-y-1">
            <Label>Chuyên môn</Label>
            <Input
              value={form.specialization || ''}
              onChange={e => set('specialization', e.target.value)}
              placeholder="Ví dụ: Kỹ thuật quân sự, CNTT..."
            />
          </div>

          {/* Kinh nghiệm */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kinh nghiệm giảng dạy (năm)</Label>
              <Input
                type="number"
                min={0}
                value={form.teachingExperience ?? 0}
                onChange={e => set('teachingExperience', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label>Kinh nghiệm thực tế (năm)</Label>
              <Input
                type="number"
                min={0}
                value={form.industryExperience ?? 0}
                onChange={e => set('industryExperience', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Tiểu sử */}
          <div className="space-y-1">
            <Label>Tiểu sử</Label>
            <Textarea
              rows={3}
              value={form.biography || ''}
              onChange={e => set('biography', e.target.value)}
              placeholder="Quá trình công tác, đào tạo..."
            />
          </div>

          {/* Links */}
          <div className="space-y-2 border-t pt-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Liên kết học thuật</Label>
            <Input
              value={form.googleScholarUrl || ''}
              onChange={e => set('googleScholarUrl', e.target.value)}
              placeholder="Google Scholar URL"
            />
            <Input
              value={form.researchGateUrl || ''}
              onChange={e => set('researchGateUrl', e.target.value)}
              placeholder="ResearchGate URL"
            />
            <Input
              value={form.linkedinUrl || ''}
              onChange={e => set('linkedinUrl', e.target.value)}
              placeholder="LinkedIn URL"
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-3 border-t pt-3">
            <Label>Trạng thái</Label>
            <Select
              value={form.isActive ? 'active' : 'inactive'}
              onValueChange={v => set('isActive', v === 'active')}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Staff Picker Dialog ─────────────────────────────────────────────────────

interface StaffPickerProps {
  units: Unit[];
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

function StaffPickerDialog({ units, open, onClose, onAssigned }: StaffPickerProps) {
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [unitId, setUnitId] = useState('');
  const [academicRank, setAcademicRank] = useState('');
  const [academicDegree, setAcademicDegree] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30', ...(search && { search }) });
      const res = await fetch(`/api/faculty/assign?${params}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(fetchStaff, 300);
      return () => clearTimeout(timer);
    }
  }, [open, search, fetchStaff]);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/faculty/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.id,
          unitId: unitId || undefined,
          academicRank: academicRank || undefined,
          academicDegree: academicDegree || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm giảng viên');
      toast.success(`Đã thêm ${selected.name} vào danh sách giảng viên`);
      onAssigned();
      handleClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSearch('');
    setSelected(null);
    setUnitId('');
    setAcademicRank('');
    setAcademicDegree('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Thêm giảng viên từ danh sách cán bộ
          </DialogTitle>
          <DialogDescription>
            Tìm cán bộ chưa có hồ sơ giảng viên và chỉ định vào bộ môn
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên, số quân, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="border rounded-md max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : staff.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {search ? 'Không tìm thấy cán bộ phù hợp' : 'Tất cả cán bộ đã có hồ sơ giảng viên'}
                </div>
              ) : (
                staff.map(s => (
                  <button
                    key={s.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted flex items-center gap-3 border-b last:border-b-0"
                    onClick={() => setSelected(s)}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.militaryId && <span className="mr-2">#{s.militaryId}</span>}
                        {s.rank && <span className="mr-2">{s.rank}</span>}
                        {s.unit?.name}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected staff summary */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selected.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{selected.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selected.militaryId && <span className="mr-2">#{selected.militaryId}</span>}
                  {selected.rank}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" /> Đổi
              </Button>
            </div>

            {/* Assignment details */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label>Khoa / Bộ môn phụ trách</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger><SelectValue placeholder="Chọn khoa/bộ môn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Chưa phân công —</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Học hàm (tùy chọn)</Label>
                  <Input
                    value={academicRank}
                    onChange={e => setAcademicRank(e.target.value)}
                    placeholder="GS, PGS..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Học vị (tùy chọn)</Label>
                  <Input
                    value={academicDegree}
                    onChange={e => setAcademicDegree(e.target.value)}
                    placeholder="TS, ThS, KS..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Hủy</Button>
          {selected && (
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang thêm...</>
                : <><CheckCircle className="h-4 w-4 mr-2" />Xác nhận thêm giảng viên</>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Faculty Card ─────────────────────────────────────────────────────────────

function FacultyCard({
  faculty,
  onEdit,
}: {
  faculty: FacultyProfile;
  onEdit: (f: FacultyProfile) => void;
}) {
  const router = useRouter();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getRankBadgeColor = (rank: string | null) => {
    if (!rank) return 'secondary';
    if (rank.includes('Giáo sư') && !rank.includes('Phó')) return 'default';
    if (rank.includes('Phó')) return 'secondary';
    return 'outline';
  };

  const userName = faculty.user?.name || 'N/A';
  const userEmail = faculty.user?.email || '';
  const militaryId = faculty.user?.militaryId;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${!faculty.isActive ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar
            className="h-14 w-14 cursor-pointer flex-shrink-0"
            onClick={() => router.push(`/dashboard/faculty/profile?userId=${faculty.userId}`)}
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-base truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push(`/dashboard/faculty/profile?userId=${faculty.userId}`)}
            >
              {userName}
            </CardTitle>
            <CardDescription className="truncate text-xs">{userEmail}</CardDescription>
            {militaryId && <p className="text-xs text-muted-foreground mt-0.5">#{militaryId}</p>}
          </div>
          {/* Edit button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            title="Chỉnh sửa thông tin"
            onClick={e => { e.stopPropagation(); onEdit(faculty); }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Academic badges */}
        <div className="flex flex-wrap gap-1.5">
          {faculty.academicRank && (
            <Badge variant={getRankBadgeColor(faculty.academicRank) as any} className="text-xs">
              {faculty.academicRank}
            </Badge>
          )}
          {faculty.academicDegree && (
            <Badge variant="outline" className="text-xs">{faculty.academicDegree}</Badge>
          )}
          {!faculty.isActive && (
            <Badge variant="destructive" className="text-xs">Vô hiệu</Badge>
          )}
        </div>

        {/* Unit */}
        {faculty.unit && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{faculty.unit.name}</span>
          </div>
        )}

        {/* Specialization */}
        {faculty.specialization && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Award className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{faculty.specialization}</span>
          </div>
        )}

        {/* Research metrics */}
        {(faculty.publications > 0 || faculty.researchProjects > 0) && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-base font-bold text-primary">{faculty.researchProjects}</div>
              <div className="text-xs text-muted-foreground">Dự án</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-primary">{faculty.publications}</div>
              <div className="text-xs text-muted-foreground">Công bố</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-primary">{faculty.citations}</div>
              <div className="text-xs text-muted-foreground">Trích dẫn</div>
            </div>
          </div>
        )}

        {/* External links */}
        {(faculty.googleScholarUrl || faculty.researchGateUrl || faculty.linkedinUrl) && (
          <div className="flex gap-3 pt-2 border-t">
            {faculty.googleScholarUrl && (
              <a href={faculty.googleScholarUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                GS <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {faculty.researchGateUrl && (
              <a href={faculty.researchGateUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                RG <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {faculty.linkedinUrl && (
              <a href={faculty.linkedinUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                IN <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FacultyListPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();

  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  // Master data
  const [academicRanks, setAcademicRanks] = useState<{ id: string; name: string; shortName: string }[]>([]);
  const [educationLevels, setEducationLevels] = useState<{ id: string; name: string; shortName: string }[]>([]);

  // Edit drawer
  const [editTarget, setEditTarget] = useState<FacultyProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Staff picker
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  // Fetch units + master data
  useEffect(() => {
    fetch('/api/units?type=FACULTY,DEPARTMENT')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(data => setUnits(data.units || data.data || []))
      .catch(() => {});

    Promise.all([
      fetch('/api/master-data/academic-titles').then(r => r.json()),
      fetch('/api/master-data/education-levels').then(r => r.json()),
    ]).then(([rankData, eduData]) => {
      if (rankData.data) setAcademicRanks(rankData.data);
      if (eduData.data) setEducationLevels(eduData.data);
    }).catch(() => {});
  }, []);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedUnit !== 'all' && { unitId: selectedUnit }),
        ...(selectedRank !== 'all' && { academicRank: selectedRank }),
        ...(selectedDegree !== 'all' && { academicDegree: selectedDegree }),
      });

      const res = await fetch(`/api/faculty/list?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải danh sách giảng viên');

      setFaculty(data.faculty || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedUnit, selectedRank, selectedDegree]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUnit('all');
    setSelectedRank('all');
    setSelectedDegree('all');
    setPage(1);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Lỗi khi xuất file');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('DANH SACH GIANG VIEN', 105, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`Tong so: ${faculty.length} giang vien`, 105, 28, { align: 'center' });

      const tableData = faculty.map((f, i) => [
        i + 1,
        f.user?.name || 'N/A',
        f.user?.email || 'N/A',
        f.unit?.name || 'N/A',
        f.academicRank || 'N/A',
        f.academicDegree || 'N/A',
        f.researchProjects || 0,
        f.publications || 0,
      ]);

      autoTable(doc, {
        head: [['STT', 'Ho ten', 'Email', 'Khoa/Phong', 'Hoc ham', 'Hoc vi', 'De tai NC', 'Cong bo']],
        body: tableData,
        startY: 35,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 35, left: 10, right: 10 },
      });

      doc.save(`danh-sach-giang-vien-${Date.now()}.pdf`);
    } catch {
      toast.error('Lỗi khi xuất file PDF');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Danh sách Giảng viên
          </h1>
          <p className="text-muted-foreground mt-1">Tổng số: {total} giảng viên</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Add instructor button — visible to admins/departments (backend enforces permission) */}
          <Button onClick={() => setStaffPickerOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Thêm giảng viên
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Lọc
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-1">
                {[searchTerm && 1, selectedUnit !== 'all' && 1, selectedRank !== 'all' && 1, selectedDegree !== 'all' && 1].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Khoa/Bộ môn</label>
                <Select value={selectedUnit} onValueChange={val => { setSelectedUnit(val); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Học hàm</label>
                <Select value={selectedRank} onValueChange={val => { setSelectedRank(val); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {academicRanks.map(r => <SelectItem key={r.id} value={r.name}>{r.name} ({r.shortName})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Học vị</label>
                <Select value={selectedDegree} onValueChange={val => { setSelectedDegree(val); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {educationLevels.map(d => <SelectItem key={d.id} value={d.name}>{d.name} ({d.shortName})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-3">
                  <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" /> Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6"><p className="text-destructive">{error}</p></CardContent>
        </Card>
      )}

      {/* Grid */}
      {!error && (
        <>
          {faculty.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không tìm thấy giảng viên</p>
                <Button className="mt-4" onClick={() => setStaffPickerOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Thêm giảng viên đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faculty.map(f => (
                <FacultyCard
                  key={f.id}
                  faculty={f}
                  onEdit={target => { setEditTarget(target); setEditOpen(true); }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Trang {page} / {totalPages} ({total} kết quả)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Trước</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Sau</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Drawer */}
      <EditDrawer
        faculty={editTarget}
        units={units}
        academicRanks={academicRanks}
        educationLevels={educationLevels}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSaved={fetchFaculty}
      />

      {/* Staff Picker Dialog */}
      <StaffPickerDialog
        units={units}
        open={staffPickerOpen}
        onClose={() => setStaffPickerOpen(false)}
        onAssigned={() => { setStaffPickerOpen(false); fetchFaculty(); }}
      />
    </div>
  );
}
