'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Zap, RefreshCw, Trash2, Database, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type CacheOverview = {
  backend: { type: 'redis' | 'memory'; connected: boolean }
  stats: { activeCategories: number; activeItems: number }
  hitStats: {
    inProcess: { hits: number; misses: number; sets: number; deletes: number }
    redis?: {
      keyspaceHits: number | null
      keyspaceMisses: number | null
      usedMemoryHuman: string | null
      connectedClients: number | null
    }
  }
  categoryTtls: { code: string; ttlSeconds: number | null; cached: boolean }[]
}

type CategoryRow = {
  code: string
  nameVi: string
  cacheType: string
  itemCount?: number
}

function fmtTtl(ttlSeconds: number | null, cached: boolean): { text: string; className: string } {
  if (!cached) return { text: 'Chưa cache', className: 'text-muted-foreground' }
  if (ttlSeconds === null) return { text: 'Không hết hạn', className: 'text-green-600' }
  if (ttlSeconds >= 3600) {
    const h = Math.round(ttlSeconds / 3600)
    return { text: `Còn ~${h}h`, className: 'text-blue-600' }
  }
  const m = Math.round(ttlSeconds / 60)
  return {
    text: `Còn ~${m} phút`,
    className: ttlSeconds < 300 ? 'text-destructive' : 'text-amber-600',
  }
}

const TTL_LABELS: Record<string, { label: string; color: string }> = {
  STATIC: { label: '24h', color: 'bg-green-100 text-green-800 border-green-300' },
  SEMI: { label: '1h', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  DYNAMIC: { label: '5min', color: 'bg-amber-100 text-amber-800 border-amber-300' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CacheDashboard() {
  const [overview, setOverview] = useState<CacheOverview | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [flushing, setFlushing] = useState<string | 'all' | null>(null)
  const [manualCode, setManualCode] = useState('')

  const ttlMap = Object.fromEntries(
    (overview?.categoryTtls ?? []).map(t => [t.code, t])
  )

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, catsRes] = await Promise.all([
        fetch('/api/admin/master-data/cache'),
        fetch('/api/master-data/categories?withCount=true'),
      ])
      if (overviewRes.ok) setOverview(await overviewRes.json())
      if (catsRes.ok) setCategories(await catsRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const flush = async (categoryCode?: string) => {
    const key = categoryCode ?? 'all'
    if (key === 'all' && !confirm('Xác nhận xóa toàn bộ cache MDM?')) return
    setFlushing(key)
    try {
      const res = await fetch('/api/admin/master-data/cache/flush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryCode ? { categoryCode } : {}),
      })
      const body = await res.json()
      if (res.ok) {
        toast.success(body.message ?? 'Đã xóa cache')
        await loadAll()
      } else {
        toast.error(body.error ?? 'Lỗi xóa cache')
      }
    } finally {
      setFlushing(null)
    }
  }

  const ip = overview?.hitStats?.inProcess
  const totalRequests = (ip?.hits ?? 0) + (ip?.misses ?? 0)
  const hitRate = totalRequests > 0
    ? Math.round(((ip?.hits ?? 0) / totalRequests) * 10000) / 100
    : null

  const redisStats = overview?.hitStats?.redis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5" /> Cache Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Trạng thái cache server-side cho dữ liệu danh mục
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => flush()}
            disabled={flushing !== null}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {flushing === 'all' ? 'Đang xóa...' : 'Xóa tất cả cache'}
          </Button>
        </div>
      </div>

      {/* Status + stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Loại cache</p>
            <div className="flex items-center gap-2 mt-2">
              {overview?.backend.connected
                ? <Wifi className="h-4 w-4 text-green-600" />
                : <WifiOff className="h-4 w-4 text-destructive" />}
              <span className="font-semibold capitalize">
                {overview?.backend.type ?? '—'}
              </span>
              <Badge
                variant={overview?.backend.connected ? 'default' : 'destructive'}
                className="text-xs"
              >
                {overview?.backend.connected ? 'Kết nối' : 'Ngắt'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Hit rate (process)</p>
            <p className={`text-2xl font-bold mt-1 ${hitRate !== null && hitRate >= 80 ? 'text-green-600' : hitRate !== null ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {hitRate !== null ? `${hitRate}%` : '—'}
            </p>
            {totalRequests > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {ip?.hits} hits / {totalRequests} req
              </p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">Kể từ lúc khởi động</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Danh mục hoạt động</p>
            <p className="text-2xl font-bold mt-1">{overview?.stats.activeCategories ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Mục dữ liệu (DB)</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">
              {overview?.stats.activeItems ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Redis extended stats (when available) */}
      {redisStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Redis INFO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Keyspace Hits</p>
                <p className="font-mono font-semibold">{redisStats.keyspaceHits?.toLocaleString() ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Keyspace Misses</p>
                <p className="font-mono font-semibold">{redisStats.keyspaceMisses?.toLocaleString() ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Used Memory</p>
                <p className="font-mono font-semibold">{redisStats.usedMemoryHuman ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="font-mono font-semibold">{redisStats.connectedClients ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual flush by code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Xóa cache theo mã danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="VD: RANK"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!manualCode.trim() || flushing !== null}
              onClick={() => { flush(manualCode.trim()); setManualCode('') }}
            >
              {flushing === manualCode.trim() ? 'Đang...' : 'Xóa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-category table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" /> Danh mục và TTL
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
          ) : !categories.length ? (
            <p className="text-center py-8 text-muted-foreground">Không có dữ liệu</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead className="text-right">Số mục</TableHead>
                  <TableHead>Cache TTL</TableHead>
                  <TableHead>TTL còn lại</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => {
                  const ttl = TTL_LABELS[cat.cacheType] ?? { label: cat.cacheType, color: 'bg-muted' }
                  const ttlEntry = ttlMap[cat.code]
                  const ttlDisplay = ttlEntry
                    ? fmtTtl(ttlEntry.ttlSeconds, ttlEntry.cached)
                    : { text: '—', className: 'text-muted-foreground' }
                  return (
                    <TableRow key={cat.code}>
                      <TableCell className="font-mono text-xs">{cat.code}</TableCell>
                      <TableCell className="text-sm">{cat.nameVi}</TableCell>
                      <TableCell className="text-right font-medium">
                        {cat.itemCount ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${ttl.color}`}>
                          {cat.cacheType} · {ttl.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-mono ${ttlDisplay.className}`}>
                          {ttlDisplay.text}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={flushing !== null}
                          onClick={() => flush(cat.code)}
                        >
                          {flushing === cat.code ? 'Đang...' : 'Flush'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
