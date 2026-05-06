/**
 * Hồ sơ cá nhân – Modern UI v3
 * Fixes: BloodType enum mapping, master data for ethnicity/religion, hero redesign
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMasterData } from '@/hooks/use-master-data';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  User, Shield, Briefcase, GraduationCap, Award, Star,
  Mail, Phone, Building2, Calendar, Edit2, Save, Plus, Trash2,
  Loader2, Clock, Globe, FileCheck, X, MapPin, Droplets,
  Hash, Fingerprint, BookOpen, ChevronRight, CheckCircle2,
  Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';


// ─── Position suggestions for datalist (free-text field) ─────────────────────
const POSITION_OPTIONS = [
  'Giám đốc','Phó Giám đốc','Chính ủy','Phó Chính ủy',
  'Trưởng khoa','Phó Trưởng khoa','Chủ nhiệm bộ môn',
  'Giảng viên cao cấp','Giảng viên chính','Giảng viên',
  'Trưởng phòng','Phó Trưởng phòng','Cán bộ phòng',
  'Trợ lý','Thư ký','Nghiên cứu viên','Kỹ sư',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkExp {
  id?: string; organization: string; position: string;
  startDate: string; endDate: string; description: string;
}
interface EduRecord {
  id?: string; level: string; institution: string; major: string;
  startDate: string; endDate: string; thesisTitle?: string;
  trainingSystem?: string; classification?: string; certificateCode?: string;
}
interface LangCert {
  id?: string; language: string; certType: string; certLevel?: string;
  framework?: string; certNumber?: string; issueDate?: string; issuer?: string; notes?: string;
}
interface TechCert {
  id?: string; certType: string; certName: string; certNumber?: string;
  classification?: string; issueDate?: string; issuer?: string;
  decisionNumber?: string; notes?: string;
}
interface ProfileData {
  id: string; name: string; email: string; phone: string | null;
  avatar: string | null;
  dateOfBirth: string | null; gender: string | null; citizenId: string | null;
  militaryId: string | null; rank: string | null; position: string | null;
  unitName: string | null; birthPlace: string | null; placeOfOrigin: string | null;
  permanentAddress: string | null; temporaryAddress: string | null;
  ethnicity: string | null; religion: string | null; bloodType: string | null;
  educationLevel: string | null; specialization: string | null;
  enlistmentDate: string | null; managementCategory: string | null;
  partyJoinDate: string | null; partyPosition: string | null;
  workExperience: WorkExp[]; educationHistory: EduRecord[];
  foreignLanguageCerts: LangCert[]; technicalCertificates: TechCert[];
  awards: any[];
}
interface MasterItem { id: string; code: string; name: string; }
interface RankItem { id: string; name: string; shortCode: string; category: string; }
interface EduLevelItem { id: string; name: string; shortName: string | null; }
interface SimpleItem { id: string; name: string; }

interface RankDeclaration {
  id: string;
  rankType: string;
  promotionType: string;
  previousRank: string | null;
  newRank: string | null;
  effectiveDate: string;
  decisionNumber: string | null;
  decisionDate: string | null;
  previousPosition: string | null;
  newPosition: string | null;
  reason: string | null;
  notes: string | null;
  declarationStatus: string;
  lockedAt: string | null;
  declaredOnBehalfOf: boolean;
  createdAt: string;
}

interface OfficerPromotionRecord {
  id: string;
  promotionType: string;
  effectiveDate: string;
  decisionNumber: string | null;
  decisionDate: string | null;
  previousRank: string | null;
  newRank: string | null;
  previousPosition: string | null;
  newPosition: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  THANG_CAP:   'Thăng cấp',
  BO_NHIEM:    'Bổ nhiệm',
  DIEU_DONG:   'Điều động',
  LUAN_CHUYEN: 'Luân chuyển',
  GIANG_CHUC:  'Giáng chức',
  CACH_CHUC:   'Cách chức',
  NGHI_HUU:    'Nghỉ hưu',
  XUAT_NGU:    'Xuất ngũ',
};

const DECL_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT:          { label: 'Nháp',           variant: 'secondary' },
  PENDING_REVIEW: { label: 'Chờ duyệt',      variant: 'outline' },
  UNDER_REVIEW:   { label: 'Đang xét duyệt', variant: 'outline' },
  APPROVED:       { label: 'Đã duyệt',       variant: 'default' },
  REJECTED:       { label: 'Từ chối',        variant: 'destructive' },
  RETURNED:       { label: 'Trả lại',        variant: 'destructive' },
  CANCELLED:      { label: 'Đã hủy',         variant: 'secondary' },
};

const RANK_DECL_EMPTY = {
  rankType:         'OFFICER',
  promotionType:    '',
  previousRank:     '',
  newRank:          '',
  effectiveDate:    '',
  decisionNumber:   '',
  decisionDate:     '',
  previousPosition: '',
  newPosition:      '',
  reason:           '',
  notes:            '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: vi }); }
  catch { return '—'; }
}
function toDateInput(d: string | null | undefined) {
  if (!d) return '';
  return d.includes('T') ? d.split('T')[0] : d;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldGroup({ label, icon: Icon, children }: {
  label: string; icon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </Label>
      {children}
    </div>
  );
}

function ReadValue({ value }: { value?: string | null }) {
  return (
    <p className="text-sm font-medium min-h-[2.25rem] flex items-center border border-transparent px-0">
      {value || <span className="text-muted-foreground/50 italic font-normal text-xs">Chưa cập nhật</span>}
    </p>
  );
}

function SectionTitle({ icon: Icon, title, color = 'default' }: {
  icon: React.ElementType; title: string; color?: string;
}) {
  const cls: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    default: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
  };
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cls[color]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );
}

function CrudDialog({ open, onOpenChange, title, saving, onSave, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string;
  saving: boolean; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3.5 py-1">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1.5" />Hủy</Button>
          <Button onClick={onSave} disabled={saving} className="min-w-[90px]">
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>Thao tác này không thể hoàn tác.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState({ icon: Icon, title, sub }: {
  icon: React.ElementType; title: string; sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [profile, setProfile]         = useState<ProfileData | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoHover, setPhotoHover]   = useState(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});

  // MDM hooks
  const { items: bloodTypeItems } = useMasterData('MD_BLOOD_TYPE');
  const { items: languageItems }  = useMasterData('MD_LANGUAGE');
  const bloodTypeLabel = useMemo(
    () => Object.fromEntries(bloodTypeItems.map(i => [i.code, i.nameVi])),
    [bloodTypeItems]
  );

  // Master data
  const [ethnicities, setEthnicities]               = useState<MasterItem[]>([]);
  const [religions, setReligions]                   = useState<MasterItem[]>([]);
  const [ranks, setRanks]                           = useState<RankItem[]>([]);
  const [educationLevels, setEducationLevels]       = useState<EduLevelItem[]>([]);
  const [trainingInstitutions, setTrainingInstitutions] = useState<SimpleItem[]>([]);
  const [degreeTypes, setDegreeTypes]               = useState<SimpleItem[]>([]);

  // Work experience
  const WRK_EMPTY: WorkExp = { organization: '', position: '', startDate: '', endDate: '', description: '' };
  const [wrkOpen, setWrkOpen]         = useState(false);
  const [wrkSaving, setWrkSaving]     = useState(false);
  const [wrkEditing, setWrkEditing]   = useState<WorkExp | null>(null);
  const [wrkForm, setWrkForm]         = useState<WorkExp>(WRK_EMPTY);
  const [wrkDeleteId, setWrkDeleteId] = useState<string | null>(null);

  // Education
  const EDU_EMPTY: EduRecord = { level: '', institution: '', major: '', startDate: '', endDate: '' };
  const [eduOpen, setEduOpen]         = useState(false);
  const [eduSaving, setEduSaving]     = useState(false);
  const [eduEditing, setEduEditing]   = useState<EduRecord | null>(null);
  const [eduForm, setEduForm]         = useState<EduRecord>(EDU_EMPTY);
  const [eduDeleteId, setEduDeleteId] = useState<string | null>(null);

  // Foreign language
  const LANG_EMPTY: LangCert = { language: '', certType: '' };
  const [langOpen, setLangOpen]         = useState(false);
  const [langSaving, setLangSaving]     = useState(false);
  const [langEditing, setLangEditing]   = useState<LangCert | null>(null);
  const [langForm, setLangForm]         = useState<LangCert>(LANG_EMPTY);
  const [langDeleteId, setLangDeleteId] = useState<string | null>(null);

  // Technical cert
  const TECH_EMPTY: TechCert = { certType: '', certName: '' };
  const [techOpen, setTechOpen]         = useState(false);
  const [techSaving, setTechSaving]     = useState(false);
  const [techEditing, setTechEditing]   = useState<TechCert | null>(null);
  const [techForm, setTechForm]         = useState<TechCert>(TECH_EMPTY);
  const [techDeleteId, setTechDeleteId] = useState<string | null>(null);

  // Rank declarations + official promotion history
  const [officerHistory, setOfficerHistory]     = useState<OfficerPromotionRecord[]>([]);
  const [rankDecls, setRankDecls]               = useState<RankDeclaration[]>([]);
  const [rankDeclsLoading, setRankDeclsLoading] = useState(false);
  const [rankDeclOpen, setRankDeclOpen]         = useState(false);
  const [rankDeclSaving, setRankDeclSaving]     = useState(false);
  const [rankDeclForm, setRankDeclForm]         = useState({ ...RANK_DECL_EMPTY });
  const [rankSubmittingId, setRankSubmittingId] = useState<string | null>(null);

  const fetchRankDeclarations = useCallback(async () => {
    if (!profile) return;
    setRankDeclsLoading(true);
    try {
      const [histRes, declRes] = await Promise.all([
        fetch(`/api/officer-career/promotions?personnelId=${profile.id}&limit=50`),
        fetch(`/api/officer-career/rank-declarations?personnelId=${profile.id}&limit=50`),
      ]);
      const [histData, declData] = await Promise.all([histRes.json(), declRes.json()]);
      if (histData.success) {
        // Sort ASC so timeline reads from enlistment → present
        const sorted = (histData.data || []).slice().sort(
          (a: OfficerPromotionRecord, b: OfficerPromotionRecord) =>
            new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
        );
        setOfficerHistory(sorted);
      }
      if (declData.success) {
        // Only show non-approved declarations in the pending section
        const pending = (declData.items || declData.data || []).filter(
          (d: RankDeclaration) => d.declarationStatus !== 'APPROVED' && d.declarationStatus !== 'CANCELLED',
        );
        setRankDecls(pending);
      }
    } catch { /* silent */ }
    finally { setRankDeclsLoading(false); }
  }, [profile]);

  // ── Load profile + master data ─────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/profile/me');
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditData(data.data);
      } else {
        toast.error(data.error || 'Lỗi tải hồ sơ');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      // Fetch master data in parallel
      fetch('/api/master-data/ethnicities')
        .then(r => r.json()).then(d => { if (d.success) setEthnicities(d.data); })
        .catch(() => {});
      fetch('/api/master-data/religions')
        .then(r => r.json()).then(d => { if (d.success) setReligions(d.data); })
        .catch(() => {});
      fetch('/api/master-data/ranks')
        .then(r => r.json()).then(d => { if (d.success) setRanks(d.data); })
        .catch(() => {});
      fetch('/api/master-data/education-levels')
        .then(r => r.json()).then(d => { if (d.success) setEducationLevels(d.data); })
        .catch(() => {});
      fetch('/api/master-data/training-institutions')
        .then(r => r.json()).then(d => { if (d.success) setTrainingInstitutions(d.data); })
        .catch(() => {});
      fetch('/api/master-data/degree-types')
        .then(r => r.json()).then(d => { if (d.success) setDegreeTypes(d.data); })
        .catch(() => {});
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchProfile]);

  // ── Save basic profile ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        name:             editData.name,
        phone:            editData.phone,
        dateOfBirth:      editData.dateOfBirth,
        gender:           editData.gender,
        citizenId:        editData.citizenId,
        birthPlace:       editData.birthPlace,
        placeOfOrigin:    editData.placeOfOrigin,
        permanentAddress: editData.permanentAddress,
        temporaryAddress: editData.temporaryAddress,
        ethnicity:        editData.ethnicity,
        religion:         editData.religion,
        bloodType:        editData.bloodType,   // Prisma enum value e.g. "A_POSITIVE"
        educationLevel:   editData.educationLevel,
        specialization:   editData.specialization,
        rank:             editData.rank,
        position:         editData.position,
      };
      const res  = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cập nhật hồ sơ thành công');
        setProfile(prev => ({ ...prev!, ...data.data }));
        setEditData(prev => ({ ...prev, ...data.data }));
        setEditMode(false);
      } else {
        toast.error(data.error || 'Lỗi cập nhật');
      }
    } catch (err) {
      console.error('[Profile save]', err);
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : prev);
        toast.success('Cập nhật ảnh thành công');
      } else {
        toast.error(data.error || 'Lỗi upload ảnh');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally   { setPhotoUploading(false); e.target.value = ''; }
  };

  // ── Work experience CRUD ───────────────────────────────────────────────────
  const openEditWork = (w: WorkExp) => {
    setWrkEditing(w);
    setWrkForm({ ...w, startDate: toDateInput(w.startDate), endDate: toDateInput(w.endDate) });
    setWrkOpen(true);
  };
  const handleSaveWork = async () => {
    if (!wrkForm.organization || !wrkForm.position) { toast.error('Vui lòng nhập đơn vị và chức vụ'); return; }
    setWrkSaving(true);
    try {
      const isEdit = !!wrkEditing?.id;
      const res = await fetch('/api/profile/work-experience', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...wrkForm, id: wrkEditing!.id } : wrkForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
        fetchProfile(); setWrkOpen(false); setWrkForm(WRK_EMPTY); setWrkEditing(null);
      } else { toast.error(data.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setWrkSaving(false); }
  };
  const handleDeleteWork = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/work-experience?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Đã xóa'); fetchProfile(); }
      else { toast.error(data.error || 'Lỗi xóa'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setWrkDeleteId(null); }
  };

  // ── Education CRUD ─────────────────────────────────────────────────────────
  const openEditEdu = (e: EduRecord) => {
    setEduEditing(e);
    setEduForm({ ...e, startDate: toDateInput(e.startDate), endDate: toDateInput(e.endDate) });
    setEduOpen(true);
  };
  const handleSaveEdu = async () => {
    if (!eduForm.level || !eduForm.institution) { toast.error('Vui lòng chọn trình độ và nhập cơ sở đào tạo'); return; }
    setEduSaving(true);
    try {
      const isEdit = !!eduEditing?.id;
      const url = isEdit ? `/api/profile/education/${eduEditing!.id}` : '/api/profile/education';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eduForm),
      });
      const data = await res.json();
      const ok = data.success !== undefined ? data.success : !!data.id;
      if (ok) {
        toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
        fetchProfile(); setEduOpen(false); setEduForm(EDU_EMPTY); setEduEditing(null);
      } else { toast.error(data.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setEduSaving(false); }
  };
  const handleDeleteEdu = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/education/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Đã xóa'); fetchProfile(); }
      else { toast.error(data.error || 'Lỗi xóa'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setEduDeleteId(null); }
  };

  // ── Foreign language CRUD ──────────────────────────────────────────────────
  const openEditLang = (lc: LangCert) => {
    setLangEditing(lc);
    setLangForm({ ...lc, issueDate: toDateInput(lc.issueDate) });
    setLangOpen(true);
  };
  const handleSaveLang = async () => {
    if (!langForm.language || !langForm.certType) { toast.error('Vui lòng nhập ngôn ngữ và loại chứng chỉ'); return; }
    setLangSaving(true);
    try {
      const isEdit = !!langEditing?.id;
      const url = isEdit ? `/api/profile/foreign-language/${langEditing!.id}` : '/api/profile/foreign-language';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(langForm),
      });
      const data = await res.json();
      const ok = data.success !== undefined ? data.success : !!data.id;
      if (ok) {
        toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
        fetchProfile(); setLangOpen(false); setLangForm(LANG_EMPTY); setLangEditing(null);
      } else { toast.error(data.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLangSaving(false); }
  };
  const handleDeleteLang = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/foreign-language/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Đã xóa'); fetchProfile(); }
      else { toast.error(data.error || 'Lỗi xóa'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLangDeleteId(null); }
  };

  // ── Technical cert CRUD ────────────────────────────────────────────────────
  const openEditTech = (tc: TechCert) => {
    setTechEditing(tc);
    setTechForm({ ...tc, issueDate: toDateInput(tc.issueDate) });
    setTechOpen(true);
  };
  const handleSaveTech = async () => {
    if (!techForm.certType || !techForm.certName) { toast.error('Vui lòng nhập loại và tên chứng chỉ'); return; }
    setTechSaving(true);
    try {
      const isEdit = !!techEditing?.id;
      const url = isEdit ? `/api/profile/technical-cert/${techEditing!.id}` : '/api/profile/technical-cert';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techForm),
      });
      const data = await res.json();
      const ok = data.success !== undefined ? data.success : !!data.id;
      if (ok) {
        toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
        fetchProfile(); setTechOpen(false); setTechForm(TECH_EMPTY); setTechEditing(null);
      } else { toast.error(data.error || 'Lỗi'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setTechSaving(false); }
  };
  const handleDeleteTech = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/technical-cert/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Đã xóa'); fetchProfile(); }
      else { toast.error(data.error || 'Lỗi xóa'); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setTechDeleteId(null); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (!profile) return null;

  // Completion
  const COMPLETION_FIELDS = [
    profile.name, profile.email, profile.phone, profile.rank, profile.position,
    profile.dateOfBirth, profile.militaryId, profile.unitName, profile.birthPlace,
    profile.citizenId, profile.bloodType, profile.educationLevel,
  ];
  const completionPct = Math.round((COMPLETION_FIELDS.filter(Boolean).length / COMPLETION_FIELDS.length) * 100);
  const completionColor = completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-yellow-500' : 'bg-red-400';

  const set = (k: keyof ProfileData, v: string) => setEditData(prev => ({ ...prev, [k]: v || null }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
        {/* Top gradient banner */}
        <div className="h-24 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '8px 8px' }} />
          {/* Military badge watermark */}
          <div className="absolute right-5 top-2 opacity-10 select-none">
            <Shield className="h-20 w-20 text-white" />
          </div>
        </div>

        {/* Content below banner */}
        <div className="bg-white dark:bg-slate-900 px-5 md:px-6 pb-5">
          <div className="flex flex-col md:flex-row gap-5 -mt-12">

            {/* ── 3×4 Photo frame ─── */}
            <div className="shrink-0 relative z-10">
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer block"
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
              >
                {/* 3:4 ratio = 90×120px */}
                <div className="relative w-[90px] h-[120px] rounded-lg overflow-hidden shadow-lg border-2 border-white dark:border-slate-700 bg-slate-700">
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar}
                      alt={profile.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-600 to-slate-800">
                      <span className="text-white text-3xl font-bold select-none">
                        {profile.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                      <span className="text-slate-400 text-[10px]">3×4</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  {(photoHover || photoUploading) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                      {photoUploading
                        ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                        : <>
                            <Camera className="h-6 w-6 text-white" />
                            <span className="text-white text-[10px] text-center leading-tight px-1">Đổi ảnh</span>
                          </>
                      }
                    </div>
                  )}
                </div>
                {/* Upload hint */}
                <p className="text-[10px] text-center text-muted-foreground mt-1 leading-tight">
                  Ảnh 3×4<br/>JPG / PNG
                </p>
              </label>
              {profile.partyJoinDate && (
                <div title="Đảng viên ĐCSVN" className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow">
                  <Star className="h-2.5 w-2.5 text-white fill-white" />
                </div>
              )}
            </div>

            {/* ── Name + info ── */}
            <div className="flex-1 min-w-0 pt-2 md:pt-14">
              <div className="flex flex-wrap items-start gap-2">
                <h1 className="text-xl font-bold leading-tight">{profile.name}</h1>
                {completionPct >= 80 && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.rank && (
                  <Badge className="text-xs bg-blue-700 text-white border-0">{profile.rank}</Badge>
                )}
                {profile.position && (
                  <Badge variant="outline" className="text-xs">{profile.position}</Badge>
                )}
                {profile.managementCategory && (
                  <Badge className="text-xs bg-amber-100 text-amber-800 border-0 dark:bg-amber-950/50 dark:text-amber-300">
                    {profile.managementCategory === 'CAN_BO' ? 'Diện CB QL' : 'Diện Quân lực'}
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-y-1.5 gap-x-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="truncate">{profile.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  {profile.phone || '—'}
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                  <span className="truncate">{profile.unitName || '—'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  {profile.militaryId || '—'}
                </span>
              </div>
            </div>

            {/* ── Right: completion + stats ── */}
            <div className="shrink-0 flex flex-col gap-3 min-w-[148px] pt-2 md:pt-14">
              {/* Completion ring */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium">Hoàn thiện hồ sơ</span>
                  <span className={`font-bold ${completionPct >= 80 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${completionColor}`} style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { n: profile.workExperience?.length || 0,       label: 'Công tác',  color: 'text-blue-600' },
                  { n: profile.educationHistory?.length || 0,      label: 'Học vấn',  color: 'text-purple-600' },
                  { n: (profile.foreignLanguageCerts?.length || 0) + (profile.technicalCertificates?.length || 0), label: 'Chứng chỉ', color: 'text-emerald-600' },
                ].map(({ n, label, color }) => (
                  <div key={label} className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className={`text-base font-bold ${color}`}>{n}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="basic" onValueChange={v => { if (v === 'rank') fetchRankDeclarations(); }}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          {([
            { value: 'basic',     label: 'Cơ bản',      Icon: User },
            { value: 'work',      label: 'Công tác',    Icon: Briefcase },
            { value: 'education', label: 'Học vấn',     Icon: GraduationCap },
            { value: 'language',  label: 'Ngoại ngữ',   Icon: Globe },
            { value: 'techcert',  label: 'Chứng chỉ',   Icon: FileCheck },
            { value: 'awards',    label: 'Khen thưởng', Icon: Award },
            { value: 'party',     label: 'Đảng viên',   Icon: Star },
            { value: 'rank',      label: 'Quân hàm',    Icon: Shield },
          ] as const).map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value}
              className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Icon className="h-3.5 w-3.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Cơ bản */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="basic" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {editMode
                ? <span className="text-orange-600 font-medium">Đang chỉnh sửa — Nhấn Lưu để áp dụng thay đổi</span>
                : 'Thông tin cơ bản của hồ sơ cá nhân'}
            </p>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setEditData(profile); }}>
                    <X className="h-3.5 w-3.5 mr-1" />Hủy
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="min-w-[110px]">
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Lưu thay đổi
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditMode(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white">
                  <Edit2 className="h-3.5 w-3.5 mr-1" />Chỉnh sửa
                </Button>
              )}
            </div>
          </div>

          {/* SECTION 1 – Thông tin cá nhân */}
          <Card className={editMode ? 'ring-1 ring-blue-200 dark:ring-blue-800' : ''}>
            <CardContent className="p-5">
              <SectionTitle icon={User} title="Thông tin cá nhân" color="blue" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                <FieldGroup label="Họ và tên" icon={User}>
                  {editMode
                    ? <Input value={editData.name || ''} onChange={e => set('name', e.target.value)} placeholder="Nhập họ và tên đầy đủ" />
                    : <ReadValue value={profile.name} />}
                </FieldGroup>

                <FieldGroup label="Email">
                  <p className="text-sm text-muted-foreground min-h-[2.25rem] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />{profile.email}
                    <Badge variant="secondary" className="text-xs ml-1">Cố định</Badge>
                  </p>
                </FieldGroup>

                <FieldGroup label="Số điện thoại" icon={Phone}>
                  {editMode
                    ? <Input value={editData.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="0xxx xxx xxx" type="tel" />
                    : <ReadValue value={profile.phone} />}
                </FieldGroup>

                <FieldGroup label="Ngày sinh" icon={Calendar}>
                  {editMode
                    ? <Input type="date" value={toDateInput(editData.dateOfBirth)} onChange={e => set('dateOfBirth', e.target.value)} />
                    : <ReadValue value={fmtDate(profile.dateOfBirth)} />}
                </FieldGroup>

                <FieldGroup label="Giới tính">
                  {editMode
                    ? <Select value={editData.gender || ''} onValueChange={v => set('gender', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                    : <ReadValue value={profile.gender} />}
                </FieldGroup>

                {/* BloodType – uses Prisma enum values as option keys */}
                <FieldGroup label="Nhóm máu" icon={Droplets}>
                  {editMode
                    ? <Select value={editData.bloodType || ''} onValueChange={v => set('bloodType', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn nhóm máu" /></SelectTrigger>
                        <SelectContent>
                          {bloodTypeItems.map(o => (
                            <SelectItem key={o.code} value={o.code}>{o.nameVi}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    : <ReadValue value={profile.bloodType ? bloodTypeLabel[profile.bloodType] || profile.bloodType : null} />}
                </FieldGroup>

                <FieldGroup label="CMND / CCCD">
                  {editMode
                    ? <Input value={editData.citizenId || ''} onChange={e => set('citizenId', e.target.value)} placeholder="Số CMND hoặc CCCD" />
                    : <ReadValue value={profile.citizenId} />}
                </FieldGroup>

                <FieldGroup label="Mã quân nhân" icon={Hash}>
                  <p className="text-sm min-h-[2.25rem] flex items-center gap-1.5 text-muted-foreground">
                    {profile.militaryId || '—'}
                    <Badge variant="secondary" className="text-xs">Hệ thống</Badge>
                  </p>
                </FieldGroup>

                {/* Ethnicity from master data */}
                <FieldGroup label="Dân tộc" icon={Fingerprint}>
                  {editMode
                    ? ethnicities.length > 0
                      ? <Select value={editData.ethnicity || ''} onValueChange={v => set('ethnicity', v)}>
                          <SelectTrigger><SelectValue placeholder="Chọn dân tộc" /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {ethnicities.map(e => (
                              <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      : <Input value={editData.ethnicity || ''} onChange={e => set('ethnicity', e.target.value)} placeholder="Kinh, Tày, Mường..." />
                    : <ReadValue value={profile.ethnicity} />}
                </FieldGroup>

                {/* Religion from master data */}
                <FieldGroup label="Tôn giáo">
                  {editMode
                    ? religions.length > 0
                      ? <Select value={editData.religion || ''} onValueChange={v => set('religion', v)}>
                          <SelectTrigger><SelectValue placeholder="Chọn tôn giáo" /></SelectTrigger>
                          <SelectContent>
                            {religions.map(r => (
                              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      : <Input value={editData.religion || ''} onChange={e => set('religion', e.target.value)} placeholder="Không, Phật giáo, Công giáo..." />
                    : <ReadValue value={profile.religion} />}
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2 – Thông tin quân sự */}
          <Card className={editMode ? 'ring-1 ring-orange-200 dark:ring-orange-800' : ''}>
            <CardContent className="p-5">
              <SectionTitle icon={Shield} title="Thông tin quân sự & nghề nghiệp" color="orange" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                <FieldGroup label="Quân hàm" icon={Shield}>
                  {editMode
                    ? <Select value={editData.rank || ''} onValueChange={v => set('rank', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {ranks.map((r, idx) => {
                            const prev = ranks[idx - 1];
                            const showCat = !prev || prev.category !== r.category;
                            return (
                              <div key={r.id}>
                                {showCat && <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">{r.category}</div>}
                                <SelectItem value={r.name}>{r.name}</SelectItem>
                              </div>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    : <ReadValue value={profile.rank} />}
                </FieldGroup>

                {/* Position with predefined options */}
                <FieldGroup label="Chức vụ" icon={Briefcase}>
                  {editMode
                    ? <>
                        <Input
                          value={editData.position || ''}
                          onChange={e => set('position', e.target.value)}
                          placeholder="Nhập hoặc chọn chức vụ..."
                          list="position-options"
                        />
                        <datalist id="position-options">
                          {POSITION_OPTIONS.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </>
                    : <ReadValue value={profile.position} />}
                </FieldGroup>

                <FieldGroup label="Trình độ học vấn" icon={GraduationCap}>
                  {editMode
                    ? <Select value={editData.educationLevel || ''} onValueChange={v => set('educationLevel', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {educationLevels.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    : <ReadValue value={profile.educationLevel} />}
                </FieldGroup>

                <FieldGroup label="Chuyên ngành" icon={BookOpen}>
                  {editMode
                    ? <Input value={editData.specialization || ''} onChange={e => set('specialization', e.target.value)} placeholder="Ngành, chuyên ngành đào tạo" />
                    : <ReadValue value={profile.specialization} />}
                </FieldGroup>

                <FieldGroup label="Ngày nhập ngũ" icon={Calendar}>
                  <ReadValue value={fmtDate(profile.enlistmentDate)} />
                </FieldGroup>

                <FieldGroup label="Đơn vị công tác">
                  <p className="text-sm min-h-[2.25rem] flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />{profile.unitName || '—'}
                  </p>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3 – Địa chỉ */}
          <Card className={editMode ? 'ring-1 ring-emerald-200 dark:ring-emerald-800' : ''}>
            <CardContent className="p-5">
              <SectionTitle icon={MapPin} title="Địa chỉ & quê quán" color="green" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                <FieldGroup label="Nơi sinh" icon={MapPin}>
                  {editMode
                    ? <Input value={editData.birthPlace || ''} onChange={e => set('birthPlace', e.target.value)} placeholder="Tỉnh / TP nơi sinh" />
                    : <ReadValue value={profile.birthPlace} />}
                </FieldGroup>

                <FieldGroup label="Quê quán">
                  {editMode
                    ? <Input value={editData.placeOfOrigin || ''} onChange={e => set('placeOfOrigin', e.target.value)} placeholder="Quê quán gốc" />
                    : <ReadValue value={profile.placeOfOrigin} />}
                </FieldGroup>

                <FieldGroup label="Địa chỉ thường trú">
                  {editMode
                    ? <Input value={editData.permanentAddress || ''} onChange={e => set('permanentAddress', e.target.value)} placeholder="Số nhà, đường, phường/xã, tỉnh/TP" />
                    : <ReadValue value={profile.permanentAddress} />}
                </FieldGroup>

                <FieldGroup label="Địa chỉ tạm trú">
                  {editMode
                    ? <Input value={editData.temporaryAddress || ''} onChange={e => set('temporaryAddress', e.target.value)} placeholder="Nơi ở hiện tại (nếu khác thường trú)" />
                    : <ReadValue value={profile.temporaryAddress} />}
                </FieldGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Công tác */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="work" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Quá trình công tác</CardTitle>
                <CardDescription>{profile.workExperience?.length || 0} mốc công tác được ghi nhận</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setWrkEditing(null); setWrkForm(WRK_EMPTY); setWrkOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />Thêm mới
              </Button>
            </CardHeader>
            <CardContent>
              {(profile.workExperience?.length || 0) > 0 ? (
                <div className="relative pl-6">
                  <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
                  {profile.workExperience.map((w, i) => (
                    <div key={w.id || i} className="relative group mb-4 last:mb-0">
                      <div className="absolute -left-[14px] top-5 w-3 h-3 rounded-full bg-blue-500 border-2 border-background ring-2 ring-blue-100 dark:ring-blue-900/50" />
                      <div className="ml-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm">{w.position}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                              <span className="text-sm text-muted-foreground">{w.organization}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {fmtDate(w.startDate)} — {w.endDate ? fmtDate(w.endDate) : <span className="text-emerald-600 font-medium">Hiện tại</span>}
                            </p>
                            {w.description && <p className="text-xs mt-1.5 text-muted-foreground/80 line-clamp-2">{w.description}</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditWork(w)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setWrkDeleteId(w.id!)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Briefcase} title="Chưa có quá trình công tác" sub='Nhấn "Thêm mới" để ghi nhận' />
              )}
            </CardContent>
          </Card>

          <CrudDialog open={wrkOpen} onOpenChange={setWrkOpen}
            title={wrkEditing ? 'Chỉnh sửa quá trình công tác' : 'Thêm quá trình công tác'}
            saving={wrkSaving} onSave={handleSaveWork}>
            <FieldGroup label="Đơn vị / Tổ chức *">
              <Input value={wrkForm.organization} onChange={e => setWrkForm({ ...wrkForm, organization: e.target.value })} placeholder="Tên đơn vị, tổ chức" />
            </FieldGroup>
            <FieldGroup label="Chức vụ *">
              <Input value={wrkForm.position} onChange={e => setWrkForm({ ...wrkForm, position: e.target.value })} placeholder="Chức danh, chức vụ" list="wrk-position-list" />
              <datalist id="wrk-position-list">
                {POSITION_OPTIONS.map(p => <option key={p} value={p} />)}
              </datalist>
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Từ ngày">
                <Input type="date" value={wrkForm.startDate} onChange={e => setWrkForm({ ...wrkForm, startDate: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Đến ngày">
                <Input type="date" value={wrkForm.endDate} onChange={e => setWrkForm({ ...wrkForm, endDate: e.target.value })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Ghi chú">
              <Textarea rows={3} value={wrkForm.description} onChange={e => setWrkForm({ ...wrkForm, description: e.target.value })} placeholder="Nhiệm vụ, thành tích..." />
            </FieldGroup>
          </CrudDialog>
          <DeleteConfirm open={!!wrkDeleteId} onOpenChange={v => !v && setWrkDeleteId(null)} onConfirm={() => wrkDeleteId && handleDeleteWork(wrkDeleteId)} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Học vấn */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="education" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Quá trình học tập</CardTitle>
                <CardDescription>Bằng cấp, học hàm, học vị — {profile.educationHistory?.length || 0} mục</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEduEditing(null); setEduForm(EDU_EMPTY); setEduOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />Thêm mới
              </Button>
            </CardHeader>
            <CardContent>
              {(profile.educationHistory?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {profile.educationHistory.map((e, i) => (
                    <div key={e.id || i} className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">
                              {e.level}
                              {e.major && <span className="font-normal text-muted-foreground"> — {e.major}</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{e.institution}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{fmtDate(e.startDate)} — {fmtDate(e.endDate)}
                              </span>
                              {e.trainingSystem && <Badge variant="outline" className="text-xs h-5">{e.trainingSystem}</Badge>}
                              {e.classification && <Badge variant="secondary" className="text-xs h-5">{e.classification}</Badge>}
                            </div>
                            {e.thesisTitle && <p className="text-xs mt-1.5 italic text-muted-foreground/80">"{e.thesisTitle}"</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEdu(e)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setEduDeleteId(e.id!)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} title="Chưa có thông tin học vấn" sub='Nhấn "Thêm mới" để bổ sung bằng cấp' />
              )}
            </CardContent>
          </Card>

          <CrudDialog open={eduOpen} onOpenChange={setEduOpen}
            title={eduEditing ? 'Chỉnh sửa học vấn' : 'Thêm thông tin học vấn'}
            saving={eduSaving} onSave={handleSaveEdu}>
            <FieldGroup label="Trình độ *">
              <Select value={eduForm.level} onValueChange={v => setEduForm({ ...eduForm, level: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {educationLevels.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Cơ sở đào tạo *">
              <Input value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} placeholder="Tên trường, học viện..." list="institution-list" />
              <datalist id="institution-list">
                {trainingInstitutions.map(inst => <option key={inst.id} value={inst.name} />)}
              </datalist>
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Chuyên ngành">
                <Input value={eduForm.major || ''} onChange={e => setEduForm({ ...eduForm, major: e.target.value })} placeholder="Ngành học" />
              </FieldGroup>
              <FieldGroup label="Hệ đào tạo">
                <Select value={eduForm.trainingSystem || ''} onValueChange={v => setEduForm({ ...eduForm, trainingSystem: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn hệ" /></SelectTrigger>
                  <SelectContent>
                    {degreeTypes.map(dt => <SelectItem key={dt.id} value={dt.name}>{dt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Từ năm">
                <Input type="date" value={eduForm.startDate || ''} onChange={e => setEduForm({ ...eduForm, startDate: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Đến năm">
                <Input type="date" value={eduForm.endDate || ''} onChange={e => setEduForm({ ...eduForm, endDate: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Xếp loại tốt nghiệp">
                <Select value={eduForm.classification || ''} onValueChange={v => setEduForm({ ...eduForm, classification: v })}>
                  <SelectTrigger><SelectValue placeholder="Xếp loại" /></SelectTrigger>
                  <SelectContent>
                    {['Xuất sắc','Giỏi','Khá','Trung bình'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Số hiệu bằng">
                <Input value={eduForm.certificateCode || ''} onChange={e => setEduForm({ ...eduForm, certificateCode: e.target.value })} placeholder="Số hiệu văn bằng" />
              </FieldGroup>
            </div>
            <FieldGroup label="Tên luận văn / luận án">
              <Textarea rows={2} value={eduForm.thesisTitle || ''} onChange={e => setEduForm({ ...eduForm, thesisTitle: e.target.value })} placeholder="Tên đề tài nghiên cứu..." />
            </FieldGroup>
          </CrudDialog>
          <DeleteConfirm open={!!eduDeleteId} onOpenChange={v => !v && setEduDeleteId(null)} onConfirm={() => eduDeleteId && handleDeleteEdu(eduDeleteId)} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Ngoại ngữ */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="language" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Chứng chỉ ngoại ngữ</CardTitle>
                <CardDescription>{profile.foreignLanguageCerts?.length || 0} chứng chỉ</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setLangEditing(null); setLangForm(LANG_EMPTY); setLangOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />Thêm mới
              </Button>
            </CardHeader>
            <CardContent>
              {(profile.foreignLanguageCerts?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.foreignLanguageCerts.map((lc, i) => (
                    <div key={lc.id || i} className="group p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                            <Globe className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{lc.language}</p>
                            <p className="text-xs text-muted-foreground">{lc.certType}</p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {lc.certLevel && <Badge variant="secondary" className="text-xs">{lc.certLevel}</Badge>}
                              {lc.framework && <span className="text-xs text-muted-foreground">{lc.framework}</span>}
                            </div>
                            {lc.issuer && <p className="text-xs text-muted-foreground mt-1">{lc.issuer}{lc.issueDate ? ` — ${fmtDate(lc.issueDate)}` : ''}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLang(lc)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setLangDeleteId(lc.id!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {lc.notes && <p className="text-xs mt-2 text-muted-foreground/70 border-t pt-2">{lc.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Globe} title="Chưa có chứng chỉ ngoại ngữ" sub="Thêm IELTS, TOEFL, B1, B2, cử nhân ngoại ngữ..." />
              )}
            </CardContent>
          </Card>

          <CrudDialog open={langOpen} onOpenChange={setLangOpen}
            title={langEditing ? 'Chỉnh sửa chứng chỉ ngoại ngữ' : 'Thêm chứng chỉ ngoại ngữ'}
            saving={langSaving} onSave={handleSaveLang}>
            <FieldGroup label="Ngôn ngữ *">
              <Select value={langForm.language} onValueChange={v => setLangForm({ ...langForm, language: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn ngôn ngữ" /></SelectTrigger>
                <SelectContent>
                  {languageItems.map(l => <SelectItem key={l.code} value={l.nameVi}>{l.nameVi}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Loại chứng chỉ *">
              <Input value={langForm.certType} onChange={e => setLangForm({ ...langForm, certType: e.target.value })} placeholder="IELTS, TOEFL, B1, B2, Cử nhân..." />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Trình độ / Điểm">
                <Input value={langForm.certLevel || ''} onChange={e => setLangForm({ ...langForm, certLevel: e.target.value })} placeholder="B1, 6.5, 600..." />
              </FieldGroup>
              <FieldGroup label="Khung tham chiếu">
                <Input value={langForm.framework || ''} onChange={e => setLangForm({ ...langForm, framework: e.target.value })} placeholder="CEFR, ETS..." />
              </FieldGroup>
              <FieldGroup label="Số chứng chỉ">
                <Input value={langForm.certNumber || ''} onChange={e => setLangForm({ ...langForm, certNumber: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Ngày cấp">
                <Input type="date" value={langForm.issueDate || ''} onChange={e => setLangForm({ ...langForm, issueDate: e.target.value })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Nơi cấp">
              <Input value={langForm.issuer || ''} onChange={e => setLangForm({ ...langForm, issuer: e.target.value })} placeholder="Tổ chức, trường cấp chứng chỉ" />
            </FieldGroup>
            <FieldGroup label="Ghi chú">
              <Textarea rows={2} value={langForm.notes || ''} onChange={e => setLangForm({ ...langForm, notes: e.target.value })} />
            </FieldGroup>
          </CrudDialog>
          <DeleteConfirm open={!!langDeleteId} onOpenChange={v => !v && setLangDeleteId(null)} onConfirm={() => langDeleteId && handleDeleteLang(langDeleteId)} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Chứng chỉ kỹ thuật */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="techcert" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Bằng cấp / Chứng chỉ kỹ thuật</CardTitle>
                <CardDescription>{profile.technicalCertificates?.length || 0} mục</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setTechEditing(null); setTechForm(TECH_EMPTY); setTechOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />Thêm mới
              </Button>
            </CardHeader>
            <CardContent>
              {(profile.technicalCertificates?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.technicalCertificates.map((tc, i) => (
                    <div key={tc.id || i} className="group p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                            <FileCheck className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{tc.certName}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-xs h-5">{tc.certType}</Badge>
                              {tc.classification && <Badge variant="secondary" className="text-xs h-5">{tc.classification}</Badge>}
                            </div>
                            {tc.issuer && <p className="text-xs text-muted-foreground mt-1">{tc.issuer}{tc.issueDate ? ` — ${fmtDate(tc.issueDate)}` : ''}</p>}
                            {tc.decisionNumber && <p className="text-xs text-muted-foreground">Số QĐ: {tc.decisionNumber}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTech(tc)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setTechDeleteId(tc.id!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {tc.notes && <p className="text-xs mt-2 text-muted-foreground/70 border-t pt-2">{tc.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileCheck} title="Chưa có chứng chỉ kỹ thuật" sub="Thêm bằng cấp, chứng chỉ nghiệp vụ chuyên ngành..." />
              )}
            </CardContent>
          </Card>

          <CrudDialog open={techOpen} onOpenChange={setTechOpen}
            title={techEditing ? 'Chỉnh sửa chứng chỉ kỹ thuật' : 'Thêm chứng chỉ kỹ thuật'}
            saving={techSaving} onSave={handleSaveTech}>
            <FieldGroup label="Loại chứng chỉ *">
              <Select value={techForm.certType} onValueChange={v => setTechForm({ ...techForm, certType: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                <SelectContent>
                  {['Chứng chỉ nghiệp vụ','Chứng chỉ kỹ thuật','Chứng chỉ tin học','Bằng lái xe quân sự','Chứng nhận hoàn thành khóa học','Khác'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Tên chứng chỉ / bằng cấp *">
              <Input value={techForm.certName} onChange={e => setTechForm({ ...techForm, certName: e.target.value })} placeholder="Tên đầy đủ của chứng chỉ" />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Số hiệu bằng">
                <Input value={techForm.certNumber || ''} onChange={e => setTechForm({ ...techForm, certNumber: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Xếp loại">
                <Select value={techForm.classification || ''} onValueChange={v => setTechForm({ ...techForm, classification: v })}>
                  <SelectTrigger><SelectValue placeholder="Xếp loại" /></SelectTrigger>
                  <SelectContent>
                    {['Xuất sắc','Giỏi','Khá','Trung bình'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Ngày cấp">
                <Input type="date" value={techForm.issueDate || ''} onChange={e => setTechForm({ ...techForm, issueDate: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Số quyết định">
                <Input value={techForm.decisionNumber || ''} onChange={e => setTechForm({ ...techForm, decisionNumber: e.target.value })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Nơi cấp">
              <Input value={techForm.issuer || ''} onChange={e => setTechForm({ ...techForm, issuer: e.target.value })} placeholder="Cơ quan, tổ chức cấp" />
            </FieldGroup>
            <FieldGroup label="Ghi chú">
              <Textarea rows={2} value={techForm.notes || ''} onChange={e => setTechForm({ ...techForm, notes: e.target.value })} />
            </FieldGroup>
          </CrudDialog>
          <DeleteConfirm open={!!techDeleteId} onOpenChange={v => !v && setTechDeleteId(null)} onConfirm={() => techDeleteId && handleDeleteTech(techDeleteId)} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Khen thưởng */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="awards" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Khen thưởng — Kỷ luật</CardTitle>
              <CardDescription>Liên thông tự động từ module Thi đua — Chính sách</CardDescription>
            </CardHeader>
            <CardContent>
              {(profile.awards?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {profile.awards.map((a, i) => (
                    <div key={a.id || i} className="flex items-center gap-3 p-3.5 rounded-xl border">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'KHEN_THUONG' ? 'bg-yellow-100 dark:bg-yellow-950/40' : 'bg-red-100 dark:bg-red-950/40'}`}>
                        <Award className={`h-4 w-4 ${a.type === 'KHEN_THUONG' ? 'text-yellow-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{a.description || a.type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.awardedBy && `${a.awardedBy} — `}Năm {a.year}</p>
                      </div>
                      <Badge variant={a.type === 'KHEN_THUONG' ? 'default' : 'destructive'} className="text-xs shrink-0">
                        {a.type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Award} title="Chưa có dữ liệu khen thưởng" sub="Liên thông từ module Thi đua — Chính sách" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Đảng viên */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="party" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin Đảng viên</CardTitle>
              <CardDescription>Liên thông từ CSDL Đảng viên</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.partyJoinDate ? (
                <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                      <Star className="h-6 w-6 text-red-600 fill-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-red-800 dark:text-red-200">Đảng viên Đảng Cộng sản Việt Nam</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-red-500 shrink-0" />
                          Ngày vào Đảng: <strong className="text-foreground ml-1">{fmtDate(profile.partyJoinDate)}</strong>
                        </span>
                        {profile.partyPosition && (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-4 w-4 text-red-500 shrink-0" />
                            Chức vụ Đảng: <strong className="text-foreground ml-1">{profile.partyPosition}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Star} title="Chưa có thông tin đảng viên" sub="Dữ liệu sẽ được liên thông từ CSDL Đảng viên" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Quân hàm */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="rank" className="mt-4 space-y-4">

          {/* ── SECTION A: Lịch sử chính thức ──────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Lịch sử quân hàm chính thức
                  </CardTitle>
                  <CardDescription>
                    Toàn bộ quá trình quân hàm từ khi nhập ngũ — dữ liệu đã được cơ quan xác nhận và đưa vào CSDL.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => { setRankDeclForm({ ...RANK_DECL_EMPTY }); setRankDeclOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />Thêm mốc quân hàm
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rankDeclsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : officerHistory.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Chưa có lịch sử quân hàm chính thức"
                  sub="Nhấn 'Thêm mốc quân hàm' để khai báo từng mốc từ khi nhập ngũ đến hiện tại. Sau khi cơ quan duyệt, dữ liệu sẽ xuất hiện tại đây."
                />
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1">
                    {officerHistory.map((rec, idx) => (
                      <div key={rec.id} className="relative flex gap-4 pb-4">
                        {/* Timeline dot */}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${idx === officerHistory.length - 1 ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                          <Shield className={`h-4 w-4 ${idx === officerHistory.length - 1 ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {PROMOTION_TYPE_LABELS[rec.promotionType] || rec.promotionType}
                            </span>
                            {idx === officerHistory.length - 1 && (
                              <Badge className="text-xs bg-emerald-600 text-white">Hiện tại</Badge>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{fmtDate(rec.effectiveDate)}
                            </span>
                            {rec.previousRank && rec.newRank && (
                              <span>{rec.previousRank} → <strong className="text-foreground">{rec.newRank}</strong></span>
                            )}
                            {rec.newRank && !rec.previousRank && (
                              <span>Quân hàm: <strong className="text-foreground">{rec.newRank}</strong></span>
                            )}
                            {rec.newPosition && <span>Chức vụ: {rec.newPosition}</span>}
                            {rec.decisionNumber && <span>QĐ: {rec.decisionNumber}</span>}
                          </div>
                          {rec.reason && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{rec.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── SECTION B: Bản khai đang xử lý ─────────────────────────────── */}
          {rankDecls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Bản khai đang chờ xử lý ({rankDecls.length})
                </CardTitle>
                <CardDescription>
                  Các bản khai chưa được cơ quan phê duyệt. Nộp bản khai để gửi lên{' '}
                  {profile?.managementCategory === 'CAN_BO' ? 'Ban Cán bộ' : 'Ban Quân lực'} xét duyệt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rankDecls.map(decl => {
                    const statusCfg = DECL_STATUS_CONFIG[decl.declarationStatus] || { label: decl.declarationStatus, variant: 'secondary' as const };
                    const canSubmit = decl.declarationStatus === 'DRAFT' || decl.declarationStatus === 'RETURNED';
                    return (
                      <div key={decl.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {PROMOTION_TYPE_LABELS[decl.promotionType] || decl.promotionType}
                            </span>
                            <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                            <span>{fmtDate(decl.effectiveDate)}</span>
                            {decl.previousRank && decl.newRank && <span>{decl.previousRank} → {decl.newRank}</span>}
                            {decl.decisionNumber && <span>QĐ: {decl.decisionNumber}</span>}
                          </div>
                        </div>
                        {canSubmit && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rankSubmittingId === decl.id}
                            className="shrink-0 text-xs"
                            onClick={async () => {
                              setRankSubmittingId(decl.id);
                              try {
                                const res = await fetch(`/api/officer-career/rank-declarations/${decl.id}/submit`, { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                  toast.success('Đã nộp bản khai — chờ cơ quan xét duyệt');
                                  fetchRankDeclarations();
                                } else {
                                  toast.error(data.error || 'Không thể nộp bản khai');
                                }
                              } catch { toast.error('Lỗi kết nối'); }
                              finally { setRankSubmittingId(null); }
                            }}
                          >
                            {rankSubmittingId === decl.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <><ChevronRight className="h-3.5 w-3.5 mr-1" />Nộp</>
                            }
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hướng dẫn */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
            <strong>Hướng dẫn khai báo lịch sử:</strong> Nhấn &quot;Thêm mốc quân hàm&quot; để khai báo từng sự kiện
            (nhập ngũ, thăng cấp, bổ nhiệm, điều động…) theo thứ tự thời gian từ đầu đến nay.
            Mỗi bản khai cần được{' '}
            {profile?.managementCategory === 'CAN_BO' ? 'Ban Cán bộ' : 'Ban Quân lực'}{' '}
            xác nhận trước khi vào CSDL chính thức.
          </div>

          {/* Create rank declaration dialog */}
          <CrudDialog
            open={rankDeclOpen}
            onOpenChange={setRankDeclOpen}
            title="Khai báo mốc quân hàm"
            saving={rankDeclSaving}
            onSave={async () => {
              if (!profile) return;
              if (!rankDeclForm.promotionType || !rankDeclForm.effectiveDate) {
                toast.error('Vui lòng điền loại sự kiện và ngày hiệu lực');
                return;
              }
              setRankDeclSaving(true);
              try {
                const res = await fetch('/api/officer-career/rank-declarations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    personnelId:      profile.id,
                    rankType:         rankDeclForm.rankType,
                    promotionType:    rankDeclForm.promotionType,
                    previousRank:     rankDeclForm.previousRank || null,
                    newRank:          rankDeclForm.newRank || null,
                    effectiveDate:    rankDeclForm.effectiveDate,
                    decisionNumber:   rankDeclForm.decisionNumber || null,
                    decisionDate:     rankDeclForm.decisionDate || null,
                    previousPosition: rankDeclForm.previousPosition || null,
                    newPosition:      rankDeclForm.newPosition || null,
                    reason:           rankDeclForm.reason || null,
                    notes:            rankDeclForm.notes || null,
                    onBehalf:         false,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  toast.success('Đã tạo bản khai. Nhấn "Nộp" để gửi cơ quan xét duyệt.');
                  setRankDeclOpen(false);
                  fetchRankDeclarations();
                } else {
                  toast.error(data.error || 'Không thể tạo bản khai');
                }
              } catch { toast.error('Lỗi kết nối'); }
              finally { setRankDeclSaving(false); }
            }}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Diện quản lý">
                  <Select value={rankDeclForm.rankType} onValueChange={v => setRankDeclForm({ ...rankDeclForm, rankType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OFFICER">Sĩ quan / Cán bộ</SelectItem>
                      <SelectItem value="SOLDIER">Quân nhân chuyên nghiệp</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Loại sự kiện *">
                  <Select value={rankDeclForm.promotionType} onValueChange={v => setRankDeclForm({ ...rankDeclForm, promotionType: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Quân hàm cũ">
                  <Input value={rankDeclForm.previousRank} onChange={e => setRankDeclForm({ ...rankDeclForm, previousRank: e.target.value })} placeholder="VD: Đại úy" />
                </FieldGroup>
                <FieldGroup label="Quân hàm mới">
                  <Input value={rankDeclForm.newRank} onChange={e => setRankDeclForm({ ...rankDeclForm, newRank: e.target.value })} placeholder="VD: Thiếu tá" />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Ngày hiệu lực *">
                  <Input type="date" value={rankDeclForm.effectiveDate} onChange={e => setRankDeclForm({ ...rankDeclForm, effectiveDate: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Số quyết định">
                  <Input value={rankDeclForm.decisionNumber} onChange={e => setRankDeclForm({ ...rankDeclForm, decisionNumber: e.target.value })} placeholder="VD: 123/QĐ-BQP" />
                </FieldGroup>
              </div>
              <FieldGroup label="Ngày ban hành QĐ">
                <Input type="date" value={rankDeclForm.decisionDate} onChange={e => setRankDeclForm({ ...rankDeclForm, decisionDate: e.target.value })} />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Chức vụ cũ">
                  <Input value={rankDeclForm.previousPosition} onChange={e => setRankDeclForm({ ...rankDeclForm, previousPosition: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Chức vụ mới">
                  <Input value={rankDeclForm.newPosition} onChange={e => setRankDeclForm({ ...rankDeclForm, newPosition: e.target.value })} />
                </FieldGroup>
              </div>
              <FieldGroup label="Lý do / Căn cứ">
                <Textarea rows={2} value={rankDeclForm.reason} onChange={e => setRankDeclForm({ ...rankDeclForm, reason: e.target.value })} placeholder="Theo Quyết định số... hoặc lý do thăng cấp" />
              </FieldGroup>
              <FieldGroup label="Ghi chú">
                <Textarea rows={2} value={rankDeclForm.notes} onChange={e => setRankDeclForm({ ...rankDeclForm, notes: e.target.value })} />
              </FieldGroup>
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                Bản khai sẽ lưu ở trạng thái <strong>Nháp</strong>. Sau khi kiểm tra xong, nhấn &quot;Nộp&quot;
                để gửi lên cơ quan xét duyệt. Có thể thêm nhiều mốc để khai báo toàn bộ lịch sử.
              </p>
            </div>
          </CrudDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
