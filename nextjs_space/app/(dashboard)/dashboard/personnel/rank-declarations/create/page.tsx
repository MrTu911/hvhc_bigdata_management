'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, Loader2, Shield } from 'lucide-react'

const OFFICER_RANK_OPTIONS = [
  { value: 'THIEU_UY', label: 'Thiếu úy' },
  { value: 'TRUNG_UY', label: 'Trung úy' },
  { value: 'THUONG_UY', label: 'Thượng úy' },
  { value: 'DAI_UY', label: 'Đại úy' },
  { value: 'THIEU_TA', label: 'Thiếu tá' },
  { value: 'TRUNG_TA', label: 'Trung tá' },
  { value: 'THUONG_TA', label: 'Thượng tá' },
  { value: 'DAI_TA', label: 'Đại tá' },
  { value: 'THIEU_TUONG', label: 'Thiếu tướng' },
  { value: 'TRUNG_TUONG', label: 'Trung tướng' },
  { value: 'THUONG_TUONG', label: 'Thượng tướng' },
  { value: 'DAI_TUONG', label: 'Đại tướng' },
]

const SOLDIER_RANK_OPTIONS = [
  { value: 'BINH_NHI', label: 'Binh nhì' },
  { value: 'BINH_NHAT', label: 'Binh nhất' },
  { value: 'HA_SI', label: 'Hạ sĩ' },
  { value: 'TRUNG_SI', label: 'Trung sĩ' },
  { value: 'THUONG_SI', label: 'Thượng sĩ' },
]

const PROMOTION_TYPES = [
  { value: 'THANG_CAP',   label: 'Thăng cấp' },
  { value: 'BO_NHIEM',    label: 'Bổ nhiệm' },
  { value: 'DIEU_DONG',   label: 'Điều động' },
  { value: 'LUAN_CHUYEN', label: 'Luân chuyển' },
  { value: 'GIANG_CHUC',  label: 'Giáng chức' },
  { value: 'CACH_CHUC',   label: 'Cách chức' },
  { value: 'NGHI_HUU',    label: 'Nghỉ hưu' },
  { value: 'XUAT_NGU',    label: 'Xuất ngũ' },
]

export default function CreateRankDeclarationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledPersonnelId = searchParams.get('personnelId') ?? ''

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    personnelId:      prefilledPersonnelId,
    rankType:         'OFFICER',
    promotionType:    'THANG_CAP',
    previousRank:     '',
    newRank:          '',
    effectiveDate:    '',
    decisionNumber:   '',
    decisionDate:     '',
    previousPosition: '',
    newPosition:      '',
    reason:           '',
    notes:            '',
    onBehalf:         false,
  })

  const rankOptions = form.rankType === 'OFFICER' ? OFFICER_RANK_OPTIONS : SOLDIER_RANK_OPTIONS

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'rankType') {
      setForm((prev) => ({ ...prev, rankType: value as string, previousRank: '', newRank: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.personnelId || !form.effectiveDate) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/officer-career/rank-declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          previousRank:   form.previousRank   || null,
          newRank:        form.newRank         || null,
          decisionNumber: form.decisionNumber  || null,
          decisionDate:   form.decisionDate    || null,
          previousPosition: form.previousPosition || null,
          newPosition:    form.newPosition     || null,
          reason:         form.reason          || null,
          notes:          form.notes           || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Có lỗi xảy ra')
        return
      }
      router.push(`/dashboard/personnel/rank-declarations/${json.data.id}`)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tạo bản khai quân hàm
          </h1>
          <p className="text-sm text-muted-foreground">
            Khai báo một sự kiện lên/thay đổi quân hàm
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Mã cán bộ / Personnel ID <span className="text-red-500">*</span></Label>
                <Input
                  value={form.personnelId}
                  onChange={(e) => handleChange('personnelId', e.target.value)}
                  placeholder="ID hoặc mã cán bộ"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Loại quân hàm <span className="text-red-500">*</span></Label>
                <Select value={form.rankType} onValueChange={(v) => handleChange('rankType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICER">Sĩ quan</SelectItem>
                    <SelectItem value="SOLDIER">Quân nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Loại sự kiện <span className="text-red-500">*</span></Label>
                <Select value={form.promotionType} onValueChange={(v) => handleChange('promotionType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROMOTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Quân hàm trước</Label>
                <Select value={form.previousRank} onValueChange={(v) => handleChange('previousRank', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent>
                    {rankOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Quân hàm mới</Label>
                <Select value={form.newRank} onValueChange={(v) => handleChange('newRank', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent>
                    {rankOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin quyết định</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Ngày hiệu lực <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Số quyết định</Label>
                <Input
                  value={form.decisionNumber}
                  onChange={(e) => handleChange('decisionNumber', e.target.value)}
                  placeholder="VD: 123/QĐ-HVHC"
                />
              </div>
              <div className="space-y-1">
                <Label>Ngày quyết định</Label>
                <Input
                  type="date"
                  value={form.decisionDate}
                  onChange={(e) => handleChange('decisionDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Chức vụ mới</Label>
                <Input
                  value={form.newPosition}
                  onChange={(e) => handleChange('newPosition', e.target.value)}
                  placeholder="Nếu có thay đổi chức vụ"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Lý do / Căn cứ</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={3}
                placeholder="Lý do thăng cấp, số nghị quyết căn cứ..."
              />
            </div>
            <div className="space-y-1">
              <Label>Ghi chú thêm</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu bản nháp
          </Button>
        </div>
      </form>
    </div>
  )
}
