/**
 * RBAC Management - Trung tâm Phân quyền
 * Redesigned v3.0: Overview Stats + Audit Log + Interactive Charts
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import Link from 'next/link';
import { usePermissionRefresh } from '@/lib/permission-utils';
import { useSession } from 'next-auth/react';
import {
  Shield, Users, Key, Plus, Trash2, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Building2, Grid3X3, UserPlus,
  Calendar, Eye, FileEdit, Download, Upload, Check, ArrowLeft,
  ChevronRight, ChevronLeft, ListFilter, Layers, Pencil,
  CheckSquare, Square, Star, Settings2, BarChart3, ClipboardList,
  Activity, MonitorSmartphone,
} from 'lucide-react';
import { SidebarPreviewTab } from '@/components/dashboard/admin/rbac/sidebar-preview-tab';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
  positionScope: string;
  level: number;
  isActive: boolean;
  _count?: { positionFunctions: number; userPositions: number };
}

interface FunctionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  description?: string;
  isCritical: boolean;
  isActive: boolean;
}

interface PositionFunction {
  id: string;
  positionId: string;
  functionId: string;
  scope: string;
  position?: { id: string; code: string; name: string };
  function?: { id: string; code: string; name: string; module: string };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  rank?: string;
}

interface UnitItem {
  id: string;
  name: string;
  code: string;
}

interface UserPosition {
  id: string;
  userId: string;
  positionId: string;
  unitId?: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
  user?: UserItem;
  position?: Position;
  unit?: UnitItem;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  usersWithUnit: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODULE_META: Record<string, {
  label: string; textClass: string; bgClass: string; borderClass: string; barColor: string;
}> = {
  PERSONNEL:  { label: 'Cán bộ',      textClass: 'text-blue-700',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-200',    barColor: '#3b82f6' },
  PARTY:      { label: 'Đảng viên',   textClass: 'text-red-700',     bgClass: 'bg-red-50',     borderClass: 'border-red-200',     barColor: '#ef4444' },
  INSURANCE:  { label: 'Bảo hiểm',    textClass: 'text-teal-700',    bgClass: 'bg-teal-50',    borderClass: 'border-teal-200',    barColor: '#14b8a6' },
  POLICY:     { label: 'Chính sách',  textClass: 'text-orange-700',  bgClass: 'bg-orange-50',  borderClass: 'border-orange-200',  barColor: '#f97316' },
  AWARDS:     { label: 'Khen thưởng', textClass: 'text-yellow-700',  bgClass: 'bg-yellow-50',  borderClass: 'border-yellow-200',  barColor: '#ca8a04' },
  TRAINING:   { label: 'Đào tạo',     textClass: 'text-green-700',   bgClass: 'bg-green-50',   borderClass: 'border-green-200',   barColor: '#22c55e' },
  EDUCATION:  { label: 'Giáo dục',    textClass: 'text-cyan-700',    bgClass: 'bg-cyan-50',    borderClass: 'border-cyan-200',    barColor: '#06b6d4' },
  FACULTY:    { label: 'Giảng viên',  textClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-200',   barColor: '#f59e0b' },
  STUDENT:    { label: 'Học viên',    textClass: 'text-violet-700',  bgClass: 'bg-violet-50',  borderClass: 'border-violet-200',  barColor: '#8b5cf6' },
  RESEARCH:   { label: 'NCKH',        textClass: 'text-purple-700',  bgClass: 'bg-purple-50',  borderClass: 'border-purple-200',  barColor: '#a855f7' },
  DATA:       { label: 'BigData',     textClass: 'text-pink-700',    bgClass: 'bg-pink-50',    borderClass: 'border-pink-200',    barColor: '#ec4899' },
  SYSTEM:     { label: 'Hệ thống',    textClass: 'text-gray-700',    bgClass: 'bg-gray-50',    borderClass: 'border-gray-200',    barColor: '#6b7280' },
  DASHBOARD:  { label: 'Dashboard',   textClass: 'text-sky-700',     bgClass: 'bg-sky-50',     borderClass: 'border-sky-200',     barColor: '#0ea5e9' },
  AI:         { label: 'AI',          textClass: 'text-indigo-700',  bgClass: 'bg-indigo-50',  borderClass: 'border-indigo-200',  barColor: '#6366f1' },
  AUDIT:      { label: 'Kiểm toán',   textClass: 'text-slate-700',   bgClass: 'bg-slate-50',   borderClass: 'border-slate-200',   barColor: '#64748b' },
};
const DEFAULT_MODULE_META = { label: 'Khác', textClass: 'text-slate-600', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', barColor: '#94a3b8' };

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; bgClass: string }> = {
  VIEW:    { label: 'Xem',       icon: Eye,         bgClass: 'bg-blue-100 text-blue-700' },
  CREATE:  { label: 'Tạo mới',   icon: Plus,        bgClass: 'bg-green-100 text-green-700' },
  UPDATE:  { label: 'Cập nhật',  icon: FileEdit,    bgClass: 'bg-amber-100 text-amber-700' },
  DELETE:  { label: 'Xóa',       icon: Trash2,      bgClass: 'bg-red-100 text-red-700' },
  APPROVE: { label: 'Phê duyệt', icon: CheckCircle, bgClass: 'bg-violet-100 text-violet-700' },
  REJECT:  { label: 'Từ chối',   icon: XCircle,     bgClass: 'bg-rose-100 text-rose-700' },
  EXPORT:  { label: 'Xuất',      icon: Download,    bgClass: 'bg-teal-100 text-teal-700' },
  IMPORT:  { label: 'Nhập',      icon: Upload,      bgClass: 'bg-cyan-100 text-cyan-700' },
  SUBMIT:  { label: 'Gửi',       icon: Upload,      bgClass: 'bg-purple-100 text-purple-700' },
};

const SCOPE_CONFIG: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  SELF:       { label: 'Cá nhân',    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',    dotClass: 'bg-slate-400' },
  UNIT:       { label: 'Đơn vị',     badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',       dotClass: 'bg-blue-500' },
  DEPARTMENT: { label: 'Khoa/Phòng', badgeClass: 'bg-green-100 text-green-700 border-green-300',    dotClass: 'bg-green-500' },
  ACADEMY:    { label: 'Học viện',   badgeClass: 'bg-violet-100 text-violet-700 border-violet-300', dotClass: 'bg-violet-500' },
};
const SCOPE_OPTIONS = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];

const POSITION_SCOPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  SELF:       { label: 'Cá nhân',    badgeClass: 'bg-slate-100 text-slate-600' },
  UNIT:       { label: 'Đơn vị',     badgeClass: 'bg-blue-100 text-blue-700' },
  DEPARTMENT: { label: 'Khoa/Phòng', badgeClass: 'bg-green-100 text-green-700' },
  ACADEMY:    { label: 'Học viện',   badgeClass: 'bg-violet-100 text-violet-700' },
};

const TOOLTIP_STYLE = {
  background: 'white', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '12px', padding: '8px 12px',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RBACManagementPage() {
  const { toast } = useToast();
  useSession();
  const { refreshAll } = usePermissionRefresh();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // ── Core data ──
  const [positions, setPositions] = useState<Position[]>([]);
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [positionFunctions, setPositionFunctions] = useState<PositionFunction[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // ── Audit ──
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Matrix tab ──
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [positionScopeFilter, setPositionScopeFilter] = useState('ALL');
  const [selectedModule, setSelectedModule] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [savingFuncId, setSavingFuncId] = useState<string | null>(null);

  // ── User-position tab ──
  const [userSearch, setUserSearch] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: '', positionId: '', unitId: '', isPrimary: false,
    startDate: new Date().toISOString().split('T')[0],
  });
  const [deleteUpId, setDeleteUpId] = useState<string | null>(null);

  // ── Position management tab ──
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionForm, setPositionForm] = useState({
    code: '', name: '', description: '', positionScope: 'UNIT', level: 0, isActive: true,
  });
  const [deletePositionId, setDeletePositionId] = useState<string | null>(null);
  const [posMgmtSearch, setPosMgmtSearch] = useState('');

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchPositions = useCallback(async () => {
    const res = await fetch('/api/admin/rbac/positions?withStats=true').catch(() => null);
    if (res?.ok) { const d = await res.json(); setPositions(d.positions || []); }
  }, []);

  const fetchFunctions = useCallback(async () => {
    const res = await fetch('/api/admin/rbac/functions').catch(() => null);
    if (res?.ok) { const d = await res.json(); setFunctions(d.functions || []); }
  }, []);

  const fetchPositionFunctions = useCallback(async (posId?: string) => {
    const url = posId
      ? `/api/admin/rbac/position-functions?positionId=${posId}`
      : '/api/admin/rbac/position-functions';
    const res = await fetch(url).catch(() => null);
    if (res?.ok) { const d = await res.json(); setPositionFunctions(d.assignments || []); }
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/rbac/users?limit=500').catch(() => null);
    if (res?.ok) { const d = await res.json(); setUsers(d.data || []); }
  }, []);

  const fetchUnits = useCallback(async () => {
    const res = await fetch('/api/units?limit=200').catch(() => null);
    if (res?.ok) { const d = await res.json(); setUnits(d.units || []); }
  }, []);

  const fetchUserPositions = useCallback(async () => {
    const res = await fetch('/api/admin/rbac/user-positions').catch(() => null);
    if (res?.ok) { const d = await res.json(); setUserPositions(d.data || []); }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/rbac/users/stats').catch(() => null);
    if (res?.ok) { const d = await res.json(); setUserStats(d); }
  }, []);

  const fetchAuditLogs = useCallback(async (page = 1) => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/rbac/audit-logs?limit=20&page=${page}`).catch(() => null);
      if (res?.ok) {
        const d = await res.json();
        setAuditLogs(d.logs || []);
        setAuditTotal(d.total || 0);
      }
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchPositions(), fetchFunctions(), fetchPositionFunctions(),
        fetchUsers(), fetchUnits(), fetchUserPositions(), fetchStats(),
      ]);
      setLoading(false);
    })();
  }, [fetchPositions, fetchFunctions, fetchPositionFunctions, fetchUsers, fetchUnits, fetchUserPositions, fetchStats]);

  useEffect(() => {
    if (selectedPositionId) fetchPositionFunctions(selectedPositionId);
  }, [selectedPositionId, fetchPositionFunctions]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs(auditPage);
  }, [activeTab, auditPage, fetchAuditLogs]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const selectedPosition = useMemo(
    () => positions.find(p => p.id === selectedPositionId),
    [positions, selectedPositionId],
  );

  const availableModules = useMemo(() => {
    const mods = Array.from(new Set(functions.filter(f => f.isActive).map(f => f.module)));
    return mods.sort();
  }, [functions]);

  useEffect(() => {
    if (availableModules.length > 0 && !selectedModule) setSelectedModule(availableModules[0]);
  }, [availableModules, selectedModule]);

  // pfMap is scoped to the selected position only — prevents stale cross-position assignments
  const pfMap = useMemo(() => {
    const map = new Map<string, PositionFunction>();
    const relevant = selectedPositionId
      ? positionFunctions.filter(pf => pf.positionId === selectedPositionId)
      : positionFunctions;
    relevant.forEach(pf => map.set(pf.functionId, pf));
    return map;
  }, [positionFunctions, selectedPositionId]);

  // System-wide assigned function ids for overview chart (all positions, not filtered)
  const allAssignedFuncIds = useMemo(() =>
    new Set<string>(positionFunctions.map(pf => pf.functionId)),
  [positionFunctions]);

  const moduleFunctions = useMemo(() => functions.filter(f => {
    if (!f.isActive || f.module !== selectedModule) return false;
    if (actionFilter !== 'ALL' && f.actionType !== actionFilter) return false;
    if (funcSearch) {
      const q = funcSearch.toLowerCase();
      return f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
    }
    return true;
  }), [functions, selectedModule, actionFilter, funcSearch]);

  const moduleStats = useMemo(() => {
    const stats: Record<string, { total: number; assigned: number }> = {};
    for (const mod of availableModules) {
      const mFuncs = functions.filter(f => f.isActive && f.module === mod);
      stats[mod] = { total: mFuncs.length, assigned: mFuncs.filter(f => allAssignedFuncIds.has(f.id)).length };
    }
    return stats;
  }, [availableModules, functions, allAssignedFuncIds]);

  const totalAssigned = positionFunctions.length;
  const totalFunctions = functions.filter(f => f.isActive).length;

  const filteredPositions = useMemo(() => positions.filter(p => {
    const matchScope = positionScopeFilter === 'ALL' || p.positionScope === positionScopeFilter;
    const matchSearch = !positionSearch
      || p.name.toLowerCase().includes(positionSearch.toLowerCase())
      || p.code.toLowerCase().includes(positionSearch.toLowerCase());
    return matchScope && matchSearch;
  }), [positions, positionScopeFilter, positionSearch]);

  // Chart data – module coverage
  const moduleCoverageData = useMemo(() =>
    availableModules.map(mod => {
      const meta = MODULE_META[mod] || DEFAULT_MODULE_META;
      const stats = moduleStats[mod] || { total: 0, assigned: 0 };
      return {
        name: meta.label,
        assigned: stats.assigned,
        total: stats.total,
        pct: stats.total > 0 ? Math.round(stats.assigned / stats.total * 100) : 0,
        fill: meta.barColor,
      };
    }),
  [availableModules, moduleStats]);

  // Scope distribution
  const scopeDistribution = useMemo(() =>
    ['ACADEMY', 'DEPARTMENT', 'UNIT', 'SELF'].map(scope => ({
      scope,
      label: POSITION_SCOPE_CONFIG[scope]?.label || scope,
      count: positions.filter(p => p.positionScope === scope && p.isActive).length,
    })),
  [positions]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectPosition = (posId: string) => {
    setSelectedPositionId(posId);
    setFuncSearch('');
    setActionFilter('ALL');
    setSelectedModule(availableModules[0] || '');
  };

  const handleToggleFunction = async (func: FunctionItem, checked: boolean) => {
    if (!selectedPositionId) return;
    setSavingFuncId(func.id);
    try {
      if (checked) {
        const res = await fetch('/api/admin/rbac/position-functions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionId: selectedPositionId, functionId: func.id, scope: 'UNIT' }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        toast({ title: 'Đã gán quyền', description: func.name });
      } else {
        const res = await fetch('/api/admin/rbac/position-functions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionId: selectedPositionId, functionId: func.id }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        toast({ title: 'Đã gỡ quyền', description: func.name });
      }
      await fetchPositionFunctions(selectedPositionId);
      await fetchPositions();
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSavingFuncId(null);
    }
  };

  const handleUpdateScope = async (assignmentId: string, newScope: string, funcName: string) => {
    try {
      const res = await fetch('/api/admin/rbac/position-functions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId, scope: newScope }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: 'Cập nhật phạm vi', description: `${funcName} → ${SCOPE_CONFIG[newScope]?.label}` });
      fetchPositionFunctions(selectedPositionId);
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkModule = async (assign: boolean) => {
    if (!selectedPositionId) return;
    const funcsToChange = moduleFunctions.filter(f => assign ? !pfMap.has(f.id) : pfMap.has(f.id));
    for (const f of funcsToChange) await handleToggleFunction(f, assign);
  };

  const handleCreateUserPosition = async () => {
    if (!assignForm.userId || !assignForm.positionId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn người dùng và chức vụ', variant: 'destructive' });
      return;
    }
    const res = await fetch('/api/admin/rbac/user-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignForm),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: 'Đã gán chức vụ' });
      setAssignDialogOpen(false);
      setAssignForm({ userId: '', positionId: '', unitId: '', isPrimary: false, startDate: new Date().toISOString().split('T')[0] });
      fetchUserPositions();
      refreshAll();
    } else {
      toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
    }
  };

  const handleDeleteUserPosition = async () => {
    if (!deleteUpId) return;
    const res = await fetch(`/api/admin/rbac/user-positions?id=${deleteUpId}`, { method: 'DELETE' });
    if (res.ok) { toast({ title: 'Đã xóa gán chức vụ' }); fetchUserPositions(); refreshAll(); }
    else { toast({ title: 'Lỗi', variant: 'destructive' }); }
    setDeleteUpId(null);
  };

  const openCreatePosition = () => {
    setEditingPosition(null);
    setPositionForm({ code: '', name: '', description: '', positionScope: 'UNIT', level: 0, isActive: true });
    setPositionDialogOpen(true);
  };

  const openEditPosition = (pos: Position) => {
    setEditingPosition(pos);
    setPositionForm({ code: pos.code, name: pos.name, description: pos.description || '', positionScope: pos.positionScope, level: pos.level, isActive: pos.isActive });
    setPositionDialogOpen(true);
  };

  const handleSavePosition = async () => {
    if (!positionForm.code || !positionForm.name) {
      toast({ title: 'Lỗi', description: 'Mã và tên chức vụ là bắt buộc', variant: 'destructive' });
      return;
    }
    const method = editingPosition ? 'PUT' : 'POST';
    const body = editingPosition ? { ...positionForm, id: editingPosition.id } : positionForm;
    const res = await fetch('/api/admin/rbac/positions', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: editingPosition ? 'Đã cập nhật' : 'Đã tạo', description: positionForm.name });
      setPositionDialogOpen(false);
      fetchPositions();
    } else {
      toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
    }
  };

  const handleDeletePosition = async () => {
    if (!deletePositionId) return;
    const res = await fetch(`/api/admin/rbac/positions?id=${deletePositionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast({ title: 'Đã xóa chức vụ' });
      if (selectedPositionId === deletePositionId) setSelectedPositionId('');
      fetchPositions();
    } else {
      toast({ title: 'Không thể xóa', description: data.error, variant: 'destructive' });
    }
    setDeletePositionId(null);
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchPositions(), fetchFunctions(),
      fetchPositionFunctions(selectedPositionId || undefined),
      fetchUserPositions(), fetchStats(),
    ]);
    if (activeTab === 'audit') fetchAuditLogs(auditPage);
    toast({ title: 'Đã làm mới dữ liệu' });
  }, [fetchPositions, fetchFunctions, fetchPositionFunctions, fetchUserPositions, fetchStats, fetchAuditLogs, selectedPositionId, activeTab, auditPage]);

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  const filteredUserPositions = userPositions.filter(up => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return up.user?.name?.toLowerCase().includes(q)
      || up.user?.email?.toLowerCase().includes(q)
      || up.position?.name?.toLowerCase().includes(q)
      || up.unit?.name?.toLowerCase().includes(q);
  });

  const moduleMeta = selectedModule ? (MODULE_META[selectedModule] || DEFAULT_MODULE_META) : DEFAULT_MODULE_META;
  const modStats = selectedModule ? (moduleStats[selectedModule] || { total: 0, assigned: 0 }) : { total: 0, assigned: 0 };
  const allModuleAssigned = modStats.total > 0 && moduleFunctions.every(f => pfMap.has(f.id));
  const noneModuleAssigned = moduleFunctions.every(f => !pfMap.has(f.id));
  const coveragePct = totalFunctions > 0 ? Math.round(totalAssigned / totalFunctions * 100) : 0;
  const activePositions = positions.filter(p => p.isActive).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="space-y-5 p-6 max-w-screen-2xl mx-auto">

          {/* ── Hero Banner ──────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-20 top-8 h-32 w-32 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-0 bottom-0 opacity-[0.04]">
              <Shield className="h-52 w-52" />
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-xs mb-2 transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Quản trị hệ thống
                </Link>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-indigo-200" />
                  <span className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">
                    M01 · Trung tâm Phân quyền RBAC
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Phân quyền Hệ thống</h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Ma trận quyền theo chức vụ · Phân công người dùng · Kiểm toán truy cập
                </p>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Chức vụ',    value: activePositions,         sub: 'hoạt động',    icon: Layers },
                  { label: 'Chức năng',  value: totalFunctions,          sub: `${availableModules.length} phân hệ`, icon: Key },
                  { label: 'Gán quyền',  value: positionFunctions.length, sub: 'pos-function', icon: Grid3X3 },
                  { label: 'Người dùng', value: userStats?.activeUsers ?? userPositions.length, sub: 'active', icon: Users },
                ].map(({ label, value, sub, icon: Icon }) => (
                  <div key={label} className="rounded-xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm min-w-[76px]">
                    <Icon className="h-3.5 w-3.5 text-indigo-200 mx-auto mb-0.5" />
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-[10px] text-indigo-200">{label}</p>
                    <p className="text-[9px] text-indigo-300 opacity-80">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => { openCreatePosition(); setActiveTab('positions'); }}
                className="bg-white text-indigo-700 hover:bg-indigo-50 gap-1.5 font-semibold"
              >
                <Plus className="h-4 w-4" /> Tạo chức vụ
              </Button>
              <Button
                size="sm" variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5"
                onClick={() => setAssignDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4" /> Gán chức vụ
              </Button>
              <Button
                size="sm" variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5 ml-auto"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" /> Làm mới
              </Button>
            </div>
          </div>

          {/* ── Main Tabs ────────────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border shadow-sm h-11">
              <TabsTrigger value="overview"        className="gap-2 px-4"><BarChart3         className="h-4 w-4" /> Tổng quan</TabsTrigger>
              <TabsTrigger value="matrix"          className="gap-2 px-4"><Grid3X3          className="h-4 w-4" /> Ma trận Quyền</TabsTrigger>
              <TabsTrigger value="users"           className="gap-2 px-4"><UserPlus         className="h-4 w-4" /> Gán Chức vụ</TabsTrigger>
              <TabsTrigger value="positions"       className="gap-2 px-4"><Settings2        className="h-4 w-4" /> Chức vụ</TabsTrigger>
              <TabsTrigger value="sidebar-preview" className="gap-2 px-4"><MonitorSmartphone className="h-4 w-4" /> Xem trước Sidebar</TabsTrigger>
              <TabsTrigger value="audit"           className="gap-2 px-4"><ClipboardList    className="h-4 w-4" /> Nhật ký</TabsTrigger>
            </TabsList>

            {/* ═══════════════════════════════════════════════════
                TAB 1: OVERVIEW
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="mt-4 space-y-5">

              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Layers,   border: 'border-l-indigo-500', bg: 'bg-indigo-50',  txt: 'text-indigo-600',  label: 'Chức vụ hoạt động',  value: activePositions,          sub: `${positions.length} tổng` },
                  { icon: Key,      border: 'border-l-emerald-500',bg: 'bg-emerald-50', txt: 'text-emerald-600', label: 'Chức năng hệ thống', value: totalFunctions,           sub: `${availableModules.length} phân hệ` },
                  { icon: Grid3X3,  border: 'border-l-amber-500',  bg: 'bg-amber-50',   txt: 'text-amber-600',   label: 'Tổng gán quyền',     value: positionFunctions.length, sub: 'position-function' },
                  { icon: Users,    border: 'border-l-blue-500',   bg: 'bg-blue-50',    txt: 'text-blue-600',    label: 'Người dùng Active',  value: userStats?.activeUsers ?? 0, sub: `${userStats?.totalUsers ?? 0} tổng` },
                ].map(({ icon: Icon, border, bg, txt, label, value, sub }) => (
                  <div key={label} className={`rounded-xl border bg-white p-4 border-l-4 ${border} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2.5 ${bg}`}><Icon className={`h-5 w-5 ${txt}`} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">{label}</p>
                        <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Module coverage bar chart */}
                <div className="lg:col-span-2">
                  <Card className="shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        Mức độ phân quyền theo phân hệ
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Cột xám = tổng quyền · Cột màu = đã gán (toàn hệ thống)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {moduleCoverageData.length === 0 ? (
                        <div className="flex items-center justify-center h-52 text-slate-400 text-sm">
                          Chưa có dữ liệu phân quyền
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={270}>
                          <BarChart data={moduleCoverageData} margin={{ top: 4, right: 8, left: -16, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fill: '#64748b' }}
                              angle={-40}
                              textAnchor="end"
                              interval={0}
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <RechartsTooltip
                              contentStyle={TOOLTIP_STYLE}
                              formatter={(value: any, name: string, props: any) => {
                                if (name === 'assigned') {
                                  const { total, pct } = props.payload;
                                  return [`${value}/${total} (${pct}%)`, 'Đã gán'];
                                }
                                return [value, 'Tổng quyền'];
                              }}
                            />
                            <Bar dataKey="total" fill="#e2e8f0" radius={[3,3,0,0]} maxBarSize={22} name="total" />
                            <Bar dataKey="assigned" radius={[3,3,0,0]} maxBarSize={22} name="assigned">
                              {moduleCoverageData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} fillOpacity={0.85} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Scope distribution */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-violet-500" /> Phân bổ Phạm vi
                      </CardTitle>
                      <CardDescription className="text-xs">Chức vụ hoạt động theo phạm vi quyền</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {scopeDistribution.map(({ scope, label, count }) => {
                        const cfg = SCOPE_CONFIG[scope];
                        const total = activePositions || 1;
                        const pct = Math.round(count / total * 100);
                        return (
                          <div key={scope}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
                                <span className="text-xs font-medium text-slate-700">{label}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">{count}</span>
                                <span className="text-xs font-bold text-slate-700 w-8 text-right">{pct}%</span>
                              </div>
                            </div>
                            <Progress
                              value={pct}
                              className={`h-1.5 ${
                                scope === 'ACADEMY'    ? '[&>div]:bg-violet-500' :
                                scope === 'DEPARTMENT' ? '[&>div]:bg-green-500'  :
                                scope === 'UNIT'       ? '[&>div]:bg-blue-500'   :
                                '[&>div]:bg-slate-400'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* User stats */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" /> Thống kê Người dùng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      {userStats ? [
                        { label: 'Tổng tài khoản',  value: userStats.totalUsers,   cls: 'text-slate-700'   },
                        { label: 'Đang hoạt động',   value: userStats.activeUsers,  cls: 'text-emerald-600' },
                        { label: 'Bị khóa/chờ',      value: userStats.lockedUsers,  cls: 'text-red-500'     },
                        { label: 'Thuộc đơn vị',     value: userStats.usersWithUnit, cls: 'text-blue-600'   },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-b-0">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className={`text-sm font-bold ${cls}`}>{value}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 text-center py-2">Đang tải...</p>
                      )}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Gán chức vụ</span>
                          <span className="text-xs font-bold">{userPositions.length} phân công</span>
                        </div>
                        <Progress
                          value={userStats ? Math.round(userPositions.length / Math.max(userStats.totalUsers, 1) * 100) : 0}
                          className="h-1.5 [&>div]:bg-indigo-500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Top positions by function count */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-500" />
                      Mức độ phân quyền theo Chức vụ
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-indigo-600 h-7 text-xs gap-1"
                      onClick={() => setActiveTab('matrix')}>
                      Xem ma trận <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2.5">
                    {[...positions]
                      .filter(p => p.isActive)
                      .sort((a, b) => (b._count?.positionFunctions || 0) - (a._count?.positionFunctions || 0))
                      .slice(0, 10)
                      .map(pos => {
                        const funcCount = pos._count?.positionFunctions || 0;
                        const pct = totalFunctions > 0 ? Math.round(funcCount / totalFunctions * 100) : 0;
                        const scopeMeta = POSITION_SCOPE_CONFIG[pos.positionScope] || POSITION_SCOPE_CONFIG.UNIT;
                        return (
                          <div key={pos.id} className="flex items-center gap-3 group">
                            <button
                              type="button"
                              onClick={() => { handleSelectPosition(pos.id); setActiveTab('matrix'); }}
                              className="flex items-center gap-2 min-w-[200px] hover:text-indigo-600 transition-colors text-left"
                            >
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${scopeMeta.badgeClass}`}>
                                {scopeMeta.label}
                              </span>
                              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 truncate">
                                {pos.name}
                              </span>
                            </button>
                            <div className="flex-1">
                              <Progress value={pct} className="h-2 [&>div]:bg-indigo-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 flex-shrink-0 w-20 text-right">
                              {funcCount} / {totalFunctions}
                            </span>
                          </div>
                        );
                      })
                    }
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════
                TAB 2: PERMISSION MATRIX
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="matrix" className="mt-4">
              <div className="grid grid-cols-12 gap-5 items-start">

                {/* LEFT: Position list */}
                <div className="col-span-12 lg:col-span-3 space-y-3">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3 px-4 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-500" /> Danh sách Chức vụ
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">{filteredPositions.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Tìm chức vụ..." value={positionSearch}
                          onChange={e => setPositionSearch(e.target.value)} className="pl-8 h-8 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['ALL','ACADEMY','DEPARTMENT','UNIT','SELF'].map(s => (
                          <button type="button" key={s} onClick={() => setPositionScopeFilter(s)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                              positionScopeFilter === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                            }`}>
                            {s === 'ALL' ? 'Tất cả' : POSITION_SCOPE_CONFIG[s]?.label}
                          </button>
                        ))}
                      </div>
                      <Separator />
                      <ScrollArea className="h-[480px] -mx-1 px-1">
                        <div className="space-y-1">
                          {filteredPositions.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">Không có chức vụ nào</div>
                          )}
                          {filteredPositions.map(pos => {
                            const isSelected = pos.id === selectedPositionId;
                            const scopeMeta = POSITION_SCOPE_CONFIG[pos.positionScope] || POSITION_SCOPE_CONFIG.UNIT;
                            const funcCount = pos._count?.positionFunctions || 0;
                            return (
                              <button type="button" key={pos.id} onClick={() => handleSelectPosition(pos.id)}
                                className={`w-full text-left rounded-lg px-3 py-2.5 transition-all border-2 ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                }`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pos.isActive ? 'bg-green-400' : 'bg-slate-300'}`} />
                                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {pos.name}
                                      </p>
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono ml-3.5 mt-0.5">{pos.code}</p>
                                    <div className="ml-3.5 mt-1">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${scopeMeta.badgeClass}`}>
                                        {scopeMeta.label}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <Badge variant={isSelected ? 'default' : 'secondary'} className={`text-xs px-1.5 ${isSelected ? 'bg-indigo-600' : ''}`}>
                                      {funcCount}
                                    </Badge>
                                    {isSelected && <ChevronRight className="h-3.5 w-3.5 text-indigo-500" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT: Matrix panel */}
                <div className="col-span-12 lg:col-span-9">
                  {!selectedPositionId ? (
                    <Card className="shadow-sm">
                      <CardContent className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="rounded-2xl bg-slate-100 p-6 mb-4">
                          <Grid3X3 className="h-14 w-14 opacity-40" />
                        </div>
                        <p className="text-lg font-medium">Chọn một Chức vụ để xem ma trận quyền</p>
                        <p className="text-sm mt-1">Bấm vào chức vụ bên trái để bắt đầu phân quyền</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {/* Position summary bar */}
                      <Card className="shadow-sm border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50">
                        <CardContent className="py-4 px-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
                                <Shield className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-800 text-base">{selectedPosition?.name}</h3>
                                  <code className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border">
                                    {selectedPosition?.code}
                                  </code>
                                  <Badge className={`text-xs ${POSITION_SCOPE_CONFIG[selectedPosition?.positionScope||'UNIT']?.badgeClass}`} variant="outline">
                                    {POSITION_SCOPE_CONFIG[selectedPosition?.positionScope||'UNIT']?.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Đang gán <span className="font-bold text-indigo-700">{totalAssigned}</span> / {totalFunctions} chức năng
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Tỷ lệ phân quyền</p>
                                <p className="text-lg font-bold text-indigo-700">{coveragePct}%</p>
                              </div>
                              {/* SVG circular progress — no inline style */}
                              <div className="relative w-14 h-14">
                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                  <circle cx="28" cy="28" r="22" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                  <circle cx="28" cy="28" r="22" fill="none" stroke="#6366f1" strokeWidth="6"
                                    strokeDasharray={`${coveragePct * 1.38} 138`}
                                    strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-indigo-700">{totalAssigned}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Module tabs + function table */}
                      <Card className="shadow-sm">
                        <CardContent className="p-0">
                          {/* Module tab strip */}
                          <div className="overflow-x-auto border-b">
                            <div className="flex min-w-max">
                              {availableModules.map(mod => {
                                const meta = MODULE_META[mod] || DEFAULT_MODULE_META;
                                const stats = moduleStats[mod] || { total: 0, assigned: 0 };
                                const isActive = selectedModule === mod;
                                return (
                                  <button type="button" key={mod}
                                    onClick={() => { setSelectedModule(mod); setFuncSearch(''); setActionFilter('ALL'); }}
                                    className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-all border-b-2 min-w-[90px] hover:bg-slate-50 ${
                                      isActive
                                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}>
                                    <span className={`text-xs font-semibold truncate max-w-[80px] ${isActive ? 'text-indigo-700' : meta.textClass}`}>
                                      {meta.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                                      stats.assigned > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {stats.assigned}/{stats.total}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Module header + bulk controls */}
                          <div className={`px-5 py-3 flex items-center justify-between gap-3 ${moduleMeta.bgClass} border-b`}>
                            <div>
                              <h4 className={`font-semibold text-sm ${moduleMeta.textClass}`}>{moduleMeta.label}</h4>
                              <p className="text-xs text-slate-500">{modStats.assigned} / {modStats.total} quyền đã gán</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input placeholder="Tìm quyền..." value={funcSearch} onChange={e => setFuncSearch(e.target.value)} className="pl-8 h-8 text-xs w-40" />
                              </div>
                              <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="h-8 text-xs w-32">
                                  <ListFilter className="h-3.5 w-3.5 mr-1" />
                                  <SelectValue placeholder="Loại" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                                  {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline"
                                    className="h-8 text-xs gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                                    onClick={() => handleBulkModule(true)}
                                    disabled={allModuleAssigned || moduleFunctions.length === 0}>
                                    <CheckSquare className="h-3.5 w-3.5" /> Chọn tất cả
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gán tất cả quyền trong phân hệ này</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline"
                                    className="h-8 text-xs gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => handleBulkModule(false)}
                                    disabled={noneModuleAssigned || moduleFunctions.length === 0}>
                                    <Square className="h-3.5 w-3.5" /> Bỏ tất cả
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gỡ tất cả quyền trong phân hệ này</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Function table */}
                          <div className="overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="w-12 text-center">Gán</TableHead>
                                  <TableHead>Chức năng</TableHead>
                                  <TableHead className="w-32">Loại</TableHead>
                                  <TableHead className="w-40">Phạm vi</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {moduleFunctions.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                      <p className="text-sm">Không có chức năng nào phù hợp</p>
                                    </TableCell>
                                  </TableRow>
                                ) : moduleFunctions.map(func => {
                                  const pf = pfMap.get(func.id);
                                  const isAssigned = !!pf;
                                  const actionMeta = ACTION_CONFIG[func.actionType] || ACTION_CONFIG.VIEW;
                                  const ActionIcon = actionMeta.icon;
                                  const scopeMeta = pf ? (SCOPE_CONFIG[pf.scope] || SCOPE_CONFIG.UNIT) : null;
                                  const isSaving = savingFuncId === func.id;
                                  return (
                                    <TableRow key={func.id}
                                      className={`transition-colors ${isAssigned ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-slate-50'}`}>
                                      <TableCell className="text-center">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex justify-center">
                                              <Switch
                                                checked={isAssigned} disabled={isSaving}
                                                onCheckedChange={c => handleToggleFunction(func, c)}
                                                className={isAssigned ? 'data-[state=checked]:bg-green-500' : ''}
                                              />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>{isAssigned ? 'Bấm để GỠ quyền này' : 'Bấm để GÁN quyền này'}</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2.5">
                                          <div className={`rounded-md p-1.5 flex-shrink-0 ${actionMeta.bgClass}`}>
                                            <ActionIcon className="h-3.5 w-3.5" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <p className={`text-sm font-medium ${isAssigned ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {func.name}
                                              </p>
                                              {func.isCritical && (
                                                <Tooltip>
                                                  <TooltipTrigger>
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>Quyền nhạy cảm — cần cân nhắc kỹ khi gán</TooltipContent>
                                                </Tooltip>
                                              )}
                                            </div>
                                            <code className="text-[10px] text-slate-400 font-mono">{func.code}</code>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${actionMeta.bgClass}`}>
                                          <ActionIcon className="h-3 w-3" />
                                          {actionMeta.label}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {isAssigned && pf ? (
                                          <Select value={pf.scope}
                                            onValueChange={ns => handleUpdateScope(pf.id, ns, func.name)}
                                            disabled={isSaving}>
                                            <SelectTrigger className={`h-8 text-xs border font-medium ${scopeMeta?.badgeClass}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {SCOPE_OPTIONS.map(s => {
                                                const sc = SCOPE_CONFIG[s];
                                                return (
                                                  <SelectItem key={s} value={s}>
                                                    <div className="flex items-center gap-2">
                                                      <div className={`w-2 h-2 rounded-full ${sc.dotClass}`} />
                                                      <span>{sc.label}</span>
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <span className="text-xs text-slate-300 italic">— chưa gán —</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {isSaving && <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />}
                                        {isAssigned && !isSaving && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {modStats.total > 0 && (
                            <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                              <span>Hiển thị <strong>{moduleFunctions.length}</strong> / {modStats.total} chức năng</span>
                              <span>Đã gán: <strong className="text-green-600">{modStats.assigned}</strong> / {modStats.total} ({Math.round(modStats.assigned/modStats.total*100)}%)</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════
                TAB 3: USER-POSITION
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="users" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-violet-600" /> Gán Chức vụ cho Người dùng
                      </CardTitle>
                      <CardDescription>Quản lý phân công Position cho từng User trong hệ thống</CardDescription>
                    </div>
                    <Button onClick={() => setAssignDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> Gán chức vụ mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Tìm theo tên, email, chức vụ..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-10" />
                    </div>
                    <Badge variant="secondary">{filteredUserPositions.length} bản ghi</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Chức vụ</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Ngày bắt đầu</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUserPositions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p>Không có dữ liệu gán chức vụ</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUserPositions.map(up => (
                        <TableRow key={up.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {up.user?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-800">{up.user?.name || 'N/A'}</p>
                                <p className="text-xs text-slate-400">{up.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{up.position?.name || 'N/A'}</p>
                              <code className="text-[10px] text-slate-400 font-mono">{up.position?.code}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            {up.unit ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-sm">{up.unit.name}</span>
                              </div>
                            ) : <span className="text-slate-300 text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            {up.isPrimary
                              ? <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1"><Star className="h-3 w-3" /> Chính</Badge>
                              : <Badge variant="secondary">Phụ</Badge>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(up.startDate).toLocaleDateString('vi-VN')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => setDeleteUpId(up.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════
                TAB 4: POSITION MANAGEMENT
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="positions" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-orange-600" /> Quản lý Chức vụ (Positions)
                      </CardTitle>
                      <CardDescription>Tạo, chỉnh sửa và phân cấp các chức vụ trong hệ thống RBAC</CardDescription>
                    </div>
                    <Button onClick={openCreatePosition} className="gap-2">
                      <Plus className="h-4 w-4" /> Tạo chức vụ mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Tìm chức vụ..." value={posMgmtSearch} onChange={e => setPosMgmtSearch(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Chức vụ</TableHead>
                        <TableHead>Mã</TableHead>
                        <TableHead>Phạm vi</TableHead>
                        <TableHead className="text-center">Quyền</TableHead>
                        <TableHead className="text-center">Users</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions
                        .filter(p => !posMgmtSearch
                          || p.name.toLowerCase().includes(posMgmtSearch.toLowerCase())
                          || p.code.toLowerCase().includes(posMgmtSearch.toLowerCase()))
                        .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-400">Không có chức vụ nào</TableCell>
                        </TableRow>
                      ) : positions
                          .filter(p => !posMgmtSearch
                            || p.name.toLowerCase().includes(posMgmtSearch.toLowerCase())
                            || p.code.toLowerCase().includes(posMgmtSearch.toLowerCase()))
                          .map(pos => {
                            const scopeMeta = POSITION_SCOPE_CONFIG[pos.positionScope] || POSITION_SCOPE_CONFIG.UNIT;
                            return (
                              <TableRow key={pos.id} className="hover:bg-slate-50">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${pos.isActive ? 'bg-green-400' : 'bg-slate-200'}`} />
                                    <div>
                                      <p className="font-medium text-sm text-slate-800">{pos.name}</p>
                                      {pos.description && <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{pos.description}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{pos.code}</code>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${scopeMeta.badgeClass} text-xs`} variant="outline">{scopeMeta.label}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="text-xs">{pos._count?.positionFunctions || 0} quyền</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="text-xs">{pos._count?.userPositions || 0} users</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {pos.isActive
                                    ? <Badge className="bg-green-100 text-green-700 gap-1 text-xs"><Check className="h-3 w-3" /> Hoạt động</Badge>
                                    : <Badge variant="secondary" className="text-xs">Tạm khóa</Badge>
                                  }
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50"
                                          onClick={() => { handleSelectPosition(pos.id); setActiveTab('matrix'); }}>
                                          <Grid3X3 className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Xem ma trận quyền</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                                          onClick={() => openEditPosition(pos)}>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Chỉnh sửa</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                          onClick={() => setDeletePositionId(pos.id)}
                                          disabled={(pos._count?.positionFunctions || 0) > 0 || (pos._count?.userPositions || 0) > 0}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {(pos._count?.positionFunctions || 0) > 0 || (pos._count?.userPositions || 0) > 0
                                          ? 'Không thể xóa: đang có quyền/user được gán'
                                          : 'Xóa chức vụ'}
                                      </TooltipContent>
                                    </Tooltip>
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

            {/* ═══════════════════════════════════════════════════
                TAB 5: SIDEBAR PREVIEW
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="sidebar-preview" className="mt-4">
              <SidebarPreviewTab positions={positions} />
            </TabsContent>

            {/* ═══════════════════════════════════════════════════
                TAB 6: AUDIT LOG
            ═══════════════════════════════════════════════════ */}
            <TabsContent value="audit" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-slate-600" /> Nhật ký Kiểm toán
                      </CardTitle>
                      <CardDescription>Lịch sử các thao tác và thay đổi trong hệ thống phân quyền</CardDescription>
                    </div>
                    <Button size="sm" variant="outline"
                      onClick={() => fetchAuditLogs(auditPage)} disabled={auditLoading}
                      className="gap-1.5">
                      <RefreshCw className={`h-4 w-4 ${auditLoading ? 'animate-spin' : ''}`} /> Làm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {auditLoading ? (
                    <div className="divide-y">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-48" />
                            <Skeleton className="h-3 w-80" />
                          </div>
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="py-16 text-center">
                      <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Chưa có nhật ký nào</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Các thay đổi phân quyền sẽ được ghi lại tại đây
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {auditLogs.map((log: any) => {
                        const isSuccess = log.success !== false;
                        return (
                          <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                              isSuccess ? 'bg-emerald-100' : 'bg-red-100'
                            }`}>
                              {isSuccess
                                ? <CheckCircle className="h-4 w-4 text-emerald-600" />
                                : <XCircle className="h-4 w-4 text-red-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-slate-800">
                                  {log.actorUser?.name || log.actorUserId || 'Hệ thống'}
                                </span>
                                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                                  {log.action}
                                </code>
                                {log.resourceType && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{log.resourceType}</Badge>
                                )}
                              </div>
                              {log.details && (
                                <p className="text-xs text-slate-500 truncate">
                                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </p>
                              )}
                              {log.ipAddress && (
                                <p className="text-[10px] text-slate-400 mt-0.5">IP: {log.ipAddress}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs text-slate-400">
                                {log.createdAt
                                  ? new Date(log.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                  : '—'}
                              </p>
                              <Badge
                                className={`text-[10px] mt-1 ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}
                                variant="outline">
                                {isSuccess ? 'Thành công' : 'Thất bại'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {auditTotal > 20 && (
                    <div className="px-5 py-3 border-t flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Trang {auditPage} · {auditTotal} bản ghi
                      </span>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" disabled={auditPage <= 1}
                          onClick={() => setAuditPage(p => p - 1)} className="h-8 gap-1">
                          <ChevronLeft className="h-3.5 w-3.5" /> Trước
                        </Button>
                        <Button variant="outline" size="sm" disabled={auditPage * 20 >= auditTotal}
                          onClick={() => setAuditPage(p => p + 1)} className="h-8 gap-1">
                          Sau <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ═══════════════════════════════════════════════════
              DIALOGS
          ═══════════════════════════════════════════════════ */}

          {/* Assign User-Position Dialog */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-violet-600" /> Gán chức vụ cho người dùng
                </DialogTitle>
                <DialogDescription>Chọn người dùng, chức vụ và đơn vị phụ trách</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Người dùng <span className="text-red-500">*</span></Label>
                  <Select value={assignForm.userId} onValueChange={v => setAssignForm({ ...assignForm, userId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn người dùng..." /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} <span className="text-slate-400 text-xs">({u.email})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Chức vụ <span className="text-red-500">*</span></Label>
                  <Select value={assignForm.positionId} onValueChange={v => setAssignForm({ ...assignForm, positionId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn chức vụ..." /></SelectTrigger>
                    <SelectContent>
                      {positions.filter(p => p.isActive).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} <code className="text-xs text-slate-400 ml-1">({p.code})</code>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Đơn vị <span className="text-slate-400 text-xs">(không bắt buộc)</span></Label>
                  <Select value={assignForm.unitId || 'none'} onValueChange={v => setAssignForm({ ...assignForm, unitId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn đơn vị..." /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="none">— Không chọn —</SelectItem>
                      {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Ngày bắt đầu</Label>
                    <Input type="date" className="mt-1" value={assignForm.startDate}
                      onChange={e => setAssignForm({ ...assignForm, startDate: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 pt-7">
                    <Switch checked={assignForm.isPrimary} onCheckedChange={v => setAssignForm({ ...assignForm, isPrimary: v })} />
                    <Label className="text-sm cursor-pointer">Chức vụ chính</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleCreateUserPosition} className="gap-2">
                  <Check className="h-4 w-4" /> Xác nhận gán
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create/Edit Position Dialog */}
          <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingPosition ? <Pencil className="h-5 w-5 text-amber-600" /> : <Plus className="h-5 w-5 text-green-600" />}
                  {editingPosition ? 'Chỉnh sửa Chức vụ' : 'Tạo Chức vụ mới'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Mã chức vụ <span className="text-red-500">*</span></Label>
                    <Input className="mt-1 uppercase font-mono" placeholder="VD: CHI_HUY"
                      value={positionForm.code}
                      onChange={e => setPositionForm({ ...positionForm, code: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cấp bậc</Label>
                    <Input className="mt-1" type="number" min={0} max={10} placeholder="0"
                      value={positionForm.level}
                      onChange={e => setPositionForm({ ...positionForm, level: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tên chức vụ <span className="text-red-500">*</span></Label>
                  <Input className="mt-1" placeholder="VD: Chỉ huy Học viện"
                    value={positionForm.name}
                    onChange={e => setPositionForm({ ...positionForm, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Mô tả</Label>
                  <Input className="mt-1" placeholder="Mô tả ngắn gọn..."
                    value={positionForm.description}
                    onChange={e => setPositionForm({ ...positionForm, description: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phạm vi quyền hạn</Label>
                  <Select value={positionForm.positionScope}
                    onValueChange={v => setPositionForm({ ...positionForm, positionScope: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(POSITION_SCOPE_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${SCOPE_CONFIG[k]?.dotClass || 'bg-slate-400'}`} />
                            {v.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingPosition && (
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={positionForm.isActive}
                      onCheckedChange={v => setPositionForm({ ...positionForm, isActive: v })} />
                    <Label className="text-sm cursor-pointer">
                      {positionForm.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                    </Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPositionDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleSavePosition} className="gap-2">
                  <Check className="h-4 w-4" /> {editingPosition ? 'Lưu thay đổi' : 'Tạo chức vụ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User-Position Confirm */}
          <AlertDialog open={!!deleteUpId} onOpenChange={o => !o && setDeleteUpId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa gán chức vụ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Người dùng sẽ mất các quyền của chức vụ này ngay lập tức. Hành động không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUserPosition} className="bg-red-600 hover:bg-red-700">
                  Xóa gán chức vụ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Position Confirm */}
          <AlertDialog open={!!deletePositionId} onOpenChange={o => !o && setDeletePositionId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa chức vụ này?</AlertDialogTitle>
                <AlertDialogDescription>
                  Chức vụ sẽ bị xóa vĩnh viễn. Chỉ có thể xóa chức vụ chưa được gán quyền hoặc user.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePosition} className="bg-red-600 hover:bg-red-700">
                  Xóa chức vụ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </TooltipProvider>
  );
}
