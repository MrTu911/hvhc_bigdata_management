'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TalentRankingPanel } from '@/components/personnel/search/talent-ranking-panel'
import type { TalentCandidate } from '@/components/personnel/search/talent-ranking-panel'
import { Target, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

// ─── Form state ───────────────────────────────────────────────────────────────

interface PlanningForm {
  targetPosition: string
  category: string
  requiredDegree: string
  requiredPoliticalTheory: string
  requiredServiceYearsMin: string
  preferredMajorRaw: string   // comma-separated, split before POST
  preferredAcademicTitle: string
  topN: string
}

const BLANK: PlanningForm = {
  targetPosition: '',
  category: '',
  requiredDegree: '',
  requiredPoliticalTheory: '',
  requiredServiceYearsMin: '',
  preferredMajorRaw: '',
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

// ─── Meta display ─────────────────────────────────────────────────────────────

interface SearchMeta {
  topN: number
  totalScanned: number
  hardFiltered: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonnelPlanningPage() {
  const [form, setForm] = useState<PlanningForm>(BLANK)
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<TalentCandidate[] | null>(null)
  const [meta, setMeta] = useState<SearchMeta | undefined>()

  const set = (field: keyof PlanningForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setCandidates(null)
    setMeta(undefined)

    const preferredMajor = form.preferredMajorRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const body: Record<string, unknown> = {}
    if (form.targetPosition) body.targetPosition = form.targetPosition
    if (form.category && form.category !== '_all') body.category = form.category
    if (form.requiredDegree) body.requiredDegree = form.requiredDegree
    if (form.requiredPoliticalTheory) body.requiredPoliticalTheory = form.requiredPoliticalTheory
    if (form.requiredServiceYearsMin) body.requiredServiceYearsMin = Number(form.requiredServiceYearsMin)
    if (preferredMajor.length > 0) body.preferredMajor = preferredMajor
    if (form.preferredAcademicTitle) body.preferredAcademicTitle = form.preferredAcademicTitle
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
            : 'Tiêu chí không hợp lệ — phải có ít nhất 1 tiêu chí',
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Quy hoạch & Tìm nguồn cán bộ</h1>
          <p className="text-xs text-muted-foreground">
            Nhập yêu cầu vị trí — hệ thống xếp hạng ứng viên theo điểm phù hợp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        {/* ── Input panel ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Tiêu chí yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Target position */}
              <div className="space-y-1">
                <Label>Vị trí cần quy hoạch</Label>
                <Input
                  placeholder="VD: Chủ nhiệm Khoa, Trưởng phòng..."
                  value={form.targetPosition}
                  onChange={(e) => set('targetPosition', e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label>Nhóm cán bộ</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger>
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

              <Separator />

              {/* Required degree */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Học vị tối thiểu
                  <span className="text-xs text-muted-foreground font-normal">(lọc mềm)</span>
                </Label>
                <Input
                  placeholder="VD: Tiến sĩ, Thạc sĩ..."
                  value={form.requiredDegree}
                  onChange={(e) => set('requiredDegree', e.target.value)}
                />
              </div>

              {/* Political theory */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Lý luận chính trị
                  <span className="text-xs text-muted-foreground font-normal">(lọc mềm)</span>
                </Label>
                <Input
                  placeholder="VD: Cao cấp, Trung cấp..."
                  value={form.requiredPoliticalTheory}
                  onChange={(e) => set('requiredPoliticalTheory', e.target.value)}
                />
              </div>

              {/* Service years */}
              <div className="space-y-1">
                <Label>Năm công tác tối thiểu</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  placeholder="VD: 8"
                  value={form.requiredServiceYearsMin}
                  onChange={(e) => set('requiredServiceYearsMin', e.target.value)}
                />
              </div>

              <Separator />

              {/* Preferred major */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Chuyên ngành ưu tiên
                  <span className="text-xs text-muted-foreground font-normal">(cách nhau dấu phẩy)</span>
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Hậu cần QS, Kinh tế QP, Quản trị..."
                  value={form.preferredMajorRaw}
                  onChange={(e) => set('preferredMajorRaw', e.target.value)}
                />
              </div>

              {/* Preferred academic title */}
              <div className="space-y-1">
                <Label>Học hàm ưu tiên</Label>
                <Input
                  placeholder="VD: PGS, GS..."
                  value={form.preferredAcademicTitle}
                  onChange={(e) => set('preferredAcademicTitle', e.target.value)}
                />
              </div>

              {/* topN */}
              <div className="space-y-1">
                <Label>Số ứng viên hiển thị</Label>
                <Select value={form.topN} onValueChange={(v) => set('topN', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="30">Top 30</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/60 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Kết quả là công cụ hỗ trợ tham khảo — không thay thế quyết định nhân sự.
                </span>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tìm nguồn cán bộ
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Results panel ────────────────────────────────────────────── */}
        <div>
          {candidates === null && !loading ? (
            <div className="rounded-md border py-16 text-center text-muted-foreground text-sm">
              Nhập tiêu chí và nhấn <strong>Tìm nguồn cán bộ</strong> để bắt đầu quy hoạch.
            </div>
          ) : (
            <TalentRankingPanel
              candidates={candidates ?? []}
              meta={meta}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
