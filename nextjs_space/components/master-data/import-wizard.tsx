'use client'

/**
 * ImportWizard – 3-step import modal for a single MDM category.
 * Step 1: Paste JSON or upload CSV file
 * Step 2: Preview & validate (calls /api/admin/master-data/[code]/items/bulk with dry-run flag)
 * Step 3: Confirm & execute
 */
import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, FileJson, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ImportItem {
  code: string
  nameVi: string
  nameEn?: string
  shortName?: string
  parentCode?: string
  externalCode?: string
  sortOrder?: number
}

interface PreviewRow extends ImportItem {
  _status: 'new' | 'update' | 'invalid'
  _errors: string[]
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  categoryCode: string
  onSuccess: () => void
}

function parseCsv(text: string): ImportItem[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
    return {
      code: obj.code ?? '',
      nameVi: obj.nameVi ?? '',
      nameEn: obj.nameEn || undefined,
      shortName: obj.shortName || undefined,
      parentCode: obj.parentCode || undefined,
      externalCode: obj.externalCode || undefined,
      sortOrder: obj.sortOrder ? parseInt(obj.sortOrder) : undefined,
    }
  })
}

export function ImportWizard({ open, onOpenChange, categoryCode, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [rawText, setRawText] = useState('')
  const [inputMode, setInputMode] = useState<'json' | 'csv'>('json')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1)
    setRawText('')
    setPreview([])
    setParseError('')
    setImporting(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const mode = file.name.endsWith('.csv') ? 'csv' : 'json'
    setInputMode(mode)
    const reader = new FileReader()
    reader.onload = (ev) => setRawText(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  const goToPreview = async () => {
    setParseError('')
    let items: ImportItem[] = []
    try {
      if (inputMode === 'json') {
        const parsed = JSON.parse(rawText)
        items = Array.isArray(parsed) ? parsed : parsed.items ?? []
      } else {
        items = parseCsv(rawText)
      }
    } catch {
      setParseError('Không thể phân tích dữ liệu. Kiểm tra định dạng JSON/CSV.')
      return
    }

    if (items.length === 0) {
      setParseError('Không tìm thấy dữ liệu để nhập.')
      return
    }

    // Client-side validation pass
    const rows: PreviewRow[] = items.map((it) => {
      const errors: string[] = []
      if (!it.code) errors.push('Thiếu code')
      if (!it.nameVi) errors.push('Thiếu nameVi')
      if (it.code && !/^[A-Z0-9_]+$/.test(it.code)) errors.push('code phải là chữ hoa, số, gạch dưới')
      return { ...it, _status: errors.length > 0 ? 'invalid' : 'new', _errors: errors }
    })

    // Fetch existing codes from this category to distinguish new vs update
    try {
      const res = await fetch(`/api/admin/master-data/${categoryCode}/items?includeInactive=true&limit=9999`)
      if (res.ok) {
        const existing: { code: string }[] = await res.json()
        const existingSet = new Set(existing.map((e) => e.code))
        rows.forEach((r) => {
          if (r._status !== 'invalid' && existingSet.has(r.code)) r._status = 'update'
        })
      }
    } catch { /* ignore — show all as "new" */ }

    setPreview(rows)
    setStep(2)
  }

  const handleImport = async () => {
    const valid = preview.filter((r) => r._status !== 'invalid')
    if (valid.length === 0) {
      toast.error('Không có dòng hợp lệ để nhập')
      return
    }
    setImporting(true)
    try {
      const res = await fetch(`/api/admin/master-data/${categoryCode}/items/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: valid.map(({ _status, _errors, ...it }) => it),
          mode: 'upsert',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Lỗi nhập dữ liệu')
        return
      }
      setStep(3)
      toast.success(`Nhập thành công: +${data.inserted} mới, ~${data.updated} cập nhật`)
      onSuccess()
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setImporting(false)
    }
  }

  const newCount = preview.filter((r) => r._status === 'new').length
  const updateCount = preview.filter((r) => r._status === 'update').length
  const invalidCount = preview.filter((r) => r._status === 'invalid').length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import dữ liệu — <span className="font-mono text-sm">{categoryCode}</span>
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2 text-sm">
            {(['1. Tải lên', '2. Xem trước', '3. Hoàn tất'] as const).map((label, i) => (
              <div key={i} className={`flex items-center gap-1 ${step === i + 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center border ${step === i + 1 ? 'border-primary bg-primary text-primary-foreground' : step > i + 1 ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                {label}
                {i < 2 && <ChevronRight className="h-3 w-3" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* ─── Step 1: Upload ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={inputMode === 'json' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('json')}>
                  <FileJson className="h-4 w-4 mr-1" /> JSON
                </Button>
                <Button variant={inputMode === 'csv' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('csv')}>
                  <FileText className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Chọn file
                </Button>
                <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} />
              </div>

              <textarea
                className="w-full h-64 font-mono text-xs border rounded-md p-3 resize-none bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={
                  inputMode === 'json'
                    ? `[\n  { "code": "RANK_01", "nameVi": "Thiếu úy", "nameEn": "Second Lieutenant", "shortName": "TU", "sortOrder": 1 },\n  ...\n]`
                    : `code,nameVi,nameEn,shortName,sortOrder\nRANK_01,Thiếu úy,Second Lieutenant,TU,1`
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              {parseError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Các trường bắt buộc: <code>code</code>, <code>nameVi</code>. Tuỳ chọn: <code>nameEn</code>, <code>shortName</code>, <code>parentCode</code>, <code>externalCode</code>, <code>sortOrder</code>.
              </p>
            </div>
          )}

          {/* ─── Step 2: Preview ─── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {newCount} mới</span>
                <span className="flex items-center gap-1 text-blue-600"><CheckCircle2 className="h-4 w-4" /> {updateCount} cập nhật</span>
                {invalidCount > 0 && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" /> {invalidCount} lỗi (sẽ bỏ qua)</span>}
              </div>
              <div className="border rounded-md overflow-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Tên (VI)</TableHead>
                      <TableHead>Tên (EN)</TableHead>
                      <TableHead>Tên ngắn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i} className={row._status === 'invalid' ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs">{row.code || '—'}</TableCell>
                        <TableCell>{row.nameVi || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.nameEn ?? '—'}</TableCell>
                        <TableCell className="text-xs">{row.shortName ?? '—'}</TableCell>
                        <TableCell>
                          {row._status === 'new' && <Badge className="bg-green-500 text-white text-xs">Mới</Badge>}
                          {row._status === 'update' && <Badge variant="secondary" className="text-xs">Cập nhật</Badge>}
                          {row._status === 'invalid' && (
                            <Badge variant="destructive" className="text-xs" title={row._errors.join(', ')}>
                              Lỗi: {row._errors[0]}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ─── Step 3: Done ─── */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold">Import hoàn tất!</h3>
              <p className="text-sm text-muted-foreground">Dữ liệu đã được nhập thành công vào danh mục <code>{categoryCode}</code>.</p>
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <DialogFooter>
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại
              </Button>
            )}
            {step === 1 && (
              <Button onClick={goToPreview} disabled={!rawText.trim()}>
                Xem trước <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleImport}
                disabled={importing || (newCount + updateCount) === 0}
              >
                {importing ? 'Đang nhập...' : `Xác nhận nhập ${newCount + updateCount} dòng`}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
