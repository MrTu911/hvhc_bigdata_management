'use client'

/**
 * ImportWizard (admin) – M19 MDM
 *
 * 3-step import modal with server-side validation and importId session flow.
 *
 * Step 1 – Upload: pick JSON or CSV file / paste text
 * Step 2 – Preview: server validates, shows new/update/invalid rows with full error detail
 * Step 3 – Done: confirms result after execution
 *
 * Flow:
 *   POST /api/admin/master-data/[categoryCode]/import
 *     → { importId, preview, stats }
 *   POST /api/admin/master-data/[categoryCode]/import/[importId]
 *     → { inserted, updated, errors }
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
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileJson,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PreviewRow } from '@/lib/services/master-data/master-data-import.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type RawItem = {
  code?: unknown
  nameVi?: unknown
  nameEn?: unknown
  shortName?: unknown
  parentCode?: unknown
  externalCode?: unknown
  sortOrder?: unknown
  metadata?: unknown
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  categoryCode: string
  onSuccess: () => void
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseCsv(text: string): RawItem[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values: string[] = []
    let inQuote = false
    let cur = ''
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { values.push(cur); cur = ''; continue }
      cur += ch
    }
    values.push(cur)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (values[i] ?? '').trim() })
    return {
      code: obj.code,
      nameVi: obj.nameVi,
      nameEn: obj.nameEn || undefined,
      shortName: obj.shortName || undefined,
      parentCode: obj.parentCode || undefined,
      externalCode: obj.externalCode || undefined,
      sortOrder: obj.sortOrder ? parseInt(obj.sortOrder) || undefined : undefined,
    }
  })
}

function parseInput(text: string, mode: 'json' | 'csv'): { items: RawItem[]; error: string } {
  try {
    if (mode === 'json') {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : (parsed?.items ?? [])
      if (!Array.isArray(items)) return { items: [], error: 'JSON phải là mảng hoặc có trường "items"' }
      return { items, error: '' }
    }
    const items = parseCsv(text)
    if (items.length === 0) return { items: [], error: 'Không đọc được dữ liệu CSV. Kiểm tra header và dấu phân cách.' }
    return { items, error: '' }
  } catch {
    return { items: [], error: 'Không thể phân tích dữ liệu. Kiểm tra định dạng.' }
  }
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mt-2 text-sm select-none">
      {(['1. Tải lên', '2. Xem trước', '3. Hoàn tất'] as const).map((label, i) => (
        <div
          key={i}
          className={`flex items-center gap-1 ${step === i + 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
        >
          <span
            className={`w-5 h-5 rounded-full text-xs flex items-center justify-center border ${
              step === i + 1
                ? 'border-primary bg-primary text-primary-foreground'
                : step > i + 1
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-muted-foreground'
            }`}
          >
            {step > i + 1 ? '✓' : i + 1}
          </span>
          {label}
          {i < 2 && <ChevronRight className="h-3 w-3" />}
        </div>
      ))}
    </div>
  )
}

// ─── Preview stats bar ────────────────────────────────────────────────────────

function StatsBar({ preview }: { preview: PreviewRow[] }) {
  const newCount = preview.filter(r => r._status === 'new').length
  const updateCount = preview.filter(r => r._status === 'update').length
  const invalidCount = preview.filter(r => r._status === 'invalid').length

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="flex items-center gap-1.5 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        {newCount} mới
      </span>
      <span className="flex items-center gap-1.5 text-blue-600">
        <CheckCircle2 className="h-4 w-4" />
        {updateCount} cập nhật
      </span>
      {invalidCount > 0 && (
        <span className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {invalidCount} lỗi (sẽ bỏ qua)
        </span>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportWizard({ open, onOpenChange, categoryCode, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [rawText, setRawText] = useState('')
  const [inputMode, setInputMode] = useState<'json' | 'csv'>('json')
  const [parseError, setParseError] = useState('')

  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [stats, setStats] = useState({ new: 0, update: 0, invalid: 0, total: 0 })
  const [importId, setImportId] = useState<string | null>(null)
  const [confirmResult, setConfirmResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null)

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1)
    setRawText('')
    setPreview([])
    setStats({ new: 0, update: 0, invalid: 0, total: 0 })
    setImportId(null)
    setConfirmResult(null)
    setParseError('')
    setLoadingPreview(false)
    setConfirming(false)
  }

  const handleClose = () => { reset(); onOpenChange(false) }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInputMode(file.name.endsWith('.csv') ? 'csv' : 'json')
    const reader = new FileReader()
    reader.onload = ev => setRawText(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Step 1 → 2: parse client-side, then POST to server for validation ────────
  const goToPreview = async () => {
    setParseError('')
    const { items, error } = parseInput(rawText.trim(), inputMode)
    if (error) { setParseError(error); return }
    if (items.length === 0) { setParseError('Không tìm thấy dữ liệu để nhập.'); return }
    if (items.length > 5000) { setParseError('Tối đa 5000 dòng mỗi lần import.'); return }

    setLoadingPreview(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setParseError(data.error ?? 'Lỗi xử lý trên server')
        return
      }
      setImportId(data.importId)
      setPreview(data.preview)
      setStats(data.stats)
      setStep(2)
    } catch {
      setParseError('Lỗi kết nối với server')
    } finally {
      setLoadingPreview(false)
    }
  }

  // ── Step 2 → 3: confirm with importId ────────────────────────────────────────
  const handleConfirm = async () => {
    if (!importId) return
    setConfirming(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/import/${importId}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Lỗi nhập dữ liệu')
        // 410 = session expired — go back to step 1
        if (res.status === 410 || res.status === 409) {
          toast.error('Vui lòng tải lại và xem trước lại.')
          setImportId(null)
          setStep(1)
        }
        return
      }
      setConfirmResult({ inserted: data.inserted, updated: data.updated, errors: data.errors ?? [] })
      setStep(3)
      toast.success(`Nhập xong: +${data.inserted} mới, ~${data.updated} cập nhật`)
      onSuccess()
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setConfirming(false)
    }
  }

  const canConfirm = (stats.new + stats.update) > 0 && !confirming

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import dữ liệu —{' '}
            <span className="font-mono text-sm">{categoryCode}</span>
          </DialogTitle>
          <StepIndicator step={step} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">

          {/* ─── Step 1: Upload ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={inputMode === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('json')}
                >
                  <FileJson className="h-4 w-4 mr-1" /> JSON
                </Button>
                <Button
                  variant={inputMode === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('csv')}
                >
                  <FileText className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Chọn file
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <textarea
                className="w-full h-64 font-mono text-xs border rounded-md p-3 resize-none bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={
                  inputMode === 'json'
                    ? `[\n  {\n    "code": "RANK_01",\n    "nameVi": "Thiếu úy",\n    "nameEn": "Second Lieutenant",\n    "shortName": "TU",\n    "sortOrder": 1\n  }\n]`
                    : `code,nameVi,nameEn,shortName,parentCode,externalCode,sortOrder\nRANK_01,Thiếu úy,Second Lieutenant,TU,,,1`
                }
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                spellCheck={false}
              />

              {parseError && (
                <div className="flex items-center gap-2 text-destructive text-sm rounded-md border border-destructive/30 bg-destructive/5 p-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Bắt buộc:</span>{' '}
                  <code>code</code> (chữ hoa, số, _-), <code>nameVi</code>
                </p>
                <p>
                  <span className="font-medium">Tuỳ chọn:</span>{' '}
                  <code>nameEn</code>, <code>shortName</code>, <code>parentCode</code>,{' '}
                  <code>externalCode</code>, <code>sortOrder</code>
                </p>
                <p>Tối đa 5000 dòng mỗi lần import.</p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Preview ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <StatsBar preview={preview} />

              {stats.invalid > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {stats.invalid} dòng lỗi sẽ bị bỏ qua. Hover vào badge lỗi để xem chi tiết.
                </div>
              )}

              <div className="border rounded-md overflow-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Tên (VI)</TableHead>
                      <TableHead>Tên (EN)</TableHead>
                      <TableHead>Tên ngắn</TableHead>
                      <TableHead>Mã cha</TableHead>
                      <TableHead className="text-right">Thứ tự</TableHead>
                      <TableHead>Kết quả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow
                        key={i}
                        className={row._status === 'invalid' ? 'bg-destructive/5' : ''}
                      >
                        <TableCell className="font-mono text-xs">{row.code || '—'}</TableCell>
                        <TableCell className="max-w-40 truncate">{row.nameVi || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-32 truncate">
                          {row.nameEn ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs">{row.shortName ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{row.parentCode ?? '—'}</TableCell>
                        <TableCell className="text-right text-xs">{row.sortOrder ?? '—'}</TableCell>
                        <TableCell>
                          {row._status === 'new' && (
                            <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">
                              Mới
                            </Badge>
                          )}
                          {row._status === 'update' && (
                            <Badge variant="secondary" className="text-xs">
                              Cập nhật
                            </Badge>
                          )}
                          {row._status === 'invalid' && (
                            <Badge
                              variant="destructive"
                              className="text-xs cursor-help"
                              title={row._errors.join(' · ')}
                            >
                              Lỗi: {row._errors[0]}
                              {row._errors.length > 1 && ` (+${row._errors.length - 1})`}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {importId && (
                <p className="text-xs text-muted-foreground">
                  Session: <code>{importId}</code> · hết hạn sau 15 phút
                </p>
              )}
            </div>
          )}

          {/* ─── Step 3: Done ───────────────────────────────────────────────── */}
          {step === 3 && confirmResult && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold">Import hoàn tất!</h3>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600 font-medium">+{confirmResult.inserted} mới</span>
                <span className="text-blue-600 font-medium">~{confirmResult.updated} cập nhật</span>
                {confirmResult.errors.length > 0 && (
                  <span className="text-destructive font-medium">
                    {confirmResult.errors.length} lỗi
                  </span>
                )}
              </div>
              {confirmResult.errors.length > 0 && (
                <div className="w-full text-left rounded-md border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                  {confirmResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive">{e}</p>
                  ))}
                </div>
              )}
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
              <Button onClick={goToPreview} disabled={!rawText.trim() || loadingPreview}>
                {loadingPreview ? 'Đang xác thực...' : 'Xem trước'}
                {!loadingPreview && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleConfirm} disabled={!canConfirm}>
                {confirming
                  ? 'Đang nhập...'
                  : `Xác nhận nhập ${stats.new + stats.update} dòng`}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
