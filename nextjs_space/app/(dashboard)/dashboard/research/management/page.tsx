'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import {
  Search, Plus, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  FlaskConical, BookOpen, Lightbulb, Newspaper, FileText, ClipboardList,
  GraduationCap, BookMarked, Users, Info
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Publication {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  year: number;
  month: number | null;
  role: string;
  publisher: string | null;
  organization: string | null;
  issueNumber: string | null;
  pageNumbers: string | null;
  targetUsers: string | null;
  coAuthors: string | null;
  notes: string | null;
  user: { id: string; name: string; email: string; rank: string | null };
}

interface Activity {
  id: string;
  title: string;
  year: number;
  role: string;
  level: string;
  type: string;
  institution: string | null;
  result: string | null;
  notes: string | null;
  user: { id: string; name: string; email: string; rank: string | null };
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  rank: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PUB_TABS = [
  { key: 'DE_TAI',       label: 'Đề tài NCKH',       icon: FlaskConical,  color: 'violet' },
  { key: 'SANG_KIEN',    label: 'Sáng kiến',          icon: Lightbulb,     color: 'amber'  },
  { key: 'GIAO_TRINH',   label: 'Giáo trình',         icon: BookOpen,      color: 'blue'   },
  { key: 'GIAO_TRINH_DT',label: 'Giáo trình ĐT',      icon: BookMarked,    color: 'cyan'   },
  { key: 'TAI_LIEU',     label: 'Tài liệu',           icon: FileText,      color: 'teal'   },
  { key: 'BAI_TAP',      label: 'Bài tập',            icon: ClipboardList, color: 'green'  },
  { key: 'BAI_BAO',      label: 'Bài báo KH',         icon: Newspaper,     color: 'rose'   },
] as const;

const TAB_COLOR: Record<string, string> = {
  violet: 'bg-violet-500', amber: 'bg-amber-500', blue: 'bg-blue-500',
  cyan: 'bg-cyan-500', teal: 'bg-teal-500', green: 'bg-green-500',
  rose: 'bg-rose-500',
};

const TAB_ICON_COLOR: Record<string, string> = {
  violet: 'text-violet-500', amber: 'text-amber-500', blue: 'text-blue-500',
  cyan: 'text-cyan-500', teal: 'text-teal-500', green: 'text-green-500',
  rose: 'text-rose-500',
};

const TAB_COUNT_COLOR: Record<string, string> = {
  violet: 'text-violet-600', amber: 'text-amber-600', blue: 'text-blue-600',
  cyan: 'text-cyan-600', teal: 'text-teal-600', green: 'text-green-600',
  rose: 'text-rose-600',
};

const PUB_ROLE_LABELS: Record<string, string> = {
  CHU_BIEN: 'Chủ biên', THAM_GIA: 'Tham gia', DONG_TAC_GIA: 'Đồng tác giả',
};

const ACT_ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm', THAM_GIA: 'Tham gia', THANH_VIEN: 'Thành viên',
};

const LEVEL_OPTIONS = [
  'Cấp Học viện', 'Cấp Bộ', 'Cấp Quân khu', 'Cấp Quốc gia', 'Cấp Quốc tế',
  'Cấp Khoa', 'Cấp Bộ môn',
];

const RESEARCH_TYPE_OPTIONS = [
  'Nghiên cứu cơ bản', 'Nghiên cứu ứng dụng', 'Nghiên cứu phát triển',
  'Đề tài khoa học', 'Dự án nghiên cứu', 'Hội thảo khoa học', 'Báo cáo khoa học',
];

const EMPTY_PUB = {
  id: '', type: '', title: '', year: new Date().getFullYear(), month: '',
  role: 'CHU_BIEN', publisher: '', organization: '', issueNumber: '',
  pageNumbers: '', targetUsers: '', coAuthors: '', notes: '', userId: '',
};

const EMPTY_ACT = {
  id: '', title: '', year: new Date().getFullYear(), role: 'CHU_NHIEM',
  level: 'Cấp Học viện', type: 'Nghiên cứu ứng dụng',
  institution: '', result: '', notes: '', userId: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResearchManagementPage() {
  const [activeTab, setActiveTab] = useState<string>('DE_TAI');
  const [isActivityTab, setIsActivityTab] = useState(false);

  // Publication state
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [pubTotal, setPubTotal] = useState(0);
  const [pubPage, setPubPage] = useState(1);
  const [pubStats, setPubStats] = useState<Record<string, number>>({});
  const [pubYears, setPubYears] = useState<number[]>([]);

  // Activity state
  const [acts, setActs] = useState<Activity[]>([]);
  const [actTotal, setActTotal] = useState(0);
  const [actPage, setActPage] = useState(1);
  const [actYears, setActYears] = useState<number[]>([]);

  // Shared filters
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [loading, setLoading] = useState(false);

  // Users list for picker
  const [users, setUsers] = useState<UserOption[]>([]);

  // Dialogs
  const [showPubDialog, setShowPubDialog] = useState(false);
  const [pubForm, setPubForm] = useState({ ...EMPTY_PUB });
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [pubSaving, setPubSaving] = useState(false);

  const [showActDialog, setShowActDialog] = useState(false);
  const [actForm, setActForm] = useState({ ...EMPTY_ACT });
  const [editingAct, setEditingAct] = useState<Activity | null>(null);
  const [actSaving, setActSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; isAct: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 20;

  // ── Fetch users ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/rbac/users?limit=300&status=ACTIVE')
      .then(r => r.json())
      .then(d => {
        if (d.users) setUsers(d.users);
      })
      .catch(() => {});
  }, []);

  // ── Fetch publications stats (always) ─────────────────────────────────────
  const fetchPubStats = useCallback(async () => {
    const r = await fetch('/api/scientific-publications?limit=1&page=1');
    const d = await r.json();
    if (d.stats) {
      const map: Record<string, number> = {};
      d.stats.forEach((s: any) => { map[s.type] = s.count; });
      setPubStats(map);
      setPubYears(d.years || []);
    }
  }, []);

  // ── Fetch publications ─────────────────────────────────────────────────────
  const fetchPubs = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: tab, page: String(page), limit: String(PAGE_SIZE),
        ...(search && { search }),
        ...(filterYear && { year: filterYear }),
        ...(filterUser && { userId: filterUser }),
      });
      const r = await fetch(`/api/scientific-publications?${params}`);
      const d = await r.json();
      setPubs(d.publications || []);
      setPubTotal(d.total || 0);
      if (d.stats) {
        const map: Record<string, number> = {};
        d.stats.forEach((s: any) => { map[s.type] = s.count; });
        setPubStats(map);
        setPubYears(d.years || []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterYear, filterUser]);

  // ── Fetch activities ───────────────────────────────────────────────────────
  const fetchActs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(search && { search }),
        ...(filterYear && { year: filterYear }),
        ...(filterUser && { userId: filterUser }),
      });
      const r = await fetch(`/api/research/activities?${params}`);
      const d = await r.json();
      setActs(d.activities || []);
      setActTotal(d.total || 0);
      setActYears(d.years || []);
    } finally {
      setLoading(false);
    }
  }, [search, filterYear, filterUser]);

  // ── Tab switch / filter change ─────────────────────────────────────────────
  useEffect(() => {
    const isAct = activeTab === 'HOAT_DONG';
    setIsActivityTab(isAct);
    if (isAct) {
      setActPage(1);
      fetchActs(1);
    } else {
      setPubPage(1);
      fetchPubs(activeTab, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, filterYear, filterUser]);

  useEffect(() => {
    if (!isActivityTab) fetchPubs(activeTab, pubPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubPage]);

  useEffect(() => {
    if (isActivityTab) fetchActs(actPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actPage]);

  useEffect(() => { fetchPubStats(); }, [fetchPubStats]);

  // ─── Publication CRUD ──────────────────────────────────────────────────────

  function openCreatePub() {
    setEditingPub(null);
    setPubForm({ ...EMPTY_PUB, type: activeTab });
    setShowPubDialog(true);
  }

  function openEditPub(p: Publication) {
    setEditingPub(p);
    setPubForm({
      id: p.id, type: p.type, title: p.title, year: p.year,
      month: p.month ? String(p.month) : '',
      role: p.role, publisher: p.publisher || '', organization: p.organization || '',
      issueNumber: p.issueNumber || '', pageNumbers: p.pageNumbers || '',
      targetUsers: p.targetUsers || '', coAuthors: p.coAuthors || '',
      notes: p.notes || '', userId: p.user?.id || '',
    });
    setShowPubDialog(true);
  }

  async function savePub() {
    if (!pubForm.title || !pubForm.year || !pubForm.role || !pubForm.type) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setPubSaving(true);
    try {
      const method = editingPub ? 'PUT' : 'POST';
      const body = { ...pubForm, year: Number(pubForm.year), month: pubForm.month ? Number(pubForm.month) : null };
      const r = await fetch('/api/scientific-publications', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lỗi lưu');
      toast.success(d.message || 'Lưu thành công');
      setShowPubDialog(false);
      fetchPubs(activeTab, pubPage);
      fetchPubStats();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPubSaving(false);
    }
  }

  // ─── Activity CRUD ─────────────────────────────────────────────────────────

  function openCreateAct() {
    setEditingAct(null);
    setActForm({ ...EMPTY_ACT });
    setShowActDialog(true);
  }

  function openEditAct(a: Activity) {
    setEditingAct(a);
    setActForm({
      id: a.id, title: a.title, year: a.year, role: a.role,
      level: a.level, type: a.type, institution: a.institution || '',
      result: a.result || '', notes: a.notes || '', userId: a.user?.id || '',
    });
    setShowActDialog(true);
  }

  async function saveAct() {
    if (!actForm.title || !actForm.year || !actForm.role || !actForm.level || !actForm.type) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setActSaving(true);
    try {
      const method = editingAct ? 'PUT' : 'POST';
      const body = { ...actForm, year: Number(actForm.year) };
      const r = await fetch('/api/research/activities', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lỗi lưu');
      toast.success(d.message || 'Lưu thành công');
      setShowActDialog(false);
      fetchActs(actPage);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActSaving(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url = deleteTarget.isAct
        ? `/api/research/activities?id=${deleteTarget.id}`
        : `/api/scientific-publications?id=${deleteTarget.id}`;
      const r = await fetch(url, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lỗi xóa');
      toast.success('Đã xóa thành công');
      setDeleteTarget(null);
      if (deleteTarget.isAct) fetchActs(actPage);
      else { fetchPubs(activeTab, pubPage); fetchPubStats(); }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const totalPubs = Object.values(pubStats).reduce((a, b) => a + b, 0);
  const currentYears = isActivityTab ? actYears : pubYears;

  function roleBadge(role: string, isAct: boolean) {
    const label = isAct ? ACT_ROLE_LABELS[role] : PUB_ROLE_LABELS[role];
    const colors: Record<string, string> = {
      CHU_BIEN: 'bg-violet-100 text-violet-700', CHU_NHIEM: 'bg-violet-100 text-violet-700',
      THAM_GIA: 'bg-blue-100 text-blue-700', THANH_VIEN: 'bg-slate-100 text-slate-600',
      DONG_TAC_GIA: 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
        {label || role}
      </span>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-white px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Quản lý Nghiên cứu Khoa học</h1>
        </div>
        <p className="text-indigo-100 text-sm">Đề tài · Sáng kiến · Giáo trình · Bài báo · Tài liệu · Hoạt động nghiên cứu</p>
        {/* M09 Cross-links */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Link href="/dashboard/research/projects" className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors">
            <FlaskConical className="w-3.5 h-3.5" />
            Đề tài NCKH (vòng đời M09)
          </Link>
          <Link href="/dashboard/research/publications" className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            Kho Công bố KH (M09)
          </Link>
          <Link href="/dashboard/research/scientists" className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors">
            <Users className="w-3.5 h-3.5" />
            Nhà khoa học (M09)
          </Link>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-3 mt-5 lg:grid-cols-8">
          {PUB_TABS.map(t => {
            const Icon = t.icon;
            const count = pubStats[t.key] || 0;
            const active = activeTab === t.key && !isActivityTab;
            return (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setIsActivityTab(false); }}
                className={`rounded-xl p-3 text-left transition-all ${
                  active
                    ? 'bg-white shadow-xl scale-105 ring-2 ring-white/60'
                    : 'bg-white/95 hover:bg-white shadow-md hover:shadow-lg hover:scale-102'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${active ? 'text-indigo-600' : TAB_ICON_COLOR[t.color]}`} />
                <div className={`text-lg font-bold ${active ? 'text-indigo-700' : TAB_COUNT_COLOR[t.color]}`}>{count}</div>
                <div className={`text-xs leading-tight ${active ? 'text-indigo-500' : 'text-slate-500'}`}>{t.label}</div>
              </button>
            );
          })}
          {/* Activity tile */}
          <button
            onClick={() => { setActiveTab('HOAT_DONG'); setIsActivityTab(true); }}
            className={`rounded-xl p-3 text-left transition-all ${
              isActivityTab
                ? 'bg-white shadow-xl scale-105 ring-2 ring-white/60'
                : 'bg-white/95 hover:bg-white shadow-md hover:shadow-lg hover:scale-102'
            }`}
          >
            <GraduationCap className={`w-4 h-4 mb-1 ${isActivityTab ? 'text-indigo-600' : 'text-indigo-500'}`} />
            <div className={`text-lg font-bold ${isActivityTab ? 'text-indigo-700' : 'text-indigo-600'}`}>{isActivityTab ? actTotal : '...'}</div>
            <div className={`text-xs leading-tight ${isActivityTab ? 'text-indigo-500' : 'text-slate-500'}`}>Hoạt động NC</div>
          </button>
        </div>
      </div>

      {/* Data system info banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Trang này hiển thị dữ liệu hệ thống cũ (legacy)</span>
          {' '}— nhập trực tiếp qua form bên dưới, không theo dõi vòng đời đề tài.{' '}
          Để quản lý đề tài đầy đủ (phê duyệt, mốc tiến độ, kinh phí, nhà khoa học), sử dụng{' '}
          <Link href="/dashboard/research/projects" className="font-semibold underline underline-offset-2 hover:text-amber-900">
            Hệ thống M09
          </Link>.{' '}
          Dữ liệu legacy đã được đồng bộ sang M09 qua script bridge — các thay đổi mới nên được nhập tại M09.
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b shadow-sm px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm tiêu đề, tác giả, tổ chức..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterYear || 'all'} onValueChange={v => setFilterYear(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm</SelectItem>
            {currentYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterUser || 'all'} onValueChange={v => setFilterUser(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo người dùng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhân sự</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}{u.rank ? ` (${u.rank})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterYear(''); setFilterUser(''); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại
        </Button>

        <div className="ml-auto">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={isActivityTab ? openCreateAct : openCreatePub}
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm {isActivityTab ? 'Hoạt động' : PUB_TABS.find(t => t.key === activeTab)?.label || ''}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-xl border shadow-md overflow-hidden">
          {/* Tab header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isActivityTab ? (() => {
                const tab = PUB_TABS.find(t => t.key === activeTab);
                const Icon = tab?.icon || FlaskConical;
                return (
                  <>
                    <span className={`w-3 h-3 rounded-full ${TAB_COLOR[tab?.color || 'violet']}`} />
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-800">{tab?.label}</span>
                    <Badge variant="secondary">{pubTotal} công trình</Badge>
                  </>
                );
              })() : (
                <>
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  <GraduationCap className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-800">Hoạt động Nghiên cứu</span>
                  <Badge variant="secondary">{actTotal} hoạt động</Badge>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải...
            </div>
          ) : isActivityTab ? (
            /* ── Activity Table ── */
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 text-xs font-medium">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Tiêu đề / Tổ chức thực hiện</TableHead>
                  <TableHead className="w-36">Nghiên cứu viên</TableHead>
                  <TableHead className="w-24">Vai trò</TableHead>
                  <TableHead className="w-36">Cấp độ</TableHead>
                  <TableHead className="w-28">Loại hình</TableHead>
                  <TableHead className="w-16">Năm</TableHead>
                  <TableHead className="w-24">Kết quả</TableHead>
                  <TableHead className="w-20 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      Không có dữ liệu hoạt động nghiên cứu
                    </TableCell>
                  </TableRow>
                ) : acts.map((a, i) => (
                  <TableRow key={a.id} className="hover:bg-indigo-50/40 text-sm transition-colors">
                    <TableCell className="text-gray-400">{(actPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-2">{a.title}</div>
                      {a.institution && <div className="text-xs text-gray-500 mt-0.5">{a.institution}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800">{a.user?.name}</div>
                      {a.user?.rank && <div className="text-xs text-gray-500">{a.user.rank}</div>}
                    </TableCell>
                    <TableCell>{roleBadge(a.role, true)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{a.level}</span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{a.type}</TableCell>
                    <TableCell className="text-center font-mono text-gray-700">{a.year}</TableCell>
                    <TableCell>
                      {a.result ? (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded line-clamp-1">{a.result}</span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAct(a)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: a.id, title: a.title, isAct: true })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* ── Publication Table ── */
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 text-xs font-medium">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-36">Tác giả</TableHead>
                  <TableHead className="w-24">Vai trò</TableHead>
                  {activeTab === 'BAI_BAO' && <TableHead className="w-32">Tạp chí / Số</TableHead>}
                  {['GIAO_TRINH','GIAO_TRINH_DT','BAI_TAP','TAI_LIEU'].includes(activeTab) && <TableHead className="w-32">NXB / Đối tượng</TableHead>}
                  {activeTab === 'SANG_KIEN' && <TableHead className="w-36">Tổ chức công nhận</TableHead>}
                  {activeTab === 'DE_TAI' && <TableHead className="w-36">Cơ quan chủ trì</TableHead>}
                  {activeTab === 'BAI_BAO' && <TableHead className="w-16">Tháng</TableHead>}
                  <TableHead className="w-16">Năm</TableHead>
                  <TableHead className="w-20 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : pubs.map((p, i) => (
                  <TableRow key={p.id} className="hover:bg-indigo-50/40 text-sm transition-colors">
                    <TableCell className="text-gray-400">{(pubPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-2">{p.title}</div>
                      {p.coAuthors && <div className="text-xs text-gray-500 mt-0.5">Đồng tác giả: {p.coAuthors}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800">{p.user?.name}</div>
                      {p.user?.rank && <div className="text-xs text-gray-500">{p.user.rank}</div>}
                    </TableCell>
                    <TableCell>{roleBadge(p.role, false)}</TableCell>
                    {activeTab === 'BAI_BAO' && (
                      <TableCell className="text-xs text-gray-600">
                        <div>{p.publisher}</div>
                        {p.issueNumber && <div className="text-gray-400">Số {p.issueNumber}{p.pageNumbers ? `, tr.${p.pageNumbers}` : ''}</div>}
                      </TableCell>
                    )}
                    {['GIAO_TRINH','GIAO_TRINH_DT','BAI_TAP','TAI_LIEU'].includes(activeTab) && (
                      <TableCell className="text-xs text-gray-600">
                        <div>{p.publisher}</div>
                        {p.targetUsers && <div className="text-gray-400">{p.targetUsers}</div>}
                      </TableCell>
                    )}
                    {activeTab === 'SANG_KIEN' && (
                      <TableCell className="text-xs text-gray-600">{p.organization || '—'}</TableCell>
                    )}
                    {activeTab === 'DE_TAI' && (
                      <TableCell className="text-xs text-gray-600">{p.organization || p.publisher || '—'}</TableCell>
                    )}
                    {activeTab === 'BAI_BAO' && (
                      <TableCell className="text-center text-gray-600">{p.month || '—'}</TableCell>
                    )}
                    <TableCell className="text-center font-mono text-gray-700">{p.year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPub(p)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: p.id, title: p.title, isAct: false })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {(isActivityTab ? actTotal : pubTotal) > PAGE_SIZE && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>
                Hiển thị {((isActivityTab ? actPage : pubPage) - 1) * PAGE_SIZE + 1}–
                {Math.min((isActivityTab ? actPage : pubPage) * PAGE_SIZE, isActivityTab ? actTotal : pubTotal)}
                {' '}/ {isActivityTab ? actTotal : pubTotal}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  disabled={(isActivityTab ? actPage : pubPage) <= 1}
                  onClick={() => isActivityTab ? setActPage(p => p - 1) : setPubPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm"
                  disabled={(isActivityTab ? actPage : pubPage) * PAGE_SIZE >= (isActivityTab ? actTotal : pubTotal)}
                  onClick={() => isActivityTab ? setActPage(p => p + 1) : setPubPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Publication Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showPubDialog} onOpenChange={setShowPubDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              {editingPub ? 'Chỉnh sửa' : 'Thêm mới'} — {PUB_TABS.find(t => t.key === pubForm.type)?.label || pubForm.type}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Người sở hữu */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Nghiên cứu viên</Label>
                <Select value={pubForm.userId || 'self'} onValueChange={v => setPubForm(f => ({ ...f, userId: v === 'self' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn nghiên cứu viên" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">— Tôi (mặc định) —</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}{u.rank ? ` · ${u.rank}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tiêu đề */}
            <div>
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Textarea rows={2} value={pubForm.title} onChange={e => setPubForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên công trình..." />
            </div>

            {/* Năm / Tháng / Vai trò */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Năm <span className="text-red-500">*</span></Label>
                <Input type="number" value={pubForm.year} onChange={e => setPubForm(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              {activeTab === 'BAI_BAO' && (
                <div>
                  <Label>Tháng</Label>
                  <Select value={pubForm.month ? String(pubForm.month) : 'none'} onValueChange={v => setPubForm(f => ({ ...f, month: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Tháng" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Vai trò <span className="text-red-500">*</span></Label>
                <Select value={pubForm.role} onValueChange={v => setPubForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHU_BIEN">Chủ biên</SelectItem>
                    <SelectItem value="THAM_GIA">Tham gia</SelectItem>
                    <SelectItem value="DONG_TAC_GIA">Đồng tác giả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type-specific fields */}
            {activeTab === 'BAI_BAO' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tên tạp chí / NXB</Label>
                  <Input value={pubForm.publisher} onChange={e => setPubForm(f => ({ ...f, publisher: e.target.value }))} placeholder="Tên tạp chí..." />
                </div>
                <div>
                  <Label>Số phát hành</Label>
                  <Input value={pubForm.issueNumber} onChange={e => setPubForm(f => ({ ...f, issueNumber: e.target.value }))} placeholder="Số X/2024" />
                </div>
                <div>
                  <Label>Trang</Label>
                  <Input value={pubForm.pageNumbers} onChange={e => setPubForm(f => ({ ...f, pageNumbers: e.target.value }))} placeholder="tr.1-15" />
                </div>
              </div>
            )}

            {['GIAO_TRINH','GIAO_TRINH_DT','BAI_TAP','TAI_LIEU'].includes(activeTab) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nhà xuất bản</Label>
                  <Input value={pubForm.publisher} onChange={e => setPubForm(f => ({ ...f, publisher: e.target.value }))} placeholder="NXB Quân đội..." />
                </div>
                <div>
                  <Label>Đối tượng sử dụng</Label>
                  <Input value={pubForm.targetUsers} onChange={e => setPubForm(f => ({ ...f, targetUsers: e.target.value }))} placeholder="Học viên hệ chính quy..." />
                </div>
              </div>
            )}

            {activeTab === 'SANG_KIEN' && (
              <div>
                <Label>Tổ chức công nhận</Label>
                <Input value={pubForm.organization} onChange={e => setPubForm(f => ({ ...f, organization: e.target.value }))} placeholder="Hội đồng sáng kiến cấp..." />
              </div>
            )}

            {activeTab === 'DE_TAI' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cơ quan chủ trì</Label>
                  <Input value={pubForm.organization} onChange={e => setPubForm(f => ({ ...f, organization: e.target.value }))} placeholder="Học viện Hậu cần..." />
                </div>
                <div>
                  <Label>Cơ quan tài trợ</Label>
                  <Input value={pubForm.publisher} onChange={e => setPubForm(f => ({ ...f, publisher: e.target.value }))} placeholder="Bộ Quốc phòng..." />
                </div>
              </div>
            )}

            {/* Co-authors & Notes */}
            <div>
              <Label>Đồng tác giả</Label>
              <Input value={pubForm.coAuthors} onChange={e => setPubForm(f => ({ ...f, coAuthors: e.target.value }))} placeholder="Nguyễn Văn A, Trần Văn B..." />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea rows={2} value={pubForm.notes} onChange={e => setPubForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ghi chú thêm..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPubDialog(false)}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={savePub} disabled={pubSaving}>
              {pubSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingPub ? 'Lưu thay đổi' : 'Thêm công trình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Activity Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showActDialog} onOpenChange={setShowActDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              {editingAct ? 'Chỉnh sửa' : 'Thêm'} Hoạt động Nghiên cứu
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Nghiên cứu viên</Label>
              <Select value={actForm.userId || 'self'} onValueChange={v => setActForm(f => ({ ...f, userId: v === 'self' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn nghiên cứu viên" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">— Tôi (mặc định) —</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}{u.rank ? ` · ${u.rank}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tên đề tài / hoạt động <span className="text-red-500">*</span></Label>
              <Textarea rows={2} value={actForm.title} onChange={e => setActForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên hoạt động nghiên cứu..." />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Năm <span className="text-red-500">*</span></Label>
                <Input type="number" value={actForm.year} onChange={e => setActForm(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Vai trò <span className="text-red-500">*</span></Label>
                <Select value={actForm.role} onValueChange={v => setActForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHU_NHIEM">Chủ nhiệm</SelectItem>
                    <SelectItem value="THAM_GIA">Tham gia</SelectItem>
                    <SelectItem value="THANH_VIEN">Thành viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cấp độ <span className="text-red-500">*</span></Label>
                <Select value={actForm.level} onValueChange={v => setActForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loại hình NC <span className="text-red-500">*</span></Label>
                <Select value={actForm.type} onValueChange={v => setActForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESEARCH_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cơ quan / Tổ chức</Label>
                <Input value={actForm.institution} onChange={e => setActForm(f => ({ ...f, institution: e.target.value }))} placeholder="Học viện Hậu cần..." />
              </div>
            </div>

            <div>
              <Label>Kết quả đạt được</Label>
              <Textarea rows={2} value={actForm.result} onChange={e => setActForm(f => ({ ...f, result: e.target.value }))} placeholder="Kết quả nghiệm thu, xếp loại..." />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea rows={2} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ghi chú thêm..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActDialog(false)}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveAct} disabled={actSaving}>
              {actSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingAct ? 'Lưu thay đổi' : 'Thêm hoạt động'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Bạn có chắc muốn xóa{' '}
            <span className="font-semibold text-gray-800">"{deleteTarget?.title}"</span>?
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
