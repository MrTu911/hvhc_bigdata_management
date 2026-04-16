'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { TalentRankingPanel } from '@/components/personnel/search/talent-ranking-panel'
import type { TalentCandidate } from '@/components/personnel/search/talent-ranking-panel'
import {
  Target,
  Loader2,
  Info,
  Filter,
  Sparkles,
  SlidersHorizontal,
  Users,
  ChevronsUpDown,
  Check,
  Briefcase,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MasterItem {
  code: string
  nameVi: string
  shortName?: string | null
  sortOrder?: number
}

interface PositionOption {
  id: string
  code: string
  name: string
  positionScope: string
  description?: string | null
}

interface CatalogState {
  positions: PositionOption[]
  degrees: MasterItem[]
  politicalLevels: MasterItem[]
  academicTitles: MasterItem[]
  researchFields: MasterItem[]
}

interface PlanningForm {
  targetPositionName: string
  category: string
  requiredDegree: string
  requiredPoliticalTheory: string
  requiredServiceYearsMin: string
  preferredMajor: string[]         // array of nameVi values from MD_RESEARCH_FIELD
  preferredAcademicTitle: string
  topN: string
}

const BLANK: PlanningForm = {
  targetPositionName: '',
  category: '',
  requiredDegree: '',
  requiredPoliticalTheory: '',
  requiredServiceYearsMin: '',
  preferredMajor: [],
  preferredAcademicTitle: '',
  topN: '30',
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Cán bộ chỉ huy',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  CONG_NHAN_VIEN: 'CNVCQP',
  HOC_VIEN_QUAN_SU: 'Học viên quân sự',
  SINH_VIEN_DAN_SU: 'Sinh viên dân sự',
}

const SCOPE_LABELS: Record<string, string> = {
  ACADEMY: 'Học viện',
  DEPARTMENT: 'Khoa/Phòng',
  UNIT: 'Đơn vị',
  SELF: 'Cá nhân',
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface SearchMeta {
  topN: number
  totalScanned: number
  hardFiltered: number
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  color,
  badge,
}: {
  icon: React.ElementType
  label: string
  color: string
  badge?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-1 rounded ${color}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Position combobox ────────────────────────────────────────────────────────

function PositionCombobox({
  positions,
  loadingPositions,
  value,
  onChange,
}: {
  positions: PositionOption[]
  loadingPositions: boolean
  value: string
  onChange: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = positions.find((p) => p.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between text-sm font-normal h-9', !value && 'text-muted-foreground')}
        >
          <span className="truncate">{selected ? selected.name : 'Chọn chức vụ từ danh mục...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm chức vụ..." className="text-sm" />
          <CommandList>
            {loadingPositions ? (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <>
                <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                  Không tìm thấy chức vụ.
                </CommandEmpty>
                {(['ACADEMY', 'DEPARTMENT', 'UNIT'] as const).map((scope) => {
                  const items = positions.filter((p) => p.positionScope === scope)
                  if (items.length === 0) return null
                  return (
                    <CommandGroup key={scope} heading={SCOPE_LABELS[scope]}>
                      {items.map((pos) => (
                        <CommandItem
                          key={pos.id}
                          value={pos.name}
                          onSelect={() => { onChange(pos.name === value ? '' : pos.name); setOpen(false) }}
                          className="text-sm gap-2"
                        >
                          <Check className={cn('h-3.5 w-3.5 shrink-0', value === pos.name ? 'opacity-100 text-indigo-600' : 'opacity-0')} />
                          <span className="flex-1">{pos.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Multi-select combobox (for chuyên ngành) ────────────────────────────────

function MultiSelectCombobox({
  items,
  loading,
  selected,
  onToggle,
  placeholder,
  emptyText,
}: {
  items: MasterItem[]
  loading: boolean
  selected: string[]
  onToggle: (nameVi: string) => void
  placeholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between text-sm font-normal h-9', selected.length === 0 && 'text-muted-foreground')}
          >
            <span className="truncate">
              {selected.length === 0
                ? placeholder
                : selected.length === 1
                  ? selected[0]
                  : `${selected.length} lĩnh vực đã chọn`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm lĩnh vực..." className="text-sm" />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang tải...
                </div>
              ) : (
                <>
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                    {emptyText}
                  </CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => {
                      const isSelected = selected.includes(item.nameVi)
                      return (
                        <CommandItem
                          key={item.code}
                          value={item.nameVi}
                          onSelect={() => onToggle(item.nameVi)}
                          className="text-sm gap-2"
                        >
                          <div className={cn(
                            'h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center',
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-muted-foreground/40',
                          )}>
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          {item.nameVi}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="text-[11px] gap-1 pr-1 text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60"
            >
              {name}
              <button
                type="button"
                onClick={() => onToggle(name)}
                aria-label={`Bỏ chọn ${name}`}
                className="ml-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── M19 Select (single) ─────────────────────────────────────────────────────

function M19Select({
  items,
  loading,
  value,
  onChange,
  placeholder,
}: {
  items: MasterItem[]
  loading: boolean
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="text-sm">
        {loading
          ? <span className="text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Đang tải...</span>
          : <SelectValue placeholder={placeholder} />
        }
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none" className="text-muted-foreground">— Không yêu cầu —</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.code} value={item.nameVi} className="text-sm">
            {item.nameVi}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonnelPlanningPage() {
  const [form, setForm] = useState<PlanningForm>(BLANK)
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<TalentCandidate[] | null>(null)
  const [meta, setMeta] = useState<SearchMeta | undefined>()
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalog, setCatalog] = useState<CatalogState>({
    positions: [],
    degrees: [],
    politicalLevels: [],
    academicTitles: [],
    researchFields: [],
  })

  const set = (field: keyof PlanningForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function toggleMajor(nameVi: string) {
    setForm((prev) => ({
      ...prev,
      preferredMajor: prev.preferredMajor.includes(nameVi)
        ? prev.preferredMajor.filter((m) => m !== nameVi)
        : [...prev.preferredMajor, nameVi],
    }))
  }

  // Load all M19 catalogs in parallel on mount
  useEffect(() => {
    const fetchItems = (categoryCode: string): Promise<MasterItem[]> =>
      fetch(`/api/master-data/${categoryCode}/items?onlyActive=true`)
        .then((r) => r.json())
        .then((json) => (json.success && Array.isArray(json.data) ? json.data : []))
        .catch(() => [])

    const fetchPositions = (): Promise<PositionOption[]> =>
      fetch('/api/admin/positions')
        .then((r) => r.json())
        .then((json) =>
          json.success && Array.isArray(json.positions)
            ? json.positions.filter((p: PositionOption) => p.positionScope !== 'SELF')
            : [],
        )
        .catch(() => [])

    Promise.all([
      fetchPositions(),
      fetchItems('MD_ACADEMIC_DEGREE'),
      fetchItems('MD_POLITICAL_LEVEL'),
      fetchItems('MD_ACADEMIC_TITLE'),
      fetchItems('MD_RESEARCH_FIELD'),
    ]).then(([positions, degrees, politicalLevels, academicTitles, researchFields]) => {
      setCatalog({ positions, degrees, politicalLevels, academicTitles, researchFields })
      setCatalogLoading(false)
    })
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setCandidates(null)
    setMeta(undefined)

    const body: Record<string, unknown> = {}
    if (form.targetPositionName) body.targetPosition = form.targetPositionName
    if (form.category && form.category !== '_all') body.category = form.category
    if (form.requiredDegree && form.requiredDegree !== '_none') body.requiredDegree = form.requiredDegree
    if (form.requiredPoliticalTheory && form.requiredPoliticalTheory !== '_none') body.requiredPoliticalTheory = form.requiredPoliticalTheory
    if (form.requiredServiceYearsMin) body.requiredServiceYearsMin = Number(form.requiredServiceYearsMin)
    if (form.preferredMajor.length > 0) body.preferredMajor = form.preferredMajor
    if (form.preferredAcademicTitle && form.preferredAcademicTitle !== '_none') body.preferredAcademicTitle = form.preferredAcademicTitle
    body.topN = Number(form.topN) || 30

    try {
      const res = await fetch('/api/personnel/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(
          typeof json.error === 'string'
            ? json.error
            : 'Phải có ít nhất 1 tiêu chí tìm kiếm',
        )
        return
      }

      setCandidates(json.data)
      setMeta(json.meta)
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const selectedPosition = catalog.positions.find((p) => p.name === form.targetPositionName)

  return (
    <div className="space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Quy hoạch & Tìm nguồn cán bộ</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn chức vụ và tiêu chí từ danh mục M19 — hệ thống xếp hạng ứng viên theo điểm phù hợp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        {/* ── Input panel ──────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              Tiêu chí tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-4">
            <form onSubmit={handleSearch} className="space-y-5">

              {/* ── Block: Chức vụ quy hoạch ── */}
              <div className="space-y-3">
                <SectionLabel icon={Briefcase} label="Chức vụ quy hoạch" color="bg-indigo-500" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Chức vụ
                    <span className="ml-1 font-normal text-muted-foreground">(danh mục M19)</span>
                  </Label>
                  <PositionCombobox
                    positions={catalog.positions}
                    loadingPositions={catalogLoading}
                    value={form.targetPositionName}
                    onChange={(name) => set('targetPositionName', name)}
                  />
                  {selectedPosition && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Badge variant="secondary" className="text-[11px] gap-1 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400">
                        {SCOPE_LABELS[selectedPosition.positionScope] ?? selectedPosition.positionScope}
                      </Badge>
                      {selectedPosition.description && (
                        <span className="text-[11px] text-muted-foreground truncate">{selectedPosition.description}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nhóm cán bộ</Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Tất cả loại</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* ── Block: Điều kiện cứng ── */}
              <div className="space-y-3">
                <SectionLabel icon={Filter} label="Điều kiện cứng" color="bg-rose-500" badge="lọc bắt buộc" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Học vị tối thiểu</Label>
                  <M19Select
                    items={catalog.degrees}
                    loading={catalogLoading}
                    value={form.requiredDegree}
                    onChange={(v) => set('requiredDegree', v)}
                    placeholder="Chọn học vị..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Lý luận chính trị tối thiểu</Label>
                  <M19Select
                    items={catalog.politicalLevels}
                    loading={catalogLoading}
                    value={form.requiredPoliticalTheory}
                    onChange={(v) => set('requiredPoliticalTheory', v)}
                    placeholder="Chọn trình độ..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Năm công tác tối thiểu</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    placeholder="VD: 8"
                    value={form.requiredServiceYearsMin}
                    onChange={(e) => set('requiredServiceYearsMin', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <Separator />

              {/* ── Block: Tiêu chí ưu tiên ── */}
              <div className="space-y-3">
                <SectionLabel icon={Sparkles} label="Tiêu chí ưu tiên" color="bg-amber-500" badge="cộng điểm" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Lĩnh vực chuyên ngành ưu tiên</Label>
                  <MultiSelectCombobox
                    items={catalog.researchFields}
                    loading={catalogLoading}
                    selected={form.preferredMajor}
                    onToggle={toggleMajor}
                    placeholder="Chọn lĩnh vực..."
                    emptyText="Không tìm thấy lĩnh vực."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Học hàm ưu tiên</Label>
                  <M19Select
                    items={catalog.academicTitles}
                    loading={catalogLoading}
                    value={form.preferredAcademicTitle}
                    onChange={(v) => set('preferredAcademicTitle', v)}
                    placeholder="Chọn học hàm..."
                  />
                </div>
              </div>

              <Separator />

              {/* ── Block: Số kết quả ── */}
              <div className="space-y-3">
                <SectionLabel icon={Users} label="Số kết quả" color="bg-teal-500" />
                <Select value={form.topN} onValueChange={(v) => set('topN', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Top 10 ứng viên</SelectItem>
                    <SelectItem value="20">Top 20 ứng viên</SelectItem>
                    <SelectItem value="30">Top 30 ứng viên</SelectItem>
                    <SelectItem value="50">Top 50 ứng viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Kết quả là công cụ hỗ trợ tham khảo — không thay thế quyết định nhân sự.
                </span>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 font-semibold"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tìm kiếm...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Tìm nguồn cán bộ</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Results panel ────────────────────────────────────────────── */}
        <div>
          {candidates === null && !loading ? (
            <div className="rounded-xl border-2 border-dashed border-muted py-20 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-muted/60">
                  <Target className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-medium">Chưa có kết quả</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">
                    Chọn tiêu chí và nhấn{' '}
                    <span className="font-semibold text-indigo-500">Tìm nguồn cán bộ</span>{' '}
                    để bắt đầu quy hoạch.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <TalentRankingPanel
              candidates={candidates ?? []}
              meta={meta}
              loading={loading}
              targetPositionName={form.targetPositionName || undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
