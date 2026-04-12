/**
 * CSDL Cán bộ - Ban Cán bộ quản lý
 * Quản lý sĩ quan, lịch sử thăng cấp, bổ nhiệm, và hạn thăng quân hàm
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  RefreshCw,
  Star,
  TrendingUp,
  Award,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  Shield,
  UserPlus,
  Loader2,
  X,
  ArrowUpCircle,
  CalendarCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMasterData } from '@/hooks/use-master-data';

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];

const PROMOTION_TYPES: { value: string; label: string; color: string }[] = [
  { value: 'THANG_CAP',   label: 'Thăng cấp',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'BO_NHIEM',    label: 'Bổ nhiệm',      color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'DIEU_DONG',   label: 'Điều động',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'LUAN_CHUYEN', label: 'Luân chuyển',   color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'GIANG_CHUC',  label: 'Giáng chức',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'CACH_CHUC',   label: 'Cách chức',     color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'NGHI_HUU',    label: 'Nghỉ hưu',      color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'XUAT_NGU',    label: 'Xuất ngũ',      color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const PROMOTION_TYPE_MAP = Object.fromEntries(
  PROMOTION_TYPES.map(t => [t.value, t]),
);

const HEALTH_CATEGORIES_CONFIG: Array<{
  value: string;
  label: string;
  description: string;
  badgeColor: string;
  cardBg: string;
  cardText: string;
  dotColor: string;
}> = [
  {
    value:       'Loại 1',
    label:       'Loại 1',
    description: 'Sức khỏe tốt — đủ điều kiện toàn diện',
    badgeColor:  'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardBg:      'bg-gradient-to-br from-emerald-500 to-emerald-700',
    cardText:    'text-emerald-100',
    dotColor:    'bg-emerald-500',
  },
  {
    value:       'Loại 2',
    label:       'Loại 2',
    description: 'Sức khỏe khá — đủ tiêu chuẩn công tác',
    badgeColor:  'bg-blue-100 text-blue-800 border-blue-300',
    cardBg:      'bg-gradient-to-br from-blue-500 to-blue-700',
    cardText:    'text-blue-100',
    dotColor:    'bg-blue-500',
  },
  {
    value:       'Loại 3',
    label:       'Loại 3',
    description: 'Sức khỏe trung bình — cần theo dõi',
    badgeColor:  'bg-amber-100 text-amber-800 border-amber-300',
    cardBg:      'bg-gradient-to-br from-amber-500 to-amber-700',
    cardText:    'text-amber-100',
    dotColor:    'bg-amber-500',
  },
  {
    value:       'Loại 4',
    label:       'Loại 4',
    description: 'Sức khỏe yếu — cần điều trị',
    badgeColor:  'bg-red-100 text-red-800 border-red-300',
    cardBg:      'bg-gradient-to-br from-red-500 to-red-700',
    cardText:    'text-red-100',
    dotColor:    'bg-red-500',
  },
];

const HEALTH_CAT_MAP = Object.fromEntries(HEALTH_CATEGORIES_CONFIG.map(c => [c.value, c]));

const SPECIAL_CASE_TYPES = [
  { value: 'CHIEN_SI_THI_DUA_TOAN_QUAN', label: 'Chiến sĩ thi đua toàn quân' },
  { value: 'TIEN_SI',                    label: 'Tiến sĩ' },
  { value: 'THANH_TICH_DAC_BIET',        label: 'Thành tích đặc biệt' },
  { value: 'NGHI_QUYET_CAP_TREN',        label: 'Theo nghị quyết cấp trên' },
  { value: 'KHAC',                        label: 'Khác' },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  OVERDUE:  { label: 'Quá hạn',       color: 'bg-red-100 text-red-800 border-red-300',          icon: <AlertCircle className="h-3 w-3" /> },
  CRITICAL: { label: 'Sắp đến hạn',   color: 'bg-orange-100 text-orange-800 border-orange-300', icon: <AlertTriangle className="h-3 w-3" /> },
  WARNING:  { label: 'Chú ý',         color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
  UPCOMING: { label: 'Sắp đến',       color: 'bg-blue-100 text-blue-800 border-blue-300',       icon: <Info className="h-3 w-3" /> },
  NOT_YET:  { label: 'Chưa đến hạn',  color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  MAX_RANK: { label: 'Cấp cao nhất',  color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Star className="h-3 w-3" /> },
  NO_DATA:  { label: 'Thiếu dữ liệu', color: 'bg-gray-100 text-gray-600 border-gray-300',       icon: <Info className="h-3 w-3" /> },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonnelOption {
  id: string;
  fullName: string;
  personnelCode: string;
  militaryRank: string | null;
  unit: { name: string } | null;
}

interface OfficerCareer {
  id: string;
  officerIdNumber: string | null;
  currentRank: string | null;
  currentPosition: string | null;
  commissionedDate: string | null;
  personnel: {
    id: string;
    personnelCode: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    militaryRank: string | null;
    position: string | null;
    unit: { id: string; name: string; code: string } | null;
  };
  promotions: Array<{
    id: string;
    promotionType: string;
    effectiveDate: string;
    newRank: string | null;
    newPosition: string | null;
  }>;
}

interface Stats {
  total: number;
  byRank: Array<{ rank: string; count: number }>;
  byUnit: Array<{ name: string; count: number }>;
  recentPromotions: Array<{
    id: string;
    officerName: string;
    promotionType: string;
    effectiveDate: string;
    newRank: string;
    newPosition: string;
  }>;
  health?: {
    byCategory: Array<{ healthCategory: string; count: number }>;
    byRankGroup: Array<Record<string, string | number>>;
    needsFollowUp: number;
    checkedCount: number;
    recentChecks: Array<{ currentRank: string | null; healthCategory: string | null; lastHealthCheckDate: string | null }>;
  };
}

interface OfficerHealthRecord {
  id: string;
  currentRank: string | null;
  currentPosition: string | null;
  healthCategory: string | null;
  healthNotes: string | null;
  lastHealthCheckDate: string | null;
  personnel: {
    id: string;
    fullName: string;
    personnelCode: string;
    dateOfBirth: string | null;
    gender: string | null;
    unit: { id: string; name: string } | null;
  };
}

interface HealthSummary {
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  notChecked: number;
}

interface DeadlineItem {
  id: string;
  personnelId: string;
  personnelCode: string;
  fullName: string;
  unit: string | null;
  rankType: 'OFFICER' | 'SOLDIER';
  currentRank: string | null;
  currentRankLabel: string | null;
  nextRank: string | null;
  nextRankLabel: string | null;
  standardMonths: number | null;
  totalReductionMonths: number;
  effectiveMonths: number | null;
  lastRankDate: string | null;
  eligibilityDate: string | null;
  daysUntilEligible: number | null;
  status: string;
  ageWarning: boolean;
  specialCaseCount: number;
}

interface DeadlineSummary {
  total: number;
  overdue: number;
  critical: number;
  warning: number;
  upcoming: number;
  notYet: number;
  ageWarnings: number;
}

interface OfficerPromotion {
  id: string;
  officerCareerId: string;
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
  officerCareer: {
    personnel: {
      id: string;
      fullName: string;
      personnelCode: string;
      unit: { id: string; name: string } | null;
    };
  };
}

interface SpecialCase {
  id: string;
  officerCareerId: string | null;
  soldierProfileId: string | null;
  caseType: string;
  caseTypeLabel: string;
  title: string;
  description: string | null;
  reductionMonths: number;
  decisionNumber: string | null;
  decisionDate: string | null;
  issuedBy: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OfficerManagementPage() {
  const router = useRouter();

  // Master data — ranks from MDM
  const { items: rankItems } = useMasterData('MD_RANK');
  const ranks = rankItems;
  const rankLabelMap = useMemo(
    () => Object.fromEntries(rankItems.map(r => [r.code, r.nameVi])),
    [rankItems]
  );

  // Officers list
  const [officers, setOfficers] = useState<OfficerCareer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Deadlines tab
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [deadlineSummary, setDeadlineSummary] = useState<DeadlineSummary | null>(null);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineTypeFilter, setDeadlineTypeFilter] = useState('ALL');
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState('ALL');
  const [deadlinePage, setDeadlinePage] = useState(1);
  const [deadlineTotalPages, setDeadlineTotalPages] = useState(1);

  // ── Health tab ───────────────────────────────────────────────────────────────
  const [healthRecords, setHealthRecords] = useState<OfficerHealthRecord[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthSearch, setHealthSearch] = useState('');
  const [healthCategoryFilter, setHealthCategoryFilter] = useState('ALL');
  const [healthPage, setHealthPage] = useState(1);
  const [healthTotalPages, setHealthTotalPages] = useState(1);
  const [healthTotal, setHealthTotal] = useState(0);
  const [showUnchecked, setShowUnchecked] = useState(false);

  const [healthDialog, setHealthDialog] = useState<{
    open: boolean;
    record?: OfficerHealthRecord;
  }>({ open: false });

  const [healthForm, setHealthForm] = useState({
    healthCategory:      '',
    healthNotes:         '',
    lastHealthCheckDate: '',
  });
  const [healthSaving, setHealthSaving] = useState(false);

  // Special cases
  const [specialCases, setSpecialCases] = useState<SpecialCase[]>([]);
  const [specialCasesLoading, setSpecialCasesLoading] = useState(false);
  const [showAllCases, setShowAllCases] = useState(false);

  // ── Promotions tab ──────────────────────────────────────────────────────────

  const [promotions, setPromotions] = useState<OfficerPromotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionSearch, setPromotionSearch] = useState('');
  const [promotionTypeFilter, setPromotionTypeFilter] = useState('ALL');
  const [promotionPage, setPromotionPage] = useState(1);
  const [promotionTotalPages, setPromotionTotalPages] = useState(1);
  const [promotionTotal, setPromotionTotal] = useState(0);

  const [promotionDialog, setPromotionDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: OfficerPromotion;
  }>({ open: false, mode: 'create' });

  const [promotionForm, setPromotionForm] = useState({
    officerCareerId: '',
    promotionType: '',
    effectiveDate: '',
    decisionNumber: '',
    decisionDate: '',
    previousRank: '',
    newRank: '',
    previousPosition: '',
    newPosition: '',
    reason: '',
    notes: '',
  });
  const [promotionSaving, setPromotionSaving] = useState(false);

  // Personnel search for promotion dialog
  const [promoPersonnelQuery, setPromoPersonnelQuery] = useState('');
  const [promoPersonnelResults, setPromoPersonnelResults] = useState<Array<PersonnelOption & { _careerId: string }>>([]);
  const [promoPersonnelSearching, setPromoPersonnelSearching] = useState(false);
  const [promoSelectedOfficer, setPromoSelectedOfficer] = useState<{ _careerId: string; fullName: string; personnelCode: string } | null>(null);

  // ── Officer CRUD dialog ──────────────────────────────────────────────────────

  const [officerDialog, setOfficerDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: OfficerCareer;
  }>({ open: false, mode: 'create' });

  const [officerForm, setOfficerForm] = useState({
    personnelId: '',
    officerIdNumber: '',
    currentRank: '',
    currentPosition: '',
    commissionedDate: '',
    lastEvaluationResult: '',
  });
  const [officerSaving, setOfficerSaving] = useState(false);

  // Personnel autocomplete for create dialog
  const [personnelQuery, setPersonnelQuery] = useState('');
  const [personnelResults, setPersonnelResults] = useState<PersonnelOption[]>([]);
  const [personnelSearching, setPersonnelSearching] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelOption | null>(null);

  // Special case dialog
  const [scDialog, setScDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: SpecialCase }>({
    open: false, mode: 'create',
  });
  const [scForm, setScForm] = useState({
    officerCareerId: '',
    soldierProfileId: '',
    caseType: '',
    title: '',
    description: '',
    reductionMonths: '',
    decisionNumber: '',
    decisionDate: '',
    issuedBy: '',
    notes: '',
    isActive: true,
  });
  const [scSaving, setScSaving] = useState(false);

  // Personnel search for special cases
  const [scPersonnelQuery, setScPersonnelQuery] = useState('');
  const [scPersonnelResults, setScPersonnelResults] = useState<PersonnelOption[]>([]);
  const [scPersonnelSearching, setScPersonnelSearching] = useState(false);
  const [scSelectedPersonnel, setScSelectedPersonnel] = useState<PersonnelOption | null>(null);

  // ── Fetch officers ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (rankFilter && rankFilter !== 'all') params.set('rank', rankFilter);

      const [officersRes, statsRes] = await Promise.all([
        fetch(`/api/officer-career?${params}`),
        fetch('/api/officer-career/stats'),
      ]);

      const officersData = await officersRes.json();
      const statsData = await statsRes.json();

      if (officersData.success) {
        setOfficers(officersData.data);
        setTotalPages(officersData.pagination.totalPages);
        setTotalOfficers(officersData.pagination.total);
      }
      if (statsData.success) setStats(statsData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, rankFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch deadlines ──────────────────────────────────────────────────────────

  const fetchDeadlines = useCallback(async () => {
    setDeadlineLoading(true);
    try {
      const params = new URLSearchParams({
        type: deadlineTypeFilter,
        status: deadlineStatusFilter,
        page: deadlinePage.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/officer-career/promotion-deadlines?${params}`);
      const data = await res.json();
      if (data.success) {
        setDeadlines(data.data);
        setDeadlineSummary(data.summary);
        setDeadlineTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeadlineLoading(false);
    }
  }, [deadlineTypeFilter, deadlineStatusFilter, deadlinePage]);

  useEffect(() => {
    if (activeTab === 'deadlines') fetchDeadlines();
  }, [activeTab, fetchDeadlines]);

  // ── Fetch all special cases ──────────────────────────────────────────────────

  const fetchAllSpecialCases = useCallback(async () => {
    setSpecialCasesLoading(true);
    try {
      const res = await fetch(
        `/api/officer-career/special-cases?activeOnly=${!showAllCases}`,
      );
      const data = await res.json();
      if (data.success) setSpecialCases(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSpecialCasesLoading(false);
    }
  }, [showAllCases]);

  useEffect(() => {
    if (activeTab === 'special-cases') fetchAllSpecialCases();
  }, [activeTab, fetchAllSpecialCases]);

  // ── Fetch & CRUD promotions ───────────────────────────────────────────────────

  const fetchPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    try {
      const params = new URLSearchParams({
        page:  promotionPage.toString(),
        limit: '20',
      });
      if (promotionSearch) params.set('search', promotionSearch);
      if (promotionTypeFilter !== 'ALL') params.set('promotionType', promotionTypeFilter);

      const res = await fetch(`/api/officer-career/promotions?${params}`);
      const data = await res.json();
      if (data.success) {
        setPromotions(data.data);
        setPromotionTotalPages(data.pagination.totalPages);
        setPromotionTotal(data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPromotionsLoading(false);
    }
  }, [promotionPage, promotionSearch, promotionTypeFilter]);

  useEffect(() => {
    if (activeTab === 'promotions') fetchPromotions();
  }, [activeTab, fetchPromotions]);

  const searchOfficersForPromo = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setPromoPersonnelResults([]); return; }
    setPromoPersonnelSearching(true);
    try {
      const res = await fetch(`/api/officer-career?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.success) {
        setPromoPersonnelResults(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.data as OfficerCareer[]).map((o) => ({
            id:            o.personnel?.id ?? '',
            fullName:      o.personnel?.fullName ?? '',
            personnelCode: o.personnel?.personnelCode ?? '',
            militaryRank:  o.personnel?.militaryRank ?? null,
            unit:          o.personnel?.unit ?? null,
            _careerId:     o.id,
          })),
        );
      }
    } catch {
      setPromoPersonnelResults([]);
    } finally {
      setPromoPersonnelSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchOfficersForPromo(promoPersonnelQuery), 300);
    return () => clearTimeout(t);
  }, [promoPersonnelQuery, searchOfficersForPromo]);

  const openCreatePromotionDialog = () => {
    setPromoSelectedOfficer(null);
    setPromoPersonnelQuery('');
    setPromoPersonnelResults([]);
    setPromotionForm({
      officerCareerId: '', promotionType: '', effectiveDate: '',
      decisionNumber: '', decisionDate: '', previousRank: '', newRank: '',
      previousPosition: '', newPosition: '', reason: '', notes: '',
    });
    setPromotionDialog({ open: true, mode: 'create' });
  };

  const openEditPromotionDialog = (p: OfficerPromotion) => {
    setPromoSelectedOfficer({
      _careerId:     p.officerCareerId,
      fullName:      p.officerCareer.personnel.fullName,
      personnelCode: p.officerCareer.personnel.personnelCode,
    });
    setPromotionForm({
      officerCareerId:  p.officerCareerId,
      promotionType:    p.promotionType,
      effectiveDate:    p.effectiveDate ? p.effectiveDate.split('T')[0] : '',
      decisionNumber:   p.decisionNumber   ?? '',
      decisionDate:     p.decisionDate     ? p.decisionDate.split('T')[0] : '',
      previousRank:     p.previousRank     ?? '',
      newRank:          p.newRank          ?? '',
      previousPosition: p.previousPosition ?? '',
      newPosition:      p.newPosition      ?? '',
      reason:           p.reason           ?? '',
      notes:            p.notes            ?? '',
    });
    setPromotionDialog({ open: true, mode: 'edit', data: p });
  };

  const savePromotion = async () => {
    setPromotionSaving(true);
    try {
      const isEdit = promotionDialog.mode === 'edit' && promotionDialog.data;
      const careerId = isEdit
        ? promotionDialog.data!.officerCareerId
        : (promoSelectedOfficer?._careerId ?? promotionForm.officerCareerId);

      if (!careerId) { alert('Vui lòng chọn sĩ quan'); return; }
      if (!promotionForm.promotionType) { alert('Vui lòng chọn loại quyết định'); return; }
      if (!promotionForm.effectiveDate) { alert('Vui lòng nhập ngày hiệu lực'); return; }

      const payload = {
        officerCareerId:  careerId,
        promotionType:    promotionForm.promotionType,
        effectiveDate:    promotionForm.effectiveDate,
        decisionNumber:   promotionForm.decisionNumber   || null,
        decisionDate:     promotionForm.decisionDate     || null,
        previousRank:     (promotionForm.previousRank && promotionForm.previousRank !== 'none') ? promotionForm.previousRank : null,
        newRank:          (promotionForm.newRank && promotionForm.newRank !== 'none')           ? promotionForm.newRank      : null,
        previousPosition: promotionForm.previousPosition || null,
        newPosition:      promotionForm.newPosition      || null,
        reason:           promotionForm.reason           || null,
        notes:            promotionForm.notes            || null,
      };

      const url    = isEdit ? `/api/officer-career/promotions/${promotionDialog.data!.id}` : '/api/officer-career/promotions';
      const method = isEdit ? 'PATCH' : 'POST';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.success || data.data) {
        setPromotionDialog({ open: false, mode: 'create' });
        fetchPromotions();
        // Refresh stats so overview updates
        fetchData();
      } else {
        alert(data.error || 'Lỗi khi lưu');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi');
    } finally {
      setPromotionSaving(false);
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm('Xóa quyết định này? Thao tác không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/officer-career/promotions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPromotions();
        fetchData();
      } else {
        alert(data.error || 'Lỗi khi xóa');
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa');
    }
  };

  // ── Health fetch & CRUD ───────────────────────────────────────────────────────

  const fetchHealthRecords = useCallback(async () => {
    setHealthLoading(true);
    try {
      const params = new URLSearchParams({
        page:  healthPage.toString(),
        limit: '20',
      });
      if (healthSearch) params.set('search', healthSearch);
      if (healthCategoryFilter !== 'ALL') params.set('healthCategory', healthCategoryFilter);
      if (showUnchecked) params.set('needsCheck', 'true');

      const res = await fetch(`/api/officer-career/health?${params}`);
      const data = await res.json();
      if (data.success) {
        setHealthRecords(data.data);
        setHealthSummary(data.summary);
        setHealthTotalPages(data.pagination.totalPages);
        setHealthTotal(data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHealthLoading(false);
    }
  }, [healthPage, healthSearch, healthCategoryFilter, showUnchecked]);

  useEffect(() => {
    if (activeTab === 'health') fetchHealthRecords();
  }, [activeTab, fetchHealthRecords]);

  const openHealthDialog = (record: OfficerHealthRecord) => {
    setHealthForm({
      healthCategory:      record.healthCategory      ?? '',
      healthNotes:         record.healthNotes          ?? '',
      lastHealthCheckDate: record.lastHealthCheckDate
        ? record.lastHealthCheckDate.split('T')[0]
        : '',
    });
    setHealthDialog({ open: true, record });
  };

  const saveHealth = async () => {
    if (!healthDialog.record) return;
    setHealthSaving(true);
    try {
      const res = await fetch(`/api/officer-career/${healthDialog.record.id}/health`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthCategory:      healthForm.healthCategory      || null,
          healthNotes:         healthForm.healthNotes          || null,
          lastHealthCheckDate: healthForm.lastHealthCheckDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHealthDialog({ open: false });
        fetchHealthRecords();
      } else {
        alert(data.error || 'Lỗi khi lưu');
      }
    } catch {
      alert('Đã xảy ra lỗi');
    } finally {
      setHealthSaving(false);
    }
  };

  const daysSinceCheck = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // ── Personnel search ─────────────────────────────────────────────────────────

  const searchPersonnel = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setPersonnelResults([]); return; }
    setPersonnelSearching(true);
    try {
      const res = await fetch(`/api/personnel?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.success) setPersonnelResults(data.data || []);
    } catch {
      setPersonnelResults([]);
    } finally {
      setPersonnelSearching(false);
    }
  }, []);

  const searchPersonnelForSc = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setScPersonnelResults([]); return; }
    setScPersonnelSearching(true);
    try {
      const res = await fetch(`/api/personnel?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.success) setScPersonnelResults(data.data || []);
    } catch {
      setScPersonnelResults([]);
    } finally {
      setScPersonnelSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPersonnel(personnelQuery), 300);
    return () => clearTimeout(t);
  }, [personnelQuery, searchPersonnel]);

  useEffect(() => {
    const t = setTimeout(() => searchPersonnelForSc(scPersonnelQuery), 300);
    return () => clearTimeout(t);
  }, [scPersonnelQuery, searchPersonnelForSc]);

  // ── Officer CRUD ─────────────────────────────────────────────────────────────

  const openCreateOfficerDialog = () => {
    setSelectedPersonnel(null);
    setPersonnelQuery('');
    setPersonnelResults([]);
    setOfficerForm({ personnelId: '', officerIdNumber: '', currentRank: '', currentPosition: '', commissionedDate: '', lastEvaluationResult: '' });
    setOfficerDialog({ open: true, mode: 'create' });
  };

  const openEditOfficerDialog = (officer: OfficerCareer) => {
    setOfficerForm({
      personnelId: officer.personnel?.id || '',
      officerIdNumber: officer.officerIdNumber || '',
      currentRank: officer.currentRank || '',
      currentPosition: officer.currentPosition || '',
      commissionedDate: officer.commissionedDate ? officer.commissionedDate.split('T')[0] : '',
      lastEvaluationResult: '',
    });
    setOfficerDialog({ open: true, mode: 'edit', data: officer });
  };

  const saveOfficer = async () => {
    setOfficerSaving(true);
    try {
      const isEdit = officerDialog.mode === 'edit' && officerDialog.data;
      if (isEdit) {
        const res = await fetch(`/api/officer-career/${officerDialog.data!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentRank: officerForm.currentRank || undefined,
            currentPosition: officerForm.currentPosition || undefined,
            lastEvaluationResult: officerForm.lastEvaluationResult || undefined,
          }),
        });
        const data = await res.json();
        if (data.success || data.data) {
          setOfficerDialog({ open: false, mode: 'create' });
          fetchData();
        } else {
          alert(data.error || 'Lỗi khi cập nhật');
        }
      } else {
        if (!selectedPersonnel) { alert('Vui lòng chọn cán bộ'); return; }
        const res = await fetch('/api/officer-career', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personnelId: selectedPersonnel.id,
            officerIdNumber: officerForm.officerIdNumber || undefined,
            currentRank: officerForm.currentRank || undefined,
            currentPosition: officerForm.currentPosition || undefined,
            commissionedDate: officerForm.commissionedDate || undefined,
          }),
        });
        const data = await res.json();
        if (data.success || data.data) {
          setOfficerDialog({ open: false, mode: 'create' });
          fetchData();
        } else {
          alert(data.error || 'Lỗi khi tạo mới');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi');
    } finally {
      setOfficerSaving(false);
    }
  };

  const deleteOfficer = async (id: string, name: string) => {
    if (!confirm(`Xóa hồ sơ sĩ quan của "${name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`/api/officer-career/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Lỗi khi xóa');
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa');
    }
  };

  // ── Special case CRUD ────────────────────────────────────────────────────────

  const saveSpecialCase = async () => {
    setScSaving(true);
    try {
      const isEdit = scDialog.mode === 'edit' && scDialog.data;
      const url = isEdit
        ? `/api/officer-career/special-cases/${scDialog.data!.id}`
        : '/api/officer-career/special-cases';

      // Resolve personnelId → officerCareerId or soldierProfileId
      let resolvedOfficerCareerId = scForm.officerCareerId;
      if (!isEdit && scSelectedPersonnel) {
        // Find the officer career for this personnel
        const checkRes = await fetch(`/api/officer-career?search=${encodeURIComponent(scSelectedPersonnel.fullName)}&limit=100`);
        const checkData = await checkRes.json();
        if (checkData.success) {
          const match = checkData.data.find((o: OfficerCareer) => o.personnel?.id === scSelectedPersonnel.id);
          if (match) resolvedOfficerCareerId = match.id;
        }
      }

      const payload: Record<string, unknown> = {
        caseType: scForm.caseType,
        title: scForm.title,
        description: scForm.description || null,
        reductionMonths: parseInt(scForm.reductionMonths) || 1,
        decisionNumber: scForm.decisionNumber || null,
        decisionDate: scForm.decisionDate || null,
        issuedBy: scForm.issuedBy || null,
        notes: scForm.notes || null,
        ...(isEdit && { isActive: scForm.isActive }),
      };
      if (!isEdit) {
        payload.officerCareerId = resolvedOfficerCareerId || null;
        payload.soldierProfileId = scForm.soldierProfileId || null;
      }

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setScDialog({ open: false, mode: 'create' });
        fetchAllSpecialCases();
        fetchDeadlines();
      } else {
        alert(data.error || 'Lỗi khi lưu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScSaving(false);
    }
  };

  const deleteSpecialCase = async (id: string) => {
    if (!confirm('Xóa trường hợp đặc biệt này?')) return;
    await fetch(`/api/officer-career/special-cases/${id}`, { method: 'DELETE' });
    fetchAllSpecialCases();
    fetchDeadlines();
  };

  const openCreateScDialog = () => {
    setScSelectedPersonnel(null);
    setScPersonnelQuery('');
    setScPersonnelResults([]);
    setScForm({
      officerCareerId: '', soldierProfileId: '', caseType: '', title: '',
      description: '', reductionMonths: '', decisionNumber: '',
      decisionDate: '', issuedBy: '', notes: '', isActive: true,
    });
    setScDialog({ open: true, mode: 'create' });
  };

  const openEditScDialog = (sc: SpecialCase) => {
    setScForm({
      officerCareerId: sc.officerCareerId ?? '',
      soldierProfileId: sc.soldierProfileId ?? '',
      caseType: sc.caseType,
      title: sc.title,
      description: sc.description ?? '',
      reductionMonths: sc.reductionMonths.toString(),
      decisionNumber: sc.decisionNumber ?? '',
      decisionDate: sc.decisionDate ? sc.decisionDate.split('T')[0] : '',
      issuedBy: sc.issuedBy ?? '',
      notes: sc.notes ?? '',
      isActive: sc.isActive,
    });
    setScDialog({ open: true, mode: 'edit', data: sc });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const formatDays = (days: number | null) => {
    if (days === null) return '-';
    if (days < 0) return `Quá ${Math.abs(days)} ngày`;
    if (days === 0) return 'Hôm nay';
    return `Còn ${days} ngày`;
  };

  const getRankBadgeStyle = (rank: string) => {
    if (['DAI_TUONG', 'THUONG_TUONG', 'TRUNG_TUONG', 'THIEU_TUONG'].includes(rank))
      return 'bg-red-100 text-red-800 border border-red-200';
    if (['DAI_TA', 'THUONG_TA', 'TRUNG_TA', 'THIEU_TA'].includes(rank))
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 text-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg">
              <Shield className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">CSDL Cán bộ — Ban Cán bộ</h1>
              <p className="text-slate-300 text-sm mt-0.5">Hồ sơ sĩ quan · Thăng cấp · Bổ nhiệm · Hạn quân hàm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchData}
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:text-white hover:bg-white/10 border border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Làm mới
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold border-0 shadow"
              onClick={() => { setActiveTab('list'); openCreateOfficerDialog(); }}
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Thêm hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="promotions" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Thăng cấp / Bổ nhiệm
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="relative data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Hạn thăng quân hàm
              {deadlineSummary && (deadlineSummary.overdue + deadlineSummary.critical) > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">
                  {deadlineSummary.overdue + deadlineSummary.critical}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="health" className="relative data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Sức khỏe
              {stats?.health?.needsFollowUp ? (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">
                  {stats.health.needsFollowUp}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="special-cases" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
              Trường hợp đặc biệt
            </TabsTrigger>
          </TabsList>

          {/* ── Tổng quan ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">Tổng sĩ quan</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.total || 0}</div>
                      <p className="text-xs text-blue-200 mt-1">Hồ sơ đang quản lý</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-amber-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-amber-100">Cấp tá</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats?.byRank.filter(r => r.rank.includes('TA')).reduce((a, b) => a + b.count, 0) || 0}
                      </div>
                      <p className="text-xs text-amber-200 mt-1">Đại · Thượng · Trung · Thiếu tá</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-100">Cấp úy</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats?.byRank.filter(r => r.rank.includes('UY')).reduce((a, b) => a + b.count, 0) || 0}
                      </div>
                      <p className="text-xs text-emerald-200 mt-1">Đại · Thượng · Trung · Thiếu úy</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">Đơn vị</CardTitle>
                      <div className="p-1.5 bg-white/20 rounded-md">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.byUnit.length || 0}</div>
                      <p className="text-xs text-purple-200 mt-1">Đơn vị có sĩ quan</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-800">Phân bố theo cấp bậc</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.byRank.filter(r => r.rank !== 'Chưa xác định').slice(0, 6) || []}
                            cx="50%" cy="50%" labelLine={false}
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${rankLabelMap[name || ''] || name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={95} dataKey="count" nameKey="rank"
                          >
                            {stats?.byRank.slice(0, 6).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={RANK_COLORS[index % RANK_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, rankLabelMap[name as string] || name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-800">Top 10 đơn vị</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.byUnit.slice(0, 10) || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Bar dataKey="count" fill="#1d4ed8" name="Số sĩ quan" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Danh sách ─────────────────────────────────────────────────── */}
          <TabsContent value="list" className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên, mã cán bộ..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 border-slate-200"
                />
              </div>
              <Select value={rankFilter} onValueChange={(v) => { setRankFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] border-slate-200">
                  <SelectValue placeholder="Cấp bậc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                  {ranks.map(r => (
                    <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {totalOfficers > 0 && `${totalOfficers} hồ sơ`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Xuất danh sách"
                >
                  <FileDown className="h-4 w-4 mr-1.5" />
                  Xuất Excel
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={openCreateOfficerDialog}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm hồ sơ
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Mã CB</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Họ và tên</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Cấp bậc</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Chức vụ</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Số hiệu SQ</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-center w-28">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : officers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Không có dữ liệu</p>
                        </TableCell>
                      </TableRow>
                    ) : officers.map((officer) => {
                      const rank = officer.currentRank || '';
                      return (
                        <TableRow
                          key={officer.id}
                          className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                          onClick={() => router.push(`/dashboard/officer-management/${officer.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-slate-500">
                            {officer.personnel?.personnelCode || '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            {officer.personnel?.fullName}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankBadgeStyle(rank)}`}>
                              {rankLabelMap[rank] || officer.personnel?.militaryRank || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {officer.currentPosition || officer.personnel?.position || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {officer.personnel?.unit?.name || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {officer.officerIdNumber || '-'}
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                                title="Xem chi tiết"
                                onClick={() => router.push(`/dashboard/officer-management/${officer.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                title="Chỉnh sửa"
                                onClick={() => openEditOfficerDialog(officer)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Xóa"
                                onClick={() => deleteOfficer(officer.id, officer.personnel?.fullName || '')}
                              >
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trang <span className="font-medium text-slate-700">{page}</span> / {totalPages}
                {totalOfficers > 0 && ` · ${totalOfficers} hồ sơ`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)} className="border-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Thăng cấp / Bổ nhiệm ──────────────────────────────────────── */}
          <TabsContent value="promotions" className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên, mã cán bộ..."
                  value={promotionSearch}
                  onChange={(e) => { setPromotionSearch(e.target.value); setPromotionPage(1); }}
                  className="pl-9 border-slate-200"
                />
              </div>
              <Select value={promotionTypeFilter} onValueChange={(v) => { setPromotionTypeFilter(v); setPromotionPage(1); }}>
                <SelectTrigger className="w-[180px] border-slate-200">
                  <SelectValue placeholder="Loại quyết định" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  {PROMOTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchPromotions} className="border-slate-200">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Tải lại
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {promotionTotal > 0 && (
                  <span className="text-sm text-slate-500">{promotionTotal} quyết định</span>
                )}
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={openCreatePromotionDialog}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ghi nhận quyết định
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Sĩ quan</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Loại quyết định</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Số QĐ / Ngày QĐ</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Ngày hiệu lực</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Cấp bậc</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Chức vụ</TableHead>
                      <TableHead className="text-slate-600 font-semibold w-20 text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotionsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : promotions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                          <ArrowUpCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Chưa có quyết định nào được ghi nhận</p>
                          <p className="text-xs mt-1">Nhấn &ldquo;Ghi nhận quyết định&rdquo; để thêm mới</p>
                        </TableCell>
                      </TableRow>
                    ) : promotions.map((p) => {
                      const typeConf = PROMOTION_TYPE_MAP[p.promotionType];
                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/60">
                          <TableCell>
                            <div className="font-semibold text-slate-800">
                              {p.officerCareer.personnel.fullName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {p.officerCareer.personnel.personnelCode}
                              {p.officerCareer.personnel.unit && ` · ${p.officerCareer.personnel.unit.name}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeConf?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {typeConf?.label ?? p.promotionType}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <div className="font-mono">{p.decisionNumber || '-'}</div>
                            {p.decisionDate && (
                              <div className="text-xs text-slate-400">{formatDate(p.decisionDate)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                              <CalendarCheck className="h-3.5 w-3.5 text-blue-500" />
                              {formatDate(p.effectiveDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {(p.previousRank || p.newRank) ? (
                              <div className="flex items-center gap-1">
                                {p.previousRank && (
                                  <span className="text-slate-400 text-xs">{rankLabelMap[p.previousRank] || p.previousRank}</span>
                                )}
                                {p.previousRank && p.newRank && <span className="text-slate-300">→</span>}
                                {p.newRank && (
                                  <span className={`font-medium ${p.previousRank ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {rankLabelMap[p.newRank] || p.newRank}
                                  </span>
                                )}
                              </div>
                            ) : <span className="text-slate-400 text-xs">-</span>}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-[180px]">
                            {(p.previousPosition || p.newPosition) ? (
                              <div>
                                {p.previousPosition && (
                                  <div className="text-slate-400 text-xs truncate">{p.previousPosition}</div>
                                )}
                                {p.newPosition && (
                                  <div className={`truncate ${p.previousPosition ? 'text-blue-700 font-medium' : ''}`}>
                                    {p.newPosition}
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-slate-400 text-xs">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                title="Chỉnh sửa"
                                onClick={() => openEditPromotionDialog(p)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Xóa"
                                onClick={() => deletePromotion(p.id)}
                              >
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trang <span className="font-medium text-slate-700">{promotionPage}</span> / {promotionTotalPages}
                {promotionTotal > 0 && ` · ${promotionTotal} quyết định`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={promotionPage <= 1}
                  onClick={() => setPromotionPage(p => p - 1)} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={promotionPage >= promotionTotalPages}
                  onClick={() => setPromotionPage(p => p + 1)} className="border-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Hạn thăng quân hàm ────────────────────────────────────────── */}
          <TabsContent value="deadlines" className="space-y-4 mt-4">
            {deadlineSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Tổng',                    value: deadlineSummary.total,       color: 'text-slate-800',   bg: 'bg-white' },
                  { label: 'Quá hạn',                 value: deadlineSummary.overdue,     color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
                  { label: 'Sắp đến hạn (≤30 ngày)', value: deadlineSummary.critical,    color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
                  { label: 'Chú ý (≤90 ngày)',        value: deadlineSummary.warning,     color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200' },
                  { label: 'Sắp đến (≤180 ngày)',     value: deadlineSummary.upcoming,    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
                  { label: 'Chưa đến hạn',            value: deadlineSummary.notYet,      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { label: 'Cảnh báo tuổi',           value: deadlineSummary.ageWarnings, color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
                ].map((c) => (
                  <Card key={c.label} className={`text-center p-3 shadow-sm border ${c.bg}`}>
                    <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-tight">{c.label}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={deadlineTypeFilter} onValueChange={v => { setDeadlineTypeFilter(v); setDeadlinePage(1); }}>
                <SelectTrigger className="w-[150px] border-slate-200">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="OFFICER">Sĩ quan</SelectItem>
                  <SelectItem value="SOLDIER">Chiến sĩ / HSQ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deadlineStatusFilter} onValueChange={v => { setDeadlineStatusFilter(v); setDeadlinePage(1); }}>
                <SelectTrigger className="w-[200px] border-slate-200">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="OVERDUE">Quá hạn</SelectItem>
                  <SelectItem value="CRITICAL">Sắp đến hạn (≤30 ngày)</SelectItem>
                  <SelectItem value="WARNING">Chú ý (≤90 ngày)</SelectItem>
                  <SelectItem value="UPCOMING">Sắp đến (≤180 ngày)</SelectItem>
                  <SelectItem value="NOT_YET">Chưa đến hạn</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchDeadlines} className="border-slate-200">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Tải lại
              </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Họ tên</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Cấp bậc hiện tại</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Cấp bậc tiếp theo</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-center">Hạn (tháng)</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-center">Rút ngắn</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Ngày đủ hạn</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Còn lại</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadlineLoading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : deadlines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-16 text-slate-400">
                          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Không có dữ liệu</p>
                        </TableCell>
                      </TableRow>
                    ) : deadlines.map((d) => {
                      const sc = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.NO_DATA;
                      return (
                        <TableRow key={d.id} className={d.ageWarning ? 'bg-purple-50/60' : 'hover:bg-slate-50/60'}>
                          <TableCell>
                            <div className="font-semibold text-slate-800">{d.fullName}</div>
                            <div className="text-xs text-slate-400 font-mono">{d.personnelCode}</div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{d.unit ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                              {d.currentRankLabel ?? '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {d.nextRankLabel
                              ? <Badge className="text-xs bg-blue-100 text-blue-800 border border-blue-200">{d.nextRankLabel}</Badge>
                              : <span className="text-xs text-slate-400">-</span>}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-700">
                            {d.standardMonths ?? '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {d.totalReductionMonths > 0
                              ? <span className="text-emerald-700 font-semibold text-sm">-{d.totalReductionMonths}</span>
                              : <span className="text-slate-400 text-xs">0</span>}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            <div>{formatDate(d.eligibilityDate)}</div>
                            {d.ageWarning && (
                              <div className="text-xs text-purple-700 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="h-3 w-3" /> Vượt tuổi đề bạt
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-sm font-semibold ${
                            d.status === 'OVERDUE'  ? 'text-red-700'    :
                            d.status === 'CRITICAL' ? 'text-orange-700' :
                            d.status === 'WARNING'  ? 'text-yellow-700' : 'text-slate-500'
                          }`}>
                            {formatDays(d.daysUntilEligible)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${sc.color} border text-xs flex items-center gap-1 w-fit`}>
                              {sc.icon} {sc.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Trang {deadlinePage} / {deadlineTotalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={deadlinePage <= 1}
                  onClick={() => setDeadlinePage(p => p - 1)} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={deadlinePage >= deadlineTotalPages}
                  onClick={() => setDeadlinePage(p => p + 1)} className="border-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Sức khỏe ──────────────────────────────────────────────────── */}
          <TabsContent value="health" className="space-y-5 mt-4">

            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {HEALTH_CATEGORIES_CONFIG.map((cat) => {
                const count = healthSummary?.byCategory.find(b => b.category === cat.value)?.count ?? 0;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`rounded-xl p-4 text-left shadow-sm transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${cat.cardBg} text-white`}
                    onClick={() => {
                      setHealthCategoryFilter(cat.value);
                      setShowUnchecked(false);
                      setHealthPage(1);
                    }}
                  >
                    <div className="text-3xl font-bold">{count}</div>
                    <div className="text-sm font-semibold mt-1">{cat.label}</div>
                    <div className={`text-xs mt-0.5 ${cat.cardText} opacity-90 leading-tight`}>{cat.description}</div>
                  </button>
                );
              })}
              <button
                type="button"
                className="rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-slate-500 to-slate-700 text-white transition-all hover:shadow-md hover:scale-[1.02]"
                onClick={() => { setShowUnchecked(true); setHealthCategoryFilter('ALL'); setHealthPage(1); }}
              >
                <div className="text-3xl font-bold">{healthSummary?.notChecked ?? 0}</div>
                <div className="text-sm font-semibold mt-1">Chưa kiểm tra</div>
                <div className="text-xs mt-0.5 text-slate-200 opacity-90 leading-tight">Chưa có dữ liệu sức khỏe</div>
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên, mã cán bộ..."
                  value={healthSearch}
                  onChange={(e) => { setHealthSearch(e.target.value); setHealthPage(1); }}
                  className="pl-9 border-slate-200"
                />
              </div>
              <Select
                value={showUnchecked ? 'NONE' : healthCategoryFilter}
                onValueChange={(v) => {
                  if (v === 'NONE') { setShowUnchecked(true); setHealthCategoryFilter('ALL'); }
                  else { setShowUnchecked(false); setHealthCategoryFilter(v); }
                  setHealthPage(1);
                }}
              >
                <SelectTrigger className="w-[200px] border-slate-200">
                  <SelectValue placeholder="Lọc phân loại SK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả phân loại</SelectItem>
                  {HEALTH_CATEGORIES_CONFIG.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.dotColor}`} />
                        {c.label} — {c.description}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="NONE">Chưa kiểm tra</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchHealthRecords} className="border-slate-200">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Tải lại
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {healthTotal > 0 && (
                  <span className="text-sm text-slate-500">{healthTotal} sĩ quan</span>
                )}
              </div>
            </div>

            {/* Table */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Sĩ quan</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Đơn vị</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Cấp bậc</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Phân loại SK</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Lần kiểm tra gần nhất</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Ghi chú sức khỏe</TableHead>
                      <TableHead className="text-slate-600 font-semibold w-20 text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : healthRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                          <HeartPulse className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Không có dữ liệu</p>
                        </TableCell>
                      </TableRow>
                    ) : healthRecords.map((r) => {
                      const catConf = r.healthCategory ? HEALTH_CAT_MAP[r.healthCategory] : null;
                      const days    = daysSinceCheck(r.lastHealthCheckDate);
                      const isOverdue = days !== null && days > 365;
                      return (
                        <TableRow
                          key={r.id}
                          className={`hover:bg-slate-50/60 ${r.healthCategory === 'Loại 4' ? 'bg-red-50/40' : ''}`}
                        >
                          <TableCell>
                            <div className="font-semibold text-slate-800">{r.personnel.fullName}</div>
                            <div className="text-xs text-slate-400 font-mono">{r.personnel.personnelCode}</div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {r.personnel.unit?.name ?? '-'}
                          </TableCell>
                          <TableCell>
                            {r.currentRank ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRankBadgeStyle(r.currentRank)}`}>
                                {rankLabelMap[r.currentRank] || r.currentRank}
                              </span>
                            ) : <span className="text-slate-400 text-xs">-</span>}
                          </TableCell>
                          <TableCell>
                            {catConf ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catConf.badgeColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${catConf.dotColor}`} />
                                {catConf.label}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Chưa kiểm tra
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.lastHealthCheckDate ? (
                              <div>
                                <div className={`text-sm font-medium ${isOverdue ? 'text-orange-700' : 'text-slate-700'}`}>
                                  {formatDate(r.lastHealthCheckDate)}
                                </div>
                                <div className={`text-xs mt-0.5 ${isOverdue ? 'text-orange-600' : 'text-slate-400'}`}>
                                  {days !== null && (isOverdue ? `⚠ Quá ${days - 365} ngày cần tái kiểm` : `${days} ngày trước`)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa có dữ liệu</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-[220px]">
                            <span className="line-clamp-2">{r.healthNotes ?? '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                                title="Cập nhật sức khỏe"
                                onClick={() => openHealthDialog(r)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trang <span className="font-medium text-slate-700">{healthPage}</span> / {healthTotalPages}
                {healthTotal > 0 && ` · ${healthTotal} sĩ quan`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={healthPage <= 1}
                  onClick={() => setHealthPage(p => p - 1)} className="border-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={healthPage >= healthTotalPages}
                  onClick={() => setHealthPage(p => p + 1)} className="border-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Trường hợp đặc biệt ───────────────────────────────────────── */}
          <TabsContent value="special-cases" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-800">Trường hợp đặc biệt rút ngắn hạn thăng quân hàm</h2>
                <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    title="Hiện cả trường hợp đã hủy"
                    checked={showAllCases}
                    onChange={e => setShowAllCases(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Hiện cả đã hủy
                </label>
              </div>
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white" onClick={openCreateScDialog}>
                <Plus className="h-4 w-4 mr-1.5" />
                Thêm trường hợp
              </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold">Quân nhân</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Loại đặc biệt</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Tiêu đề</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-center">Rút ngắn</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Số quyết định</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Ngày QĐ</TableHead>
                      <TableHead className="text-slate-600 font-semibold">Trạng thái</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialCasesLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : specialCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                          <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Chưa có trường hợp đặc biệt nào</p>
                        </TableCell>
                      </TableRow>
                    ) : specialCases.map((sc) => {
                      const person =
                        (sc as any).officerCareer?.personnel ||
                        (sc as any).soldierProfile?.personnel;
                      return (
                        <TableRow key={sc.id} className="hover:bg-slate-50/60">
                          <TableCell>
                            {person ? (
                              <>
                                <div className="font-medium text-slate-800">{person.fullName}</div>
                                <div className="text-xs text-slate-400 font-mono">{person.personnelCode}</div>
                              </>
                            ) : <span className="text-slate-400 text-xs">-</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                              {sc.caseTypeLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 max-w-xs truncate">{sc.title}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-emerald-700 font-bold text-sm">-{sc.reductionMonths} tháng</span>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-slate-600">{sc.decisionNumber ?? '-'}</TableCell>
                          <TableCell className="text-sm text-slate-600">{formatDate(sc.decisionDate)}</TableCell>
                          <TableCell>
                            {sc.isActive
                              ? <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs">Đang áp dụng</Badge>
                              : <Badge variant="secondary" className="text-xs">Đã hủy</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => openEditScDialog(sc)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => deleteSpecialCase(sc.id)}>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Promotion Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={promotionDialog.open} onOpenChange={(o) => setPromotionDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              {promotionDialog.mode === 'create'
                ? <><ArrowUpCircle className="h-5 w-5 text-blue-700" /> Ghi nhận quyết định thăng cấp / bổ nhiệm</>
                : <><Pencil className="h-5 w-5 text-amber-600" /> Chỉnh sửa quyết định</>}
            </DialogTitle>
            <DialogDescription>
              {promotionDialog.mode === 'create'
                ? 'Ghi nhận quyết định thăng cấp, bổ nhiệm, điều động hoặc các quyết định nhân sự khác.'
                : `Cập nhật quyết định của: ${promotionDialog.data?.officerCareer.personnel.fullName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Officer selector (create only) */}
            {promotionDialog.mode === 'create' && (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Sĩ quan <span className="text-red-500">*</span></Label>
                {promoSelectedOfficer ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <div className="font-semibold text-blue-900">{promoSelectedOfficer.fullName}</div>
                      <div className="text-xs text-blue-600 font-mono">{promoSelectedOfficer.personnelCode}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400"
                      onClick={() => { setPromoSelectedOfficer(null); setPromoPersonnelQuery(''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Gõ tên hoặc mã sĩ quan để tìm..."
                      value={promoPersonnelQuery}
                      onChange={e => setPromoPersonnelQuery(e.target.value)}
                    />
                    {promoPersonnelSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                    {promoPersonnelResults.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {promoPersonnelResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                            onClick={() => {
                              setPromoSelectedOfficer({ _careerId: p._careerId, fullName: p.fullName, personnelCode: p.personnelCode });
                              setPromoPersonnelResults([]);
                              setPromoPersonnelQuery('');
                            }}
                          >
                            <div className="font-medium text-slate-800 text-sm">{p.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.personnelCode} · {p.unit?.name || '-'}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Promotion type + effective date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Loại quyết định <span className="text-red-500">*</span></Label>
                <Select value={promotionForm.promotionType} onValueChange={v => setPromotionForm(f => ({ ...f, promotionType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                  <SelectContent>
                    {PROMOTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Ngày hiệu lực <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={promotionForm.effectiveDate}
                  onChange={e => setPromotionForm(f => ({ ...f, effectiveDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Decision info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm">Số quyết định</Label>
                <Input
                  value={promotionForm.decisionNumber}
                  onChange={e => setPromotionForm(f => ({ ...f, decisionNumber: e.target.value }))}
                  placeholder="123/QĐ-BQP"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm">Ngày ký quyết định</Label>
                <Input
                  type="date"
                  value={promotionForm.decisionDate}
                  onChange={e => setPromotionForm(f => ({ ...f, decisionDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Rank change */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thay đổi cấp bậc</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm">Cấp bậc trước</Label>
                  <Select value={promotionForm.previousRank} onValueChange={v => setPromotionForm(f => ({ ...f, previousRank: v }))}>
                    <SelectTrigger><SelectValue placeholder="Không thay đổi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Không điền —</SelectItem>
                      {ranks.map(r => <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm">Cấp bậc mới</Label>
                  <Select value={promotionForm.newRank} onValueChange={v => setPromotionForm(f => ({ ...f, newRank: v }))}>
                    <SelectTrigger><SelectValue placeholder="Không thay đổi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Không điền —</SelectItem>
                      {ranks.map(r => <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Position change */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thay đổi chức vụ</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm">Chức vụ trước</Label>
                  <Input
                    value={promotionForm.previousPosition}
                    onChange={e => setPromotionForm(f => ({ ...f, previousPosition: e.target.value }))}
                    placeholder="VD: Trưởng phòng..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm">Chức vụ mới</Label>
                  <Input
                    value={promotionForm.newPosition}
                    onChange={e => setPromotionForm(f => ({ ...f, newPosition: e.target.value }))}
                    placeholder="VD: Phó Giám đốc..."
                  />
                </div>
              </div>
            </div>

            {/* Reason + Notes */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Lý do / Căn cứ</Label>
              <Input
                value={promotionForm.reason}
                onChange={e => setPromotionForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="VD: Theo đề xuất của Hội đồng xét thăng hàm..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Ghi chú</Label>
              <Textarea
                value={promotionForm.notes}
                onChange={e => setPromotionForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Thông tin bổ sung..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromotionDialog(prev => ({ ...prev, open: false }))}>
              Hủy
            </Button>
            <Button
              onClick={savePromotion}
              disabled={promotionSaving || !promotionForm.promotionType || !promotionForm.effectiveDate}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {promotionSaving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Đang lưu...</>
              ) : promotionDialog.mode === 'create' ? 'Ghi nhận' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Officer CRUD Dialog ───────────────────────────────────────────────── */}
      <Dialog open={officerDialog.open} onOpenChange={(o) => setOfficerDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              {officerDialog.mode === 'create'
                ? <><UserPlus className="h-5 w-5 text-blue-700" /> Thêm hồ sơ sĩ quan</>
                : <><Pencil className="h-5 w-5 text-amber-600" /> Chỉnh sửa hồ sơ sĩ quan</>}
            </DialogTitle>
            <DialogDescription>
              {officerDialog.mode === 'create'
                ? 'Tạo hồ sơ nghề nghiệp cho sĩ quan đã có trong CSDL nhân sự.'
                : `Cập nhật thông tin cho: ${officerDialog.data?.personnel?.fullName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {officerDialog.mode === 'create' && (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Chọn cán bộ <span className="text-red-500">*</span></Label>
                {selectedPersonnel ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <div className="font-semibold text-blue-900">{selectedPersonnel.fullName}</div>
                      <div className="text-xs text-blue-600 font-mono">{selectedPersonnel.personnelCode} · {selectedPersonnel.unit?.name || '-'}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                      onClick={() => { setSelectedPersonnel(null); setPersonnelQuery(''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Gõ tên hoặc mã cán bộ để tìm..."
                      value={personnelQuery}
                      onChange={e => setPersonnelQuery(e.target.value)}
                    />
                    {personnelSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                    {personnelResults.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {personnelResults.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                            onClick={() => {
                              setSelectedPersonnel(p);
                              setPersonnelResults([]);
                              setPersonnelQuery('');
                            }}
                          >
                            <div className="font-medium text-slate-800 text-sm">{p.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.personnelCode} · {p.unit?.name || '-'}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Số hiệu sĩ quan</Label>
                <Input
                  value={officerForm.officerIdNumber}
                  onChange={e => setOfficerForm(f => ({ ...f, officerIdNumber: e.target.value }))}
                  placeholder="VD: SQ-0001"
                  disabled={officerDialog.mode === 'edit'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Ngày phong quân hàm đầu</Label>
                <Input
                  type="date"
                  value={officerForm.commissionedDate}
                  onChange={e => setOfficerForm(f => ({ ...f, commissionedDate: e.target.value }))}
                  disabled={officerDialog.mode === 'edit'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">Cấp bậc hiện tại</Label>
              <Select value={officerForm.currentRank} onValueChange={v => setOfficerForm(f => ({ ...f, currentRank: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn cấp bậc..." /></SelectTrigger>
                <SelectContent>
                  {ranks.map(r => (
                    <SelectItem key={r.code} value={r.code}>{r.nameVi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">Chức vụ hiện tại</Label>
              <Input
                value={officerForm.currentPosition}
                onChange={e => setOfficerForm(f => ({ ...f, currentPosition: e.target.value }))}
                placeholder="VD: Trưởng phòng Đào tạo"
              />
            </div>

            {officerDialog.mode === 'edit' && (
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm">Kết quả đánh giá gần nhất</Label>
                <Input
                  value={officerForm.lastEvaluationResult}
                  onChange={e => setOfficerForm(f => ({ ...f, lastEvaluationResult: e.target.value }))}
                  placeholder="VD: Hoàn thành xuất sắc nhiệm vụ"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOfficerDialog(prev => ({ ...prev, open: false }))}>
              Hủy
            </Button>
            <Button
              onClick={saveOfficer}
              disabled={officerSaving || (officerDialog.mode === 'create' && !selectedPersonnel)}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {officerSaving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Đang lưu...</>
              ) : officerDialog.mode === 'create' ? 'Tạo hồ sơ' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Special Case Dialog ───────────────────────────────────────────────── */}
      <Dialog open={scDialog.open} onOpenChange={(o) => setScDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              {scDialog.mode === 'create' ? 'Thêm trường hợp đặc biệt' : 'Chỉnh sửa trường hợp đặc biệt'}
            </DialogTitle>
            <DialogDescription>
              Trường hợp đặc biệt sẽ rút ngắn thời gian chờ thăng quân hàm tiêu chuẩn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {scDialog.mode === 'create' && (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Quân nhân áp dụng</Label>
                {scSelectedPersonnel ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <div className="font-semibold text-blue-900 text-sm">{scSelectedPersonnel.fullName}</div>
                      <div className="text-xs text-blue-600 font-mono">{scSelectedPersonnel.personnelCode}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400"
                      onClick={() => { setScSelectedPersonnel(null); setScPersonnelQuery(''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Tìm quân nhân theo tên hoặc mã..."
                      value={scPersonnelQuery}
                      onChange={e => setScPersonnelQuery(e.target.value)}
                    />
                    {scPersonnelSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                    {scPersonnelResults.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {scPersonnelResults.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                            onClick={() => {
                              setScSelectedPersonnel(p);
                              setScPersonnelResults([]);
                              setScPersonnelQuery('');
                            }}
                          >
                            <div className="font-medium text-slate-800 text-sm">{p.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.personnelCode} · {p.unit?.name || '-'}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-700">Loại trường hợp đặc biệt <span className="text-red-500">*</span></Label>
              <Select value={scForm.caseType} onValueChange={v => setScForm(f => ({ ...f, caseType: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                <SelectContent>
                  {SPECIAL_CASE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">Tiêu đề / Tên trường hợp <span className="text-red-500">*</span></Label>
              <Input
                value={scForm.title}
                onChange={e => setScForm(f => ({ ...f, title: e.target.value }))}
                placeholder="VD: Tiến sĩ Khoa học quân sự 2023"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">Số tháng rút ngắn <span className="text-red-500">*</span></Label>
              <Input
                type="number" min={1} max={24}
                value={scForm.reductionMonths}
                onChange={e => setScForm(f => ({ ...f, reductionMonths: e.target.value }))}
                placeholder="VD: 6"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm">Số quyết định</Label>
                <Input
                  value={scForm.decisionNumber}
                  onChange={e => setScForm(f => ({ ...f, decisionNumber: e.target.value }))}
                  placeholder="123/QĐ-BQP"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm">Ngày quyết định</Label>
                <Input
                  type="date"
                  value={scForm.decisionDate}
                  onChange={e => setScForm(f => ({ ...f, decisionDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Cơ quan ban hành</Label>
              <Input
                value={scForm.issuedBy}
                onChange={e => setScForm(f => ({ ...f, issuedBy: e.target.value }))}
                placeholder="Bộ Quốc phòng / Học viện..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Mô tả / Ghi chú</Label>
              <Textarea
                value={scForm.description}
                onChange={e => setScForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Thông tin bổ sung..."
                rows={2}
              />
            </div>

            {scDialog.mode === 'edit' && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isActive"
                  title="Trạng thái áp dụng"
                  checked={scForm.isActive}
                  onChange={e => setScForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="isActive" className="text-sm cursor-pointer text-slate-700">
                  Đang áp dụng (bỏ chọn để hủy trường hợp này)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScDialog(prev => ({ ...prev, open: false }))}>
              Hủy
            </Button>
            <Button
              onClick={saveSpecialCase}
              disabled={scSaving || !scForm.caseType || !scForm.title || !scForm.reductionMonths}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {scSaving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Đang lưu...</>
              ) : scDialog.mode === 'create' ? 'Thêm' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
