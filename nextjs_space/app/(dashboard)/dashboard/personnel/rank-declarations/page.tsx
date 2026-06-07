'use client'

/**
 * M02 Extension – Danh sách bản khai quá trình lên quân hàm
 * Route: /dashboard/personnel/rank-declarations
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ModuleHero, EmptyState } from '@/components/ui/enhanced-data-card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Search, RefreshCw, Eye, ChevronLeft, ChevronRight, Award,
  FileStack, Clock, CheckCircle2, FilePen, Lock,
} from 'lucide-react'
import {
  getDeclarationStatusMeta,
  getRankLabel,
  getPromotionTypeLabel,
  RANK_TYPE_LABELS,
  DECLARATION_STATUS_ORDER,
  DECLARATION_STATUS_META,
} from '@/lib/constants/rank-declaration'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankDeclaration {
  id: string
  rankType: string
  promotionType: string
  previousRank: string | null
  newRank: string | null
  effectiveDate: string
  decisionNumber: string | null
  declarationStatus: string
  lockedAt: string | null
  createdAt: string
  personnel: {
    id: string
    fullName: string
    personnelCode: string
    militaryRank: string | null
    unit: { id: string; name: string } | null
  }
  declarer: { id: string; name: string }
}

const PAGE_SIZE = 20

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RankDeclarationsPage() {
  const router = useRouter()

  const [items, setItems] = useState<RankDeclaration[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [totalAllStatuses, setTotalAllStatuses] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [rankTypeFilter, setRankTypeFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (keyword) params.set('keyword', keyword)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (rankTypeFilter !== 'ALL') params.set('rankType', rankTypeFilter)

    try {
      const res = await fetch(`/api/officer-career/rank-declarations?${params}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể tải danh sách bản khai')
      }
      setItems(json.items ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
      setStatusCounts(json.statusCounts ?? {})
      setTotalAllStatuses(json.totalAllStatuses ?? 0)
    } catch (e: any) {
      toast({
        title: 'Lỗi tải dữ liệu',
        description: e?.message ?? 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, keyword, statusFilter, rankTypeFilter])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const pendingCount =
    (statusCounts.PENDING_REVIEW ?? 0) + (statusCounts.UNDER_REVIEW ?? 0)

  const summaryCards = [
    {
      key: 'ALL',
      label: 'Tổng bản khai',
      value: totalAllStatuses,
      icon: FileStack,
      tone: 'text-slate-600 bg-slate-100',
      ring: 'hover:border-slate-300',
    },
    {
      key: 'DRAFT',
      label: 'Bản nháp',
      value: statusCounts.DRAFT ?? 0,
      icon: FilePen,
      tone: 'text-slate-600 bg-slate-100',
      ring: 'hover:border-slate-300',
    },
    {
      key: 'PENDING_REVIEW',
      label: 'Chờ duyệt',
      value: pendingCount,
      icon: Clock,
      tone: 'text-blue-600 bg-blue-100',
      ring: 'hover:border-blue-300',
    },
    {
      key: 'APPROVED',
      label: 'Đã phê duyệt',
      value: statusCounts.APPROVED ?? 0,
      icon: CheckCircle2,
      tone: 'text-emerald-600 bg-emerald-100',
      ring: 'hover:border-emerald-300',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Module Hero ─────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="personnel"
        supra="M02 · Nhân sự"
        title="Khai báo Quá trình Lên Quân hàm"
        subtitle="Quản lý bản khai lịch sử thăng/biến động quân hàm của cán bộ, quân nhân"
        icon={Award}
        stats={[
          { label: 'Tổng', value: totalAllStatuses },
          { label: 'Chờ duyệt', value: pendingCount },
          { label: 'Đã duyệt', value: statusCounts.APPROVED ?? 0 },
        ]}
        controls={
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}
              className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/personnel/rank-declarations/create')}
              className="gap-1.5 bg-white text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Tạo bản khai
            </Button>
          </div>
        }
      />

      {/* ── Summary cards (click để lọc nhanh) ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = statusFilter === card.key
          const Icon = card.icon
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                // Toggle: bấm lại card đang active → bỏ lọc về tất cả
                setStatusFilter((prev) => (prev === card.key ? 'ALL' : card.key))
                setPage(1)
              }}
              className={cn(
                'group flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all',
                'shadow-sm hover:shadow-md',
                active ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200',
                card.ring,
              )}
            >
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', card.tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo họ tên, mã cán bộ..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            className="bg-white pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {DECLARATION_STATUS_ORDER.map((k) => (
              <SelectItem key={k} value={k}>{DECLARATION_STATUS_META[k].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rankTypeFilter} onValueChange={(v) => { setRankTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="Loại quân hàm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            <SelectItem value="OFFICER">Sĩ quan</SelectItem>
            <SelectItem value="SOLDIER">Quân nhân</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-700">
            <FileStack className="h-4 w-4 text-blue-600" />
            Danh sách bản khai
            <span className="font-normal text-slate-400">({total})</span>
            {statusFilter !== 'ALL' && (
              <span className="ml-1 text-sm font-normal text-slate-400">
                — lọc: {DECLARATION_STATUS_META[statusFilter]?.label ?? statusFilter}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title="Chưa có bản khai nào"
              description="Không có bản khai phù hợp bộ lọc. Hãy tạo bản khai mới hoặc đổi điều kiện tìm kiếm."
              action={
                <Button
                  onClick={() => router.push('/dashboard/personnel/rank-declarations/create')}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" /> Tạo bản khai
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cán bộ</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đơn vị</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sự kiện</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quân hàm</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hiệu lực</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const statusMeta = getDeclarationStatusMeta(item.declarationStatus)
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer border-slate-100 transition-colors hover:bg-blue-50/40"
                        onClick={() => router.push(`/dashboard/personnel/rank-declarations/${item.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-800">{item.personnel.fullName}</div>
                          <div className="text-xs text-slate-400">{item.personnel.personnelCode}</div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {item.personnel.unit?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                            item.rankType === 'OFFICER'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-cyan-200 bg-cyan-50 text-cyan-700',
                          )}>
                            {RANK_TYPE_LABELS[item.rankType] ?? item.rankType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {getPromotionTypeLabel(item.promotionType)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1.5">
                            {item.previousRank && (
                              <>
                                <span className="text-slate-400">{getRankLabel(item.previousRank)}</span>
                                <ChevronRight className="h-3 w-3 text-slate-300" />
                              </>
                            )}
                            <span className="font-medium text-slate-800">{getRankLabel(item.newRank)}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(item.effectiveDate)}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            <span className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                              statusMeta.pill,
                            )}>
                              {statusMeta.label}
                            </span>
                            {item.lockedAt && (
                              <Lock className="h-3 w-3 text-slate-400" aria-label="Đã khóa" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                            onClick={() => router.push(`/dashboard/personnel/rank-declarations/${item.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500">Trang {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm" disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>
                <Button
                  variant="outline" size="sm" disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  Sau <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
