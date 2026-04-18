'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Globe2, Users, FileText, Building2, CalendarDays, ArrowLeft,
  ExternalLink, Plus, Edit2, Check, X, Download, ChevronRight,
  Handshake, UserPlus, Upload, Info, CheckCircle2, XCircle, Clock,
  RefreshCw, Link2,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  INTERNAL:      'Nội bộ',
  EXTERNAL:      'Bên ngoài',
  INTERNATIONAL: 'Quốc tế',
}

const TYPE_COLOR: Record<string, { badge: string; icon: string; ring: string }> = {
  INTERNAL:      { badge: 'bg-blue-100 text-blue-700',    icon: 'text-blue-600',    ring: 'ring-blue-200' },
  EXTERNAL:      { badge: 'bg-violet-100 text-violet-700', icon: 'text-violet-600',  ring: 'ring-violet-200' },
  INTERNATIONAL: { badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:     'Đang hoạt động',
  COMPLETED:  'Hoàn thành',
  TERMINATED: 'Chấm dứt',
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:     'bg-teal-100 text-teal-700',
  COMPLETED:  'bg-gray-100 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-600',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  AGREEMENT:      'Hợp đồng',
  REPORT:         'Báo cáo',
  CORRESPONDENCE: 'Thư từ',
  OTHER:          'Khác',
}

const DOC_TYPE_BADGE: Record<string, string> = {
  AGREEMENT:      'bg-blue-50 text-blue-700',
  REPORT:         'bg-violet-50 text-violet-700',
  CORRESPONDENCE: 'bg-amber-50 text-amber-700',
  OTHER:          'bg-gray-50 text-gray-600',
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  institution?: string | null
  role?: string | null
  createdAt: string
  user?: { id: string; name: string; rank?: string | null } | null
}

interface Document {
  id: string
  title: string
  fileUrl: string
  docType: string
  createdAt: string
  uploadedBy: { id: string; name: string }
}

interface Collaboration {
  id: string
  projectId: string
  type: string
  partnerName: string
  partnerCountry?: string | null
  partnerUnit?: string | null
  agreementNumber?: string | null
  startDate: string
  endDate?: string | null
  status: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  project: { id: string; projectCode: string; title: string }
  createdBy: { id: string; name: string }
  participants: Participant[]
  documents: Document[]
}

type TabKey = 'info' | 'participants' | 'documents'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

// ─── Tab nav ───────────────────────────────────────────────────────────────────

function TabNav({ active, onChange, participantCount, documentCount }: {
  active: TabKey
  onChange: (t: TabKey) => void
  participantCount: number
  documentCount: number
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'info',         label: 'Thông tin',     icon: <Info className="h-3.5 w-3.5" /> },
    { key: 'participants', label: 'Thành viên',    icon: <Users className="h-3.5 w-3.5" />, count: participantCount },
    { key: 'documents',    label: 'Tài liệu',      icon: <FileText className="h-3.5 w-3.5" />, count: documentCount },
  ]

  return (
    <div className="flex gap-1 border-b border-gray-200 pb-px overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === t.key
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {t.icon}
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className={`text-xs rounded-full px-1.5 py-px font-semibold ${
              active === t.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Tab: Thông tin ────────────────────────────────────────────────────────────

function InfoTab({ collab, onUpdate }: { collab: Collaboration; onUpdate: (data: Partial<Collaboration>) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    partnerName:     collab.partnerName,
    partnerCountry:  collab.partnerCountry ?? '',
    partnerUnit:     collab.partnerUnit ?? '',
    agreementNumber: collab.agreementNumber ?? '',
    startDate:       collab.startDate.slice(0, 10),
    endDate:         collab.endDate?.slice(0, 10) ?? '',
    status:          collab.status,
    notes:           collab.notes ?? '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onUpdate({
        partnerName:     form.partnerName,
        partnerCountry:  form.partnerCountry  || undefined,
        partnerUnit:     form.partnerUnit     || undefined,
        agreementNumber: form.agreementNumber || undefined,
        startDate:       form.startDate,
        endDate:         form.endDate || undefined,
        status:          form.status,
        notes:           form.notes || undefined,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const tc = TYPE_COLOR[collab.type] ?? TYPE_COLOR.EXTERNAL

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-violet-500" /> Chỉnh sửa thông tin hợp tác
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tên đối tác *</label>
              <input value={form.partnerName} onChange={(e) => set('partnerName', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quốc gia</label>
              <input value={form.partnerCountry} onChange={(e) => set('partnerCountry', e.target.value)} className={inputCls} placeholder="Việt Nam" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Đơn vị trong đối tác</label>
              <input value={form.partnerUnit} onChange={(e) => set('partnerUnit', e.target.value)} className={inputCls} placeholder="Khoa / Bộ môn..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số hợp đồng</label>
              <input value={form.agreementNumber} onChange={(e) => set('agreementNumber', e.target.value)} className={inputCls} placeholder="HĐ-2024-..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bắt đầu *</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kết thúc</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputCls + ' resize-none'} placeholder="Phạm vi hợp tác, mục tiêu..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            <X className="h-3.5 w-3.5 mr-1" /> Hủy
          </Button>
          <Button type="submit" size="sm" disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {/* Partner card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl ring-2 ${tc.ring} flex items-center justify-center flex-shrink-0 bg-white`}>
              <Globe2 className={`h-7 w-7 ${tc.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{collab.partnerName}</h2>
              {collab.partnerUnit && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {collab.partnerUnit}
                </p>
              )}
              {collab.partnerCountry && (
                <p className="text-sm text-gray-400 mt-0.5">{collab.partnerCountry}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[collab.type]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABELS[collab.type] ?? collab.type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[collab.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[collab.status] ?? collab.status}
                </span>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => setEditing(true)}
              className="gap-1.5 flex-shrink-0"
            >
              <Edit2 className="h-3.5 w-3.5" /> Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Handshake className="h-4 w-4 text-violet-500" /> Chi tiết hợp tác
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <InfoRow label="Số hợp đồng" value={collab.agreementNumber} mono />
            <InfoRow label="Bắt đầu" value={formatDate(collab.startDate)} />
            <InfoRow label="Kết thúc" value={formatDate(collab.endDate)} />
            <InfoRow label="Tạo bởi" value={collab.createdBy.name} />
            <InfoRow label="Ngày tạo" value={formatDate(collab.createdAt)} />
            <InfoRow label="Cập nhật" value={formatDate(collab.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-500" /> Liên kết đề tài
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/dashboard/science/projects/${collab.project.id}`}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50/40 transition-colors group"
            >
              <div>
                <p className="text-xs font-mono text-violet-600 font-semibold">{collab.project.projectCode}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5 line-clamp-2">{collab.project.title}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-violet-500 flex-shrink-0 ml-2" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {collab.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{collab.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" /> Thời gian hợp tác
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-violet-500" />
              <div className="text-xs text-center">
                <p className="font-semibold text-gray-800">{formatDate(collab.startDate)}</p>
                <p className="text-gray-400">Bắt đầu</p>
              </div>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 relative">
              {collab.status === 'ACTIVE' && (
                <div
                  className="h-full bg-teal-400 rounded-full"
                  style={{
                    width: collab.endDate
                      ? `${Math.min(100, Math.max(0, Math.round(
                          (Date.now() - new Date(collab.startDate).getTime()) /
                          (new Date(collab.endDate).getTime() - new Date(collab.startDate).getTime()) * 100
                        )))}%`
                      : '50%',
                  }}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              {collab.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : collab.status === 'TERMINATED' ? (
                <XCircle className="h-3 w-3 text-red-500" />
              ) : (
                <Clock className="h-3 w-3 text-gray-300" />
              )}
              <div className="text-xs text-center">
                <p className="font-semibold text-gray-800">{formatDate(collab.endDate)}</p>
                <p className="text-gray-400">Kết thúc</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Thành viên ───────────────────────────────────────────────────────────

function ParticipantsTab({ collaborationId }: { collaborationId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]   = useState({ name: '', institution: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/science/collaborations/${collaborationId}/participants`)
    const json = await res.json()
    if (json.success) setParticipants(json.data)
    setLoading(false)
  }, [collaborationId])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch(`/api/science/collaborations/${collaborationId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Lỗi thêm thành viên')
      setForm({ name: '', institution: '', role: '' })
      setShowForm(false)
      await load()
      toast.success('Đã thêm thành viên')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{participants.length} thành viên tham gia hợp tác</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
          <UserPlus className="h-3.5 w-3.5" /> Thêm thành viên
        </Button>
      </div>

      {showForm && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tên thành viên *</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tổ chức</label>
                  <input value={form.institution} onChange={(e) => set('institution', e.target.value)} className={inputCls} placeholder="Trường / Viện..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Vai trò</label>
                  <input value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls} placeholder="Nghiên cứu viên / Cố vấn..." />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={saving}>Hủy</Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Thêm
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-7 w-7 border-[3px] border-violet-600 border-t-transparent rounded-full" />
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <Users className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Chưa có thành viên nào.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {participants.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-violet-200 transition-colors">
              <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-violet-700">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                  {p.user && (
                    <Link
                      href={`/dashboard/personnel/${p.user.id}`}
                      title="Hồ sơ nhân sự"
                      className="text-gray-400 hover:text-violet-600 flex-shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                {p.user?.rank && <p className="text-xs text-gray-400 mt-0.5">{p.user.rank}</p>}
                {p.institution && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {p.institution}
                  </p>
                )}
                {p.role && (
                  <span className="mt-1 inline-flex text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {p.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Tài liệu ─────────────────────────────────────────────────────────────

function DocumentsTab({ collaborationId }: { collaborationId: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({ title: '', fileUrl: '', docType: 'OTHER' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/science/collaborations/${collaborationId}/documents`)
    const json = await res.json()
    if (json.success) setDocuments(json.data)
    setLoading(false)
  }, [collaborationId])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch(`/api/science/collaborations/${collaborationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Lỗi thêm tài liệu')
      setForm({ title: '', fileUrl: '', docType: 'OTHER' })
      setShowForm(false)
      await load()
      toast.success('Đã thêm tài liệu')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white'

  const getDocIcon = (docType: string) => {
    if (docType === 'AGREEMENT')      return <Handshake className="h-4 w-4" />
    if (docType === 'CORRESPONDENCE') return <ChevronRight className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{documents.length} tài liệu</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
          <Upload className="h-3.5 w-3.5" /> Thêm tài liệu
        </Button>
      </div>

      {showForm && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tên tài liệu *</label>
                  <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} placeholder="Biên bản ký kết, Báo cáo Q1..." required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Loại tài liệu</label>
                  <select value={form.docType} onChange={(e) => set('docType', e.target.value)} className={inputCls}>
                    {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">URL tài liệu *</label>
                  <input value={form.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} className={inputCls} placeholder="https://..." required />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={saving}>Hủy</Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Thêm
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-7 w-7 border-[3px] border-violet-600 border-t-transparent rounded-full" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <FileText className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Chưa có tài liệu nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/20 transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${DOC_TYPE_BADGE[doc.docType] ?? 'bg-gray-50 text-gray-500'}`}>
                {getDocIcon(doc.docType)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className={`px-1.5 py-px rounded text-xs font-medium ${DOC_TYPE_BADGE[doc.docType] ?? 'bg-gray-50 text-gray-500'}`}>
                    {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                  </span>
                  <span>·</span>
                  <span>{doc.uploadedBy.name}</span>
                  <span>·</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>

              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex-shrink-0"
                title="Tải xuống / Xem"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CollaborationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [collab, setCollab]   = useState<Collaboration | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setTab]   = useState<TabKey>('info')

  const fetchCollab = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/science/collaborations/${id}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Không tải được')
      setCollab(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải hợp tác')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCollab() }, [fetchCollab])

  const handleUpdate = useCallback(async (data: Partial<Collaboration>) => {
    const res  = await fetch(`/api/science/collaborations/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json()
    if (!json.success) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
    toast.success('Đã cập nhật hợp tác')
    setCollab(json.data)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-9 w-9 border-[3px] border-violet-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!collab) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <Globe2 className="h-12 w-12 mx-auto text-gray-300" />
        <p className="text-gray-500">Không tìm thấy hợp tác hoặc bạn không có quyền xem.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/science/collaborations')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    )
  }

  const tc = TYPE_COLOR[collab.type] ?? TYPE_COLOR.EXTERNAL

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/dashboard/science/collaborations" className="hover:text-violet-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Hợp tác nghiên cứu
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{collab.partnerName}</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`h-11 w-11 rounded-xl ring-2 ${tc.ring} flex items-center justify-center flex-shrink-0 bg-white`}>
              <Globe2 className={`h-5 w-5 ${tc.icon}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[collab.type]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABELS[collab.type] ?? collab.type}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[collab.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[collab.status] ?? collab.status}
                </span>
                {collab.agreementNumber && (
                  <span className="text-xs text-gray-400 font-mono">{collab.agreementNumber}</span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{collab.partnerName}</h1>
              {collab.partnerUnit && (
                <p className="text-sm text-gray-500 mt-0.5">{collab.partnerUnit}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCollab} className="gap-1.5 flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 flex-wrap text-sm text-gray-500">
          <Link
            href={`/dashboard/science/projects/${collab.project.id}`}
            className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="font-mono text-violet-600 font-semibold">{collab.project.projectCode}</span>
          </Link>
          {collab.partnerCountry && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> {collab.partnerCountry}</span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(collab.startDate)}{collab.endDate ? ` — ${formatDate(collab.endDate)}` : ''}
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {collab.participants.length} thành viên</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {collab.documents.length} tài liệu</span>
        </div>
      </div>

      {/* Tabs */}
      <TabNav
        active={activeTab}
        onChange={setTab}
        participantCount={collab.participants.length}
        documentCount={collab.documents.length}
      />

      {/* Tab content */}
      <div className="pt-1">
        {activeTab === 'info'         && <InfoTab         collab={collab} onUpdate={handleUpdate} />}
        {activeTab === 'participants' && <ParticipantsTab collaborationId={collab.id} />}
        {activeTab === 'documents'    && <DocumentsTab    collaborationId={collab.id} />}
      </div>
    </div>
  )
}
