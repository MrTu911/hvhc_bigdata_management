'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Activity, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type PerCategorySync = {
  categoryCode: string
  syncSource: string
  syncStatus: string   // SUCCESS | PARTIAL | FAILED
  syncedAt: string
  addedCount: number
  updatedCount: number
  deactivatedCount: number
  errorCount: number
  triggeredBy: string
}

type SyncData = {
  lastGlobalSync: string | null
  last30Days: {
    totalSyncs: number
    added: number
    updated: number
    deactivated: number
    errors: number
    syncJobsWithErrors: number
  }
  perCategory: PerCategorySync[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  BQP: 'BQP API',
  NATIONAL: 'Dữ liệu Quốc gia',
  LOCAL: 'Nội bộ',
  ISO: 'ISO',
  BQP_API: 'BQP API',
  IMPORT_EXCEL: 'Excel Import',
  MANUAL: 'Thủ công',
  BULK_IMPORT: 'Bulk Import',
}

function SyncStatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="outline" className="text-xs">—</Badge>
  if (status === 'SUCCESS')
    return (
      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Thành công
      </Badge>
    )
  if (status === 'PARTIAL')
    return (
      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
        <AlertTriangle className="h-3 w-3 mr-1" /> Một phần
      </Badge>
    )
  return (
    <Badge variant="destructive" className="text-xs">
      <XCircle className="h-3 w-3 mr-1" /> Lỗi
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SyncMonitor() {
  const [data, setData] = useState<SyncData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/master-data/sync')
      if (res.ok) setData(await res.json())
      else toast.error('Không thể tải trạng thái đồng bộ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const triggerSync = async (categoryCode: string) => {
    setSyncing(categoryCode)
    try {
      const res = await fetch(`/api/admin/master-data/${categoryCode}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const body = await res.json()
      if (res.ok) {
        const label = dryRun ? '[Dry Run] ' : ''
        const status = body.syncStatus ?? 'SUCCESS'
        if (status === 'FAILED') {
          toast.error(`${label}Đồng bộ ${categoryCode} thất bại`)
        } else if (status === 'PARTIAL') {
          toast.warning(`${label}Đồng bộ ${categoryCode} hoàn thành một phần`)
        } else {
          toast.success(`${label}Đồng bộ ${categoryCode} thành công`)
        }
        if (!dryRun) await load()
      } else {
        toast.error(body.error ?? 'Lỗi đồng bộ')
      }
    } finally {
      setSyncing(null)
    }
  }

  const stats = data?.last30Days

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5" /> Giám sát đồng bộ
          </h2>
          <p className="text-sm text-muted-foreground">
            Trạng thái đồng bộ dữ liệu từ nguồn ngoài (BQP, NATIONAL)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded"
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
            />
            <span>Dry Run <span className="text-xs text-muted-foreground">(không ghi DB)</span></span>
          </label>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Lần đồng bộ cuối</p>
            <p className="font-semibold text-sm mt-1">
              {data?.lastGlobalSync
                ? new Date(data.lastGlobalSync).toLocaleString('vi-VN')
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Tổng jobs (30 ngày)</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalSyncs ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Mục đã thêm/cập nhật</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {stats ? stats.added + stats.updated : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Jobs có lỗi</p>
            <p className={`text-2xl font-bold mt-1 ${stats?.syncJobsWithErrors ? 'text-destructive' : 'text-green-600'}`}>
              {stats?.syncJobsWithErrors ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-category table */}
      <Card>
        <CardHeader>
          <CardTitle>Lần đồng bộ cuối theo danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
          ) : !data?.perCategory.length ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có lịch sử đồng bộ</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead className="text-right">+Mới</TableHead>
                  <TableHead className="text-right">~Cập nhật</TableHead>
                  <TableHead className="text-right">Lỗi</TableHead>
                  <TableHead>Người kích hoạt</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perCategory.map((row) => (
                  <TableRow key={row.categoryCode}>
                    <TableCell className="font-mono text-xs">{row.categoryCode}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {SOURCE_LABELS[row.syncSource] ?? row.syncSource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SyncStatusBadge status={row.syncStatus} />
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {row.addedCount}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">
                      {row.updatedCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.errorCount > 0 ? (
                        <span className="flex items-center justify-end gap-1 text-destructive">
                          <XCircle className="h-3 w-3" />{row.errorCount}
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />0
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.triggeredBy}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(row.syncedAt).toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={syncing === row.categoryCode}
                        onClick={() => triggerSync(row.categoryCode)}
                        title={dryRun ? 'Dry run — không ghi vào DB' : 'Đồng bộ thật'}
                      >
                        {syncing === row.categoryCode
                          ? 'Đang...'
                          : dryRun
                          ? 'Test sync'
                          : 'Đồng bộ'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
