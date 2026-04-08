'use client'

import { useState, useEffect } from 'react'
import { FamilyRelationType } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { FamilyMember } from './family-member-table'

// ─── Label map ────────────────────────────────────────────────────────────────

const RELATION_LABELS: Record<FamilyRelationType, string> = {
  FATHER:        'Cha',
  MOTHER:        'Mẹ',
  SPOUSE:        'Vợ / Chồng',
  CHILD:         'Con',
  SIBLING:       'Anh / Chị / Em',
  FATHER_IN_LAW: 'Bố vợ / Bố chồng',
  MOTHER_IN_LAW: 'Mẹ vợ / Mẹ chồng',
  OTHER:         'Khác',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMemberFormProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  personnelId: string
  initialData?: FamilyMember
  /** Whether sensitive fields (citizenId, phoneNumber, address) can be edited */
  includeSensitive?: boolean
  onSuccess?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyMemberForm({
  open,
  onOpenChange,
  personnelId,
  initialData,
  includeSensitive = false,
  onSuccess,
}: FamilyMemberFormProps) {
  const isEditing = !!initialData?.id
  const [loading, setLoading] = useState(false)

  const blank = {
    relation: 'SPOUSE' as FamilyRelationType,
    fullName: '',
    dateOfBirth: '',
    citizenId: '',
    phoneNumber: '',
    occupation: '',
    workplace: '',
    address: '',
    isDeceased: false,
    deceasedDate: '',
    dependentFlag: false,
    notes: '',
  }

  const [form, setForm] = useState(blank)

  useEffect(() => {
    if (open) {
      setForm({
        relation: initialData?.relation ?? 'SPOUSE',
        fullName: initialData?.fullName ?? '',
        dateOfBirth: initialData?.dateOfBirth ? initialData.dateOfBirth.slice(0, 10) : '',
        citizenId: initialData?.citizenId ?? '',
        phoneNumber: initialData?.phoneNumber ?? '',
        occupation: initialData?.occupation ?? '',
        workplace: initialData?.workplace ?? '',
        address: initialData?.address ?? '',
        isDeceased: initialData?.isDeceased ?? false,
        deceasedDate: initialData?.deceasedDate ? initialData.deceasedDate.slice(0, 10) : '',
        dependentFlag: initialData?.dependentFlag ?? false,
        notes: initialData?.notes ?? '',
      })
    }
  }, [open, initialData])

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast.error('Họ tên bắt buộc')
      return
    }

    setLoading(true)
    const payload: Record<string, unknown> = {
      relation: form.relation,
      fullName: form.fullName,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
      occupation: form.occupation || null,
      workplace: form.workplace || null,
      isDeceased: form.isDeceased,
      deceasedDate: form.deceasedDate ? new Date(form.deceasedDate).toISOString() : null,
      dependentFlag: form.dependentFlag,
      notes: form.notes || null,
    }

    // Only include sensitive fields if caller has access
    if (includeSensitive) {
      payload.citizenId = form.citizenId || null
      payload.phoneNumber = form.phoneNumber || null
      payload.address = form.address || null
    }

    try {
      const url = isEditing
        ? `/api/personnel/family/${initialData!.id}`
        : `/api/personnel/${personnelId}/family`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(typeof json.error === 'string' ? json.error : 'Dữ liệu không hợp lệ')
        return
      }

      toast.success(isEditing ? 'Cập nhật thành công' : 'Đã thêm thành viên gia đình')
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Cập nhật thành viên gia đình' : 'Thêm thành viên gia đình'}
          </DialogTitle>
          <DialogDescription>
            Thông tin quan hệ gia đình của cán bộ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Relation + fullName */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Quan hệ <span className="text-destructive">*</span></Label>
              <Select
                value={form.relation}
                onValueChange={(v) => set('relation', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATION_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Họ và tên <span className="text-destructive">*</span></Label>
              <Input
                required
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </div>
          </div>

          {/* dateOfBirth */}
          <div className="space-y-1">
            <Label>Ngày sinh</Label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </div>

          {/* occupation + workplace */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nghề nghiệp</Label>
              <Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nơi công tác</Label>
              <Input value={form.workplace} onChange={(e) => set('workplace', e.target.value)} />
            </div>
          </div>

          {/* Sensitive fields – only shown when caller has VIEW_SENSITIVE */}
          {includeSensitive ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>CCCD / CMND</Label>
                  <Input value={form.citizenId} onChange={(e) => set('citizenId', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Địa chỉ</Label>
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded bg-muted/40 text-xs text-muted-foreground border border-dashed">
              <Lock className="w-3 h-3 shrink-0" />
              <span>CCCD, SĐT và địa chỉ bị ẩn — cần quyền <strong>VIEW_PERSONNEL_SENSITIVE</strong></span>
            </div>
          )}

          {/* isDeceased */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDeceased"
              checked={form.isDeceased}
              onCheckedChange={(v) => set('isDeceased', !!v)}
            />
            <Label htmlFor="isDeceased" className="cursor-pointer">Đã mất</Label>
          </div>

          {form.isDeceased && (
            <div className="space-y-1">
              <Label>Ngày mất</Label>
              <Input
                type="date"
                value={form.deceasedDate}
                onChange={(e) => set('deceasedDate', e.target.value)}
              />
            </div>
          )}

          {/* dependentFlag */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dependentFlag"
              checked={form.dependentFlag}
              onCheckedChange={(v) => set('dependentFlag', !!v)}
            />
            <Label htmlFor="dependentFlag" className="cursor-pointer">Người phụ thuộc</Label>
          </div>

          {/* notes */}
          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
              {isEditing ? 'Lưu' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
