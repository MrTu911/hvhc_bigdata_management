'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2, Plus, Pencil, PowerOff, Search, RefreshCw,
  CheckCircle2, XCircle, Users, ChevronRight, MoreHorizontal,
  Network, BookOpen, Layers,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit = {
  id: string
  code: string
  name: string
  type: string
  level: number
  parentId: string | null
  commanderId: string | null
  description: string | null
  active: boolean
  path: string | null
  commander?: { id: string; name: string; rank: string | null } | null
  _count?: { users: number; children: number }
}

type UnitForm = {
  code: string
  name: string
  type: string
  level: string
  parentId: string
  description: string
}

const EMPTY_FORM: UnitForm = {
  code: '', name: '', type: 'KHOA', level: '2', parentId: '', description: '',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_TYPES: { value: string; label: string }[] = [
  { value: 'HVHC',       label: 'Học viện (cấp 1)' },
  { value: 'KHOA',       label: 'Khoa' },
  { value: 'PHONG',      label: 'Phòng' },
  { value: 'BAN',        label: 'Ban' },
  { value: 'BOMON',      label: 'Bộ môn' },
  { value: 'TIEUDOAN',   label: 'Tiểu đoàn' },
  { value: 'DAIDOI',     label: 'Đại đội' },
  { value: 'DEPARTMENT', label: 'Khoa/Phòng (DEPARTMENT)' },
  { value: 'UNIT',       label: 'Đơn vị khác' },
]

const TYPE_STYLES: Record<string, string> = {
  HVHC:       'bg-indigo-100 text-indigo-700 border-indigo-200',
  KHOA:       'bg-blue-100 text-blue-700 border-blue-200',
  DEPARTMENT: 'bg-blue-100 text-blue-700 border-blue-200',
  PHONG:      'bg-teal-100 text-teal-700 border-teal-200',
  BAN:        'bg-purple-100 text-purple-700 border-purple-200',
  BOMON:      'bg-amber-100 text-amber-700 border-amber-200',
  'Bộ môn':   'bg-amber-100 text-amber-700 border-amber-200',
  TIEUDOAN:   'bg-orange-100 text-orange-700 border-orange-200',
  DAIDOI:     'bg-rose-100 text-rose-700 border-rose-200',
  UNIT:       'bg-slate-100 text-slate-600 border-slate-200',
}

const TYPE_LABELS: Record<string, string> = {
  HVHC:       'Học viện',
  KHOA:       'Khoa',
  DEPARTMENT: 'Khoa/Phòng',
  PHONG:      'Phòng',
  BAN:        'Ban',
  BOMON:      'Bộ môn',
  'Bộ môn':   'Bộ môn',
  TIEUDOAN:   'Tiểu đoàn',
  DAIDOI:     'Đại đội',
  UNIT:       'Đơn vị',
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Cấp 1 – Học viện',
  2: 'Cấp 2 – Khoa/Phòng',
  3: 'Cấp 3 – Bộ môn',
  4: 'Cấp 4 – Tổ/Đại đội',
  5: 'Cấp 5 – Tiểu tổ',
}

// ─── Row skeleton ─────────────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 8 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: j === 1 ? '75%' : '55%' }} />
        </TableCell>
      ))}
    </TableRow>
  ))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/units?flat=true')
      if (!res.ok) throw new Error('Lỗi tải dữ liệu')
      const json = await res.json()
      setUnits(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast.error('Không thể tải danh sách đơn vị')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingUnit(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (u: Unit) => {
    setEditingUnit(u)
    setForm({
      code:        u.code,
      name:        u.name,
      type:        u.type,
      level:       String(u.level),
      parentId:    u.parentId ?? '',
      description: u.description ?? '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.type) {
      toast.error('Vui lòng nhập đầy đủ: Mã, Tên và Loại đơn vị')
      return
    }
    setSaving(true)
    try {
      const method = editingUnit ? 'PUT' : 'POST'
      const body = editingUnit
        ? { id: editingUnit.id, name: form.name, type: form.type, level: parseInt(form.level), parentId: form.parentId || null, description: form.description || null }
        : { code: form.code.trim().toUpperCase(), name: form.name, type: form.type, level: parseInt(form.level), parentId: form.parentId || null, description: form.description || null }

      const res = await fetch('/api/admin/units', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Lỗi lưu dữ liệu')
        return
      }
      toast.success(editingUnit ? 'Đã cập nhật đơn vị' : 'Đã tạo đơn vị mới')
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (u: Unit) => {
    if (!confirm(`Vô hiệu hóa đơn vị "${u.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/units?id=${u.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Lỗi vô hiệu hóa')
        return
      }
      toast.success('Đã vô hiệu hóa đơn vị')
      load()
    } catch {
      toast.error('Lỗi hệ thống')
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = units.filter(u => {
    if (!showInactive && !u.active) return false
    if (typeFilter  !== 'all' && u.type         !== typeFilter)       return false
    if (levelFilter !== 'all' && String(u.level) !== levelFilter)     return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
                  !u.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Compute available types from actual data for dynamic pills
  const typeCounts = units
    .filter(u => u.active)
    .reduce<Record<string, number>>((acc, u) => { acc[u.type] = (acc[u.type] ?? 0) + 1; return acc }, {})

  // KPI
  const total    = units.length
  const active   = units.filter(u => u.active).length
  const khoa     = units.filter(u => u.active && (u.type === 'KHOA' || u.type === 'DEPARTMENT')).length
  const bomon    = units.filter(u => u.active && (u.type === 'BOMON' || u.type === 'Bộ môn')).length

  // parent lookup map
  const unitMap = Object.fromEntries(units.map(u => [u.id, u]))

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Khoa / Phòng / Đơn vị</h1>
            <p className="text-sm text-muted-foreground">Cơ cấu tổ chức phân cấp của Học viện Hậu cần</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1.5" />Làm mới
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />Thêm đơn vị
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn vị',   value: total,  icon: Network,      color: 'text-foreground' },
          { label: 'Đang hoạt động', value: active, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Khoa / Phòng',   value: khoa,   icon: BookOpen,     color: 'text-blue-600' },
          { label: 'Bộ môn',         value: bomon,  icon: Layers,       color: 'text-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-normal text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-2xl font-bold ${kpi.color}`}>{loading ? '—' : kpi.value}</p>
            </CardContent>
            <kpi.icon className="absolute right-3 top-3 h-8 w-8 text-muted-foreground/10" />
          </Card>
        ))}
      </div>

      {/* ── Type pills ────────────────────────────────────────────── */}
      {!loading && Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 border-border hover:bg-muted text-muted-foreground'
            }`}
          >
            Tất cả ({active})
          </button>
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, cnt]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${TYPE_STYLES[type] ?? 'bg-muted text-muted-foreground border-border'} hover:opacity-80`
                }`}
              >
                {TYPE_LABELS[type] ?? type} ({cnt})
              </button>
            ))}
        </div>
      )}

      {/* ── Table card ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Danh sách đơn vị
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
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="Cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp</SelectItem>
                  {[1, 2, 3, 4, 5].map(l => (
                    <SelectItem key={l} value={String(l)}>{LEVEL_LABEL[l] ?? `Cấp ${l}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                  className="h-4 w-7"
                />
                Hiện vô hiệu
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6 w-28">Mã</TableHead>
                <TableHead>Tên đơn vị</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="w-20 text-center">Cấp</TableHead>
                <TableHead>Đơn vị cha</TableHead>
                <TableHead className="text-center w-20">Nhân sự</TableHead>
                <TableHead className="w-24">Trạng thái</TableHead>
                <TableHead className="pr-6 w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Building2 className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">
                        {search || typeFilter !== 'all' || levelFilter !== 'all'
                          ? 'Không tìm thấy đơn vị phù hợp'
                          : 'Chưa có đơn vị nào'}
                      </p>
                      {!search && typeFilter === 'all' && levelFilter === 'all' && (
                        <Button size="sm" onClick={openCreate}>
                          <Plus className="h-4 w-4 mr-1" />Thêm đơn vị đầu tiên
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(u => {
                  const parent = u.parentId ? unitMap[u.parentId] : null
                  return (
                    <TableRow
                      key={u.id}
                      className={`hover:bg-muted/30 transition-colors ${!u.active ? 'opacity-40' : ''}`}
                    >
                      <TableCell className="pl-6">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{u.code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {u.level > 1 && (
                            <span className="text-muted-foreground/40" style={{ paddingLeft: `${(u.level - 1) * 8}px` }}>
                              <ChevronRight className="h-3 w-3 inline" />
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            {u.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{u.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_STYLES[u.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {TYPE_LABELS[u.type] ?? u.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Cấp {u.level}
                        </span>
                      </TableCell>
                      <TableCell>
                        {parent ? (
                          <span className="text-xs text-muted-foreground">{parent.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="tabular-nums font-medium">{u._count?.users ?? 0}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {u.active ? 'Hoạt động' : 'Vô hiệu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />Chỉnh sửa
                            </DropdownMenuItem>
                            {u.active && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeactivate(u)}
                              >
                                <PowerOff className="h-3.5 w-3.5 mr-2" />Vô hiệu hóa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? `Chỉnh sửa: ${editingUnit.code}` : 'Thêm đơn vị mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Mã đơn vị <span className="text-destructive">*</span></Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editingUnit}
                placeholder="VD: KHOA_CNTT"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cấp độ <span className="text-destructive">*</span></Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(l => (
                    <SelectItem key={l} value={String(l)}>{LEVEL_LABEL[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Tên đơn vị <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tên đầy đủ của đơn vị"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Loại đơn vị <span className="text-destructive">*</span></Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Đơn vị cha</Label>
              <Select
                value={form.parentId || 'none'}
                onValueChange={v => setForm(f => ({ ...f, parentId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger className="text-sm"><SelectValue placeholder="Không chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Không chọn --</SelectItem>
                  {units
                    .filter(u => u.active && u.id !== editingUnit?.id)
                    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                    .map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {'  '.repeat(u.level - 1)}{u.name} ({u.code})
                      </SelectItem>
                    ))
                  }
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
              {saving ? 'Đang lưu...' : editingUnit ? 'Cập nhật' : 'Tạo đơn vị'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
