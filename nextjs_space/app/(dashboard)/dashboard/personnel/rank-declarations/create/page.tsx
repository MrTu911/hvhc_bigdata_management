'use client'

/**
 * M02 Extension – Tạo bản khai quá trình lên quân hàm
 * Route: /dashboard/personnel/rank-declarations/create
 */
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModuleHero } from '@/components/ui/enhanced-data-card'
import { toast } from '@/components/ui/use-toast'
import {
  PersonnelCombobox,
  type PersonnelOption,
} from '@/components/personnel/personnel-combobox'
import {
  getRankOptions,
  PROMOTION_TYPE_OPTIONS,
  type RankType,
} from '@/lib/constants/rank-declaration'
import { ArrowLeft, Loader2, Award, UserCog, FileSignature, Save } from 'lucide-react'

interface DeclarationForm {
  rankType: RankType
  promotionType: string
  previousRank: string
  newRank: string
  effectiveDate: string
  decisionNumber: string
  decisionDate: string
  previousPosition: string
  newPosition: string
  reason: string
  notes: string
  onBehalf: boolean
}

const INITIAL_FORM: DeclarationForm = {
  rankType: 'OFFICER',
  promotionType: 'THANG_CAP',
  previousRank: '',
  newRank: '',
  effectiveDate: '',
  decisionNumber: '',
  decisionDate: '',
  previousPosition: '',
  newPosition: '',
  reason: '',
  notes: '',
  onBehalf: false,
}

export default function CreateRankDeclarationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledPersonnelId = searchParams.get('personnelId')

  const [personnel, setPersonnel] = useState<PersonnelOption | null>(null)
  const [form, setForm] = useState<DeclarationForm>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const rankOptions = getRankOptions(form.rankType)

  function updateField<K extends keyof DeclarationForm>(field: K, value: DeclarationForm[K]) {
    setForm((prev) => {
      // Đổi loại quân hàm → reset hai trường quân hàm vì danh mục khác nhau
      if (field === 'rankType') {
        return { ...prev, rankType: value as RankType, previousRank: '', newRank: '' }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!personnel) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn cán bộ.', variant: 'destructive' })
      return
    }
    if (!form.effectiveDate) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập ngày hiệu lực.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/officer-career/rank-declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnelId:      personnel.id,
          rankType:         form.rankType,
          promotionType:    form.promotionType,
          previousRank:     form.previousRank     || null,
          newRank:          form.newRank          || null,
          effectiveDate:    form.effectiveDate,
          decisionNumber:   form.decisionNumber   || null,
          decisionDate:     form.decisionDate     || null,
          previousPosition: form.previousPosition || null,
          newPosition:      form.newPosition      || null,
          reason:           form.reason           || null,
          notes:            form.notes            || null,
          onBehalf:         form.onBehalf,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể tạo bản khai')
      }
      toast({ title: 'Đã lưu bản nháp', description: 'Bản khai đã được tạo thành công.' })
      router.push(`/dashboard/personnel/rank-declarations/${json.data.id}`)
    } catch (e: any) {
      toast({
        title: 'Tạo bản khai thất bại',
        description: e?.message ?? 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="personnel"
        supra="M02 · Nhân sự"
        title="Tạo bản khai quân hàm"
        subtitle="Khai báo một sự kiện thăng/biến động quân hàm cho cán bộ, quân nhân"
        icon={Award}
        controls={
          <Button
            variant="outline" size="sm" onClick={() => router.back()}
            className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
        {/* ── Đối tượng khai báo ──────────────────────────────────────────── */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-700">
              <UserCog className="h-4 w-4 text-blue-600" /> Đối tượng khai báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-slate-600">
                Cán bộ / quân nhân <span className="text-red-500">*</span>
              </Label>
              <PersonnelCombobox
                value={personnel}
                onChange={setPersonnel}
                initialId={prefilledPersonnelId}
              />
              {personnel && (
                <p className="text-xs text-slate-500">
                  Đơn vị: {personnel.unit?.name ?? '—'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <Label className="text-slate-700">Khai hộ</Label>
                <p className="text-xs text-slate-500">
                  Bật khi cán bộ nhân sự khai thay cho người khác
                </p>
              </div>
              <Switch
                checked={form.onBehalf}
                onCheckedChange={(v) => updateField('onBehalf', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Nội dung quân hàm ───────────────────────────────────────────── */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-700">
              <Award className="h-4 w-4 text-blue-600" /> Nội dung quân hàm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-slate-600">
                  Loại quân hàm <span className="text-red-500">*</span>
                </Label>
                <Select value={form.rankType} onValueChange={(v) => updateField('rankType', v as RankType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICER">Sĩ quan</SelectItem>
                    <SelectItem value="SOLDIER">Quân nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">
                  Loại sự kiện <span className="text-red-500">*</span>
                </Label>
                <Select value={form.promotionType} onValueChange={(v) => updateField('promotionType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROMOTION_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Quân hàm trước</Label>
                <Select value={form.previousRank} onValueChange={(v) => updateField('previousRank', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent>
                    {rankOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Quân hàm mới</Label>
                <Select value={form.newRank} onValueChange={(v) => updateField('newRank', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent>
                    {rankOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Chức vụ trước</Label>
                <Input
                  value={form.previousPosition}
                  onChange={(e) => updateField('previousPosition', e.target.value)}
                  placeholder="Nếu có thay đổi chức vụ"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Chức vụ mới</Label>
                <Input
                  value={form.newPosition}
                  onChange={(e) => updateField('newPosition', e.target.value)}
                  placeholder="Nếu có thay đổi chức vụ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Thông tin quyết định ────────────────────────────────────────── */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-700">
              <FileSignature className="h-4 w-4 text-blue-600" /> Thông tin quyết định
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-slate-600">
                  Ngày hiệu lực <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => updateField('effectiveDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-600">Số quyết định</Label>
                <Input
                  value={form.decisionNumber}
                  onChange={(e) => updateField('decisionNumber', e.target.value)}
                  placeholder="VD: 123/QĐ-HVHC"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-600">Ngày quyết định</Label>
                <Input
                  type="date"
                  value={form.decisionDate}
                  onChange={(e) => updateField('decisionDate', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-600">Lý do / Căn cứ</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => updateField('reason', e.target.value)}
                rows={3}
                placeholder="Lý do thăng cấp, số nghị quyết căn cứ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-600">Ghi chú thêm</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Sticky action bar ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu bản nháp
          </Button>
        </div>
      </form>
    </div>
  )
}
