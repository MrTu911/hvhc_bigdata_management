'use client'

/**
 * Tree Editor – M19 MDM Admin
 * /dashboard/admin/master-data/[categoryCode]/tree
 *
 * Hiển thị items dạng cây phân cấp với:
 * - expand / collapse
 * - search trong cây
 * - inline edit tên
 * - toggle active
 * - sort bằng Up/Down (scaffold cho drag-drop sau này)
 */

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GitBranch, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TreeView, type TreeItem } from '@/components/master-data/admin/tree-view'
import { ChangeLogDrawer } from '@/components/master-data/admin/change-log-drawer'

export default function TreePage() {
  const params = useParams()
  const categoryCode = params.categoryCode as string
  const router = useRouter()

  const [items, setItems] = useState<TreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/items?includeInactive=true`
      )
      if (!res.ok) throw new Error('Lỗi tải dữ liệu')
      setItems(await res.json())
    } catch {
      toast.error('Không thể tải danh sách mục')
    } finally {
      setLoading(false)
    }
  }, [categoryCode])

  useEffect(() => { load() }, [load])

  // ── Inline edit ────────────────────────────────────────────────────────────
  const handleEdit = useCallback(async (code: string, nameVi: string) => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/items/${encodeURIComponent(code)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nameVi }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Lỗi cập nhật')
        await load() // revert optimistic update
      } else {
        toast.success('Đã cập nhật tên')
      }
    } finally {
      setSaving(false)
    }
  }, [categoryCode, load])

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (code: string) => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/items/${encodeURIComponent(code)}/toggle`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Lỗi thay đổi trạng thái')
        await load()
      } else {
        toast.success('Đã thay đổi trạng thái')
      }
    } finally {
      setSaving(false)
    }
  }, [categoryCode, load])

  // ── Reorder ────────────────────────────────────────────────────────────────
  // Receives flat DFS-ordered code array from TreeView (Up/Down buttons or future drag-drop)
  const handleReorder = useCallback(async (flatCodes: string[]) => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/master-data/${encodeURIComponent(categoryCode)}/sort`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: flatCodes }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Lỗi lưu thứ tự')
        await load()
      }
      // No success toast for sort — too frequent during Up/Down clicks
    } finally {
      setSaving(false)
    }
  }, [categoryCode, load])

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">
                Cây phân cấp –{' '}
                <span className="font-mono text-primary">{categoryCode}</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Inline edit · Sort Up/Down · Toggle active
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/admin/master-data/categories/${categoryCode}`}>
            <Button variant="outline" size="sm">Quản lý mục (Grid)</Button>
          </Link>
          <ChangeLogDrawer categoryCode={categoryCode} />
          <a
            href={`/api/admin/master-data/${encodeURIComponent(categoryCode)}/export?format=csv&includeInactive=true`}
            download={`${categoryCode}.csv`}
          >
            <Button variant="outline" size="sm" type="button">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tree card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {items.length} mục · Kéo lên/xuống để sắp xếp thứ tự trong cùng cấp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
          ) : (
            <TreeView
              items={items}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onReorder={handleReorder}
              saving={saving}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
