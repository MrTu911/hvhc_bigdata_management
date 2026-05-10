'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Search, RefreshCw, Eye, ChevronLeft, ChevronRight, Shield } from 'lucide-react'

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

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT:          { label: 'Nháp',         variant: 'secondary' },
  PENDING_REVIEW: { label: 'Chờ duyệt',    variant: 'outline' },
  UNDER_REVIEW:   { label: 'Đang xét',     variant: 'outline' },
  APPROVED:       { label: 'Đã duyệt',     variant: 'default' },
  REJECTED:       { label: 'Từ chối',      variant: 'destructive' },
  RETURNED:       { label: 'Trả lại',      variant: 'destructive' },
  CANCELLED:      { label: 'Đã hủy',       variant: 'secondary' },
}

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  THANG_CAP:  'Thăng cấp',
  BO_NHIEM:   'Bổ nhiệm',
  DIEU_DONG:  'Điều động',
  LUAN_CHUYEN: 'Luân chuyển',
  GIANG_CHUC: 'Giáng chức',
  CACH_CHUC:  'Cách chức',
  NGHI_HUU:   'Nghỉ hưu',
  XUAT_NGU:   'Xuất ngũ',
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function RankDeclarationsPage() {
  const router = useRouter()

  const [items, setItems] = useState<RankDeclaration[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [rankTypeFilter, setRankTypeFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (keyword) params.set('keyword', keyword)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (rankTypeFilter !== 'ALL') params.set('rankType', rankTypeFilter)

    try {
      const res = await fetch(`/api/officer-career/rank-declarations?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.items ?? [])
        setTotal(json.total ?? 0)
        setTotalPages(json.totalPages ?? 1)
      }
    } finally {
      setLoading(false)
    }
  }, [page, keyword, statusFilter, rankTypeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Khai báo Quá trình Lên Quân hàm
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý bản khai lịch sử thăng quân hàm của cán bộ, quân nhân
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/personnel/rank-declarations/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo bản khai
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã cán bộ..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rankTypeFilter} onValueChange={(v) => { setRankTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Loại QH" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="OFFICER">Sĩ quan</SelectItem>
                <SelectItem value="SOLDIER">Quân nhân</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Danh sách bản khai ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có bản khai nào phù hợp
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cán bộ</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Sự kiện</TableHead>
                  <TableHead>Quân hàm mới</TableHead>
                  <TableHead>Ngày hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.declarationStatus] ?? { label: item.declarationStatus, variant: 'secondary' as const }
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.personnel.fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.personnel.personnelCode}</div>
                      </TableCell>
                      <TableCell className="text-sm">{item.personnel.unit?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.rankType === 'OFFICER' ? 'Sĩ quan' : 'Quân nhân'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{PROMOTION_TYPE_LABELS[item.promotionType] ?? item.promotionType}</TableCell>
                      <TableCell className="text-sm">{item.newRank ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.effectiveDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                        {item.lockedAt && (
                          <span className="ml-1 text-xs text-muted-foreground">🔒</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
