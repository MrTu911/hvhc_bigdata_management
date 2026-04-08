'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Database,
  RefreshCw,
  Search,
  Plus,
  BarChart2,
  Tag,
  MoreHorizontal,
  Pencil,
  PowerOff,
  Activity,
  Zap,
  Layers,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Analytics = {
  summary: {
    totalCategories: number
    activeCategories: number
    totalItems: number
    activeItems: number
    recentChanges7d: number
  }
  byGroup: { groupTag: string; count: number }[]
  topCategories: { categoryCode: string; nameVi: string; itemCount: number }[]
}

type Category = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  groupTag: string
  cacheType: string
  sourceType: string
  isActive: boolean
  sortOrder: number
  _count?: { items: number }
}

type CatForm = {
  code: string
  nameVi: string
  nameEn: string
  groupTag: string
  cacheType: string
  sourceType: string
  description: string
  sortOrder: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CatForm = {
  code: '', nameVi: '', nameEn: '', groupTag: 'MILITARY',
  cacheType: 'SEMI', sourceType: 'LOCAL', description: '', sortOrder: '0',
}

const GROUP_LABELS: Record<string, string> = {
  MILITARY:  'Quân sự',
  GEOGRAPHY: 'Địa lý',
  EDUCATION: 'Giáo dục',
  PARTY:     'Đảng / Chính trị',
  TRAINING:  'Đào tạo',
  EQUIPMENT: 'Trang bị',
  SYSTEM:    'Hệ thống',
  RESEARCH:  'Nghiên cứu KH',
  POLICY:    'Chính sách',
  LOGISTICS: 'Hậu cần',
  HEALTHCARE:'Y tế',
}

const GROUP_COLORS: Record<string, string> = {
  MILITARY:   'bg-blue-100 text-blue-800 border-blue-200',
  GEOGRAPHY:  'bg-orange-100 text-orange-800 border-orange-200',
  EDUCATION:  'bg-cyan-100 text-cyan-800 border-cyan-200',
  PARTY:      'bg-red-100 text-red-800 border-red-200',
  TRAINING:   'bg-purple-100 text-purple-800 border-purple-200',
  EQUIPMENT:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  SYSTEM:     'bg-slate-100 text-slate-700 border-slate-200',
  RESEARCH:   'bg-green-100 text-green-800 border-green-200',
  POLICY:     'bg-teal-100 text-teal-800 border-teal-200',
  LOGISTICS:  'bg-pink-100 text-pink-800 border-pink-200',
  HEALTHCARE: 'bg-rose-100 text-rose-800 border-rose-200',
}

const CACHE_STYLES: Record<string, string> = {
  STATIC:  'bg-green-100 text-green-800',
  SEMI:    'bg-amber-100 text-amber-800',
  DYNAMIC: 'bg-blue-100 text-blue-800',
}

const CACHE_HINT: Record<string, string> = {
  STATIC:  '24h',
  SEMI:    '1h',
  DYNAMIC: '5ph',
}

const SOURCE_STYLES: Record<string, string> = {
  LOCAL:    'text-muted-foreground',
  BQP:      'text-blue-600 font-medium',
  NATIONAL: 'text-purple-600 font-medium',
  ISO:      'text-green-600 font-medium',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted rounded animate-pulse mt-1" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: j === 1 ? '80%' : '60%' }} />
        </TableCell>
      ))}
    </TableRow>
  ))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterDataPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [cacheFilter, setCacheFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [form, setForm] = useState<CatForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Load analytics independently — never blocks category table
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/admin/master-data/analytics')
      if (res.ok) setAnalytics(await res.json())
    } catch {
      // analytics failure is non-fatal
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Load categories independently
  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/master-data/categories?includeInactive=true')
      if (!res.ok) throw new Error('Lỗi tải danh mục')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Không thể tải danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAll = useCallback(() => {
    loadAnalytics()
    loadCategories()
  }, [loadAnalytics, loadCategories])

  useEffect(() => { loadAll() }, [loadAll])

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/admin/master-data/cache', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã xóa cache danh mục')
        loadAnalytics()
      }
    } catch {
      toast.error('Lỗi khi xóa cache')
    }
  }

  const openCreate = () => {
    setEditingCat(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCat(cat)
    setForm({
      code:        cat.code,
      nameVi:      cat.nameVi,
      nameEn:      cat.nameEn ?? '',
      groupTag:    cat.groupTag,
      cacheType:   cat.cacheType,
      sourceType:  cat.sourceType,
      description: '',
      sortOrder:   String(cat.sortOrder),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.nameVi || !form.groupTag) {
      toast.error('Vui lòng nhập đầy đủ: Mã, Tên, Nhóm')
      return
    }
    setSaving(true)
    try {
      const url    = editingCat ? `/api/admin/master-data/categories/${editingCat.code}` : '/api/admin/master-data/categories'
      const method = editingCat ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sortOrder:   parseInt(form.sortOrder) || 0,
          nameEn:      form.nameEn      || null,
          description: form.description || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Lỗi lưu dữ liệu'); return }
      toast.success(editingCat ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới')
      setDialogOpen(false)
      loadAll()
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (cat: Category) => {
    if (!confirm(`Vô hiệu hóa danh mục "${cat.nameVi}" và toàn bộ mục con?`)) return
    try {
      const res = await fetch(`/api/admin/master-data/categories/${cat.code}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã vô hiệu hóa danh mục')
        loadAll()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Lỗi vô hiệu hóa')
      }
    } catch {
      toast.error('Lỗi hệ thống')
    }
  }

  // Compute unique group tags from actual data for dynamic filter
  const availableGroups = Array.from(new Set(categories.map(c => c.groupTag))).sort()

  const filtered = categories.filter(c => {
    if (groupFilter  !== 'all' && c.groupTag   !== groupFilter)  return false
    if (cacheFilter  !== 'all' && c.cacheType  !== cacheFilter)  return false
    if (sourceFilter !== 'all' && c.sourceType !== sourceFilter) return false
    if (search && !c.nameVi.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group-level summary from category list
  const groupCounts = categories.reduce<Record<string, number>>((acc, c) => {
    if (c.isActive) acc[c.groupTag] = (acc[c.groupTag] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Danh mục Dùng chung</h1>
            <p className="text-sm text-muted-foreground">Module M19 – Master Data Management</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/admin/master-data/analytics">
            <Button variant="outline" size="sm"><BarChart2 className="h-4 w-4 mr-1.5" />Phân tích</Button>
          </Link>
          <Link href="/dashboard/admin/master-data/sync">
            <Button variant="outline" size="sm"><Activity className="h-4 w-4 mr-1.5" />Đồng bộ</Button>
          </Link>
          <Link href="/dashboard/admin/master-data/cache">
            <Button variant="outline" size="sm"><Zap className="h-4 w-4 mr-1.5" />Cache</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleClearCache}>
            <RefreshCw className="h-4 w-4 mr-1.5" />Xóa cache
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />Thêm danh mục
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Tổng danh mục',    value: analytics.summary.totalCategories,  icon: Layers,       color: 'text-foreground' },
            { label: 'Đang hoạt động',   value: analytics.summary.activeCategories, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Tổng mục dữ liệu', value: analytics.summary.totalItems.toLocaleString(), icon: Database, color: 'text-foreground' },
            { label: 'Mục đang dùng',    value: analytics.summary.activeItems.toLocaleString(), icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Thay đổi 7 ngày',  value: analytics.summary.recentChanges7d, icon: TrendingUp,   color: 'text-blue-600' },
          ].map(kpi => (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-normal text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
              <kpi.icon className="absolute right-3 top-3 h-8 w-8 text-muted-foreground/10" />
            </Card>
          ))}
        </div>
      ) : null}

      {/* ── Group pills ─────────────────────────────────────────────── */}
      {availableGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroupFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              groupFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 border-border hover:bg-muted text-muted-foreground'
            }`}
          >
            Tất cả ({categories.filter(c => c.isActive).length})
          </button>
          {availableGroups.map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(groupFilter === g ? 'all' : g)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                groupFilter === g
                  ? 'bg-primary text-primary-foreground border-primary'
                  : `${GROUP_COLORS[g] ?? 'bg-muted text-muted-foreground border-border'} hover:opacity-80`
              }`}
            >
              {GROUP_LABELS[g] ?? g} ({groupCounts[g] ?? 0})
            </button>
          ))}
        </div>
      )}

      {/* ── Category Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Danh sách danh mục
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã hoặc tên..."
                  className="pl-8 h-8 w-52 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={cacheFilter} onValueChange={setCacheFilter}>
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue placeholder="Cache" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cache</SelectItem>
                  <SelectItem value="STATIC">STATIC (24h)</SelectItem>
                  <SelectItem value="SEMI">SEMI (1h)</SelectItem>
                  <SelectItem value="DYNAMIC">DYNAMIC (5ph)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue placeholder="Nguồn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nguồn</SelectItem>
                  <SelectItem value="LOCAL">LOCAL</SelectItem>
                  <SelectItem value="BQP">BQP</SelectItem>
                  <SelectItem value="NATIONAL">NATIONAL</SelectItem>
                  <SelectItem value="ISO">ISO</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={loadAll} title="Làm mới">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Mã</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead className="text-right">Số mục</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Database className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">
                        {search || groupFilter !== 'all' || cacheFilter !== 'all' || sourceFilter !== 'all'
                          ? 'Không tìm thấy danh mục phù hợp'
                          : 'Chưa có danh mục nào'}
                      </p>
                      {!search && groupFilter === 'all' && cacheFilter === 'all' && sourceFilter === 'all' && (
                        <Button size="sm" onClick={openCreate}>
                          <Plus className="h-4 w-4 mr-1" />Thêm danh mục đầu tiên
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(cat => (
                  <TableRow
                    key={cat.code}
                    className={`hover:bg-muted/30 transition-colors ${!cat.isActive ? 'opacity-40' : ''}`}
                  >
                    <TableCell className="pl-6">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{cat.code}</code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{cat.nameVi}</div>
                      {cat.nameEn && <div className="text-xs text-muted-foreground">{cat.nameEn}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${GROUP_COLORS[cat.groupTag] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {GROUP_LABELS[cat.groupTag] ?? cat.groupTag}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CACHE_STYLES[cat.cacheType] ?? 'bg-muted text-muted-foreground'}`}>
                        {cat.cacheType}
                        <span className="ml-1 opacity-60">{CACHE_HINT[cat.cacheType]}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs ${SOURCE_STYLES[cat.sourceType] ?? 'text-muted-foreground'}`}>
                        {cat.sourceType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums">{cat._count?.items ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cat.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {cat.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/dashboard/admin/master-data/categories/${cat.code}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                            Quản lý
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(cat)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />Chỉnh sửa
                            </DropdownMenuItem>
                            {cat.isActive && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeactivate(cat)}
                              >
                                <PowerOff className="h-3.5 w-3.5 mr-2" />Vô hiệu hóa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Top categories bar chart ─────────────────────────────────── */}
      {analytics && analytics.topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4" />Top 10 danh mục nhiều mục nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {analytics.topCategories.map((c, i) => {
                const maxCount = analytics.topCategories[0]?.itemCount || 1
                const pct = Math.min(100, (c.itemCount / maxCount) * 100)
                return (
                  <div key={c.categoryCode} className="flex items-center gap-3 group">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                    <Link
                      href={`/dashboard/admin/master-data/categories/${c.categoryCode}`}
                      className="w-52 text-sm truncate hover:underline hover:text-primary transition-colors shrink-0"
                    >
                      {c.nameVi}
                    </Link>
                    <div className="flex-1 bg-muted rounded-full h-2 min-w-0">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-10 text-right shrink-0">
                      {c.itemCount.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? `Chỉnh sửa: ${editingCat.code}` : 'Thêm danh mục mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Mã danh mục <span className="text-destructive">*</span></Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editingCat}
                placeholder="VD: MD_NEW_TYPE"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Tên (Tiếng Việt) <span className="text-destructive">*</span></Label>
              <Input
                value={form.nameVi}
                onChange={e => setForm(f => ({ ...f, nameVi: e.target.value }))}
                placeholder="Tên đầy đủ tiếng Việt"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Tên (Tiếng Anh)</Label>
              <Input
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="English name (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nhóm <span className="text-destructive">*</span></Label>
              <Select value={form.groupTag} onValueChange={v => setForm(f => ({ ...f, groupTag: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Loại Cache</Label>
              <Select value={form.cacheType} onValueChange={v => setForm(f => ({ ...f, cacheType: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATIC">STATIC (24 giờ)</SelectItem>
                  <SelectItem value="SEMI">SEMI (1 giờ)</SelectItem>
                  <SelectItem value="DYNAMIC">DYNAMIC (5 phút)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Nguồn dữ liệu</Label>
              <Select value={form.sourceType} onValueChange={v => setForm(f => ({ ...f, sourceType: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">LOCAL – Nội bộ</SelectItem>
                  <SelectItem value="BQP">BQP – Bộ Quốc phòng</SelectItem>
                  <SelectItem value="NATIONAL">NATIONAL – Quốc gia</SelectItem>
                  <SelectItem value="ISO">ISO – Quốc tế</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Mô tả</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn (tùy chọn)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editingCat ? 'Cập nhật' : 'Tạo danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
