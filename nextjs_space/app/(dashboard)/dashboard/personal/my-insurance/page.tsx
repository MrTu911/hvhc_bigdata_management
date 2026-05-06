'use client';

/**
 * /dashboard/personal/my-insurance
 * Bảo hiểm xã hội của tôi — SELF scope, mọi người dùng.
 *
 * Tabs:
 *   1. Tổng quan     — KPI cards + cảnh báo + trạng thái thẻ BHYT
 *   2. Khai báo      — Form khai báo dữ liệu ban đầu / cập nhật thông tin
 *   3. Yêu cầu       — Danh sách yêu cầu + tạo yêu cầu mới + theo dõi trạng thái
 *   4. Người thân    — Danh sách người phụ thuộc hưởng BHYT
 *   5. Lịch sử đóng  — Bảng lịch sử đóng / hưởng BHXH
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Shield, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  Send, Eye, Trash2, RefreshCw, X, FileText, ChevronRight,
  Users, Calendar, TrendingUp, Activity, Loader2,
  AlertTriangle, Info, ClipboardList, History, Wallet,
  HeartPulse, UserPlus, ArrowRight, CheckCheck, Ban, Pencil,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClaimStats {
  total: number; draft: number; pending: number; underReview: number;
  approved: number; rejected: number; paid: number; cancelled: number;
}

interface ContributionStats {
  totalMonths: number; totalAmount: number; lastYear: number;
}

interface InsuranceClaim {
  id: string;
  claimType: string; claimTypeLabel: string;
  status: string; statusLabel: string;
  amount: number | null; calculatedAmount: number | null;
  benefitDays: number | null;
  startDate: string | null; endDate: string | null;
  reason: string | null; description: string | null;
  hospitalName: string | null; diagnosis: string | null;
  rejectReason: string | null;
  submittedAt: string | null; reviewedAt: string | null;
  approvedAt: string | null; rejectedAt: string | null; paidAt: string | null;
  paymentReference: string | null;
  createdAt: string; updatedAt: string;
}

interface InsuranceDependent {
  id: string; fullName: string; relationship: string;
  dateOfBirth: string | null; gender: string | null;
  healthInsuranceNumber: string | null;
  healthInsuranceStartDate: string | null; healthInsuranceEndDate: string | null;
  healthInsuranceHospital: string | null;
  status: string; statusReason: string | null; createdAt: string;
}

interface InsuranceHistoryItem {
  id: string; transactionType: string;
  periodMonth: number; periodYear: number;
  baseSalary: number | null; amount: number;
  employeeShare: number | null; employerShare: number | null;
  benefitType: string | null; benefitReason: string | null;
  documentNumber: string | null; documentDate: string | null;
  createdAt: string;
}

interface InsuranceInfo {
  id: string;
  insuranceStartDate: string | null; insuranceEndDate: string | null;
  healthInsuranceStartDate: string | null; healthInsuranceEndDate: string | null;
  healthInsuranceHospital: string | null;
  beneficiaryName: string | null; beneficiaryRelation: string | null;
  beneficiaryPhone: string | null; notes: string | null;
  createdAt: string; updatedAt: string;
  claims: InsuranceClaim[];
  dependents: InsuranceDependent[];
  histories: InsuranceHistoryItem[];
}

interface PageData {
  insurance: InsuranceInfo | null;
  claimStats: ClaimStats;
  contributionStats: ContributionStats;
  expiryWarning: string | null;
  hasInsurance: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLAIM_TYPE_OPTIONS = [
  { value: 'SICK_LEAVE', label: 'Ốm đau' },
  { value: 'MATERNITY', label: 'Thai sản' },
  { value: 'OCCUPATIONAL_DISEASE', label: 'Bệnh nghề nghiệp' },
  { value: 'WORK_ACCIDENT', label: 'Tai nạn lao động' },
  { value: 'RETIREMENT', label: 'Hưu trí' },
  { value: 'SURVIVORSHIP', label: 'Tử tuất' },
  { value: 'UNEMPLOYMENT', label: 'Thất nghiệp' },
  { value: 'MEDICAL_EXPENSE', label: 'Chi phí khám chữa bệnh' },
  { value: 'OTHER', label: 'Khác' },
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Vợ/Chồng', CHILD: 'Con', PARENT: 'Bố/Mẹ',
  SIBLING: 'Anh/Chị/Em', GRANDPARENT: 'Ông/Bà', GRANDCHILD: 'Cháu', OTHER: 'Khác',
};

const TRANSACTION_LABELS: Record<string, string> = {
  CONTRIBUTION: 'Đóng BHXH', BENEFIT: 'Hưởng chế độ',
  ADJUSTMENT: 'Điều chỉnh', REFUND: 'Hoàn trả',
};

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  SICK_LEAVE: 'Ốm đau', MATERNITY: 'Thai sản', RETIREMENT: 'Hưu trí',
  DEATH: 'Tử tuất', OCCUPATIONAL: 'Bệnh nghề nghiệp', UNEMPLOYMENT: 'Thất nghiệp', OTHER: 'Khác',
};

function fmtMoney(v: number | null | undefined) {
  if (!v) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

function fmtDate(v: string | null | undefined) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN');
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT:        { label: 'Nháp', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    PENDING:      { label: 'Đã gửi', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    UNDER_REVIEW: { label: 'Đang xét', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED:     { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED:     { label: 'Từ chối', cls: 'bg-red-50 text-red-700 border-red-200' },
    PAID:         { label: 'Đã chi trả', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    CANCELLED:    { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    ACTIVE:       { label: 'Đang hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    INACTIVE:     { label: 'Ngừng', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const m = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', m.cls)}>
      {m.label}
    </span>
  );
}

// ─── Timeline Step ────────────────────────────────────────────────────────────

function TimelineStep({
  label, date, active, done, rejected,
}: { label: string; date: string | null; active?: boolean; done?: boolean; rejected?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
        done ? 'bg-emerald-500' : rejected ? 'bg-red-400' : active ? 'bg-blue-500' : 'bg-slate-200',
      )}>
        {done ? <CheckCheck className="h-3 w-3 text-white" /> :
         rejected ? <X className="h-3 w-3 text-white" /> :
         active ? <Clock className="h-3 w-3 text-white" /> :
         <div className="h-2 w-2 rounded-full bg-slate-400" />}
      </div>
      <div>
        <p className={cn('text-sm font-medium', done || active ? 'text-foreground' : 'text-muted-foreground')}>
          {label}
        </p>
        {date && <p className="text-xs text-muted-foreground">{fmtDate(date)}</p>}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color = 'blue',
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
}) {
  const colorMap = {
    blue:    'from-blue-500 to-blue-600 shadow-blue-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    amber:   'from-amber-400 to-amber-500 shadow-amber-200',
    purple:  'from-purple-500 to-purple-600 shadow-purple-200',
    rose:    'from-rose-500 to-rose-600 shadow-rose-200',
    slate:   'from-slate-400 to-slate-500 shadow-slate-200',
  };
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          <div className={cn(
            'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            colorMap[color],
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyInsurancePage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Requests tab state
  const [requests, setRequests] = useState<InsuranceClaim[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Dialogs
  const [showDeclareDialog, setShowDeclareDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState<InsuranceClaim | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Declare form state
  const [declareForm, setDeclareForm] = useState({
    insuranceStartDate: '',
    healthInsuranceStartDate: '',
    healthInsuranceEndDate: '',
    healthInsuranceHospital: '',
    beneficiaryName: '',
    beneficiaryRelation: '',
    beneficiaryPhone: '',
    notes: '',
    requestType: 'REGISTER' as 'REGISTER' | 'UPDATE' | 'CONFIRM',
    requestDescription: '',
  });

  // New request form state
  const [requestForm, setRequestForm] = useState({
    claimType: '',
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    hospitalName: '',
    diagnosis: '',
    benefitDays: '',
    submitNow: true,
  });

  const fetchMain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/personal/my-insurance');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Pre-fill declare form if insurance exists
        if (json.data.insurance) {
          const ins = json.data.insurance;
          setDeclareForm((f) => ({
            ...f,
            insuranceStartDate: ins.insuranceStartDate ? ins.insuranceStartDate.split('T')[0] : '',
            healthInsuranceStartDate: ins.healthInsuranceStartDate ? ins.healthInsuranceStartDate.split('T')[0] : '',
            healthInsuranceEndDate: ins.healthInsuranceEndDate ? ins.healthInsuranceEndDate.split('T')[0] : '',
            healthInsuranceHospital: ins.healthInsuranceHospital ?? '',
            beneficiaryName: ins.beneficiaryName ?? '',
            beneficiaryRelation: ins.beneficiaryRelation ?? '',
            beneficiaryPhone: ins.beneficiaryPhone ?? '',
            notes: ins.notes ?? '',
          }));
        }
      } else {
        toast.error(json.error ?? 'Không thể tải dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(requestsPage),
        pageSize: '10',
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterType ? { claimType: filterType } : {}),
      });
      const res = await fetch(`/api/personal/my-insurance/requests?${params}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.data.items);
        setRequestsTotalPages(json.data.pagination.totalPages);
      }
    } catch {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setRequestsLoading(false);
    }
  }, [requestsPage, filterStatus, filterType]);

  useEffect(() => { fetchMain(); }, [fetchMain]);
  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab, fetchRequests]);

  const handleDeclare = async (submitNow = true) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/personal/my-insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...declareForm }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message ?? 'Khai báo thành công');
        setShowDeclareDialog(false);
        fetchMain();
      } else {
        toast.error(json.error ?? 'Khai báo thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.claimType) {
      toast.error('Vui lòng chọn loại chế độ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/personal/my-insurance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          benefitDays: requestForm.benefitDays ? parseInt(requestForm.benefitDays) : null,
          submitNow: requestForm.submitNow,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message ?? 'Tạo yêu cầu thành công');
        setShowRequestDialog(false);
        setRequestForm({
          claimType: '', startDate: '', endDate: '',
          reason: '', description: '', hospitalName: '',
          diagnosis: '', benefitDays: '', submitNow: true,
        });
        fetchRequests();
        fetchMain();
      } else {
        toast.error(json.error ?? 'Tạo yêu cầu thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    try {
      const res = await fetch('/api/personal/my-insurance/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã hủy yêu cầu');
        fetchRequests();
        fetchMain();
      } else {
        toast.error(json.error ?? 'Không thể hủy yêu cầu');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    }
  };

  const handleSubmitDraft = async (id: string) => {
    try {
      const res = await fetch('/api/personal/my-insurance/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'submit' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã gửi yêu cầu tới quản lý CSDL BHXH');
        fetchRequests();
        fetchMain();
      } else {
        toast.error(json.error ?? 'Không thể gửi yêu cầu');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-muted-foreground text-sm">Đang tải thông tin bảo hiểm…</p>
        </div>
      </div>
    );
  }

  const ins = data?.insurance ?? null;
  const stats = data?.claimStats ?? { total: 0, draft: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, paid: 0, cancelled: 0 };
  const contribs = data?.contributionStats ?? { totalMonths: 0, totalAmount: 0, lastYear: 0 };

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Bảo hiểm xã hội của tôi</h1>
            <p className="text-sm text-muted-foreground">BHXH — BHYT — Chế độ bảo hiểm cá nhân</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline" size="sm"
            onClick={() => { fetchMain(); if (activeTab === 'requests') fetchRequests(); }}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => setShowDeclareDialog(true)}
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow"
          >
            <Plus className="h-3.5 w-3.5" />
            {ins ? 'Cập nhật khai báo' : 'Khai báo ban đầu'}
          </Button>
        </div>
      </div>

      {/* ── Expiry Warning ────────────────────────────────────────────────────── */}
      {data?.expiryWarning && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-700">{data.expiryWarning}</p>
          <Button variant="ghost" size="sm" className="ml-auto text-amber-700 hover:bg-amber-100 h-7 px-2">
            Gia hạn <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* ── No insurance notice ────────────────────────────────────────────────── */}
      {!ins && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có hồ sơ bảo hiểm</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Bạn chưa khai báo thông tin BHXH/BHYT. Hãy thực hiện khai báo ban đầu để gửi tới
            bộ phận quản lý CSDL bảo hiểm xã hội.
          </p>
          <Button
            onClick={() => setShowDeclareDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow gap-2"
          >
            <Plus className="h-4 w-4" /> Khai báo ngay
          </Button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 h-auto rounded-xl flex-wrap gap-1">
          {[
            { value: 'overview', icon: Activity, label: 'Tổng quan' },
            { value: 'declare', icon: ClipboardList, label: 'Thông tin khai báo' },
            { value: 'requests', icon: FileText, label: 'Yêu cầu chế độ' },
            { value: 'dependents', icon: Users, label: 'Người thân' },
            { value: 'history', icon: History, label: 'Lịch sử đóng' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 text-sm px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {value === 'requests' && stats.pending > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-bold">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ══ Tab: Tổng quan ══════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-5 mt-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon={Wallet} label="Tháng đã đóng" color="blue"
              value={contribs.totalMonths} sub="tháng tích lũy"
            />
            <KpiCard
              icon={TrendingUp} label="Đã đóng năm nay" color="emerald"
              value={fmtMoney(contribs.lastYear)} sub="tổng trong năm"
            />
            <KpiCard
              icon={FileText} label="Tổng yêu cầu" color="purple"
              value={stats.total} sub={`${stats.pending} đang chờ`}
            />
            <KpiCard
              icon={Users} label="Người thân" color="amber"
              value={ins?.dependents?.length ?? 0} sub="đang hưởng BHYT"
            />
          </div>

          {/* Insurance info card */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Thông tin BHXH
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {!ins ? (
                  <p className="text-sm text-muted-foreground italic">Chưa khai báo</p>
                ) : (
                  <>
                    <Row label="Ngày tham gia" value={fmtDate(ins.insuranceStartDate)} />
                    <Row label="Tháng đóng" value={`${contribs.totalMonths} tháng`} />
                    <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-500 flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" />
                      Số sổ BHXH được bảo mật. Liên hệ Phòng Tổ chức — Nhân sự để tra cứu.
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                    <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  Thẻ BHYT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {!ins ? (
                  <p className="text-sm text-muted-foreground italic">Chưa khai báo</p>
                ) : (
                  <>
                    <Row label="Nơi KCB ban đầu" value={ins.healthInsuranceHospital ?? '—'} />
                    <Row label="Hiệu lực" value={fmtDate(ins.healthInsuranceStartDate)} />
                    <Row
                      label="Hết hạn"
                      value={
                        <span className={cn(
                          ins.healthInsuranceEndDate &&
                          new Date(ins.healthInsuranceEndDate) < new Date()
                            ? 'text-red-600 font-medium'
                            : '',
                        )}>
                          {fmtDate(ins.healthInsuranceEndDate)}
                        </span>
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Claim status summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                </div>
                Tổng hợp yêu cầu chế độ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { key: 'draft',       label: 'Nháp',     color: 'bg-slate-100 text-slate-600' },
                  { key: 'pending',     label: 'Đã gửi',   color: 'bg-blue-100 text-blue-700' },
                  { key: 'underReview', label: 'Đang xét', color: 'bg-amber-100 text-amber-700' },
                  { key: 'approved',    label: 'Duyệt',    color: 'bg-emerald-100 text-emerald-700' },
                  { key: 'rejected',    label: 'Từ chối',  color: 'bg-red-100 text-red-700' },
                  { key: 'paid',        label: 'Chi trả',  color: 'bg-purple-100 text-purple-700' },
                ].map(({ key, label, color }) => (
                  <div key={key} className={cn('rounded-xl p-3 text-center', color)}>
                    <p className="text-2xl font-bold">{(stats as any)[key] ?? 0}</p>
                    <p className="text-xs mt-0.5 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent claims */}
          {ins && ins.claims.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">Yêu cầu gần nhất</CardTitle>
                <Button
                  variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600"
                  onClick={() => setActiveTab('requests')}
                >
                  Xem tất cả <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ins.claims.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setShowDetailDialog(c)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.claimTypeLabel}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</p>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══ Tab: Thông tin khai báo ══════════════════════════════════════════ */}
        <TabsContent value="declare" className="space-y-4 mt-5">
          {!ins ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                <ClipboardList className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-muted-foreground text-sm">Chưa có thông tin khai báo.</p>
              <Button onClick={() => setShowDeclareDialog(true)} size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Khai báo ngay
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  size="sm" variant="outline"
                  onClick={() => setShowDeclareDialog(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Cập nhật thông tin
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thông tin BHXH</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm">
                    <Row label="Ngày tham gia BHXH" value={fmtDate(ins.insuranceStartDate)} />
                    <Row label="Ngày kết thúc" value={fmtDate(ins.insuranceEndDate)} />
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thông tin BHYT</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm">
                    <Row label="Hiệu lực từ" value={fmtDate(ins.healthInsuranceStartDate)} />
                    <Row label="Hết hạn" value={fmtDate(ins.healthInsuranceEndDate)} />
                    <Row label="Nơi KCB ban đầu" value={ins.healthInsuranceHospital ?? '—'} />
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Người thụ hưởng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm">
                    <Row label="Họ tên" value={ins.beneficiaryName ?? '—'} />
                    <Row label="Quan hệ" value={ins.beneficiaryRelation ?? '—'} />
                    <Row label="Điện thoại" value={ins.beneficiaryPhone ?? '—'} />
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ghi chú</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {ins.notes ?? 'Không có ghi chú'}
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                      Cập nhật lần cuối: {fmtDate(ins.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ══ Tab: Yêu cầu chế độ ════════════════════════════════════════════ */}
        <TabsContent value="requests" className="space-y-4 mt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v); setRequestsPage(1); }}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
                  <SelectItem value="DRAFT">Nháp</SelectItem>
                  <SelectItem value="PENDING">Đã gửi</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Đang xét</SelectItem>
                  <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                  <SelectItem value="PAID">Đã chi trả</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v === '__all__' ? '' : v); setRequestsPage(1); }}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Tất cả loại chế độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả loại</SelectItem>
                  {CLAIM_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() => setShowRequestDialog(true)}
              className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo yêu cầu mới
            </Button>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>
              <Button
                size="sm" className="mt-3 gap-1.5" variant="outline"
                onClick={() => setShowRequestDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Tạo yêu cầu đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <Card key={r.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{r.claimTypeLabel}</p>
                            <StatusBadge status={r.status} />
                          </div>
                          {r.reason && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.reason}</p>
                          )}
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {r.startDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {fmtDate(r.startDate)}
                                {r.endDate && ` — ${fmtDate(r.endDate)}`}
                              </span>
                            )}
                            {r.hospitalName && (
                              <span className="text-xs text-muted-foreground">{r.hospitalName}</span>
                            )}
                          </div>
                          {r.status === 'REJECTED' && r.rejectReason && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                              <XCircle className="h-3 w-3" />
                              {r.rejectReason}
                            </div>
                          )}
                          {r.status === 'PAID' && r.calculatedAmount && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã chi trả: {fmtMoney(r.calculatedAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600"
                          title="Chi tiết"
                          onClick={() => setShowDetailDialog(r)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {r.status === 'DRAFT' && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600"
                            title="Gửi yêu cầu"
                            onClick={() => handleSubmitDraft(r.id)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {['DRAFT', 'PENDING'].includes(r.status) && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-600"
                            title="Hủy"
                            onClick={() => handleCancelRequest(r.id)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress timeline mini */}
                    <div className="mt-3 flex items-center gap-1">
                      {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID'].map((s, i, arr) => {
                        const idx = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID'].indexOf(r.status);
                        const done = i < idx;
                        const active = i === idx;
                        const rejected = r.status === 'REJECTED';
                        return (
                          <>
                            <div key={s} className={cn(
                              'h-1.5 flex-1 rounded-full',
                              done ? 'bg-emerald-400' :
                              active ? 'bg-blue-400' :
                              rejected && i === 2 ? 'bg-red-300' :
                              'bg-slate-200',
                            )} />
                            {i < arr.length - 1 && (
                              <div className={cn(
                                'h-2.5 w-2.5 rounded-full flex-shrink-0',
                                done ? 'bg-emerald-400' : active ? 'bg-blue-400' : 'bg-slate-200',
                              )} />
                            )}
                          </>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {['Đã gửi', 'Đang xét', 'Duyệt', 'Chi trả'].map((l) => (
                        <span key={l} className="text-[10px] text-muted-foreground">{l}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {requestsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline" size="sm" disabled={requestsPage === 1}
                    onClick={() => setRequestsPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {requestsPage} / {requestsTotalPages}
                  </span>
                  <Button
                    variant="outline" size="sm" disabled={requestsPage === requestsTotalPages}
                    onClick={() => setRequestsPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ══ Tab: Người thân ════════════════════════════════════════════════ */}
        <TabsContent value="dependents" className="space-y-4 mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Danh sách người thân đang hưởng BHYT theo hộ gia đình
            </p>
          </div>
          {!ins || ins.dependents.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có người thân đăng ký.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Liên hệ Phòng Tổ chức — Nhân sự để đăng ký người thân.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ins.dependents.map((d) => (
                <Card key={d.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {d.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{d.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {RELATIONSHIP_LABELS[d.relationship] ?? d.relationship}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs">
                      {d.dateOfBirth && (
                        <Row label="Ngày sinh" value={fmtDate(d.dateOfBirth)} small />
                      )}
                      {d.healthInsuranceHospital && (
                        <Row label="Nơi KCB" value={d.healthInsuranceHospital} small />
                      )}
                      {d.healthInsuranceEndDate && (
                        <Row label="Hết hạn thẻ" value={fmtDate(d.healthInsuranceEndDate)} small />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══ Tab: Lịch sử đóng ════════════════════════════════════════════ */}
        <TabsContent value="history" className="space-y-4 mt-5">
          {!ins || ins.histories.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có lịch sử đóng BHXH.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Kỳ</th>
                    <th className="text-left px-4 py-2.5 font-medium">Loại</th>
                    <th className="text-right px-4 py-2.5 font-medium">Số tiền</th>
                    <th className="text-right px-4 py-2.5 font-medium">Phần NLĐ</th>
                    <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ins.histories.map((h, i) => (
                    <tr key={h.id} className={cn('hover:bg-slate-50 transition-colors', i % 2 === 0 ? '' : 'bg-slate-50/50')}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {String(h.periodMonth).padStart(2, '0')}/{h.periodYear}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                          h.transactionType === 'CONTRIBUTION'
                            ? 'bg-blue-50 text-blue-700'
                            : h.transactionType === 'BENEFIT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600',
                        )}>
                          {TRANSACTION_LABELS[h.transactionType] ?? h.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {fmtMoney(h.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {h.employeeShare ? fmtMoney(h.employeeShare) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell text-xs">
                        {h.benefitType ? BENEFIT_TYPE_LABELS[h.benefitType] : h.benefitReason ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Dialog: Khai báo / Cập nhật ═══════════════════════════════════════ */}
      <Dialog open={showDeclareDialog} onOpenChange={setShowDeclareDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {ins ? 'Cập nhật thông tin bảo hiểm' : 'Khai báo dữ liệu bảo hiểm ban đầu'}
            </DialogTitle>
            <DialogDescription>
              Thông tin sau khi khai báo sẽ được gửi tới quản lý CSDL bảo hiểm xã hội để xác nhận và xử lý.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Loại yêu cầu */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Mục đích yêu cầu</Label>
              <Select
                value={declareForm.requestType}
                onValueChange={(v) => setDeclareForm((f) => ({ ...f, requestType: v as typeof f.requestType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTER">Đăng ký lần đầu</SelectItem>
                  <SelectItem value="UPDATE">Cập nhật thông tin</SelectItem>
                  <SelectItem value="CONFIRM">Xác nhận dữ liệu hiện tại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* BHXH */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center">
                  <Shield className="h-3 w-3 text-blue-600" />
                </div>
                Thông tin BHXH
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ngày tham gia BHXH</Label>
                  <Input
                    type="date"
                    value={declareForm.insuranceStartDate}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, insuranceStartDate: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* BHYT */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-emerald-100 flex items-center justify-center">
                  <HeartPulse className="h-3 w-3 text-emerald-600" />
                </div>
                Thông tin BHYT
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={declareForm.healthInsuranceStartDate}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, healthInsuranceStartDate: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ngày hết hạn</Label>
                  <Input
                    type="date"
                    value={declareForm.healthInsuranceEndDate}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, healthInsuranceEndDate: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Nơi KCB ban đầu</Label>
                  <Input
                    placeholder="Tên cơ sở y tế"
                    value={declareForm.healthInsuranceHospital}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, healthInsuranceHospital: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Người thụ hưởng */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center">
                  <Users className="h-3 w-3 text-purple-600" />
                </div>
                Người thụ hưởng (khi tử tuất)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Họ tên</Label>
                  <Input
                    placeholder="Nhập họ tên"
                    value={declareForm.beneficiaryName}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, beneficiaryName: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quan hệ</Label>
                  <Input
                    placeholder="VD: Vợ, Con, Mẹ…"
                    value={declareForm.beneficiaryRelation}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, beneficiaryRelation: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Điện thoại</Label>
                  <Input
                    placeholder="Số điện thoại"
                    value={declareForm.beneficiaryPhone}
                    onChange={(e) => setDeclareForm((f) => ({ ...f, beneficiaryPhone: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <Label className="text-xs">Mô tả / Ghi chú thêm</Label>
              <Textarea
                placeholder="Nhập thông tin bổ sung cần quản lý CSDL xem xét…"
                value={declareForm.requestDescription}
                onChange={(e) => setDeclareForm((f) => ({ ...f, requestDescription: e.target.value }))}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Dữ liệu sau khai báo sẽ được gửi ngay tới quản lý CSDL bảo hiểm xã hội để tiếp nhận và xử lý.
                Bạn có thể theo dõi tiến trình tại tab <strong>Yêu cầu chế độ</strong>.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeclareDialog(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={() => handleDeclare(true)}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 gap-2"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Lưu & Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Tạo yêu cầu chế độ ══════════════════════════════════════ */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Tạo yêu cầu chế độ BHXH
            </DialogTitle>
            <DialogDescription>
              Sau khi tạo, yêu cầu sẽ được gửi tới bộ phận quản lý CSDL bảo hiểm xã hội để xét duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Loại chế độ <span className="text-red-500">*</span></Label>
              <Select
                value={requestForm.claimType}
                onValueChange={(v) => setRequestForm((f) => ({ ...f, claimType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại chế độ…" />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Từ ngày</Label>
                <Input
                  type="date"
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Đến ngày</Label>
                <Input
                  type="date"
                  value={requestForm.endDate}
                  onChange={(e) => setRequestForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {['SICK_LEAVE', 'MATERNITY', 'OCCUPATIONAL_DISEASE', 'WORK_ACCIDENT', 'MEDICAL_EXPENSE'].includes(requestForm.claimType) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tên cơ sở y tế</Label>
                  <Input
                    placeholder="Bệnh viện / phòng khám"
                    value={requestForm.hospitalName}
                    onChange={(e) => setRequestForm((f) => ({ ...f, hospitalName: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Chẩn đoán</Label>
                  <Input
                    placeholder="Tên bệnh / chẩn đoán"
                    value={requestForm.diagnosis}
                    onChange={(e) => setRequestForm((f) => ({ ...f, diagnosis: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Số ngày nghỉ</Label>
                  <Input
                    type="number" min="0"
                    placeholder="Số ngày"
                    value={requestForm.benefitDays}
                    onChange={(e) => setRequestForm((f) => ({ ...f, benefitDays: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Lý do</Label>
              <Input
                placeholder="Lý do yêu cầu chế độ"
                value={requestForm.reason}
                onChange={(e) => setRequestForm((f) => ({ ...f, reason: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mô tả chi tiết</Label>
              <Textarea
                placeholder="Thông tin chi tiết thêm về yêu cầu của bạn…"
                value={requestForm.description}
                onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
              <input
                type="checkbox"
                id="submitNow"
                checked={requestForm.submitNow}
                onChange={(e) => setRequestForm((f) => ({ ...f, submitNow: e.target.checked }))}
                className="h-4 w-4 rounded accent-blue-500"
              />
              <label htmlFor="submitNow" className="text-sm cursor-pointer select-none">
                <span className="font-medium">Gửi ngay</span>
                <span className="text-muted-foreground ml-1">
                  — bỏ chọn để lưu nháp và gửi sau
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={submitting || !requestForm.claimType}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 gap-2"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
               requestForm.submitNow ? <Send className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {requestForm.submitNow ? 'Gửi yêu cầu' : 'Lưu nháp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Chi tiết yêu cầu ═════════════════════════════════════════ */}
      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Chi tiết yêu cầu
            </DialogTitle>
          </DialogHeader>
          {showDetailDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{showDetailDialog.claimTypeLabel}</p>
                <StatusBadge status={showDetailDialog.status} />
              </div>

              {/* Timeline */}
              <div className="space-y-3 border-l-2 border-slate-100 pl-4 ml-2">
                <TimelineStep
                  label="Tạo yêu cầu"
                  date={showDetailDialog.createdAt}
                  done
                />
                <TimelineStep
                  label="Đã gửi — Chờ tiếp nhận"
                  date={showDetailDialog.submittedAt}
                  done={!!showDetailDialog.submittedAt && showDetailDialog.status !== 'PENDING'}
                  active={showDetailDialog.status === 'PENDING'}
                />
                <TimelineStep
                  label="Đang xét duyệt"
                  date={showDetailDialog.reviewedAt}
                  done={!!showDetailDialog.reviewedAt && !['PENDING', 'UNDER_REVIEW'].includes(showDetailDialog.status)}
                  active={showDetailDialog.status === 'UNDER_REVIEW'}
                />
                <TimelineStep
                  label={showDetailDialog.status === 'REJECTED' ? 'Đã từ chối' : 'Đã duyệt'}
                  date={showDetailDialog.approvedAt ?? showDetailDialog.rejectedAt}
                  done={['APPROVED', 'PAID'].includes(showDetailDialog.status)}
                  active={showDetailDialog.status === 'APPROVED'}
                  rejected={showDetailDialog.status === 'REJECTED'}
                />
                {showDetailDialog.paidAt && (
                  <TimelineStep
                    label="Đã chi trả"
                    date={showDetailDialog.paidAt}
                    done
                  />
                )}
              </div>

              <div className="space-y-2 text-sm">
                {showDetailDialog.startDate && (
                  <Row label="Thời gian" value={`${fmtDate(showDetailDialog.startDate)}${showDetailDialog.endDate ? ` — ${fmtDate(showDetailDialog.endDate)}` : ''}`} />
                )}
                {showDetailDialog.hospitalName && (
                  <Row label="Cơ sở y tế" value={showDetailDialog.hospitalName} />
                )}
                {showDetailDialog.diagnosis && (
                  <Row label="Chẩn đoán" value={showDetailDialog.diagnosis} />
                )}
                {showDetailDialog.benefitDays && (
                  <Row label="Số ngày" value={`${showDetailDialog.benefitDays} ngày`} />
                )}
                {showDetailDialog.reason && (
                  <Row label="Lý do" value={showDetailDialog.reason} />
                )}
                {showDetailDialog.calculatedAmount && (
                  <Row label="Số tiền duyệt" value={fmtMoney(showDetailDialog.calculatedAmount)} />
                )}
                {showDetailDialog.status === 'REJECTED' && showDetailDialog.rejectReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium text-red-700 mb-1">Lý do từ chối:</p>
                    <p className="text-xs text-red-600">{showDetailDialog.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Utility component ────────────────────────────────────────────────────────

function Row({
  label, value, small = false,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={cn('text-muted-foreground flex-shrink-0', small ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
      <span className={cn('text-right font-medium', small ? 'text-xs' : 'text-sm')}>{value}</span>
    </div>
  );
}
