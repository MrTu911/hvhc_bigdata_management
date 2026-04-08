'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { RefreshCw, Search, AlertCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Summary = {
  totalActiveItems: number
  itemsWithRecentActivity: number
  staleItems: number
  expiredItems: number
}

type CategoryStat = {
  categoryCode: string
  nameVi: string
  total: number
  active: number
  inactive: number
  expired: number
  stale: number
  recentActivity: number
}

type UnusedCandidate = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  isActive: boolean
  isExpired: boolean
  activityCount: number
  lastActivityAt: string | null
  createdAt: string
  updatedAt: string
  reason: 'never_modified' | 'stale' | 'expired'
}

type RecentlyModified = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  activityCount: number
  lastActivityAt: string
}

type WeeklyTrend = { week: string; count: number }

type UsageData = {
  generatedAt: string
  scope: { categoryCode: string | null; staleAfterDays: number; startDate: string | null; endDate: string | null }
  summary: Summary
  byCategory: CategoryStat[]
  unusedCandidates: UnusedCandidate[]
  recentlyModified: RecentlyModified[]
  weeklyTrend: WeeklyTrend[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REASON_BADGE: Record<UnusedCandidate['reason'], { label: string; className: string }> = {
  expired: { label: 'Hết hạn', className: 'bg-red-100 text-red-800 border-red-300' },
  never_modified: { label: 'Chưa dùng', className: 'bg-slate-100 text-slate-700 border-slate-300' },
  stale: { label: 'Cũ / ít dùng', className: 'bg-amber-100 text-amber-800 border-amber-300' },
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsageAnalytics() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryCode, setCategoryCode] = useState('')
  const [staleAfterDays, setStaleAfterDays] = useState(90)
  const [inputCode, setInputCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = useCallback(async (code: string, days: number, start: string, end: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ staleAfterDays: String(days) })
      if (code) params.set('categoryCode', code)
      if (start) params.set('startDate', start)
      if (end) params.set('endDate', end)
      const res = await fetch(`/api/admin/master-data/analytics/usage?${params}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        const body = await res.json()
        toast.error(body.error ?? 'Lỗi tải analytics')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load('', staleAfterDays, '', '') }, [load, staleAfterDays])

  const handleSearch = () => {
    const code = inputCode.trim().toUpperCase()
    setCategoryCode(code)
    load(code, staleAfterDays, startDate, endDate)
  }

  const handleClear = () => {
    setInputCode('')
    setCategoryCode('')
    setStartDate('')
    setEndDate('')
    load('', staleAfterDays, '', '')
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-1 min-w-[240px] max-w-sm">
          <Input
            placeholder="Mã danh mục (để trống = tất cả)"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="font-mono text-sm"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          {categoryCode && (
            <Button variant="ghost" size="sm" onClick={handleClear}>Xóa</Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground whitespace-nowrap">Từ:</span>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-36 text-sm"
          />
          <span className="text-muted-foreground">đến:</span>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-36 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Ngưỡng cũ:</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={staleAfterDays}
            onChange={e => { const d = parseInt(e.target.value); setStaleAfterDays(d); load(categoryCode, d, startDate, endDate) }}
          >
            {[30, 60, 90, 180, 365].map(d => (
              <option key={d} value={d}>{d} ngày</option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(categoryCode, staleAfterDays, startDate, endDate)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        {data && (
          <span className="text-xs text-muted-foreground">
            {categoryCode ? <Badge variant="secondary" className="text-xs">{categoryCode}</Badge> : 'Tất cả danh mục'}
            {' · '}Cập nhật {fmtDate(data.generatedAt)}
          </span>
        )}
      </div>

      {loading && !data ? (
        <p className="text-center py-16 text-muted-foreground">Đang tải...</p>
      ) : !data ? null : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Mục đang hoạt động</p>
                <p className="text-2xl font-bold mt-1">{summary?.totalActiveItems ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  Có hoạt động ({staleAfterDays}n)
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {summary?.itemsWithRecentActivity ?? '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Mục cũ / ít dùng</p>
                <p className="text-2xl font-bold mt-1 text-amber-500">
                  {summary?.staleItems ?? '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Hết hạn (validTo)</p>
                <p className="text-2xl font-bold mt-1 text-destructive">
                  {summary?.expiredItems ?? '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly trend chart */}
          {data.weeklyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Xu hướng thay đổi 12 tuần gần nhất
                  {data.scope.categoryCode && (
                    <span className="font-mono text-xs text-muted-foreground ml-1">
                      · {data.scope.categoryCode}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data.weeklyTrend}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10 }}
                      tickFormatter={w => w.slice(5)} // show MM-DD only
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={w => `Tuần ${w}`}
                      formatter={(val) => [val, 'Số thay đổi']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Số lần ghi nhận thay đổi (ChangeLog) theo tuần. Chỉ phản ánh hành động quản trị, không phải lượt tra cứu.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chart – by category (global mode only) */}
          {data.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân tích theo danh mục</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.byCategory.slice(0, 20)}
                    margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                  >
                    <XAxis
                      dataKey="categoryCode"
                      angle={-35}
                      textAnchor="end"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [val, name === 'recentActivity' ? 'Có hoạt động' : name === 'stale' ? 'Cũ' : name === 'expired' ? 'Hết hạn' : name]}
                    />
                    <Legend
                      formatter={v => v === 'recentActivity' ? 'Có hoạt động' : v === 'stale' ? 'Cũ/ít dùng' : v === 'expired' ? 'Hết hạn' : v}
                    />
                    <Bar dataKey="recentActivity" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="stale" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expired" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unused candidates */}
            {(data.unusedCandidates.length > 0 || data.scope.categoryCode) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Đề xuất dọn dẹp
                    <Badge variant="secondary" className="ml-auto">{data.unusedCandidates.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.unusedCandidates.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">
                      {data.scope.categoryCode
                        ? 'Không có mục nào cần dọn dẹp trong danh mục này'
                        : 'Hãy chọn danh mục cụ thể để xem đề xuất chi tiết'}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Danh mục</TableHead>
                          <TableHead>Lý do</TableHead>
                          <TableHead>Lần cuối chỉnh sửa</TableHead>
                          <TableHead className="text-right">Số lần thay đổi</TableHead>
                          <TableHead>Tạo lúc</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unusedCandidates.map(item => {
                          const badge = REASON_BADGE[item.reason]
                          return (
                            <TableRow key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                              <TableCell className="font-mono text-xs">{item.code}</TableCell>
                              <TableCell className="text-sm">{item.nameVi}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {item.categoryCode}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${badge.className}`}>
                                  {badge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {fmtDate(item.lastActivityAt)}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {item.activityCount}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {fmtDate(item.createdAt)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recently modified */}
            {data.recentlyModified.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Chỉnh sửa gần đây
                    <Badge variant="secondary" className="ml-auto">{data.recentlyModified.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.recentlyModified.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <TrendingDown className="h-4 w-4 text-green-600 rotate-180" />
                          <div>
                            <p className="text-sm font-medium">{item.nameVi}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.categoryCode} · {item.code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{item.activityCount} lần</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(item.lastActivityAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
