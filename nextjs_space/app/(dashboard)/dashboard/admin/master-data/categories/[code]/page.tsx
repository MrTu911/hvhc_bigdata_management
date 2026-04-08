'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, RefreshCw, Pencil, ToggleLeft, Upload, GitBranch, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ImportWizard } from '@/components/master-data/admin/import-wizard'
import { ChangeLogDrawer } from '@/components/master-data/admin/change-log-drawer'

type Item = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  shortName: string | null
  parentCode: string | null
  externalCode: string | null
  sortOrder: number
  isActive: boolean
  metadata: unknown
}

type FormData = {
  code: string
  nameVi: string
  nameEn: string
  shortName: string
  parentCode: string
  externalCode: string
  sortOrder: string
  metadata: string
}

const EMPTY_FORM: FormData = {
  code: '', nameVi: '', nameEn: '', shortName: '',
  parentCode: '', externalCode: '', sortOrder: '0', metadata: '',
}

export default function CategoryDetailPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Import wizard state
  const [importOpen, setImportOpen] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch(
      `/api/admin/master-data/${code}/items?includeInactive=true`
    )
    setItems(await res.json())
    setLoading(false)
  }, [code])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const openCreate = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: Item) => {
    setEditingItem(item)
    setForm({
      code: item.code,
      nameVi: item.nameVi,
      nameEn: item.nameEn ?? '',
      shortName: item.shortName ?? '',
      parentCode: item.parentCode ?? '',
      externalCode: item.externalCode ?? '',
      sortOrder: String(item.sortOrder),
      metadata: item.metadata ? JSON.stringify(item.metadata, null, 2) : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.nameVi) {
      toast.error('Vui lòng nhập mã và tên danh mục')
      return
    }

    let parsedMetadata: unknown = null
    if (form.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(form.metadata)
      } catch {
        toast.error('Metadata phải là JSON hợp lệ')
        return
      }
    }

    setSaving(true)
    try {
      const url = editingItem
        ? `/api/admin/master-data/${code}/items/${editingItem.code}`
        : `/api/admin/master-data/${code}/items`
      const method = editingItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sortOrder: parseInt(form.sortOrder) || 0,
          parentCode: form.parentCode || null,
          nameEn: form.nameEn || null,
          shortName: form.shortName || null,
          externalCode: form.externalCode || null,
          metadata: parsedMetadata,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Lỗi lưu dữ liệu')
        return
      }
      toast.success(editingItem ? 'Đã cập nhật' : 'Đã thêm mới')
      setDialogOpen(false)
      await loadItems()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: Item) => {
    const res = await fetch(
      `/api/admin/master-data/${code}/items/${item.code}/toggle`,
      { method: 'POST' }
    )
    if (res.ok) {
      toast.success(item.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt lại')
      await loadItems()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Lỗi thay đổi trạng thái')
    }
  }

  const displayed = items.filter(i => {
    const active = showInactive || i.isActive
    const text =
      !search ||
      i.nameVi.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase())
    return active && text
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Danh mục: <span className="font-mono">{code}</span></h1>
          <p className="text-sm text-muted-foreground">Quản lý mục dữ liệu</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/dashboard/admin/master-data/${code}/tree`}>
            <Button variant="outline" size="sm">
              <GitBranch className="h-4 w-4 mr-1" /> Tree View
            </Button>
          </Link>
          <ChangeLogDrawer categoryCode={code} />
        </div>
      </div>

      <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Danh sách mục</CardTitle>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={e => setShowInactive(e.target.checked)}
                  />
                  Hiện vô hiệu
                </label>
                <div className="relative">
                  <Input
                    placeholder="Tìm kiếm..."
                    className="w-44"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={loadItems}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <a
                  href={`/api/admin/master-data/${code}/export?format=csv&includeInactive=true`}
                  download={`${code}.csv`}
                >
                  <Button variant="outline" size="sm" type="button">
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                </a>
                <a
                  href={`/api/admin/master-data/${code}/export?format=json&includeInactive=true`}
                  download={`${code}.json`}
                >
                  <Button variant="outline" size="sm" type="button">
                    <Download className="h-4 w-4 mr-1" /> JSON
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" /> Import
                </Button>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm mục
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên (VI)</TableHead>
                  <TableHead>Tên (EN)</TableHead>
                  <TableHead>Tên ngắn</TableHead>
                  <TableHead>Mã cha</TableHead>
                  <TableHead>Mã ngoài</TableHead>
                  <TableHead className="text-right">Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Đang tải...</TableCell></TableRow>
                ) : displayed.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                ) : (
                  displayed.map(item => (
                    <TableRow key={item.code} className={!item.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-xs">{item.code}</TableCell>
                      <TableCell>{item.nameVi}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.nameEn ?? '—'}</TableCell>
                      <TableCell className="text-sm">{item.shortName ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.parentCode ?? '—'}</TableCell>
                      <TableCell className="text-xs">{item.externalCode ?? '—'}</TableCell>
                      <TableCell className="text-right">{item.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Sửa">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggle(item)}
                            title={item.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          >
                            <ToggleLeft className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <ImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        categoryCode={code}
        onSuccess={loadItems}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Chỉnh sửa mục' : 'Thêm mục mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Mã <span className="text-destructive">*</span></Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                disabled={!!editingItem}
                placeholder="VD: RANK_01"
              />
            </div>
            <div className="space-y-1">
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Tên (Tiếng Việt) <span className="text-destructive">*</span></Label>
              <Input
                value={form.nameVi}
                onChange={e => setForm(f => ({ ...f, nameVi: e.target.value }))}
                placeholder="Tên đầy đủ tiếng Việt"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Tên (Tiếng Anh)</Label>
              <Input
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="English name (optional)"
              />
            </div>
            <div className="space-y-1">
              <Label>Tên ngắn</Label>
              <Input
                value={form.shortName}
                onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                placeholder="Viết tắt"
              />
            </div>
            <div className="space-y-1">
              <Label>Mã cha</Label>
              <Input
                value={form.parentCode}
                onChange={e => setForm(f => ({ ...f, parentCode: e.target.value }))}
                placeholder="parentCode (nếu có)"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Mã ngoài (BQP/ISO)</Label>
              <Input
                value={form.externalCode}
                onChange={e => setForm(f => ({ ...f, externalCode: e.target.value }))}
                placeholder="externalCode"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="flex items-center justify-between">
                <span>Metadata (JSON)</span>
                {form.metadata.trim() && (() => {
                  try { JSON.parse(form.metadata); return <span className="text-xs text-green-600">✓ JSON hợp lệ</span> }
                  catch { return <span className="text-xs text-destructive">✗ JSON không hợp lệ</span> }
                })()}
              </Label>
              <textarea
                value={form.metadata}
                onChange={e => setForm(f => ({ ...f, metadata: e.target.value }))}
                placeholder={'{\n  "key": "value"\n}'}
                rows={4}
                className="w-full font-mono text-xs border rounded-md p-2 resize-y bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
