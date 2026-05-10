'use client'

/**
 * /dashboard/personnel/promotion-history
 * HR management page: view and directly enter rank promotion history for personnel.
 *
 * Use cases:
 * 1. Ban cán bộ/quân lực xem timeline toàn bộ lịch sử quân hàm của từng cán bộ
 * 2. Nhập trực tiếp (backfill) các mốc lịch sử cũ — cần ADMIN_CREATE_PROMOTION
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Shield, Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  Calendar, Loader2, X, Save, TrendingUp, User, Building2, CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonnelSummary {
  id: string
  fullName: string
  personnelCode: string
  militaryRank: string | null
  managementCategory: string | null
  unit: { id: string; name: string } | null
  officerCareer: { id: string; currentRank: string | null; lastRankDate: string | null } | null
  _promotionCount?: number
}

interface OfficerPromotion {
  id: string
  promotionType: string
  effectiveDate: string
  decisionNumber: string | null
  decisionDate: string | null
  previousRank: string | null
  newRank: string | null
  previousPosition: string | null
  newPosition: string | null
  reason: string | null
  notes: string | null
  createdAt: string
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
}

const FORM_EMPTY = {
  promotionType:    '',
  effectiveDate:    '',
  decisionNumber:   '',
  decisionDate:     '',
  previousRank:     '',
  newRank:          '',
  previousPosition: '',
  newPosition:      '',
  reason:           '',
  notes:            '',
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: vi }) }
  catch { return '—' }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionHistoryPage() {
  // List state
  const [personnel, setPersonnel]     = useState<PersonnelSummary[]>([])
  const [loading, setLoading]         = useState(false)
  const [keyword, setKeyword]         = useState('')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)

  // Timeline panel
  const [selected, setSelected]           = useState<PersonnelSummary | null>(null)
  const [timeline, setTimeline]           = useState<OfficerPromotion[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineOpen, setTimelineOpen]   = useState(false)

  // Add promotion form
  const [addOpen, setAddOpen]     = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addForm, setAddForm]     = useState({ ...FORM_EMPTY })

  // ── Fetch personnel list ──────────────────────────────────────────────────
  const fetchPersonnel = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(keyword ? { keyword } : {}),
      })
      const res  = await fetch(`/api/personnel?${params}`)
      const data = await res.json()
      if (data.success) {
        setPersonnel(data.data || data.items || [])
        setTotalPages(data.pagination?.totalPages || data.totalPages || 1)
      }
    } catch { toast.error('Lỗi tải danh sách') }
    finally { setLoading(false) }
  }, [page, keyword])

  useEffect(() => { fetchPersonnel() }, [fetchPersonnel])

  // ── Fetch timeline for selected person ───────────────────────────────────
  const openTimeline = async (person: PersonnelSummary) => {
    setSelected(person)
    setTimeline([])
    setTimelineOpen(true)
    setTimelineLoading(true)
    try {
      const res  = await fetch(`/api/officer-career/promotions?personnelId=${person.id}&limit=100`)
      const data = await res.json()
      if (data.success) {
        const sorted = (data.data || []).slice().sort(
          (a: OfficerPromotion, b: OfficerPromotion) =>
            new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
        )
        setTimeline(sorted)
      }
    } catch { toast.error('Lỗi tải lịch sử') }
    finally { setTimelineLoading(false) }
  }

  // ── Submit add promotion ──────────────────────────────────────────────────
  const handleAddPromotion = async () => {
    if (!selected) return
    if (!addForm.promotionType || !addForm.effectiveDate) {
      toast.error('Vui lòng điền loại sự kiện và ngày hiệu lực')
      return
    }
    if (!selected.officerCareer?.id) {
      toast.error('Cán bộ chưa có hồ sơ Officer Career. Cần khởi tạo hồ sơ trước.')
      return
    }
    setAddSaving(true)
    try {
      const res = await fetch('/api/officer-career/promotions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerCareerId:  selected.officerCareer.id,
          promotionType:    addForm.promotionType,
          effectiveDate:    addForm.effectiveDate,
          decisionNumber:   addForm.decisionNumber   || null,
          decisionDate:     addForm.decisionDate      || null,
          previousRank:     addForm.previousRank      || null,
          newRank:          addForm.newRank            || null,
          previousPosition: addForm.previousPosition  || null,
          newPosition:      addForm.newPosition        || null,
          reason:           addForm.reason             || null,
          notes:            addForm.notes              || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã ghi nhận mốc quân hàm vào CSDL')
        setAddOpen(false)
        setAddForm({ ...FORM_EMPTY })
        // Refresh timeline
        openTimeline(selected)
      } else {
        toast.error(data.error || 'Không thể thêm mốc quân hàm')
      }
    } catch { toast.error('Lỗi kết nối') }
    finally { setAddSaving(false) }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Quản lý Lịch sử Thăng Quân hàm
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xem và nhập lịch sử quân hàm toàn quá trình cho từng cán bộ — từ khi nhập ngũ đến hiện tại
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên, mã cán bộ..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="outline" onClick={fetchPersonnel}>
              <RefreshCw className="h-4 w-4 mr-1.5" />Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personnel table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách cán bộ</CardTitle>
          <CardDescription>Nhấn vào một cán bộ để xem và quản lý toàn bộ lịch sử quân hàm</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : personnel.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
              <User className="h-10 w-10 opacity-30" />
              <p className="text-sm">Không tìm thấy cán bộ</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cán bộ</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Diện QL</TableHead>
                    <TableHead>Quân hàm hiện tại</TableHead>
                    <TableHead>Thăng gần nhất</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => openTimeline(p)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.personnelCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {p.unit?.name || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {p.managementCategory === 'CAN_BO' ? 'Cán bộ' : 'Quân lực'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {p.officerCareer?.currentRank || p.militaryRank || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {fmtDate(p.officerCareer?.lastRankDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openTimeline(p) }}>
                          <Shield className="h-3.5 w-3.5 mr-1" />Xem lịch sử
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">Trang {page} / {totalPages}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Timeline Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={timelineOpen} onOpenChange={v => { setTimelineOpen(v); if (!v) setSelected(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Lịch sử quân hàm — {selected?.fullName}
              <span className="text-sm font-normal text-muted-foreground">({selected?.personnelCode})</span>
            </DialogTitle>
          </DialogHeader>

          {/* Add event button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {timeline.length > 0
                ? `${timeline.length} sự kiện — từ ${fmtDate(timeline[0]?.effectiveDate)} đến ${fmtDate(timeline[timeline.length - 1]?.effectiveDate)}`
                : 'Chưa có sự kiện nào được ghi nhận'}
            </p>
            <Button size="sm" onClick={() => { setAddForm({ ...FORM_EMPTY }); setAddOpen(true) }}
              className="bg-blue-700 hover:bg-blue-800 text-white">
              <Plus className="h-3.5 w-3.5 mr-1" />Thêm mốc lịch sử
            </Button>
          </div>

          {/* Timeline */}
          {timelineLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : timeline.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Shield className="h-10 w-10 opacity-25" />
              <p className="text-sm text-center">Chưa có lịch sử quân hàm trong CSDL.<br />Nhấn &quot;Thêm mốc lịch sử&quot; để bắt đầu nhập từ mốc nhập ngũ.</p>
            </div>
          ) : (
            <div className="relative py-2">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-1">
                {timeline.map((rec, idx) => (
                  <div key={rec.id} className="relative flex gap-4 pb-5">
                    {/* Dot */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                      ${idx === timeline.length - 1
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                      <Shield className={`h-4 w-4 ${idx === timeline.length - 1 ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span className="font-semibold text-sm">
                            {PROMOTION_TYPE_LABELS[rec.promotionType] || rec.promotionType}
                          </span>
                          {idx === timeline.length - 1 && (
                            <Badge className="ml-2 text-xs bg-emerald-600 text-white">Hiện tại</Badge>
                          )}
                          {idx === 0 && timeline.length > 1 && (
                            <Badge variant="outline" className="ml-2 text-xs">Đầu tiên</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />{fmtDate(rec.effectiveDate)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                        {rec.previousRank && rec.newRank && (
                          <span className="font-medium text-foreground">{rec.previousRank} → {rec.newRank}</span>
                        )}
                        {rec.newRank && !rec.previousRank && (
                          <span className="font-medium text-foreground">Quân hàm: {rec.newRank}</span>
                        )}
                        {(rec.previousPosition || rec.newPosition) && (
                          <span>
                            {rec.previousPosition && <>{rec.previousPosition}</>}
                            {rec.previousPosition && rec.newPosition && ' → '}
                            {rec.newPosition && <strong className="text-foreground">{rec.newPosition}</strong>}
                          </span>
                        )}
                        {rec.decisionNumber && (
                          <span>QĐ: {rec.decisionNumber}{rec.decisionDate ? ` (${fmtDate(rec.decisionDate)})` : ''}</span>
                        )}
                      </div>
                      {rec.reason && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">{rec.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimelineOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Promotion Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setAddForm({ ...FORM_EMPTY }) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm mốc quân hàm — {selected?.fullName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              Dữ liệu sẽ được ghi <strong>trực tiếp vào CSDL</strong> (không qua workflow duyệt).
              Chỉ dùng để nhập lịch sử cũ đã có quyết định chính thức.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Loại sự kiện *</Label>
                <Select value={addForm.promotionType} onValueChange={v => setAddForm({ ...addForm, promotionType: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ngày hiệu lực *</Label>
                <Input type="date" value={addForm.effectiveDate} onChange={e => setAddForm({ ...addForm, effectiveDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quân hàm cũ</Label>
                <Input value={addForm.previousRank} onChange={e => setAddForm({ ...addForm, previousRank: e.target.value })} placeholder="VD: Đại úy" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quân hàm mới</Label>
                <Input value={addForm.newRank} onChange={e => setAddForm({ ...addForm, newRank: e.target.value })} placeholder="VD: Thiếu tá" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Số quyết định</Label>
                <Input value={addForm.decisionNumber} onChange={e => setAddForm({ ...addForm, decisionNumber: e.target.value })} placeholder="VD: 123/QĐ-BQP" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ngày ban hành QĐ</Label>
                <Input type="date" value={addForm.decisionDate} onChange={e => setAddForm({ ...addForm, decisionDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Chức vụ cũ</Label>
                <Input value={addForm.previousPosition} onChange={e => setAddForm({ ...addForm, previousPosition: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Chức vụ mới</Label>
                <Input value={addForm.newPosition} onChange={e => setAddForm({ ...addForm, newPosition: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Lý do / Căn cứ</Label>
              <Textarea rows={2} value={addForm.reason} onChange={e => setAddForm({ ...addForm, reason: e.target.value })} placeholder="Theo Quyết định số... hoặc lý do thay đổi quân hàm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ghi chú</Label>
              <Textarea rows={2} value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm({ ...FORM_EMPTY }) }}>
              <X className="h-4 w-4 mr-1.5" />Hủy
            </Button>
            <Button onClick={handleAddPromotion} disabled={addSaving} className="min-w-[100px]">
              {addSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Ghi vào CSDL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
