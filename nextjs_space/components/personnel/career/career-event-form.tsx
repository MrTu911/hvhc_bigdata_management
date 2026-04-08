'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CareerEventType } from '@prisma/client'
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
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { CareerEvent } from './career-timeline'

// ─── Local form schema ────────────────────────────────────────────────────────
// Simplified shape matching API contract (service validates strictly)

const formSchema = z
  .object({
    eventType: z.nativeEnum(CareerEventType),
    eventDate: z.string().min(1, 'Ngày bắt buộc'),
    effectiveDate: z.string().optional(),
    endDate: z.string().optional(),
    title: z.string().min(1, 'Tên sự kiện bắt buộc').max(500),
    decisionNumber: z.string().max(100).optional(),
    decisionAuthority: z.string().max(300).optional(),
    oldPosition: z.string().max(300).optional(),
    newPosition: z.string().max(300).optional(),
    oldRank: z.string().max(200).optional(),
    newRank: z.string().max(200).optional(),
    oldUnit: z.string().max(300).optional(),
    newUnit: z.string().max(300).optional(),
    reason: z.string().max(1000).optional(),
    notes: z.string().max(2000).optional(),
    attachmentUrl: z.string().max(1000).optional(),
  })
  .refine(
    (d) => {
      if (!d.effectiveDate || !d.endDate) return true
      return new Date(d.endDate) >= new Date(d.effectiveDate)
    },
    { message: 'Ngày kết thúc phải sau ngày hiệu lực', path: ['endDate'] },
  )

type FormValues = z.infer<typeof formSchema>

// ─── Event type labels ────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<CareerEventType, string> = {
  ENLISTMENT:      'Nhập ngũ',
  PROMOTION:       'Thăng quân hàm',
  APPOINTMENT:     'Bổ nhiệm',
  TRANSFER:        'Điều động',
  TRAINING:        'Đào tạo / Bồi dưỡng',
  AWARD:           'Khen thưởng',
  DISCIPLINE:      'Kỷ luật',
  RETIREMENT:      'Nghỉ hưu',
  DISCHARGE:       'Xuất ngũ',
  OTHER:           'Khác',
  RANK_DEMOTION:   'Hạ quân hàm',
  SECONDMENT:      'Biệt phái',
  STUDY_LEAVE:     'Đi học',
  RETURN:          'Về đơn vị',
  RETIREMENT_PREP: 'Chuẩn bị hưu',
  UNIT_CHANGE:     'Chuyển đơn vị',
  POSITION_CHANGE: 'Thay đổi chức vụ',
}

/** Event types that have an endDate */
const PERIOD_TYPES: CareerEventType[] = ['STUDY_LEAVE', 'SECONDMENT', 'TRAINING']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInputDate(iso: string | null | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function toISOFromDate(date: string) {
  if (!date) return undefined
  return new Date(date).toISOString()
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CareerEventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personnelId: string
  /** Set when editing an existing event */
  initialData?: CareerEvent
  onSuccess?: () => void
}

export function CareerEventForm({
  open,
  onOpenChange,
  personnelId,
  initialData,
  onSuccess,
}: CareerEventFormProps) {
  const [loading, setLoading] = useState(false)
  const [warnings, setWarnings] = useState<{ message: string }[]>([])
  const isEditing = !!initialData?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: initialData?.eventType ?? 'APPOINTMENT',
      eventDate: toInputDate(initialData?.eventDate),
      effectiveDate: toInputDate(initialData?.effectiveDate),
      endDate: toInputDate(initialData?.endDate),
      title: initialData?.title ?? '',
      decisionNumber: initialData?.decisionNumber ?? '',
      decisionAuthority: initialData?.decisionAuthority ?? '',
      oldPosition: initialData?.oldPosition ?? '',
      newPosition: initialData?.newPosition ?? '',
      oldRank: initialData?.oldRank ?? '',
      newRank: initialData?.newRank ?? '',
      oldUnit: initialData?.oldUnit ?? '',
      newUnit: initialData?.newUnit ?? '',
      reason: initialData?.reason ?? '',
      notes: initialData?.notes ?? '',
      attachmentUrl: initialData?.attachmentUrl ?? '',
    },
  })

  // Reset form when dialog opens / initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        eventType: initialData?.eventType ?? 'APPOINTMENT',
        eventDate: toInputDate(initialData?.eventDate),
        effectiveDate: toInputDate(initialData?.effectiveDate),
        endDate: toInputDate(initialData?.endDate),
        title: initialData?.title ?? '',
        decisionNumber: initialData?.decisionNumber ?? '',
        decisionAuthority: initialData?.decisionAuthority ?? '',
        oldPosition: initialData?.oldPosition ?? '',
        newPosition: initialData?.newPosition ?? '',
        oldRank: initialData?.oldRank ?? '',
        newRank: initialData?.newRank ?? '',
        oldUnit: initialData?.oldUnit ?? '',
        newUnit: initialData?.newUnit ?? '',
        reason: initialData?.reason ?? '',
        notes: initialData?.notes ?? '',
        attachmentUrl: initialData?.attachmentUrl ?? '',
      })
      setWarnings([])
    }
  }, [open, initialData])

  const watchedEventType = form.watch('eventType')
  const showEndDate = PERIOD_TYPES.includes(watchedEventType as CareerEventType)

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setWarnings([])

    const payload = {
      ...values,
      eventDate: toISOFromDate(values.eventDate) ?? values.eventDate,
      effectiveDate: values.effectiveDate ? toISOFromDate(values.effectiveDate) : null,
      endDate: values.endDate ? toISOFromDate(values.endDate) : null,
    }

    try {
      let res: Response

      if (isEditing) {
        res = await fetch(`/api/personnel/career/${initialData!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/personnel/${personnelId}/career`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(
          typeof json.error === 'string'
            ? json.error
            : 'Dữ liệu không hợp lệ',
        )
        return
      }

      if (json.warnings?.length) {
        setWarnings(json.warnings)
        toast.warning('Đã lưu nhưng có cảnh báo timeline')
      } else {
        toast.success(isEditing ? 'Cập nhật thành công' : 'Thêm sự kiện thành công')
      }

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Cập nhật sự kiện công tác' : 'Thêm sự kiện công tác'}</DialogTitle>
          <DialogDescription>
            Điền thông tin sự kiện và quyết định liên quan.
          </DialogDescription>
        </DialogHeader>

        {warnings.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i}>{w.message}</p>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: eventType + eventDate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Loại sự kiện <span className="text-destructive">*</span></Label>
              <Select
                value={form.watch('eventType')}
                onValueChange={(v) => form.setValue('eventType', v as CareerEventType, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.eventType && (
                <p className="text-xs text-destructive">{form.formState.errors.eventType.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Ngày ghi nhận <span className="text-destructive">*</span></Label>
              <Input type="date" {...form.register('eventDate')} />
              {form.formState.errors.eventDate && (
                <p className="text-xs text-destructive">{form.formState.errors.eventDate.message}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label>Tên sự kiện <span className="text-destructive">*</span></Label>
            <Input placeholder="Ví dụ: Bổ nhiệm Trưởng phòng Đào tạo" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Row: effectiveDate + endDate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Ngày hiệu lực</Label>
              <Input type="date" {...form.register('effectiveDate')} />
            </div>
            {showEndDate && (
              <div className="space-y-1">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...form.register('endDate')} />
                {form.formState.errors.endDate && (
                  <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Row: decisionNumber + decisionAuthority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Số quyết định</Label>
              <Input placeholder="VD: 123/QĐ-HVHC" {...form.register('decisionNumber')} />
            </div>
            <div className="space-y-1">
              <Label>Cơ quan ra quyết định</Label>
              <Input placeholder="VD: Giám đốc Học viện" {...form.register('decisionAuthority')} />
            </div>
          </div>

          {/* Row: oldPosition + newPosition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Chức vụ cũ</Label>
              <Input {...form.register('oldPosition')} />
            </div>
            <div className="space-y-1">
              <Label>Chức vụ mới</Label>
              <Input {...form.register('newPosition')} />
            </div>
          </div>

          {/* Row: oldRank + newRank */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Quân hàm cũ</Label>
              <Input {...form.register('oldRank')} />
            </div>
            <div className="space-y-1">
              <Label>Quân hàm mới</Label>
              <Input {...form.register('newRank')} />
            </div>
          </div>

          {/* Row: oldUnit + newUnit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Đơn vị cũ</Label>
              <Input {...form.register('oldUnit')} />
            </div>
            <div className="space-y-1">
              <Label>Đơn vị mới</Label>
              <Input {...form.register('newUnit')} />
            </div>
          </div>

          {/* reason */}
          <div className="space-y-1">
            <Label>Lý do</Label>
            <Textarea rows={2} {...form.register('reason')} />
          </div>

          {/* notes */}
          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Textarea rows={2} {...form.register('notes')} />
          </div>

          {/* attachmentUrl */}
          <div className="space-y-1">
            <Label>URL file quyết định</Label>
            <Input placeholder="MinIO key hoặc signed URL" {...form.register('attachmentUrl')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Thêm sự kiện'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
