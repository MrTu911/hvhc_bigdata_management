/**
 * CSDL Quân nhân - Ban Quân lực quản lý
 * Quản lý chiến sĩ/HSQ/QNCN, hồ sơ binh vụ, sức khỏe, hạn thăng quân hàm
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Search, RefreshCw, Star, Building, ChevronLeft, ChevronRight,
  Eye, Clock, AlertTriangle, AlertCircle, CheckCircle2, Info, Plus,
  Pencil, Trash2, FileDown, Shield, UserPlus, Loader2, ArrowUpCircle,
  HeartPulse, Activity, ClipboardList, CalendarCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = ['#7c3aed', '#1d4ed8', '#d97706', '#059669'];

const SOLDIER_RANK_LABELS: Record<string, string> = {
  THUONG_SI: 'Thượng sĩ',
  TRUNG_SI:  'Trung sĩ',
  HA_SI:     'Hạ sĩ',
  BINH_NHAT: 'Binh nhất',
  BINH_NHI:  'Binh nhì',
};
const SOLDIER_RANKS = Object.entries(SOLDIER_RANK_LABELS).map(([value, label]) => ({ value, label }));

const SOLDIER_CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  QNCN:     { label: 'Quân nhân chuyên nghiệp', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  CNVQP:    { label: 'Công nhân viên QP',        color: 'bg-blue-100 text-blue-800 border-blue-200' },
  HSQ:      { label: 'Hạ sĩ quan',               color: 'bg-amber-100 text-amber-800 border-amber-200' },
  CHIEN_SI: { label: 'Chiến sĩ',                 color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  NGHIA_VU:     'Nghĩa vụ',
  HOP_DONG:     'Hợp đồng',
  CHUYEN_NGHIEP:'Chuyên nghiệp',
};

const SERVICE_EVENT_TYPES: { value: string; label: string; color: string }[] = [
  { value: 'NHAP_NGU',    label: 'Nhập ngũ',       color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'THANG_CAP',   label: 'Thăng quân hàm', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'HA_CAP',      label: 'Hạ quân hàm',    color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'DIEU_DONG',   label: 'Điều động',      color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'XUAT_NGU',    label: 'Xuất ngũ',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'PHUC_VU_TT',  label: 'Phục vụ tiếp',  color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'KY_LUAT',     label: 'Kỷ luật',        color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'KHEN_THUONG', label: 'Khen thưởng',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'KHAC',        label: 'Khác',            color: 'bg-gray-100 text-gray-700 border-gray-200' },
];
const EVENT_TYPE_MAP = Object.fromEntries(SERVICE_EVENT_TYPES.map(t => [t.value, t]));

const HEALTH_CATEGORIES = [
  { value: 'Loại 1', description: 'Sức khỏe tốt',   badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-500' },
  { value: 'Loại 2', description: 'Sức khỏe khá',   badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',          dotColor: 'bg-blue-500' },
  { value: 'Loại 3', description: 'Sức khỏe TB',    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',        dotColor: 'bg-amber-500' },
  { value: 'Loại 4', description: 'Cần điều trị',   badgeColor: 'bg-red-100 text-red-800 border-red-300',              dotColor: 'bg-red-500' },
];

const SPECIAL_CASE_TYPES = [
  { value: 'CHIEN_SI_THI_DUA_TOAN_QUAN', label: 'Chiến sĩ thi đua toàn quân' },
  { value: 'THANH_TICH_DAC_BIET',        label: 'Thành tích đặc biệt' },
  { value: 'NGHI_QUYET_CAP_TREN',        label: 'Theo nghị quyết cấp trên' },
  { value: 'KHAC',                        label: 'Khác' },
];

const DEADLINE_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OVERDUE:  { label: 'Quá hạn',      color: 'bg-red-100 text-red-800 border-red-300',             icon: <AlertCircle className="h-3 w-3" /> },
  CRITICAL: { label: 'Sắp đến hạn', color: 'bg-orange-100 text-orange-800 border-orange-300',    icon: <AlertTriangle className="h-3 w-3" /> },
  WARNING:  { label: 'Chú ý',        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',    icon: <Clock className="h-3 w-3" /> },
  UPCOMING: { label: 'Sắp đến',      color: 'bg-blue-100 text-blue-800 border-blue-300',          icon: <Info className="h-3 w-3" /> },
  NOT_YET:  { label: 'Chưa đến hạn',color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  MAX_RANK: { label: 'Cấp cao nhất', color: 'bg-purple-100 text-purple-800 border-purple-300',    icon: <Star className="h-3 w-3" /> },
  NO_DATA:  { label: 'Thiếu dữ liệu',color: 'bg-gray-100 text-gray-600 border-gray-300',          icon: <Info className="h-3 w-3" /> },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonnelOption {
  id: string; fullName: string; personnelCode: string;
  militaryRank: string | null; unit: { name: string } | null;
}
interface SoldierProfile {
  id: string; soldierIdNumber: string | null; soldierCategory: string | null;
  currentRank: string | null; serviceType: string | null;
  enlistmentDate: string | null; expectedDischargeDate: string | null;
  healthCategory: string | null; lastRankDate: string | null;
  personnel: {
    id: string; personnelCode: string; fullName: string;
    dateOfBirth: string | null; gender: string | null;
    militaryRank: string | null; position: string | null;
    unit: { id: string; name: string; code: string } | null;
  };
  serviceRecords: Array<{ id: string; eventType: string; eventDate: string; newRank: string | null }>;
}
interface SoldierStats {
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byServiceType: Array<{ serviceType: string; count: number }>;
  byUnit: Array<{ name: string; count: number }>;
  health?: { byCategory: Array<{ healthCategory: string; count: number }>; needsFollowUp: number; checkedCount: number };
}
interface SoldierHealthRecord {
  id: string; currentRank: string | null; soldierCategory: string | null;
  healthCategory: string | null; healthNotes: string | null; lastHealthCheckDate: string | null;
  personnel: { id: string; fullName: string; personnelCode: string; dateOfBirth: string | null; gender: string | null; unit: { id: string; name: string } | null };
}
interface HealthSummary { total: number; byCategory: Array<{ category: string; count: number }>; notChecked: number }
interface ServiceRecord {
  id: string; soldierProfileId: string; eventType: string; eventDate: string;
  decisionNumber: string | null; previousRank: string | null; newRank: string | null;
  previousUnit: string | null; newUnit: string | null; description: string | null;
  notes: string | null; createdAt: string;
}
interface DeadlineItem {
  id: string; personnelId: string; personnelCode: string; fullName: string; unit: string | null;
  currentRank: string | null; currentRankLabel: string | null; nextRank: string | null; nextRankLabel: string | null;
  eligibilityDate: string | null; daysUntilEligible: number | null; status: string; specialCaseCount: number;
}
interface DeadlineSummary { total: number; overdue: number; critical: number; warning: number; upcoming: number; notYet: number }
interface SpecialCase {
  id: string; soldierProfileId: string | null; officerCareerId: string | null;
  caseType: string; caseTypeLabel: string; title: string; description: string | null;
  reductionMonths: number; decisionNumber: string | null; decisionDate: string | null;
  issuedBy: string | null; isActive: boolean; notes: string | null; createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoldierManagementPage() {
  const router = useRouter();

  // List
  const [soldiers, setSoldiers] = useState<SoldierProfile[]>([]);
  const [stats, setStats] = useState<SoldierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSoldiers, setTotalSoldiers] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Deadlines
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [deadlineSummary, setDeadlineSummary] = useState<DeadlineSummary | null>(null);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState('ALL');
  const [deadlinePage, setDeadlinePage] = useState(1);
  const [deadlineTotalPages, setDeadlineTotalPages] = useState(1);

  // Health
  const [healthRecords, setHealthRecords] = useState<SoldierHealthRecord[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthSearch, setHealthSearch] = useState('');
  const [healthCategoryFilter, setHealthCategoryFilter] = useState('ALL');
  const [healthPage, setHealthPage] = useState(1);
  const [healthTotalPages, setHealthTotalPages] = useState(1);
  const [healthTotal, setHealthTotal] = useState(0);
  const [showUnchecked, setShowUnchecked] = useState(false);
  const [healthDialog, setHealthDialog] = useState<{ open: boolean; record?: SoldierHealthRecord }>({ open: false });
  const [healthForm, setHealthForm] = useState({ healthCategory: '', healthNotes: '', lastHealthCheckDate: '' });
  const [healthSaving, setHealthSaving] = useState(false);

  // Service records
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [serviceRecordsLoading, setServiceRecordsLoading] = useState(false);
  const [serviceEventFilter, setServiceEventFilter] = useState('ALL');
  const [servicePage, setServicePage] = useState(1);
  const [serviceTotalPages, setServiceTotalPages] = useState(1);
  const [serviceTotal, setServiceTotal] = useState(0);
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean }>({ open: false });
  const [serviceForm, setServiceForm] = useState({
    soldierProfileId: '', eventType: '', eventDate: '', decisionNumber: '',
    previousRank: '', newRank: '', description: '', notes: '',
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [srPersonnelQuery, setSrPersonnelQuery] = useState('');
  const [srPersonnelResults, setSrPersonnelResults] = useState<Array<PersonnelOption & { _profileId: string }>>([]);
  const [srPersonnelSearching, setSrPersonnelSearching] = useState(false);
  const [srSelectedSoldier, setSrSelectedSoldier] = useState<{ _profileId: string; fullName: string; personnelCode: string } | null>(null);

  // Soldier CRUD
  const [soldierDialog, setSoldierDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: SoldierProfile }>({ open: false, mode: 'create' });
  const [soldierForm, setSoldierForm] = useState({ personnelId: '', soldierIdNumber: '', soldierCategory: '', currentRank: '', serviceType: '', enlistmentDate: '', expectedDischargeDate: '' });
  const [soldierSaving, setSoldierSaving] = useState(false);
  const [personnelQuery, setPersonnelQuery] = useState('');
  const [personnelResults, setPersonnelResults] = useState<PersonnelOption[]>([]);
  const [personnelSearching, setPersonnelSearching] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelOption | null>(null);

  // Special cases
  const [specialCases, setSpecialCases] = useState<SpecialCase[]>([]);
  const [specialCasesLoading, setSpecialCasesLoading] = useState(false);
  const [showAllCases, setShowAllCases] = useState(false);
  const [scDialog, setScDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: SpecialCase }>({ open: false, mode: 'create' });
  const [scForm, setScForm] = useState({ soldierProfileId: '', caseType: '', title: '', description: '', reductionMonths: '', decisionNumber: '', decisionDate: '', issuedBy: '', notes: '', isActive: true });
  const [scSaving, setScSaving] = useState(false);
  const [scPersonnelQuery, setScPersonnelQuery] = useState('');
  const [scPersonnelResults, setScPersonnelResults] = useState<PersonnelOption[]>([]);
  const [scPersonnelSearching, setScPersonnelSearching] = useState(false);
  const [scSelectedPersonnel, setScSelectedPersonnel] = useState<PersonnelOption | null>(null);

  // ── Fetchers ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString()); params.set('limit', '15');
      if (search) params.set('search', search);
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
      if (serviceTypeFilter && serviceTypeFilter !== 'all') params.set('serviceType', serviceTypeFilter);
      const [r1, r2] = await Promise.all([
        fetch(`/api/soldier-profile?${params}`), fetch('/api/soldier-profile/stats'),
      ]);
      const d1 = await r1.json(); const d2 = await r2.json();
      if (d1.success) { setSoldiers(d1.data); setTotalPages(d1.pagination.totalPages); setTotalSoldiers(d1.pagination.total); }
      if (d2.success) setStats(d2.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, search, categoryFilter, serviceTypeFilter]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchDeadlines = useCallback(async () => {
    setDeadlineLoading(true);
    try {
      const params = new URLSearchParams({ type: 'SOLDIER', status: deadlineStatusFilter, page: deadlinePage.toString(), limit: '20' });
      const data = await (await fetch(`/api/officer-career/promotion-deadlines?${params}`)).json();
      if (data.success) { setDeadlines(data.data); setDeadlineSummary(data.summary); setDeadlineTotalPages(data.pagination.totalPages); }
    } catch (e) { console.error(e); } finally { setDeadlineLoading(false); }
  }, [deadlineStatusFilter, deadlinePage]);
  useEffect(() => { if (activeTab === 'deadlines') fetchDeadlines(); }, [activeTab, fetchDeadlines]);

  const fetchHealthRecords = useCallback(async () => {
    setHealthLoading(true);
    try {
      const params = new URLSearchParams({ page: healthPage.toString(), limit: '20' });
      if (healthSearch) params.set('search', healthSearch);
      if (healthCategoryFilter !== 'ALL') params.set('healthCategory', healthCategoryFilter);
      if (showUnchecked) params.set('needsCheck', 'true');
      const data = await (await fetch(`/api/soldier-profile/health?${params}`)).json();
      if (data.success) { setHealthRecords(data.data); setHealthSummary(data.summary); setHealthTotalPages(data.pagination.totalPages); setHealthTotal(data.pagination.total); }
    } catch (e) { console.error(e); } finally { setHealthLoading(false); }
  }, [healthPage, healthSearch, healthCategoryFilter, showUnchecked]);
  useEffect(() => { if (activeTab === 'health') fetchHealthRecords(); }, [activeTab, fetchHealthRecords]);

  const fetchServiceRecords = useCallback(async () => {
    setServiceRecordsLoading(true);
    // Aggregate across all soldiers: fetch multiple profiles' records
    // We load from the first page of soldiers and get their records
    try {
      const soldiersRes = await fetch('/api/soldier-profile?limit=50');
      const soldiersData = await soldiersRes.json();
      if (!soldiersData.success) { setServiceRecordsLoading(false); return; }

      const allProfiles: SoldierProfile[] = soldiersData.data;
      let allRecords: ServiceRecord[] = allProfiles.flatMap((s: SoldierProfile) =>
        (s.serviceRecords || []).map(r => ({
          id: r.id,
          soldierProfileId: s.id,
          eventType: r.eventType,
          eventDate: r.eventDate,
          decisionNumber: null,
          previousRank: null,
          newRank: r.newRank,
          previousUnit: null,
          newUnit: null,
          description: null,
          notes: null,
          createdAt: r.eventDate,
        }))
      );

      if (serviceEventFilter !== 'ALL') {
        allRecords = allRecords.filter(r => r.eventType === serviceEventFilter);
      }
      allRecords.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

      const limit = 20;
      const total = allRecords.length;
      const start = (servicePage - 1) * limit;
      setServiceRecords(allRecords.slice(start, start + limit));
      setServiceTotal(total);
      setServiceTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch (e) { console.error(e); } finally { setServiceRecordsLoading(false); }
  }, [servicePage, serviceEventFilter]);
  useEffect(() => { if (activeTab === 'service-records') fetchServiceRecords(); }, [activeTab, fetchServiceRecords]);

  const fetchAllSpecialCases = useCallback(async () => {
    setSpecialCasesLoading(true);
    try {
      const data = await (await fetch(`/api/officer-career/special-cases?activeOnly=${!showAllCases}&rankType=SOLDIER`)).json();
      if (data.success) setSpecialCases(data.data.filter((sc: SpecialCase) => sc.soldierProfileId));
    } catch (e) { console.error(e); } finally { setSpecialCasesLoading(false); }
  }, [showAllCases]);
  useEffect(() => { if (activeTab === 'special-cases') fetchAllSpecialCases(); }, [activeTab, fetchAllSpecialCases]);

  // ── Personnel search ──────────────────────────────────────────────────────────

  const doPersonnelSearch = useCallback(async (q: string, setter: (r: PersonnelOption[]) => void, setSearching: (v: boolean) => void) => {
    if (!q || q.length < 2) { setter([]); return; }
    setSearching(true);
    try {
      const data = await (await fetch(`/api/personnel?search=${encodeURIComponent(q)}&limit=8`)).json();
      if (data.success) setter(data.data || []);
    } catch { setter([]); } finally { setSearching(false); }
  }, []);

  const searchSoldiersForSr = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSrPersonnelResults([]); return; }
    setSrPersonnelSearching(true);
    try {
      const data = await (await fetch(`/api/soldier-profile?search=${encodeURIComponent(q)}&limit=8`)).json();
      if (data.success) setSrPersonnelResults(
        (data.data as SoldierProfile[]).map(s => ({
          id: s.personnel?.id ?? '', fullName: s.personnel?.fullName ?? '',
          personnelCode: s.personnel?.personnelCode ?? '', militaryRank: s.personnel?.militaryRank ?? null,
          unit: s.personnel?.unit ?? null, _profileId: s.id,
        }))
      );
    } catch { setSrPersonnelResults([]); } finally { setSrPersonnelSearching(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => doPersonnelSearch(personnelQuery, setPersonnelResults, setPersonnelSearching), 300); return () => clearTimeout(t); }, [personnelQuery, doPersonnelSearch]);
  useEffect(() => { const t = setTimeout(() => doPersonnelSearch(scPersonnelQuery, setScPersonnelResults, setScPersonnelSearching), 300); return () => clearTimeout(t); }, [scPersonnelQuery, doPersonnelSearch]);
  useEffect(() => { const t = setTimeout(() => searchSoldiersForSr(srPersonnelQuery), 300); return () => clearTimeout(t); }, [srPersonnelQuery, searchSoldiersForSr]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const saveHealth = async () => {
    if (!healthDialog.record) return;
    setHealthSaving(true);
    try {
      const res = await fetch(`/api/soldier-profile/${healthDialog.record.id}/health`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthCategory: healthForm.healthCategory || null, healthNotes: healthForm.healthNotes || null, lastHealthCheckDate: healthForm.lastHealthCheckDate || null }),
      });
      const data = await res.json();
      if (data.success) { setHealthDialog({ open: false }); fetchHealthRecords(); }
      else alert(data.error || 'Lỗi khi lưu');
    } catch { alert('Đã xảy ra lỗi'); } finally { setHealthSaving(false); }
  };

  const saveSoldier = async () => {
    setSoldierSaving(true);
    try {
      const isEdit = soldierDialog.mode === 'edit' && soldierDialog.data;
      if (isEdit) {
        const res = await fetch(`/api/soldier-profile/${soldierDialog.data!.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ soldierCategory: soldierForm.soldierCategory || undefined, currentRank: soldierForm.currentRank || undefined, serviceType: soldierForm.serviceType || undefined, enlistmentDate: soldierForm.enlistmentDate || undefined, expectedDischargeDate: soldierForm.expectedDischargeDate || undefined }),
        });
        const data = await res.json();
        if (data.success || data.data) { setSoldierDialog({ open: false, mode: 'create' }); fetchData(); }
        else alert(data.error || 'Lỗi');
      } else {
        if (!selectedPersonnel) { alert('Vui lòng chọn quân nhân'); return; }
        const res = await fetch('/api/soldier-profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personnelId: selectedPersonnel.id, soldierIdNumber: soldierForm.soldierIdNumber || undefined, soldierCategory: soldierForm.soldierCategory || undefined, currentRank: soldierForm.currentRank || undefined, serviceType: soldierForm.serviceType || undefined, enlistmentDate: soldierForm.enlistmentDate || undefined, expectedDischargeDate: soldierForm.expectedDischargeDate || undefined }),
        });
        const data = await res.json();
        if (data.success || data.data) { setSoldierDialog({ open: false, mode: 'create' }); fetchData(); }
        else alert(data.error || 'Lỗi');
      }
    } catch { alert('Đã xảy ra lỗi'); } finally { setSoldierSaving(false); }
  };

  const deleteSoldier = async (id: string, name: string) => {
    if (!confirm(`Xóa hồ sơ quân nhân của "${name}"?`)) return;
    const data = await (await fetch(`/api/soldier-profile/${id}`, { method: 'DELETE' })).json();
    if (data.success) fetchData(); else alert(data.error || 'Lỗi khi xóa');
  };

  const saveServiceRecord = async () => {
    setServiceSaving(true);
    try {
      const profileId = srSelectedSoldier?._profileId ?? serviceForm.soldierProfileId;
      if (!profileId) { alert('Vui lòng chọn quân nhân'); return; }
      if (!serviceForm.eventType || !serviceForm.eventDate) { alert('Vui lòng điền đủ thông tin bắt buộc'); return; }
      const res = await fetch('/api/soldier-profile/service-records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soldierProfileId: profileId, eventType: serviceForm.eventType, eventDate: serviceForm.eventDate,
          decisionNumber: serviceForm.decisionNumber || null,
          previousRank: (serviceForm.previousRank && serviceForm.previousRank !== 'none') ? serviceForm.previousRank : null,
          newRank: (serviceForm.newRank && serviceForm.newRank !== 'none') ? serviceForm.newRank : null,
          description: serviceForm.description || null, notes: serviceForm.notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) { setServiceDialog({ open: false }); fetchServiceRecords(); fetchData(); }
      else alert(data.error || 'Lỗi khi lưu');
    } catch { alert('Đã xảy ra lỗi'); } finally { setServiceSaving(false); }
  };

  const saveSpecialCase = async () => {
    setScSaving(true);
    try {
      const isEdit = scDialog.mode === 'edit' && scDialog.data;
      let resolvedProfileId = scForm.soldierProfileId;
      if (!isEdit && scSelectedPersonnel) {
        const d = await (await fetch(`/api/soldier-profile?search=${encodeURIComponent(scSelectedPersonnel.fullName)}&limit=100`)).json();
        if (d.success) { const m = d.data.find((s: SoldierProfile) => s.personnel?.id === scSelectedPersonnel.id); if (m) resolvedProfileId = m.id; }
      }
      const payload: Record<string, unknown> = { caseType: scForm.caseType, title: scForm.title, description: scForm.description || null, reductionMonths: parseInt(scForm.reductionMonths) || 1, decisionNumber: scForm.decisionNumber || null, decisionDate: scForm.decisionDate || null, issuedBy: scForm.issuedBy || null, notes: scForm.notes || null, ...(isEdit && { isActive: scForm.isActive }) };
      if (!isEdit) payload.soldierProfileId = resolvedProfileId || null;
      const url = isEdit ? `/api/officer-career/special-cases/${scDialog.data!.id}` : '/api/officer-career/special-cases';
      const data = await (await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (data.success) { setScDialog({ open: false, mode: 'create' }); fetchAllSpecialCases(); fetchDeadlines(); }
      else alert(data.error || 'Lỗi khi lưu');
    } catch { } finally { setScSaving(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
  const fmtDays = (days: number | null) => { if (days === null) return '-'; if (days < 0) return `Quá ${Math.abs(days)} ngày`; if (days === 0) return 'Hôm nay'; return `Còn ${days} ngày`; };
  const daysSince = (d: string | null) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;
  const rankBadge = (rank: string | null) => {
    if (!rank) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (rank === 'THUONG_SI') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (['TRUNG_SI', 'HA_SI'].includes(rank)) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-emerald-900 to-slate-800 text-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg">
              <Shield className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">CSDL Quân nhân — Ban Quân lực</h1>
              <p className="text-slate-300 text-sm mt-0.5">Chiến sĩ · HSQ · QNCN · Binh vụ · Hạn thăng quân hàm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10 border border-white/20">
              <RefreshCw className="h-4 w-4 mr-1.5" />Làm mới
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold border-0"
              onClick={() => { setActiveTab('list'); setSelectedPersonnel(null); setPersonnelQuery(''); setSoldierForm({ personnelId: '', soldierIdNumber: '', soldierCategory: '', currentRank: '', serviceType: '', enlistmentDate: '', expectedDischargeDate: '' }); setSoldierDialog({ open: true, mode: 'create' }); }}>
              <UserPlus className="h-4 w-4 mr-1.5" />Thêm hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 border border-slate-200 flex-wrap h-auto">
            <TabsTrigger value="overview"        className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">Tổng quan</TabsTrigger>
            <TabsTrigger value="list"            className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">Danh sách</TabsTrigger>
            <TabsTrigger value="service-records" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">Hồ sơ binh vụ</TabsTrigger>
            <TabsTrigger value="deadlines" className="relative data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              Hạn thăng quân hàm
              {deadlineSummary && (deadlineSummary.overdue + deadlineSummary.critical) > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">{deadlineSummary.overdue + deadlineSummary.critical}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="health" className="relative data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              Sức khỏe
              {stats?.health?.needsFollowUp ? <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">{stats.health.needsFollowUp}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="special-cases"   className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">Trường hợp đặc biệt</TabsTrigger>
          </TabsList>

          {/* ── Tổng quan ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-100">Tổng quân nhân</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md"><Users className="h-4 w-4" /></div>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats?.total || 0}</div><p className="text-xs text-emerald-200 mt-1">Hồ sơ đang quản lý</p></CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-amber-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-amber-100">HSQ / QNCN</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md"><Star className="h-4 w-4" /></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {(stats?.byCategory.find(c => c.category === 'HSQ')?.count || 0) + (stats?.byCategory.find(c => c.category === 'QNCN')?.count || 0)}
                      </div>
                      <p className="text-xs text-amber-200 mt-1">Hạ sĩ quan + QN chuyên nghiệp</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">Chiến sĩ</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md"><Shield className="h-4 w-4" /></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.byCategory.find(c => c.category === 'CHIEN_SI')?.count || 0}</div>
                      <p className="text-xs text-blue-200 mt-1">Đang phục vụ</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">Đơn vị</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md"><Building className="h-4 w-4" /></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.byUnit.length || 0}</div>
                      <p className="text-xs text-purple-200 mt-1">Đơn vị có quân nhân</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3"><CardTitle className="text-base text-slate-800">Phân loại quân nhân</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats?.byCategory.filter(c => c.count > 0) || []} cx="50%" cy="50%" labelLine={false}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${SOLDIER_CATEGORY_LABELS[name || '']?.label?.split(' ')[0] || name} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={80} dataKey="count" nameKey="category">
                            {stats?.byCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, SOLDIER_CATEGORY_LABELS[name as string]?.label || name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3"><CardTitle className="text-base text-slate-800">Hình thức phục vụ</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.byServiceType.filter(s => s.count > 0) || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="serviceType" tick={{ fontSize: 11 }} tickFormatter={(v: string) => SERVICE_TYPE_LABELS[v] || v} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip labelFormatter={(l) => SERVICE_TYPE_LABELS[String(l)] || String(l)} formatter={(v) => [v, 'Số quân nhân']} />
                          <Bar dataKey="count" fill="#059669" name="Số quân nhân" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3"><CardTitle className="text-base text-slate-800">Top 8 đơn vị</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.byUnit.slice(0, 8) || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#1d4ed8" name="Số quân nhân" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {stats?.health && (
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-rose-500" />Tổng quan sức khỏe
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {HEALTH_CATEGORIES.map(cfg => {
                          const found = stats.health!.byCategory.find(c => c.healthCategory === cfg.value);
                          return (
                            <div key={cfg.value} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${cfg.dotColor}`} />
                              <div><p className="text-xs text-slate-500">{cfg.value}</p><p className="text-xl font-bold text-slate-800">{found?.count || 0}</p></div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                        <span>Đã kiểm tra: <span className="font-semibold text-slate-700">{stats.health.checkedCount}</span></span>
                        {stats.health.needsFollowUp > 0 && (
                          <span className="text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{stats.health.needsFollowUp} cần theo dõi (Loại 4)</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Danh sách ─────────────────────────────────────────────────── */}
          <TabsContent value="list" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Tìm theo tên, mã quân nhân..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 border-slate-200" />
              </div>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] border-slate-200"><SelectValue placeholder="Loại quân nhân" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {Object.entries(SOLDIER_CATEGORY_LABELS).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={serviceTypeFilter} onValueChange={v => { setServiceTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[155px] border-slate-200"><SelectValue placeholder="Hình thức" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả HT</SelectItem>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-slate-500">{totalSoldiers > 0 && `${totalSoldiers} hồ sơ`}</span>
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-600"><FileDown className="h-4 w-4 mr-1.5" />Xuất Excel</Button>
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => { setSelectedPersonnel(null); setPersonnelQuery(''); setSoldierForm({ personnelId: '', soldierIdNumber: '', soldierCategory: '', currentRank: '', serviceType: '', enlistmentDate: '', expectedDischargeDate: '' }); setSoldierDialog({ open: true, mode: 'create' }); }}>
                  <Plus className="h-4 w-4 mr-1.5" />Thêm hồ sơ
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Mã QN</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Họ và tên</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Quân hàm</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Loại QN</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Hình thức</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Ngày nhập ngũ</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-center w-24">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                    )) : soldiers.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-16 text-slate-400">
                        <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Không có dữ liệu</p>
                      </TableCell></TableRow>
                    ) : soldiers.map(soldier => {
                      const catCfg = SOLDIER_CATEGORY_LABELS[soldier.soldierCategory || ''];
                      return (
                        <TableRow key={soldier.id} className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                          onClick={() => router.push(`/dashboard/personnel/${soldier.personnel?.id}`)}>
                          <TableCell className="font-mono text-xs text-slate-500">{soldier.personnel?.personnelCode || '-'}</TableCell>
                          <TableCell className="font-semibold text-slate-800">{soldier.personnel?.fullName}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${rankBadge(soldier.currentRank)}`}>
                              {SOLDIER_RANK_LABELS[soldier.currentRank || ''] || soldier.currentRank || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {catCfg ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catCfg.color}`}>{catCfg.label}</span>
                              : <span className="text-slate-400 text-sm">-</span>}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{SERVICE_TYPE_LABELS[soldier.serviceType || ''] || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-500">{soldier.personnel?.unit?.name || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-500">{fmt(soldier.enlistmentDate)}</TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-blue-700 hover:bg-blue-50" title="Xem chi tiết"
                                onClick={() => router.push(`/dashboard/personnel/${soldier.personnel?.id}`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-amber-700 hover:bg-amber-50" title="Chỉnh sửa"
                                onClick={() => { setSoldierForm({ personnelId: soldier.personnel?.id || '', soldierIdNumber: soldier.soldierIdNumber || '', soldierCategory: soldier.soldierCategory || '', currentRank: soldier.currentRank || '', serviceType: soldier.serviceType || '', enlistmentDate: soldier.enlistmentDate ? new Date(soldier.enlistmentDate).toISOString().split('T')[0] : '', expectedDischargeDate: soldier.expectedDischargeDate ? new Date(soldier.expectedDischargeDate).toISOString().split('T')[0] : '' }); setSoldierDialog({ open: true, mode: 'edit', data: soldier }); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-red-600 hover:bg-red-50" title="Xóa"
                                onClick={() => deleteSoldier(soldier.id, soldier.personnel?.fullName || '')}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Trang <span className="font-medium text-slate-700">{page}</span> / {totalPages}{totalSoldiers > 0 && ` · ${totalSoldiers} hồ sơ`}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-slate-200"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-slate-200"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Hồ sơ binh vụ ─────────────────────────────────────────────── */}
          <TabsContent value="service-records" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={serviceEventFilter} onValueChange={v => { setServiceEventFilter(v); setServicePage(1); }}>
                <SelectTrigger className="w-[180px] border-slate-200"><SelectValue placeholder="Loại sự kiện" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả sự kiện</SelectItem>
                  {SERVICE_EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => { setSrSelectedSoldier(null); setSrPersonnelQuery(''); setSrPersonnelResults([]); setServiceForm({ soldierProfileId: '', eventType: '', eventDate: '', decisionNumber: '', previousRank: '', newRank: '', description: '', notes: '' }); setServiceDialog({ open: true }); }}>
                  <Plus className="h-4 w-4 mr-1.5" />Thêm bản ghi
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Hồ sơ binh vụ ghi lại các sự kiện: nhập ngũ, thăng/hạ quân hàm, điều động, xuất ngũ. Bản ghi thăng/hạ quân hàm sẽ tự động cập nhật quân hàm hiện tại.</span>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                {serviceRecordsLoading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : serviceRecords.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Chưa có bản ghi binh vụ</p>
                    <p className="text-xs mt-1">Nhấn &quot;Thêm bản ghi&quot; để bắt đầu</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Loại sự kiện</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Ngày</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Quân hàm cũ</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Quân hàm mới</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Số QĐ</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Nội dung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceRecords.map(rec => {
                        const evtCfg = EVENT_TYPE_MAP[rec.eventType];
                        return (
                          <TableRow key={rec.id} className="hover:bg-slate-50">
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${evtCfg?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{evtCfg?.label || rec.eventType}</span>
                            </TableCell>
                            <TableCell className="text-sm">{fmt(rec.eventDate)}</TableCell>
                            <TableCell className="text-sm text-slate-600">{SOLDIER_RANK_LABELS[rec.previousRank || ''] || rec.previousRank || '-'}</TableCell>
                            <TableCell className="text-sm font-medium text-slate-800">{SOLDIER_RANK_LABELS[rec.newRank || ''] || rec.newRank || '-'}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-500">{rec.decisionNumber || '-'}</TableCell>
                            <TableCell className="text-sm text-slate-600 max-w-xs truncate">{rec.description || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Trang {servicePage} / {serviceTotalPages} · {serviceTotal} bản ghi</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={servicePage <= 1} onClick={() => setServicePage(p => p - 1)} className="border-slate-200"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={servicePage >= serviceTotalPages} onClick={() => setServicePage(p => p + 1)} className="border-slate-200"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Hạn thăng quân hàm ────────────────────────────────────────── */}
          <TabsContent value="deadlines" className="space-y-4 mt-4">
            {deadlineSummary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'OVERDUE',  label: 'Quá hạn',     count: deadlineSummary.overdue,   bg: 'bg-red-50 border-red-200 text-red-800' },
                  { key: 'CRITICAL', label: 'Sắp đến hạn', count: deadlineSummary.critical,  bg: 'bg-orange-50 border-orange-200 text-orange-800' },
                  { key: 'WARNING',  label: 'Chú ý',       count: deadlineSummary.warning,   bg: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                  { key: 'UPCOMING', label: 'Sắp đến',     count: deadlineSummary.upcoming,  bg: 'bg-blue-50 border-blue-200 text-blue-800' },
                  { key: 'NOT_YET',  label: 'Chưa đến',    count: deadlineSummary.notYet,    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                ].map(item => (
                  <button key={item.key} onClick={() => setDeadlineStatusFilter(item.key)}
                    className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${item.bg} ${deadlineStatusFilter === item.key ? 'ring-2 ring-offset-1 ring-emerald-400' : ''}`}>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs mt-0.5">{item.label}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Select value={deadlineStatusFilter} onValueChange={v => { setDeadlineStatusFilter(v); setDeadlinePage(1); }}>
                <SelectTrigger className="w-[180px] border-slate-200"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="OVERDUE">Quá hạn</SelectItem>
                  <SelectItem value="CRITICAL">Sắp đến hạn</SelectItem>
                  <SelectItem value="WARNING">Chú ý</SelectItem>
                  <SelectItem value="UPCOMING">Sắp đến</SelectItem>
                  <SelectItem value="NOT_YET">Chưa đến hạn</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchDeadlines} className="border-slate-200"><RefreshCw className="h-4 w-4 mr-1.5" />Làm mới</Button>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                {deadlineLoading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : deadlines.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Không có dữ liệu hạn thăng quân hàm</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Quân nhân</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                        <TableHead className="text-slate-600 font-semibold">QH hiện tại</TableHead>
                        <TableHead className="text-slate-600 font-semibold">QH tiếp theo</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Ngày đủ ĐK</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Thời gian còn lại</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deadlines.map(item => {
                        const sc = DEADLINE_STATUS[item.status] || DEADLINE_STATUS.NO_DATA;
                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50">
                            <TableCell>
                              <div><p className="font-semibold text-slate-800 text-sm">{item.fullName}</p><p className="text-xs text-slate-400 font-mono">{item.personnelCode}</p></div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">{item.unit || '-'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${rankBadge(item.currentRank)}`}>{item.currentRankLabel || item.currentRank || '-'}</span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-700">{item.nextRankLabel || item.nextRank || '-'}</TableCell>
                            <TableCell className="text-sm text-slate-600">{fmt(item.eligibilityDate)}</TableCell>
                            <TableCell>
                              <span className={`text-sm font-medium ${item.daysUntilEligible !== null && item.daysUntilEligible < 0 ? 'text-red-600' : item.daysUntilEligible !== null && item.daysUntilEligible < 90 ? 'text-orange-600' : 'text-slate-700'}`}>
                                {fmtDays(item.daysUntilEligible)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>{sc.icon}{sc.label}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Trang {deadlinePage} / {deadlineTotalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={deadlinePage <= 1} onClick={() => setDeadlinePage(p => p - 1)} className="border-slate-200"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={deadlinePage >= deadlineTotalPages} onClick={() => setDeadlinePage(p => p + 1)} className="border-slate-200"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Sức khỏe ──────────────────────────────────────────────────── */}
          <TabsContent value="health" className="space-y-4 mt-4">
            {healthSummary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {HEALTH_CATEGORIES.map(cfg => {
                  const found = healthSummary.byCategory.find(c => c.category === cfg.value);
                  return (
                    <button key={cfg.value} onClick={() => setHealthCategoryFilter(cfg.value)}
                      className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${healthCategoryFilter === cfg.value ? 'ring-2 ring-emerald-400 ring-offset-1' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1"><div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} /><span className="text-xs text-slate-500">{cfg.value}</span></div>
                      <p className="text-2xl font-bold text-slate-800">{found?.count || 0}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                    </button>
                  );
                })}
                <button onClick={() => setShowUnchecked(v => !v)}
                  className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${showUnchecked ? 'ring-2 ring-slate-400 ring-offset-1 bg-slate-50' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /><span className="text-xs text-slate-500">Chưa KT</span></div>
                  <p className="text-2xl font-bold text-slate-800">{healthSummary.notChecked}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Chưa kiểm tra</p>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Tìm theo tên, mã..." value={healthSearch} onChange={e => { setHealthSearch(e.target.value); setHealthPage(1); }} className="pl-9 border-slate-200" />
              </div>
              <Select value={healthCategoryFilter} onValueChange={v => { setHealthCategoryFilter(v); setHealthPage(1); }}>
                <SelectTrigger className="w-[155px] border-slate-200"><SelectValue placeholder="Phân loại SK" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {HEALTH_CATEGORIES.map(cfg => <SelectItem key={cfg.value} value={cfg.value}>{cfg.value}</SelectItem>)}
                  <SelectItem value="NONE">Chưa kiểm tra</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">{healthTotal} quân nhân</span>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                {healthLoading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : healthRecords.length === 0 ? (
                  <div className="py-16 text-center text-slate-400"><HeartPulse className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Không có dữ liệu sức khỏe</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Quân nhân</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Quân hàm</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Loại QN</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Phân loại SK</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Lần KT gần nhất</TableHead>
                        <TableHead className="text-slate-600 font-semibold text-center w-20">Sửa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthRecords.map(rec => {
                        const healthCfg = HEALTH_CATEGORIES.find(c => c.value === rec.healthCategory);
                        const daysAgo = daysSince(rec.lastHealthCheckDate);
                        return (
                          <TableRow key={rec.id} className="hover:bg-slate-50">
                            <TableCell>
                              <div><p className="font-semibold text-slate-800 text-sm">{rec.personnel.fullName}</p><p className="text-xs text-slate-400 font-mono">{rec.personnel.personnelCode}</p></div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">{rec.personnel.unit?.name || '-'}</TableCell>
                            <TableCell className="text-sm text-slate-700">{SOLDIER_RANK_LABELS[rec.currentRank || ''] || rec.currentRank || '-'}</TableCell>
                            <TableCell>
                              {rec.soldierCategory && SOLDIER_CATEGORY_LABELS[rec.soldierCategory]
                                ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOLDIER_CATEGORY_LABELS[rec.soldierCategory].color}`}>{SOLDIER_CATEGORY_LABELS[rec.soldierCategory].label}</span>
                                : <span className="text-slate-400 text-sm">-</span>}
                            </TableCell>
                            <TableCell>
                              {healthCfg
                                ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${healthCfg.badgeColor}`}><span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dotColor}`} />{healthCfg.value}</span>
                                : <span className="text-slate-400 text-xs italic">Chưa phân loại</span>}
                            </TableCell>
                            <TableCell>
                              {rec.lastHealthCheckDate
                                ? <div><p className="text-sm">{fmt(rec.lastHealthCheckDate)}</p>{daysAgo !== null && <p className={`text-xs ${daysAgo > 365 ? 'text-red-500' : daysAgo > 180 ? 'text-amber-500' : 'text-slate-400'}`}>{daysAgo} ngày trước</p>}</div>
                                : <span className="text-xs text-red-400 font-medium">Chưa kiểm tra</span>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => { setHealthForm({ healthCategory: rec.healthCategory ?? '', healthNotes: rec.healthNotes ?? '', lastHealthCheckDate: rec.lastHealthCheckDate ? new Date(rec.lastHealthCheckDate).toISOString().split('T')[0] : '' }); setHealthDialog({ open: true, record: rec }); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Trang {healthPage} / {healthTotalPages} · {healthTotal} quân nhân</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={healthPage <= 1} onClick={() => setHealthPage(p => p - 1)} className="border-slate-200"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={healthPage >= healthTotalPages} onClick={() => setHealthPage(p => p + 1)} className="border-slate-200"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Trường hợp đặc biệt ───────────────────────────────────────── */}
          <TabsContent value="special-cases" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={showAllCases} onChange={e => setShowAllCases(e.target.checked)} className="rounded border-slate-300" />
                Hiển thị cả trường hợp không còn hiệu lực
              </label>
              <div className="ml-auto">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => { setScSelectedPersonnel(null); setScPersonnelQuery(''); setScPersonnelResults([]); setScForm({ soldierProfileId: '', caseType: '', title: '', description: '', reductionMonths: '', decisionNumber: '', decisionDate: '', issuedBy: '', notes: '', isActive: true }); setScDialog({ open: true, mode: 'create' }); }}>
                  <Plus className="h-4 w-4 mr-1.5" />Thêm trường hợp
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Trường hợp đặc biệt giúp rút ngắn thời gian đủ điều kiện thăng quân hàm theo quy định.</span>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                {specialCasesLoading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : specialCases.length === 0 ? (
                  <div className="py-16 text-center text-slate-400"><Activity className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Chưa có trường hợp đặc biệt nào</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Loại</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Tiêu đề</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Số tháng rút ngắn</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Số QĐ</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Trạng thái</TableHead>
                        <TableHead className="text-slate-600 font-semibold text-center w-20">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialCases.map(sc => (
                        <TableRow key={sc.id} className={`hover:bg-slate-50 ${!sc.isActive ? 'opacity-60' : ''}`}>
                          <TableCell>
                            <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                              {SPECIAL_CASE_TYPES.find(t => t.value === sc.caseType)?.label || sc.caseType}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-800">{sc.title}</TableCell>
                          <TableCell><span className="font-bold text-emerald-700">-{sc.reductionMonths}</span><span className="text-slate-500 text-xs ml-1">tháng</span></TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{sc.decisionNumber || '-'}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {sc.isActive ? 'Còn hiệu lực' : 'Hết hiệu lực'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => { setScForm({ soldierProfileId: sc.soldierProfileId ?? '', caseType: sc.caseType, title: sc.title, description: sc.description ?? '', reductionMonths: sc.reductionMonths.toString(), decisionNumber: sc.decisionNumber ?? '', decisionDate: sc.decisionDate ? new Date(sc.decisionDate).toISOString().split('T')[0] : '', issuedBy: sc.issuedBy ?? '', notes: sc.notes ?? '', isActive: sc.isActive }); setScDialog({ open: true, mode: 'edit', data: sc }); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-red-600 hover:bg-red-50"
                                onClick={async () => { if (!confirm('Xóa trường hợp đặc biệt này?')) return; await fetch(`/api/officer-career/special-cases/${sc.id}`, { method: 'DELETE' }); fetchAllSpecialCases(); fetchDeadlines(); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialog: Cập nhật sức khỏe ───────────────────────────────────────── */}
      <Dialog open={healthDialog.open} onOpenChange={open => !open && setHealthDialog({ open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-500" />Cập nhật sức khỏe</DialogTitle>
          </DialogHeader>
          {healthDialog.record && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-800">{healthDialog.record.personnel.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">{healthDialog.record.personnel.personnelCode} · {healthDialog.record.personnel.unit?.name}</p>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Phân loại sức khỏe</Label>
              <Select value={healthForm.healthCategory} onValueChange={v => setHealthForm(f => ({ ...f, healthCategory: v }))}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn phân loại" /></SelectTrigger>
                <SelectContent>
                  {HEALTH_CATEGORIES.map(cfg => (
                    <SelectItem key={cfg.value} value={cfg.value}>
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />{cfg.value} — {cfg.description}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ngày kiểm tra gần nhất</Label>
              <Input type="date" value={healthForm.lastHealthCheckDate} onChange={e => setHealthForm(f => ({ ...f, lastHealthCheckDate: e.target.value }))} className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea value={healthForm.healthNotes} onChange={e => setHealthForm(f => ({ ...f, healthNotes: e.target.value }))} placeholder="Tình trạng sức khỏe..." className="border-slate-200 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHealthDialog({ open: false })}>Hủy</Button>
            <Button onClick={saveHealth} disabled={healthSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {healthSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Thêm/sửa hồ sơ quân nhân ──────────────────────────────── */}
      <Dialog open={soldierDialog.open} onOpenChange={open => !open && setSoldierDialog({ open: false, mode: 'create' })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600" />{soldierDialog.mode === 'create' ? 'Thêm hồ sơ quân nhân' : 'Cập nhật hồ sơ quân nhân'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {soldierDialog.mode === 'create' && (
              <div className="space-y-1.5">
                <Label>Cán bộ / nhân sự <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Tìm theo tên, mã..."
                    value={selectedPersonnel ? `${selectedPersonnel.fullName} (${selectedPersonnel.personnelCode})` : personnelQuery}
                    onChange={e => { setPersonnelQuery(e.target.value); setSelectedPersonnel(null); }} className="pl-9 border-slate-200" />
                </div>
                {personnelSearching && <p className="text-xs text-slate-400">Đang tìm...</p>}
                {personnelResults.length > 0 && !selectedPersonnel && (
                  <div className="border border-slate-200 rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                    {personnelResults.map(p => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                        onClick={() => { setSelectedPersonnel(p); setPersonnelResults([]); setSoldierForm(f => ({ ...f, personnelId: p.id })); }}>
                        <span className="text-sm font-medium">{p.fullName}</span>
                        <span className="text-xs text-slate-400 font-mono">{p.personnelCode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số hiệu quân nhân</Label>
                <Input value={soldierForm.soldierIdNumber} onChange={e => setSoldierForm(f => ({ ...f, soldierIdNumber: e.target.value }))} placeholder="Số hiệu..." className="border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label>Loại quân nhân</Label>
                <Select value={soldierForm.soldierCategory} onValueChange={v => setSoldierForm(f => ({ ...f, soldierCategory: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>{Object.entries(SOLDIER_CATEGORY_LABELS).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quân hàm hiện tại</Label>
                <Select value={soldierForm.currentRank} onValueChange={v => setSoldierForm(f => ({ ...f, currentRank: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent>{SOLDIER_RANKS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hình thức phục vụ</Label>
                <Select value={soldierForm.serviceType} onValueChange={v => setSoldierForm(f => ({ ...f, serviceType: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn hình thức" /></SelectTrigger>
                  <SelectContent>{Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ngày nhập ngũ</Label>
                <Input type="date" value={soldierForm.enlistmentDate} onChange={e => setSoldierForm(f => ({ ...f, enlistmentDate: e.target.value }))} className="border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày XN dự kiến</Label>
                <Input type="date" value={soldierForm.expectedDischargeDate} onChange={e => setSoldierForm(f => ({ ...f, expectedDischargeDate: e.target.value }))} className="border-slate-200" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoldierDialog({ open: false, mode: 'create' })}>Hủy</Button>
            <Button onClick={saveSoldier} disabled={soldierSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {soldierSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{soldierDialog.mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Thêm bản ghi binh vụ ──────────────────────────────────── */}
      <Dialog open={serviceDialog.open} onOpenChange={open => !open && setServiceDialog({ open: false })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-emerald-600" />Thêm bản ghi binh vụ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Quân nhân <span className="text-red-500">*</span></Label>
              {srSelectedSoldier ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
                  <span className="text-sm font-medium text-emerald-900">{srSelectedSoldier.fullName} <span className="text-emerald-600 font-mono text-xs">({srSelectedSoldier.personnelCode})</span></span>
                  <button className="text-xs text-slate-400 hover:text-red-500" onClick={() => { setSrSelectedSoldier(null); setSrPersonnelQuery(''); }}>✕</button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Tìm quân nhân..." value={srPersonnelQuery} onChange={e => setSrPersonnelQuery(e.target.value)} className="pl-9 border-slate-200" />
                  </div>
                  {srPersonnelSearching && <p className="text-xs text-slate-400">Đang tìm...</p>}
                  {srPersonnelResults.length > 0 && (
                    <div className="border border-slate-200 rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                      {srPersonnelResults.map(p => (
                        <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                          onClick={() => { setSrSelectedSoldier({ _profileId: p._profileId, fullName: p.fullName, personnelCode: p.personnelCode }); setSrPersonnelResults([]); }}>
                          <span className="text-sm font-medium">{p.fullName}</span>
                          <span className="text-xs text-slate-400 font-mono">{p.personnelCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loại sự kiện <span className="text-red-500">*</span></Label>
                <Select value={serviceForm.eventType} onValueChange={v => setServiceForm(f => ({ ...f, eventType: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn sự kiện" /></SelectTrigger>
                  <SelectContent>{SERVICE_EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ngày <span className="text-red-500">*</span></Label>
                <Input type="date" value={serviceForm.eventDate} onChange={e => setServiceForm(f => ({ ...f, eventDate: e.target.value }))} className="border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label>Quân hàm cũ</Label>
                <Select value={serviceForm.previousRank} onValueChange={v => setServiceForm(f => ({ ...f, previousRank: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{SOLDIER_RANKS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quân hàm mới</Label>
                <Select value={serviceForm.newRank} onValueChange={v => setServiceForm(f => ({ ...f, newRank: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{SOLDIER_RANKS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Số quyết định</Label>
              <Input value={serviceForm.decisionNumber} onChange={e => setServiceForm(f => ({ ...f, decisionNumber: e.target.value }))} placeholder="Số QĐ..." className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung</Label>
              <Textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả sự kiện..." className="border-slate-200 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog({ open: false })}>Hủy</Button>
            <Button onClick={saveServiceRecord} disabled={serviceSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {serviceSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Trường hợp đặc biệt ──────────────────────────────────── */}
      <Dialog open={scDialog.open} onOpenChange={open => !open && setScDialog({ open: false, mode: 'create' })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowUpCircle className="h-5 w-5 text-purple-600" />{scDialog.mode === 'create' ? 'Thêm trường hợp đặc biệt' : 'Cập nhật trường hợp đặc biệt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {scDialog.mode === 'create' && (
              <div className="space-y-1.5">
                <Label>Quân nhân</Label>
                {scSelectedPersonnel ? (
                  <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-md">
                    <span className="text-sm font-medium text-purple-900">{scSelectedPersonnel.fullName}</span>
                    <button className="text-xs text-slate-400 hover:text-red-500" onClick={() => { setScSelectedPersonnel(null); setScPersonnelQuery(''); }}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Tìm quân nhân..." value={scPersonnelQuery} onChange={e => setScPersonnelQuery(e.target.value)} className="pl-9 border-slate-200" />
                    </div>
                    {scPersonnelSearching && <p className="text-xs text-slate-400">Đang tìm...</p>}
                    {scPersonnelResults.length > 0 && (
                      <div className="border border-slate-200 rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                        {scPersonnelResults.map(p => (
                          <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                            onClick={() => { setScSelectedPersonnel(p); setScPersonnelResults([]); }}>
                            <span className="text-sm font-medium">{p.fullName}</span>
                            <span className="text-xs text-slate-400 font-mono">{p.personnelCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loại trường hợp <span className="text-red-500">*</span></Label>
                <Select value={scForm.caseType} onValueChange={v => setScForm(f => ({ ...f, caseType: v }))}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>{SPECIAL_CASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Số tháng rút ngắn <span className="text-red-500">*</span></Label>
                <Input type="number" min={1} max={24} value={scForm.reductionMonths} onChange={e => setScForm(f => ({ ...f, reductionMonths: e.target.value }))} placeholder="VD: 6" className="border-slate-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Input value={scForm.title} onChange={e => setScForm(f => ({ ...f, title: e.target.value }))} placeholder="Mô tả ngắn gọn..." className="border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số quyết định</Label>
                <Input value={scForm.decisionNumber} onChange={e => setScForm(f => ({ ...f, decisionNumber: e.target.value }))} className="border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày quyết định</Label>
                <Input type="date" value={scForm.decisionDate} onChange={e => setScForm(f => ({ ...f, decisionDate: e.target.value }))} className="border-slate-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cơ quan ban hành</Label>
              <Input value={scForm.issuedBy} onChange={e => setScForm(f => ({ ...f, issuedBy: e.target.value }))} placeholder="Tên cơ quan..." className="border-slate-200" />
            </div>
            {scDialog.mode === 'edit' && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={scForm.isActive} onChange={e => setScForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded border-slate-300" />
                Còn hiệu lực
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScDialog({ open: false, mode: 'create' })}>Hủy</Button>
            <Button onClick={saveSpecialCase} disabled={scSaving} className="bg-purple-700 hover:bg-purple-800 text-white">
              {scSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{scDialog.mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
