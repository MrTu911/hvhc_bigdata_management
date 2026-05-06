'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Lock,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Shield,
  FileEdit,
} from 'lucide-react'

interface Declaration {
  id: string
  rankType: string
  promotionType: string
  previousRank: string | null
  newRank: string | null
  effectiveDate: string
  decisionNumber: string | null
  decisionDate: string | null
  reason: string | null
  notes: string | null
  declarationStatus: string
  lockedAt: string | null
  lockedBy: string | null
  declaredOnBehalfOf: boolean
  createdAt: string
  personnel: {
    fullName: string
    personnelCode: string
    militaryRank: string | null
    managingOrgan: string | null
    unit: { name: string } | null
  }
  declarer: { id: string; name: string }
  amendments: Array<{
    id: string
    reason: string
    amendmentStatus: string
    requestedChanges: Record<string, { from: unknown; to: unknown }>
    createdAt: string
    requester: { name: string }
  }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:          { label: 'Bản nháp',     color: 'secondary' },
  PENDING_REVIEW: { label: 'Chờ duyệt',    color: 'outline' },
  UNDER_REVIEW:   { label: 'Đang xét',     color: 'outline' },
  APPROVED:       { label: 'Đã phê duyệt', color: 'default' },
  REJECTED:       { label: 'Từ chối',      color: 'destructive' },
  RETURNED:       { label: 'Trả lại',      color: 'destructive' },
  CANCELLED:      { label: 'Đã hủy',       color: 'secondary' },
}

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  THANG_CAP: 'Thăng cấp', BO_NHIEM: 'Bổ nhiệm', DIEU_DONG: 'Điều động',
  LUAN_CHUYEN: 'Luân chuyển', GIANG_CHUC: 'Giáng chức', CACH_CHUC: 'Cách chức',
  NGHI_HUU: 'Nghỉ hưu', XUAT_NGU: 'Xuất ngũ',
}

export default function RankDeclarationDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [declaration, setDeclaration] = useState<Declaration | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [showActionDialog, setShowActionDialog] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null)
  const [showAmendDialog, setShowAmendDialog] = useState(false)
  const [amendReason, setAmendReason] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}`)
      const json = await res.json()
      if (json.success) setDeclaration(json.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleWorkflowAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      })
      if (res.ok) {
        setShowActionDialog(null)
        setComment('')
        await fetchData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}/submit`, { method: 'POST' })
      if (res.ok) await fetchData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAmendmentRequest = async () => {
    if (!amendReason.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}/amendments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedChanges: {},
          reason: amendReason,
        }),
      })
      if (res.ok) {
        setShowAmendDialog(false)
        setAmendReason('')
        await fetchData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!declaration) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Không tìm thấy bản khai
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[declaration.declarationStatus] ?? { label: declaration.declarationStatus, color: 'secondary' }
  const canSubmit = declaration.declarationStatus === 'DRAFT' || declaration.declarationStatus === 'RETURNED'
  const canAct = declaration.declarationStatus === 'PENDING_REVIEW' || declaration.declarationStatus === 'UNDER_REVIEW'
  const canAmend = declaration.declarationStatus === 'APPROVED' && !!declaration.lockedAt

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bản khai quân hàm
          </h1>
          <p className="text-sm text-muted-foreground">
            {declaration.personnel.fullName} — {declaration.personnel.personnelCode}
          </p>
        </div>
        <Badge variant={statusCfg.color as any}>{statusCfg.label}</Badge>
        {declaration.lockedAt && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Personnel Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cán bộ</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Họ tên:</span> <strong>{declaration.personnel.fullName}</strong></div>
            <div><span className="text-muted-foreground">Mã CB:</span> {declaration.personnel.personnelCode}</div>
            <div><span className="text-muted-foreground">Đơn vị:</span> {declaration.personnel.unit?.name ?? '—'}</div>
            <div><span className="text-muted-foreground">Cơ quan quản lý:</span> {declaration.personnel.managingOrgan ?? '—'}</div>
            <div><span className="text-muted-foreground">Loại QH:</span> {declaration.rankType === 'OFFICER' ? 'Sĩ quan' : 'Quân nhân'}</div>
            <div><span className="text-muted-foreground">Người khai:</span> {declaration.declarer.name}{declaration.declaredOnBehalfOf ? ' (khai hộ)' : ''}</div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration Data */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nội dung khai báo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Sự kiện:</span> <strong>{PROMOTION_TYPE_LABELS[declaration.promotionType] ?? declaration.promotionType}</strong></div>
            <div><span className="text-muted-foreground">Ngày hiệu lực:</span> {new Date(declaration.effectiveDate).toLocaleDateString('vi-VN')}</div>
            <div><span className="text-muted-foreground">QH trước:</span> {declaration.previousRank ?? '—'}</div>
            <div><span className="text-muted-foreground">QH mới:</span> <strong>{declaration.newRank ?? '—'}</strong></div>
            <div><span className="text-muted-foreground">Số QĐ:</span> {declaration.decisionNumber ?? '—'}</div>
            <div><span className="text-muted-foreground">Ngày QĐ:</span> {declaration.decisionDate ? new Date(declaration.decisionDate).toLocaleDateString('vi-VN') : '—'}</div>
            {declaration.reason && (
              <div className="col-span-2"><span className="text-muted-foreground">Lý do:</span> {declaration.reason}</div>
            )}
            {declaration.notes && (
              <div className="col-span-2"><span className="text-muted-foreground">Ghi chú:</span> {declaration.notes}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {canSubmit && (
          <Button onClick={handleSubmit} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Nộp để duyệt
          </Button>
        )}
        {canAct && (
          <>
            <Button onClick={() => setShowActionDialog('APPROVE')} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Phê duyệt
            </Button>
            <Button variant="outline" onClick={() => setShowActionDialog('RETURN')} disabled={actionLoading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Trả lại
            </Button>
            <Button variant="destructive" onClick={() => setShowActionDialog('REJECT')} disabled={actionLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
          </>
        )}
        {canAmend && (
          <Button variant="outline" onClick={() => setShowAmendDialog(true)}>
            <FileEdit className="h-4 w-4 mr-2" />
            Đề nghị chỉnh sửa
          </Button>
        )}
      </div>

      {/* Amendments */}
      {declaration.amendments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Đề nghị chỉnh sửa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {declaration.amendments.map((a) => (
              <div key={a.id} className="border rounded-md p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{a.requester.name}</span>
                  <Badge variant="outline">{a.amendmentStatus}</Badge>
                </div>
                <p className="text-muted-foreground">{a.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={!!showActionDialog} onOpenChange={() => setShowActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showActionDialog === 'APPROVE' ? 'Xác nhận phê duyệt' :
               showActionDialog === 'REJECT'  ? 'Xác nhận từ chối' : 'Trả lại bản khai'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Ý kiến / lý do (không bắt buộc)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(null)}>Hủy</Button>
            <Button
              onClick={() => showActionDialog && handleWorkflowAction(showActionDialog)}
              disabled={actionLoading}
              variant={showActionDialog === 'REJECT' ? 'destructive' : 'default'}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment Dialog */}
      <Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đề nghị chỉnh sửa bản khai</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bản khai đã được phê duyệt và khóa. Vui lòng nêu rõ nội dung cần chỉnh sửa.
          </p>
          <Textarea
            placeholder="Nội dung cần chỉnh sửa và lý do..."
            value={amendReason}
            onChange={(e) => setAmendReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmendDialog(false)}>Hủy</Button>
            <Button onClick={handleAmendmentRequest} disabled={actionLoading || !amendReason.trim()}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gửi đề nghị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
