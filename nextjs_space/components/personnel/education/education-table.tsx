'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { GraduationCap, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EducationLevel } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EducationRecord {
  id: string
  personnelId: string | null
  level: EducationLevel
  institution: string
  // trainingSystem: loại chương trình theo tổ chức — "Chính quy", "Tại chức", "Từ xa", "Liên kết"
  // studyMode:      hình thức học của cá nhân    — "Toàn thời gian", "Bán thời gian", "Trực tuyến"
  // Khi import từ 2A-LLĐV chỉ có "Hệ đào tạo" → gán vào trainingSystem, để studyMode null.
  trainingSystem: string | null
  studyMode: string | null
  major: string | null
  startDate: string | null
  endDate: string | null
  gpa: number | null
  thesisTitle: string | null
  supervisor: string | null
  certificateCode: string | null
  certificateDate: string | null
  classification: string | null
  notes: string | null
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const LEVEL_MAP: Record<EducationLevel, string> = {
  DAI_HOC: 'Đại học',
  THAC_SI: 'Thạc sĩ',
  TIEN_SI: 'Tiến sĩ',
  CU_NHAN_NGOAI_NGU: 'Cử nhân ngoại ngữ',
  KHAC: 'Khác',
}

const LEVEL_VARIANT: Record<EducationLevel, 'default' | 'secondary' | 'outline'> = {
  DAI_HOC: 'outline',
  THAC_SI: 'secondary',
  TIEN_SI: 'default',
  CU_NHAN_NGOAI_NGU: 'outline',
  KHAC: 'outline',
}

function formatYear(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).getFullYear().toString()
}

// ─── Inline edit dialog ───────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  personnelId: string
  record?: EducationRecord
  onSuccess: () => void
}

function EducationEditDialog({ open, onOpenChange, personnelId, record, onSuccess }: EditDialogProps) {
  const isEditing = !!record?.id
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    level: record?.level ?? 'DAI_HOC' as EducationLevel,
    institution: record?.institution ?? '',
    major: record?.major ?? '',
    studyMode: record?.studyMode ?? '',
    trainingSystem: record?.trainingSystem ?? '',
    startDate: record?.startDate ? record.startDate.slice(0, 10) : '',
    endDate: record?.endDate ? record.endDate.slice(0, 10) : '',
    gpa: record?.gpa != null ? String(record.gpa) : '',
    classification: record?.classification ?? '',
    thesisTitle: record?.thesisTitle ?? '',
    certificateCode: record?.certificateCode ?? '',
    notes: record?.notes ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      level: form.level,
      institution: form.institution,
      major: form.major || null,
      studyMode: form.studyMode || null,
      trainingSystem: form.trainingSystem || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      classification: form.classification || null,
      thesisTitle: form.thesisTitle || null,
      certificateCode: form.certificateCode || null,
      notes: form.notes || null,
    }

    try {
      const url = isEditing
        ? `/api/personnel/education/${record!.id}`
        : `/api/personnel/${personnelId}/education`
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

      toast.success(isEditing ? 'Cập nhật thành công' : 'Đã thêm bằng cấp')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Cập nhật bằng cấp' : 'Thêm bằng cấp / đào tạo'}</DialogTitle>
          <DialogDescription>Thông tin học vấn và đào tạo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Trình độ <span className="text-destructive">*</span></Label>
              <Select value={form.level} onValueChange={(v) => set('level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_MAP).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Hình thức đào tạo</Label>
              <Input placeholder="Tập trung / Tại chức / Từ xa" value={form.studyMode} onChange={e => set('studyMode', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Cơ sở đào tạo <span className="text-destructive">*</span></Label>
            <Input required value={form.institution} onChange={e => set('institution', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Chuyên ngành</Label>
            <Input value={form.major} onChange={e => set('major', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Năm bắt đầu</Label>
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Năm kết thúc</Label>
              <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Xếp loại</Label>
              <Input placeholder="Xuất sắc / Giỏi / Khá…" value={form.classification} onChange={e => set('classification', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>GPA (0–4)</Label>
              <Input type="number" min="0" max="4" step="0.01" value={form.gpa} onChange={e => set('gpa', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Số văn bằng</Label>
              <Input value={form.certificateCode} onChange={e => set('certificateCode', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hệ đào tạo</Label>
              <Input placeholder="Chính quy / Liên thông" value={form.trainingSystem} onChange={e => set('trainingSystem', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tên luận văn / luận án</Label>
            <Input value={form.thesisTitle} onChange={e => set('thesisTitle', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
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

// ─── Main table ───────────────────────────────────────────────────────────────

interface EducationTableProps {
  records: EducationRecord[]
  personnelId: string
  canEdit?: boolean
  onRefresh?: () => void
}

export function EducationTable({
  records,
  personnelId,
  canEdit = false,
  onRefresh,
}: EducationTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EducationRecord | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  function openAdd() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(r: EducationRecord) {
    setEditing(r)
    setDialogOpen(true)
  }

  async function handleDelete(r: EducationRecord) {
    if (!confirm(`Xóa bằng cấp "${LEVEL_MAP[r.level]}" tại "${r.institution}"?`)) return
    setDeleting(r.id)
    try {
      const res = await fetch(`/api/personnel/education/${r.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(typeof json.error === 'string' ? json.error : 'Không thể xóa')
        return
      }
      toast.success('Đã xóa bản ghi học vấn')
      onRefresh?.()
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setDeleting(null)
    }
  }

  if (records.length === 0 && !canEdit) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <GraduationCap className="w-8 h-8 opacity-30" />
        <p className="text-sm">Chưa có bằng cấp / đào tạo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-3 h-3 mr-1" />
            Thêm bằng cấp
          </Button>
        </div>
      )}

      {records.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trình độ</TableHead>
                <TableHead>Cơ sở đào tạo</TableHead>
                <TableHead>Chuyên ngành</TableHead>
                <TableHead>Hệ / Hình thức</TableHead>
                <TableHead>Năm</TableHead>
                <TableHead>Xếp loại</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant={LEVEL_VARIANT[r.level]}>
                      {LEVEL_MAP[r.level]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.institution}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.major ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {/* trainingSystem = hệ đào tạo (tổ chức); studyMode = hình thức cá nhân */}
                    {[r.trainingSystem, r.studyMode].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatYear(r.startDate)}
                    {r.endDate ? ` – ${formatYear(r.endDate)}` : ''}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.classification ?? (r.gpa != null ? `GPA ${r.gpa}` : '—')}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={deleting === r.id}
                          onClick={() => handleDelete(r)}
                        >
                          {deleting === r.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <GraduationCap className="w-6 h-6 opacity-30" />
          <p className="text-sm">Chưa có bằng cấp</p>
        </div>
      )}

      <EducationEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        personnelId={personnelId}
        record={editing}
        onSuccess={() => { setDialogOpen(false); onRefresh?.() }}
      />
    </div>
  )
}
