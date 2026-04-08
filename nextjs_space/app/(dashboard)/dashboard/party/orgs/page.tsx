'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PartyOrgTree, type PartyOrgNode } from '@/components/party/org/party-org-tree';
import { toast } from '@/components/ui/use-toast';
import { useMasterData } from '@/hooks/use-master-data';
import {
  Star, Building2, Layers, GitBranch,
  Users, Search, Plus, ChevronDown, ChevronUp,
  RefreshCw, Network,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const ORG_LEVEL_META: Record<string, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType;
}> = {
  DANG_UY_HOC_VIEN: {
    label: 'Đảng ủy Học viện',
    color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
    icon: Star,
  },
  DANG_BO: {
    label: 'Đảng bộ bộ phận',
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    icon: Building2,
  },
  CHI_BO_CO_SO: {
    label: 'Chi bộ cơ sở',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    icon: Layers,
  },
  CHI_BO_GHEP: {
    label: 'Chi bộ ghép',
    color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200',
    icon: GitBranch,
  },
};

const FALLBACK_ORG_LEVEL_OPTIONS = [
  { value: 'DANG_UY_HOC_VIEN', label: 'Đảng ủy Học viện' },
  { value: 'DANG_BO', label: 'Đảng bộ bộ phận' },
  { value: 'CHI_BO_CO_SO', label: 'Chi bộ cơ sở' },
  { value: 'CHI_BO_GHEP', label: 'Chi bộ ghép' },
];

const DEFAULT_FORM = {
  code: '',
  name: '',
  shortName: '',
  orgLevel: 'CHI_BO_CO_SO',
  parentId: '',
  description: '',
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, bg, border,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-5 py-4 flex items-center gap-4`}>
      <div className={`rounded-lg p-2.5 bg-white/70 border ${border}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className={`text-xs font-medium ${color}`}>{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PartyOrgsPage() {
  const [items, setItems] = useState<PartyOrgNode[]>([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const { items: mdOrgLevels } = useMasterData('MD_PARTY_ORG_LEVEL');

  const orgLevelOptions = mdOrgLevels.length > 0
    ? mdOrgLevels.map((x) => ({ value: x.code, label: x.nameVi }))
    : FALLBACK_ORG_LEVEL_OPTIONS;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (search) params.set('search', search);
      if (filterLevel !== 'ALL') params.set('orgLevel', filterLevel);
      const res = await fetch(`/api/party/orgs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được danh sách tổ chức');
      setItems(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterLevel]);

  useEffect(() => {
    fetchData();
  }, []);

  const createOrg = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Mã và tên tổ chức là bắt buộc', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        shortName: form.shortName.trim() || undefined,
        orgLevel: form.orgLevel,
        parentId: form.parentId || undefined,
        description: form.description.trim() || undefined,
      };
      const res = await fetch('/api/party/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo tổ chức thất bại');
      toast({ title: 'Đã tạo tổ chức', description: `${form.name} (${form.code})` });
      setForm(DEFAULT_FORM);
      setShowCreateForm(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = {
    total: items.length,
    dangUy: items.filter(i => i.orgLevel === 'DANG_UY_HOC_VIEN').length,
    dangBo: items.filter(i => i.orgLevel === 'DANG_BO').length,
    chiBoCo: items.filter(i => i.orgLevel === 'CHI_BO_CO_SO').length,
    chiBo: items.filter(i => i.orgLevel === 'CHI_BO_GHEP').length,
    totalMembers: items.reduce((sum, i) => sum + (i._count?.members ?? 0), 0),
  };

  return (
    <div className="space-y-6 p-6 max-w-screen-xl mx-auto">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-rose-500 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-3">
              <Network className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cơ cấu tổ chức Đảng</h1>
              <p className="text-sm text-red-100 mt-0.5">
                Hệ thống Đảng ủy · Đảng bộ · Chi bộ theo phân cấp Học viện Hậu cần
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-sm">
              <Network className="h-3.5 w-3.5" />
              <span className="font-semibold">{stats.total}</span>
              <span className="text-red-100">tổ chức</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-sm">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold">{stats.totalMembers}</span>
              <span className="text-red-100">đảng viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Star} label="Đảng ủy Học viện" value={stats.dangUy}
          color="text-red-700" bg="bg-red-50" border="border-red-200"
        />
        <StatCard
          icon={Building2} label="Đảng bộ bộ phận" value={stats.dangBo}
          color="text-violet-700" bg="bg-violet-50" border="border-violet-200"
        />
        <StatCard
          icon={Layers} label="Chi bộ cơ sở" value={stats.chiBoCo}
          color="text-blue-700" bg="bg-blue-50" border="border-blue-200"
        />
        <StatCard
          icon={GitBranch} label="Chi bộ ghép" value={stats.chiBo}
          color="text-teal-700" bg="bg-teal-50" border="border-teal-200"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            placeholder="Tìm theo mã hoặc tên tổ chức…"
            className="pl-9"
          />
        </div>

        <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tất cả cấp tổ chức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả cấp</SelectItem>
            {orgLevelOptions.map((x) => (
              <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5 shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>

        <Button type="button" onClick={() => setShowCreateForm(v => !v)} className="gap-1.5 shrink-0">
          {showCreateForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreateForm ? 'Đóng form' : 'Thêm tổ chức'}
        </Button>
      </div>

      {/* ── Create form ─────────────────────────────────────────────────── */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              Thêm tổ chức Đảng mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Mã tổ chức *</label>
                <Input
                  placeholder="VD: CHI_BO_K1_BM01"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tên tổ chức *</label>
                <Input
                  placeholder="VD: Chi bộ Bộ môn Kế toán"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tên viết tắt</label>
                <Input
                  placeholder="VD: CB.KT"
                  value={form.shortName}
                  onChange={(e) => setForm(f => ({ ...f, shortName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Cấp tổ chức *</label>
                <Select value={form.orgLevel} onValueChange={(v) => setForm(f => ({ ...f, orgLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {orgLevelOptions.map((x) => (
                      <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tổ chức cấp trên</label>
                <Select
                  value={form.parentId || 'NONE'}
                  onValueChange={(v) => setForm(f => ({ ...f, parentId: v === 'NONE' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Không có (cấp gốc)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Không có (cấp gốc)</SelectItem>
                    {items
                      .filter(o => o.orgLevel !== 'CHI_BO_CO_SO' && o.orgLevel !== 'CHI_BO_GHEP')
                      .map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                          {org.code ? ` (${org.code})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                <Input
                  placeholder="Mô tả ngắn (nếu có)"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t">
              <Button
                type="button" variant="ghost"
                onClick={() => { setForm(DEFAULT_FORM); setShowCreateForm(false); }}
              >
                Hủy
              </Button>
              <Button type="button" onClick={createOrg} disabled={submitting}>
                {submitting ? 'Đang lưu…' : 'Tạo tổ chức'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ORG_LEVEL_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
          );
        })}
      </div>

      {/* ── Tree ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-500" />
            Sơ đồ cơ cấu tổ chức
            {!loading && items.length > 0 && (
              <Badge variant="secondary" className="ml-auto font-normal">
                {items.length} đơn vị
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Thử lại
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-2 py-4">
              {(['ml-0', 'ml-6', 'ml-12', 'ml-0', 'ml-6', 'ml-12'] as const).map((ml, i) => (
                <div key={i} className={`h-14 rounded-xl bg-slate-100 animate-pulse ${ml}`} />
              ))}
            </div>
          ) : (
            <PartyOrgTree items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
