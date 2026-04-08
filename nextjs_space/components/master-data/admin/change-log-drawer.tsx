'use client'

/**
 * ChangeLogDrawer – M19 MDM Admin
 *
 * Drawer xem audit trail của một danh mục.
 * Production-ready:
 *   - hiển thị ai sửa, sửa gì, giá trị cũ/mới, lý do, thời gian
 *   - filter theo changeType
 *   - filter theo itemCode (tìm kiếm)
 *   - pagination
 *   - field-level diff cho UPDATE entries
 */

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { History, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'REACTIVATE'

type ChangeLog = {
  id: string
  changeType: ChangeType
  fieldName: string | null
  oldValue: unknown
  newValue: unknown
  changedBy: string
  changeReason: string | null
  createdAt: string
  item: { code: string; nameVi: string }
}

type PageResult = {
  logs: ChangeLog[]
  total: number
  page: number
  limit: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DEACTIVATE: 'Vô hiệu',
  REACTIVATE: 'Kích hoạt',
}

const CHANGE_TYPE_VARIANT: Record<ChangeType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DEACTIVATE: 'destructive',
  REACTIVATE: 'outline',
}

const ALL_TYPE = '__all__'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

// ─── FieldDiff ────────────────────────────────────────────────────────────────

function FieldDiff({ log }: { log: ChangeLog }) {
  if (log.changeType !== 'UPDATE') return null
  if (!log.oldValue || typeof log.oldValue !== 'object') return null

  const oldMap = log.oldValue as Record<string, unknown>
  const newMap = (log.newValue ?? {}) as Record<string, unknown>
  const fields = Object.keys(oldMap)
  if (fields.length === 0) return null

  return (
    <div className="mt-1.5 rounded bg-muted/50 p-2 text-xs space-y-0.5">
      {fields.map(field => (
        <div key={field} className="flex items-start gap-1 flex-wrap">
          <span className="font-medium w-24 shrink-0">{field}:</span>
          <span className="text-destructive line-through">{renderValue(oldMap[field])}</span>
          <span className="text-muted-foreground mx-0.5">→</span>
          <span className="text-green-600 dark:text-green-400">{renderValue(newMap[field])}</span>
        </div>
      ))}
    </div>
  )
}

// ─── LogEntry ─────────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: ChangeLog }) {
  return (
    <div className="rounded-md border p-3 text-sm space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={CHANGE_TYPE_VARIANT[log.changeType]}>
            {CHANGE_TYPE_LABELS[log.changeType]}
          </Badge>
          <span className="font-medium truncate">
            [{log.item.code}] {log.item.nameVi}
          </span>
        </div>
        <time
          className="text-xs text-muted-foreground whitespace-nowrap"
          dateTime={log.createdAt}
        >
          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </time>
      </div>

      <p className="text-xs text-muted-foreground">
        Bởi: <span className="font-medium">{log.changedBy}</span>
      </p>

      {log.changeReason && (
        <p className="text-xs italic text-muted-foreground">
          Lý do: {log.changeReason}
        </p>
      )}

      <FieldDiff log={log} />
    </div>
  )
}

// ─── ChangeLogDrawer ──────────────────────────────────────────────────────────

type Props = {
  categoryCode: string
  /** If provided, show as a ghost/link button instead of outline */
  variant?: 'outline' | 'ghost'
}

const LIMIT = 20

export function ChangeLogDrawer({ categoryCode, variant = 'outline' }: Props) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPE)
  const [itemSearch, setItemSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce item search to avoid spamming API
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    setItemSearch(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  const queryKey = ['master-data', 'changelog', categoryCode, page, typeFilter, debouncedSearch]

  const { data, isLoading } = useQuery<PageResult>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      })
      if (typeFilter !== ALL_TYPE) sp.set('changeType', typeFilter)
      if (debouncedSearch) sp.set('itemCode', debouncedSearch)
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/changelog?${sp}`
      )
      if (!res.ok) throw new Error('Failed to fetch changelog')
      return res.json()
    },
    enabled: open,
  })

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // Reset filters on close
      setPage(1)
      setTypeFilter(ALL_TYPE)
      setItemSearch('')
      setDebouncedSearch('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant={variant} size="sm">
          <History className="mr-2 h-4 w-4" />
          Lịch sử thay đổi
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>Lịch sử thay đổi – {categoryCode}</SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="shrink-0 flex gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-36">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lọc theo mã mục..."
              className="pl-7 h-8 text-sm"
              value={itemSearch}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={v => { setTypeFilter(v); setPage(1) }}
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Loại thay đổi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPE}>Tất cả</SelectItem>
              {(Object.keys(CHANGE_TYPE_LABELS) as ChangeType[]).map(t => (
                <SelectItem key={t} value={t}>{CHANGE_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
          )}

          {!isLoading && data?.logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Không có lịch sử thay đổi.
            </p>
          )}

          {data?.logs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="shrink-0 mt-3 flex items-center justify-between border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <span className="text-xs text-muted-foreground">
              Trang {page} / {totalPages}
              {data.total > 0 && ` · ${data.total} mục`}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
