'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Plus, Pencil, Trash2, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { FamilyRelationType } from '@prisma/client'
import { FamilyMemberForm } from './family-member-form'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyMember {
  id: string
  personnelId: string | null
  relation: FamilyRelationType
  fullName: string
  dateOfBirth: string | null
  citizenId?: string | null  // only present when includeSensitive = true
  phoneNumber?: string | null
  address?: string | null
  occupation: string | null
  workplace: string | null
  isDeceased: boolean
  deceasedDate: string | null
  dependentFlag: boolean
  notes: string | null
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const RELATION_LABELS: Record<FamilyRelationType, string> = {
  FATHER:        'Cha',
  MOTHER:        'Mẹ',
  SPOUSE:        'Vợ / Chồng',
  CHILD:         'Con',
  SIBLING:       'Anh / Chị / Em',
  FATHER_IN_LAW: 'Bố vợ / Bố chồng',
  MOTHER_IN_LAW: 'Mẹ vợ / Mẹ chồng',
  OTHER:         'Khác',
}

const RELATION_VARIANT: Record<FamilyRelationType, 'default' | 'secondary' | 'outline'> = {
  FATHER:        'outline',
  MOTHER:        'outline',
  SPOUSE:        'default',
  CHILD:         'secondary',
  SIBLING:       'outline',
  FATHER_IN_LAW: 'outline',
  MOTHER_IN_LAW: 'outline',
  OTHER:         'outline',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Sensitive cell ───────────────────────────────────────────────────────────

function SensitiveCell({ value, includeSensitive }: { value?: string | null; includeSensitive: boolean }) {
  if (!includeSensitive) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
        <Lock className="w-3 h-3" />
        Ẩn
      </span>
    )
  }
  return <span>{value ?? '—'}</span>
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FamilyMemberTableProps {
  members: FamilyMember[]
  personnelId: string
  canEdit?: boolean
  includeSensitive?: boolean
  onRefresh?: () => void
}

export function FamilyMemberTable({
  members,
  personnelId,
  canEdit = false,
  includeSensitive = false,
  onRefresh,
}: FamilyMemberTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  function openAdd() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(m: FamilyMember) {
    setEditing(m)
    setFormOpen(true)
  }

  async function handleDelete(m: FamilyMember) {
    if (!confirm(`Xóa "${m.fullName}" (${RELATION_LABELS[m.relation]})?`)) return
    setDeleting(m.id)
    try {
      const res = await fetch(`/api/personnel/family/${m.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(typeof json.error === 'string' ? json.error : 'Không thể xóa')
        return
      }
      toast.success('Đã xóa thành viên')
      onRefresh?.()
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-3 h-3 mr-1" />
            Thêm thành viên
          </Button>
        </div>
      )}

      {members.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quan hệ</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead>Nghề nghiệp</TableHead>
                <TableHead>CCCD</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Phụ thuộc</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} className={m.isDeceased ? 'opacity-50' : ''}>
                  <TableCell>
                    <Badge variant={RELATION_VARIANT[m.relation]}>
                      {RELATION_LABELS[m.relation]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{m.fullName}</span>
                    {m.isDeceased && (
                      <span className="ml-2 text-xs text-muted-foreground">(đã mất)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(m.dateOfBirth)}</TableCell>
                  <TableCell className="text-sm">
                    <div>{m.occupation ?? '—'}</div>
                    {m.workplace && (
                      <div className="text-xs text-muted-foreground">{m.workplace}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <SensitiveCell value={m.citizenId} includeSensitive={includeSensitive} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <SensitiveCell value={m.phoneNumber} includeSensitive={includeSensitive} />
                  </TableCell>
                  <TableCell>
                    {m.dependentFlag && (
                      <Badge variant="secondary" className="text-xs">Phụ thuộc</Badge>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={deleting === m.id}
                          onClick={() => handleDelete(m)}
                        >
                          {deleting === m.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <Users className="w-8 h-8 opacity-30" />
          <p className="text-sm">Chưa có thành viên gia đình</p>
        </div>
      )}

      <FamilyMemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        personnelId={personnelId}
        initialData={editing}
        includeSensitive={includeSensitive}
        onSuccess={() => { setFormOpen(false); onRefresh?.() }}
      />
    </div>
  )
}
