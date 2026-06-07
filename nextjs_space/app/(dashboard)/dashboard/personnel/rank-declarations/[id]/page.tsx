'use client'

/**
 * M02 Extension – Chi tiết bản khai quân hàm
 * Route: /dashboard/personnel/rank-declarations/[id]
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { cn } from '@/lib/utils'
import {
  getDeclarationStatusMeta,
  getAmendmentStatusMeta,
  getRankLabel,
  getPromotionTypeLabel,
  RANK_TYPE_LABELS,
} from '@/lib/constants/rank-declaration'
import {
  ArrowLeft, Lock, Send, CheckCircle2, XCircle, RotateCcw, Loader2,
  Award, FilePen, UserCog, FileSignature, History,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Declaration {
  id: string
  rankType: string
  promotionType: string
  previousRank: string | null
  newRank: string | null
  effectiveDate: string
  decisionNumber: string | null
  decisionDate: string | null
  previousPosition: string | null
  newPosition: string | null
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

type WorkflowAction = 'APPROVE' | 'REJECT' | 'RETURN'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RankDeclarationDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { hasPermission } = usePermissions()

  const [declaration, setDeclaration] = useState<Declaration | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [showActionDialog, setShowActionDialog] = useState<WorkflowAction | null>(null)
  const [showAmendDialog, setShowAmendDialog] = useState(false)
  const [amendReason, setAmendReason] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được bản khai')
      setDeclaration(json.data)
    } catch (e: any) {
      toast({ title: 'Lỗi tải dữ liệu', description: e?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}/submit`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Nộp bản khai thất bại')
      toast({ title: 'Đã nộp bản khai', description: 'Bản khai đã chuyển sang trạng thái chờ duyệt.' })
      await fetchData()
    } catch (e: any) {
      toast({ title: 'Nộp thất bại', description: e?.message, variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleWorkflowAction = async (action: WorkflowAction) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/officer-career/rank-declarations/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Thao tác thất bại')
      const labels: Record<WorkflowAction, string> = {
        APPROVE: 'Đã phê duyệt bản khai', REJECT: 'Đã từ chối bản khai', RETURN: 'Đã trả lại bản khai',
      }
      toast({ title: labels[action] })
      setShowActionDialog(null)
      setComment('')
      await fetchData()
    } catch (e: any) {
      toast({ title: 'Thao tác thất bại', description: e?.message, variant: 'destructive' })
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
        body: JSON.stringify({ requestedChanges: {}, reason: amendReason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Gửi đề nghị thất bại')
      toast({ title: 'Đã gửi đề nghị chỉnh sửa' })
      setShowAmendDialog(false)
      setAmendReason('')
      await fetchData()
    } catch (e: any) {
      toast({ title: 'Gửi đề nghị thất bại', description: e?.message, variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    )
  }

  if (!declaration) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FilePen className="mb-4 h-14 w-14 text-slate-300" />
        <p className="text-slate-600">Không tìm thấy bản khai</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  const statusMeta = getDeclarationStatusMeta(declaration.declarationStatus)
  const isDraftLike = declaration.declarationStatus === 'DRAFT' || declaration.declarationStatus === 'RETURNED'
  const isReviewable = declaration.declarationStatus === 'PENDING_REVIEW' || declaration.declarationStatus === 'UNDER_REVIEW'
  const isLockedApproved = declaration.declarationStatus === 'APPROVED' && !!declaration.lockedAt

  // Permission-aware: chỉ hiện nút khi user có quyền tương ứng (backend vẫn enforce)
  const canSubmit = isDraftLike && hasPermission(PROMOTION.SUBMIT)
  const canReview = isReviewable && hasPermission(PROMOTION.APPROVE)
  const canAmend = isLockedApproved && hasPermission(PROMOTION.REQUEST_AMENDMENT)
  const hasActions = canSubmit || canReview || canAmend

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white shadow-md">
        <Button
          variant="ghost" size="icon"
          className="text-white/90 hover:bg-white/15 hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Award className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight">Bản khai quân hàm</h1>
          <p className="text-sm text-blue-100">
            {declaration.personnel.fullName} · {declaration.personnel.personnelCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
            statusMeta.pill,
          )}>
            {statusMeta.label}
          </span>
          {declaration.lockedAt && <Lock className="h-4 w-4 text-blue-100" aria-label="Đã khóa" />}
        </div>
      </div>

      {/* ── Thông tin cán bộ ────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-700">
            <UserCog className="h-4 w-4 text-blue-600" /> Thông tin cán bộ
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoRow label="Họ tên" value={declaration.personnel.fullName} strong />
            <InfoRow label="Mã cán bộ" value={declaration.personnel.personnelCode} />
            <InfoRow label="Đơn vị" value={declaration.personnel.unit?.name ?? '—'} />
            <InfoRow label="Cơ quan quản lý" value={declaration.personnel.managingOrgan ?? '—'} />
            <InfoRow label="Loại quân hàm" value={RANK_TYPE_LABELS[declaration.rankType] ?? declaration.rankType} />
            <InfoRow
              label="Người khai"
              value={`${declaration.declarer.name}${declaration.declaredOnBehalfOf ? ' (khai hộ)' : ''}`}
            />
          </dl>
        </CardContent>
      </Card>

      {/* ── Nội dung khai báo ───────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-700">
            <FileSignature className="h-4 w-4 text-blue-600" /> Nội dung khai báo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Highlight chuyển quân hàm */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm">
              {getRankLabel(declaration.previousRank)}
            </span>
            <RotateCcw className="h-4 w-4 rotate-180 text-blue-400" />
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
              {getRankLabel(declaration.newRank)}
            </span>
            <span className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
              {getPromotionTypeLabel(declaration.promotionType)}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoRow label="Ngày hiệu lực" value={formatDate(declaration.effectiveDate)} strong />
            <InfoRow label="Số quyết định" value={declaration.decisionNumber ?? '—'} />
            <InfoRow label="Ngày quyết định" value={formatDate(declaration.decisionDate)} />
            <InfoRow label="Chức vụ trước" value={declaration.previousPosition ?? '—'} />
            <InfoRow label="Chức vụ mới" value={declaration.newPosition ?? '—'} />
            {declaration.reason && <InfoRow label="Lý do / Căn cứ" value={declaration.reason} full />}
            {declaration.notes && <InfoRow label="Ghi chú" value={declaration.notes} full />}
          </dl>
        </CardContent>
      </Card>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      {hasActions && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={actionLoading} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Nộp để duyệt
            </Button>
          )}
          {canReview && (
            <>
              <Button onClick={() => setShowActionDialog('APPROVE')} disabled={actionLoading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Phê duyệt
              </Button>
              <Button variant="outline" onClick={() => setShowActionDialog('RETURN')} disabled={actionLoading} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                <RotateCcw className="h-4 w-4" /> Trả lại
              </Button>
              <Button variant="outline" onClick={() => setShowActionDialog('REJECT')} disabled={actionLoading} className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50">
                <XCircle className="h-4 w-4" /> Từ chối
              </Button>
            </>
          )}
          {canAmend && (
            <Button variant="outline" onClick={() => setShowAmendDialog(true)} className="gap-1.5">
              <FilePen className="h-4 w-4" /> Đề nghị chỉnh sửa
            </Button>
          )}
        </div>
      )}

      {/* ── Amendments ──────────────────────────────────────────────────────── */}
      {declaration.amendments.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-700">
              <History className="h-4 w-4 text-blue-600" /> Đề nghị chỉnh sửa
              <span className="font-normal text-slate-400">({declaration.amendments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {declaration.amendments.map((a) => {
              const meta = getAmendmentStatusMeta(a.amendmentStatus)
              return (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{a.requester.name}</span>
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', meta.pill)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">{a.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(a.createdAt)}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Workflow Action Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!showActionDialog} onOpenChange={(o) => !o && setShowActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showActionDialog === 'APPROVE' ? 'Xác nhận phê duyệt'
                : showActionDialog === 'REJECT' ? 'Xác nhận từ chối'
                : 'Trả lại bản khai'}
            </DialogTitle>
            <DialogDescription>
              {showActionDialog === 'APPROVE'
                ? 'Sau khi phê duyệt, bản khai sẽ được ghi nhận vào hồ sơ và khóa lại.'
                : 'Nêu rõ ý kiến để người khai biết và xử lý.'}
            </DialogDescription>
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
              className={cn(
                'gap-1.5',
                showActionDialog === 'APPROVE' && 'bg-emerald-600 hover:bg-emerald-700',
                showActionDialog === 'REJECT' && 'bg-red-600 hover:bg-red-700',
              )}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Amendment Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đề nghị chỉnh sửa bản khai</DialogTitle>
            <DialogDescription>
              Bản khai đã được phê duyệt và khóa. Vui lòng nêu rõ nội dung cần chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nội dung cần chỉnh sửa và lý do..."
            value={amendReason}
            onChange={(e) => setAmendReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmendDialog(false)}>Hủy</Button>
            <Button onClick={handleAmendmentRequest} disabled={actionLoading || !amendReason.trim()} className="gap-1.5">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi đề nghị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function InfoRow({
  label, value, strong, full,
}: { label: string; value: string; strong?: boolean; full?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-0.5', full && 'sm:col-span-2')}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={cn('text-slate-700', strong && 'font-semibold text-slate-800')}>{value}</dd>
    </div>
  )
}
