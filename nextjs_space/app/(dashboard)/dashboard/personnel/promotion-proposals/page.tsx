'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, TrendingUp } from 'lucide-react'

interface Proposal {
  id: string
  status: string
  proposedRank: string
  justification: string
  createdAt: string
  respondedAt: string | null
  responseNote: string | null
  personnel: { fullName: string; personnelCode: string; unit: { name: string } | null }
  proposedBy: { name: string }
  proposingUnit: { name: string }
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT:        { label: 'Nháp',        variant: 'secondary' },
  SUBMITTED:    { label: 'Đã gửi',      variant: 'outline' },
  ACKNOWLEDGED: { label: 'Đã nhận',     variant: 'outline' },
  APPROVED:     { label: 'Chấp thuận',  variant: 'default' },
  REJECTED:     { label: 'Từ chối',     variant: 'destructive' },
}

export default function PromotionProposalsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Proposal[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [actionLoading, setActionLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'APPROVE' | 'REJECT' | null>(null)
  const [responseNote, setResponseNote] = useState('')

  // Create form state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ personnelId: '', proposingUnitId: '', proposedRank: '', justification: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/officer-career/promotion-proposals?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.items ?? [])
        setTotal(json.total ?? 0)
        setTotalPages(json.totalPages ?? 1)
      }
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async () => {
    if (!selectedId || !actionType) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/promotion-proposals/${selectedId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, responseNote }),
      })
      if (res.ok) {
        setSelectedId(null); setActionType(null); setResponseNote('')
        await fetchData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/officer-career/promotion-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ personnelId: '', proposingUnitId: '', proposedRank: '', justification: '' })
        await fetchData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Đề nghị Thăng Quân hàm
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Đơn vị đề nghị thăng quân hàm cho cán bộ đến hạn
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo đề nghị
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Danh sách đề nghị ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Không có đề nghị nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cán bộ</TableHead>
                  <TableHead>Đơn vị đề nghị</TableHead>
                  <TableHead>Quân hàm đề nghị</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, variant: 'secondary' as const }
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.personnel.fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.personnel.personnelCode}</div>
                      </TableCell>
                      <TableCell className="text-sm">{item.proposingUnit.name}</TableCell>
                      <TableCell className="text-sm font-medium">{item.proposedRank}</TableCell>
                      <TableCell className="text-sm">{item.proposedBy.name}</TableCell>
                      <TableCell className="text-sm">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell>
                        {item.status === 'SUBMITTED' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => { setSelectedId(item.id); setActionType('APPROVE') }}>
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setSelectedId(item.id); setActionType('REJECT') }}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVE' ? 'Chấp thuận đề nghị thăng quân hàm' : 'Từ chối đề nghị'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Ý kiến / lý do (không bắt buộc)"
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedId(null) }}>Hủy</Button>
            <Button onClick={handleAction} disabled={actionLoading} variant={actionType === 'REJECT' ? 'destructive' : 'default'}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo đề nghị thăng quân hàm</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mã cán bộ *</label>
              <Input value={createForm.personnelId} onChange={(e) => setCreateForm((f) => ({ ...f, personnelId: e.target.value }))} placeholder="ID hoặc mã cán bộ" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Đơn vị đề nghị *</label>
              <Input value={createForm.proposingUnitId} onChange={(e) => setCreateForm((f) => ({ ...f, proposingUnitId: e.target.value }))} placeholder="ID đơn vị" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quân hàm đề nghị *</label>
              <Input value={createForm.proposedRank} onChange={(e) => setCreateForm((f) => ({ ...f, proposedRank: e.target.value }))} placeholder="VD: Thượng úy" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Lý do / Căn cứ *</label>
              <Textarea value={createForm.justification} onChange={(e) => setCreateForm((f) => ({ ...f, justification: e.target.value }))} rows={3} placeholder="Lý do đề nghị thăng quân hàm..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={actionLoading || !createForm.personnelId || !createForm.proposingUnitId || !createForm.justification}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo đề nghị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
