'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ArrowLeft, RefreshCw, BarChart2, TrendingUp, Database, Layers } from 'lucide-react'
import { UsageAnalytics } from '@/components/master-data/admin/usage-analytics'

// ─── Types for overview tab ───────────────────────────────────────────────────

type AnalyticsOverview = {
  summary: {
    totalCategories: number
    activeCategories: number
    totalItems: number
    activeItems: number
    inactiveItems: number
    recentChanges7d: number
  }
  byGroup: { groupTag: string; count: number }[]
  topCategories: { categoryCode: string; nameVi: string; itemCount: number }[]
  recentSyncs: {
    categoryCode: string
    syncedAt: string
    addedCount: number
    updatedCount: number
    syncStatus?: string
    category?: { nameVi: string; code: string }
  }[]
  cacheStats?: {
    inProcess: { hits: number; misses: number; sets: number; deletes: number }
    derived?: { hitRate: string | null; totalRequests: number }
  }
}

const GROUP_COLORS: Record<string, string> = {
  MILITARY:   '#3b82f6',
  GEOGRAPHY:  '#f97316',
  EDUCATION:  '#06b6d4',
  PARTY:      '#ef4444',
  TRAINING:   '#8b5cf6',
  EQUIPMENT:  '#f59e0b',
  SYSTEM:     '#94a3b8',
  RESEARCH:   '#84cc16',
  POLICY:     '#10b981',
  LOGISTICS:  '#ec4899',
  HEALTHCARE: '#6366f1',
}

// ─── Overview tab content ─────────────────────────────────────────────────────

function OverviewTab({ data }: { data: AnalyticsOverview }) {
  const s = data.summary
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Danh mục tổng', value: s.totalCategories, icon: Layers, sub: `${s.activeCategories} đang hoạt động`, color: 'text-blue-600' },
          { label: 'Mục dữ liệu tổng', value: s.totalItems, icon: Database, sub: `${s.activeItems} đang hoạt động`, color: 'text-green-600' },
          { label: 'Thay đổi 7 ngày', value: s.recentChanges7d, icon: TrendingUp, sub: 'change log entries', color: 'text-amber-500' },
          { label: 'Mục vô hiệu', value: s.inactiveItems, icon: Layers, sub: 'soft-deleted', color: 'text-muted-foreground' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                </div>
                <kpi.icon className="h-8 w-8 text-muted-foreground/30 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Số mục theo nhóm danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byGroup} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="groupTag" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Số danh mục" radius={[3, 3, 0, 0]}>
                  {data.byGroup.map((entry) => (
                    <Cell key={entry.groupTag} fill={GROUP_COLORS[entry.groupTag] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 danh mục nhiều mục nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topCategories.slice(0, 10).map((cat, i) => (
                <div key={cat.categoryCode} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.nameVi}</p>
                    <p className="text-xs font-mono text-muted-foreground">{cat.categoryCode}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{cat.itemCount}</Badge>
                  <div className="w-24 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (cat.itemCount / (data.topCategories[0]?.itemCount || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.recentSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lần đồng bộ gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentSyncs.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <span className="font-mono text-xs text-muted-foreground">{s.categoryCode}</span>
                  <span className="text-green-600">+{s.addedCount}</span>
                  <span className="text-blue-600">~{s.updatedCount}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.syncedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.cacheStats?.derived && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cache hit rate (process)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Hit rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.cacheStats.derived.hitRate ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng request</p>
                <p className="text-2xl font-bold">{data.cacheStats.derived.totalRequests}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hits / Misses</p>
                <p className="font-medium">
                  {data.cacheStats.inProcess.hits} / {data.cacheStats.inProcess.misses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/master-data/analytics')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Phân tích dữ liệu MDM
            </h1>
            <p className="text-sm text-muted-foreground">Thống kê tổng quan hệ thống danh mục dùng chung</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="usage">Sử dụng & Dọn dẹp</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {loading ? (
            <p className="text-center py-16 text-muted-foreground">Đang tải dữ liệu...</p>
          ) : !data ? (
            <p className="text-center py-16 text-muted-foreground">Không có dữ liệu</p>
          ) : (
            <OverviewTab data={data} />
          )}
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
