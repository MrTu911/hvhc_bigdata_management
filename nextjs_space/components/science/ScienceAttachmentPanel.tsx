'use client'

/**
 * ScienceAttachmentPanel — Tab "Tài liệu đính kèm" dùng chung cho toàn module khoa học.
 *
 * Hiển thị danh sách file minh chứng của một entity, cho phép upload mới và tải về.
 * Dùng presigned URL từ /api/science/attachments/[id]/download (15 phút).
 *
 * Props:
 *   entityType        — loại entity (PROPOSAL, PROJECT, PUBLICATION, ...)
 *   entityId          — id của entity
 *   allowedCategories — giới hạn loại tài liệu có thể upload (mặc định: tất cả)
 *   allowUpload       — hiển thị nút upload (dựa trên permission)
 *   allowDelete       — hiển thị nút xóa (owner hoặc có quyền DELETE)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ATTACHMENT_CATEGORIES,
  CATEGORY_LABELS,
  ENTITY_ALLOWED_CATEGORIES,
} from '@/lib/validations/science-attachment'
import type { ScienceEntityType, AttachmentCategory } from '@/lib/validations/science-attachment'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentItem {
  id: string
  docCategory: AttachmentCategory
  title: string
  description?: string | null
  mimeType: string
  fileSize: number | bigint
  sensitivity: string
  version: number
  isLatest: boolean
  createdAt: string
  uploadedBy: { id: string; name: string }
}

interface ScienceAttachmentPanelProps {
  entityType: ScienceEntityType
  entityId: string
  allowedCategories?: AttachmentCategory[]
  allowUpload?: boolean
  allowDelete?: boolean
  currentUserId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | bigint): string {
  const n = typeof bytes === 'bigint' ? Number(bytes) : bytes
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function getMimeIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
  if (mimeType.includes('image')) return '🖼️'
  return '📎'
}

function getSensitivityBadge(sensitivity: string) {
  if (sensitivity === 'SECRET') return { label: 'TỐI MẬT', className: 'bg-red-100 text-red-700' }
  if (sensitivity === 'CONFIDENTIAL') return { label: 'MẬT', className: 'bg-orange-100 text-orange-700' }
  return { label: 'Thường', className: 'bg-gray-100 text-gray-600' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScienceAttachmentPanel({
  entityType,
  entityId,
  allowedCategories,
  allowUpload = false,
  allowDelete = false,
  currentUserId,
}: ScienceAttachmentPanelProps) {
  const [items, setItems] = useState<AttachmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadForm, setUploadForm] = useState({
    docCategory: (allowedCategories?.[0] ?? ENTITY_ALLOWED_CATEGORIES[entityType]?.[0] ?? 'TAI_LIEU_KHAC') as AttachmentCategory,
    title: '',
    description: '',
    sensitivity: 'NORMAL' as 'NORMAL' | 'CONFIDENTIAL' | 'SECRET',
  })

  const categoryOptions = allowedCategories ?? ENTITY_ALLOWED_CATEGORIES[entityType] ?? ATTACHMENT_CATEGORIES

  const fetchAttachments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/science/attachments?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`
      )
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
      } else {
        setError(json.error ?? 'Không thể tải danh sách tài liệu')
      }
    } catch {
      setError('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  async function handleDownload(item: AttachmentItem) {
    setDownloadingId(item.id)
    try {
      const res = await fetch(`/api/science/attachments/${item.id}/download`)
      const json = await res.json()
      if (json.success) {
        window.open(json.data.url, '_blank', 'noopener')
      } else {
        alert(json.error ?? 'Không thể tải file')
      }
    } catch {
      alert('Lỗi kết nối khi tải file')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(item: AttachmentItem) {
    if (!confirm(`Xóa tài liệu "${item.title}"?`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/science/attachments/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setItems(prev => prev.filter(i => i.id !== item.id))
      } else {
        alert(json.error ?? 'Không thể xóa tài liệu')
      }
    } catch {
      alert('Lỗi kết nối khi xóa tài liệu')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setUploadError('Vui lòng chọn file')
      return
    }
    if (!uploadForm.title.trim()) {
      setUploadError('Vui lòng nhập tên tài liệu')
      return
    }

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityType', entityType)
    formData.append('entityId', entityId)
    formData.append('docCategory', uploadForm.docCategory)
    formData.append('title', uploadForm.title.trim())
    if (uploadForm.description.trim()) formData.append('description', uploadForm.description.trim())
    formData.append('sensitivity', uploadForm.sensitivity)

    try {
      const res = await fetch('/api/science/attachments', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        setItems(prev => [...prev, json.data])
        setShowUploadForm(false)
        setUploadForm(f => ({ ...f, title: '', description: '' }))
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setUploadError(typeof json.error === 'string' ? json.error : 'Upload thất bại')
      }
    } catch {
      setUploadError('Lỗi kết nối khi upload')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-gray-500">Đang tải tài liệu...</div>
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchAttachments}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length === 0 ? 'Chưa có tài liệu đính kèm' : `${items.length} tài liệu`}
        </p>
        {allowUpload && !showUploadForm && (
          <Button size="sm" onClick={() => setShowUploadForm(true)}>
            + Tải lên
          </Button>
        )}
      </div>

      {/* Upload form */}
      {allowUpload && showUploadForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Loại tài liệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    value={uploadForm.docCategory}
                    onChange={e => setUploadForm(f => ({ ...f, docCategory: e.target.value as AttachmentCategory }))}
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mức độ mật</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    value={uploadForm.sensitivity}
                    onChange={e => setUploadForm(f => ({ ...f, sensitivity: e.target.value as typeof uploadForm.sensitivity }))}
                  >
                    <option value="NORMAL">Thường</option>
                    <option value="CONFIDENTIAL">Mật</option>
                    <option value="SECRET">Tối Mật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tên tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  placeholder="Nhập tên tài liệu..."
                  value={uploadForm.title}
                  onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  placeholder="Mô tả ngắn..."
                  value={uploadForm.description}
                  onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chọn file <span className="text-red-500">*</span>
                  <span className="ml-1 text-gray-400">(PDF, Word, Excel, PowerPoint, ảnh — tối đa 100MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  className="w-full text-sm"
                />
              </div>

              {uploadError && (
                <p className="text-sm text-red-500">{uploadError}</p>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowUploadForm(false); setUploadError(null) }}
                  disabled={uploading}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={uploading}>
                  {uploading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* File list */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          Chưa có tài liệu nào
          {allowUpload && (
            <p className="mt-1 text-xs">Nhấn "+ Tải lên" để thêm tài liệu đính kèm</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const badge = getSensitivityBadge(item.sensitivity)
            const isOwner = !!currentUserId && currentUserId === item.uploadedBy.id
            const canDelete = allowDelete && isOwner
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{getMimeIcon(item.mimeType)}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-600">{CATEGORY_LABELS[item.docCategory]}</span>
                    <span className="mx-1">•</span>
                    {formatBytes(item.fileSize)}
                    <span className="mx-1">•</span>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    <span className="mx-1">•</span>
                    {item.uploadedBy.name}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                    {badge.label}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={downloadingId === item.id}
                    onClick={() => handleDownload(item)}
                    className="h-7 text-xs"
                  >
                    {downloadingId === item.id ? 'Đang tải...' : 'Tải về'}
                  </Button>

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                      className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === item.id ? '...' : 'Xóa'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
