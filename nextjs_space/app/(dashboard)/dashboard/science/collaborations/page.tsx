'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Globe2, Users, FileText, Plus, Search, ChevronRight,
  Building2, CalendarDays, ArrowLeft, ExternalLink,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  INTERNAL:      'Nội bộ',
  EXTERNAL:      'Bên ngoài',
  INTERNATIONAL: 'Quốc tế',
}

const TYPE_BADGE: Record<string, string> = {
  INTERNAL:      'bg-blue-100 text-blue-700',
  EXTERNAL:      'bg-violet-100 text-violet-700',
  INTERNATIONAL: 'bg-emerald-100 text-emerald-700',
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CollabItem {
  id: string
  type: string
  partnerName: string
  partnerCountry?: string | null
  partnerUnit?: string | null
  agreementNumber?: string | null
  startDate: string
  endDate?: string | null
  status: string
  createdAt: string
  project: { id: string; projectCode: string; title: string }
  createdBy: { id: string; name: string }
  _count: { participants: number; documents: number }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CollaborationsPage() {
  const [items, setItems]     = useState<CollabItem[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setType] = useState('')
  const [statusFilter, setStatus] = useState('ACTIVE')
  const [showForm, setShowForm]   = useState(false)

  const pageSize = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(typeFilter   ? { type: typeFilter }     : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      const res  = await fetch(`/api/science/collaborations?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Lỗi tải danh sách')
      setItems(json.data.items)
      setTotal(json.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = keyword.trim()
    ? items.filter((c) =>
        c.partnerName.toLowerCase().includes(keyword.toLowerCase()) ||
        c.project.projectCode.toLowerCase().includes(keyword.toLowerCase()) ||
        c.project.title.toLowerCase().includes(keyword.toLowerCase())
      )
    : items

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  // ─── New collab form (inline) ─────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/science/projects" className="text-gray-400 hover:text-violet-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-violet-600" />
              Hợp tác nghiên cứu
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} hợp tác trong hệ thống</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          Thêm hợp tác
        </Button>
      </div>

      {/* New collab form */}
      {showForm && (
        <NewCollabForm
          onSuccess={() => { setShowForm(false); fetchData() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm đối tác, mã đề tài..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setType(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Nội bộ',   type: 'INTERNAL',      color: 'blue' },
          { label: 'Bên ngoài', type: 'EXTERNAL',     color: 'violet' },
          { label: 'Quốc tế',  type: 'INTERNATIONAL', color: 'emerald' },
        ].map(({ label, type, color }) => {
          const count = items.filter((c) => c.type === type && c.status === 'ACTIVE').length
          const colorCls = { blue: 'text-blue-600', violet: 'text-violet-600', emerald: 'text-emerald-600' }[color] ?? 'text-gray-600'
          return (
            <div key={type} className="rounded-xl border bg-white p-3 text-center">
              <p className={`text-2xl font-bold ${colorCls}`}>{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label} (đang HĐ)</p>
            </div>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-[3px] border-violet-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <Globe2 className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Chưa có hợp tác nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/science/collaborations/${c.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-violet-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    c.type === 'INTERNATIONAL' ? 'bg-emerald-100' : c.type === 'EXTERNAL' ? 'bg-violet-100' : 'bg-blue-100'
                  }`}>
                    <Globe2 className={`h-4 w-4 ${
                      c.type === 'INTERNATIONAL' ? 'text-emerald-600' : c.type === 'EXTERNAL' ? 'text-violet-600' : 'text-blue-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[c.type] ?? c.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      {c.agreementNumber && (
                        <span className="text-xs text-gray-400 font-mono">{c.agreementNumber}</span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 truncate">{c.partnerName}</h3>
                    {(c.partnerUnit || c.partnerCountry) && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {[c.partnerUnit, c.partnerCountry].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="font-mono text-violet-600">{c.project.projectCode}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(c.startDate)}{c.endDate ? ` — ${formatDate(c.endDate)}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {c._count.participants}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {c._count.documents}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 flex-shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="text-sm text-gray-500">
            Trang {page} / {Math.ceil(total / pageSize)}
          </span>
          <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Inline new-collaboration form ─────────────────────────────────────────────

function NewCollabForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    projectId: '', type: 'EXTERNAL', partnerName: '', partnerCountry: '',
    partnerUnit: '', agreementNumber: '', startDate: '', endDate: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch('/api/science/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          endDate: form.endDate || undefined,
          partnerCountry: form.partnerCountry || undefined,
          partnerUnit: form.partnerUnit || undefined,
          agreementNumber: form.agreementNumber || undefined,
          notes: form.notes || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Lỗi tạo hợp tác')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-violet-800 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm hợp tác mới
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ID Đề tài *</label>
              <input placeholder="project-id" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className={inputCls} required />
              <p className="text-xs text-gray-400 mt-0.5">Dán ID đề tài từ trang chi tiết đề tài</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Loại hợp tác *</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tên đối tác *</label>
              <input placeholder="Tên tổ chức / đơn vị đối tác" value={form.partnerName} onChange={(e) => set('partnerName', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quốc gia đối tác</label>
              <input placeholder="Việt Nam / USA / ..." value={form.partnerCountry} onChange={(e) => set('partnerCountry', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Đơn vị trong đối tác</label>
              <input placeholder="Khoa / Bộ môn / Phòng..." value={form.partnerUnit} onChange={(e) => set('partnerUnit', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Số biên bản / hợp đồng</label>
              <input placeholder="HĐ-2024-..." value={form.agreementNumber} onChange={(e) => set('agreementNumber', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bắt đầu *</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kết thúc</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
            <textarea rows={2} placeholder="Nội dung hợp tác, phạm vi..." value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputCls + ' resize-none'} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
              {saving ? <div className="h-3.5 w-3.5 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Plus className="h-3.5 w-3.5" />}
              Tạo hợp tác
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
