'use client';

/**
 * Thẻ một "nhóm" hồ sơ cán bộ điện tử dạng danh sách: bảng + dialog thêm/sửa + xóa mềm.
 * Cấu hình cột/field lấy từ registry (cadre-profile-sections). CRUD qua
 * /api/personnel/[id]/profile/[slug].
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CadreFieldInput } from './cadre-field-input';
import { EvidenceButton } from '../evidence/evidence-button';
import type { CadreField, CadreListSection } from '@/lib/constants/cadre-profile-sections';

type Row = Record<string, unknown> & { id: string };

function formatCell(field: CadreField | undefined, value: unknown): string {
  if (value == null || value === '') return '—';
  if (!field) return String(value);
  if (field.type === 'date') {
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
  }
  if (field.type === 'boolean') return value ? '✓' : '—';
  if (field.type === 'select') return field.options?.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}

interface CadreSectionCardProps {
  personnelId: string;
  section: CadreListSection;
  canEdit: boolean;
  /** Override API base — e.g. /api/profile/cadre-sections for self-service */
  apiBase?: string;
  /** Bật cột minh chứng (chỉ ngữ cảnh tự phục vụ — minh chứng là SELF-only). */
  evidenceEnabled?: boolean;
  /** Cho upload/xóa minh chứng (tách khỏi khóa khai báo). */
  evidenceCanEdit?: boolean;
}

export function CadreSectionCard({
  personnelId,
  section,
  canEdit,
  apiBase,
  evidenceEnabled = false,
  evidenceCanEdit = false,
}: CadreSectionCardProps) {
  const base = apiBase
    ? `${apiBase}/${section.slug}`
    : `/api/personnel/${personnelId}/profile/${section.slug}`;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({});

  const fieldByName = (name: string) => section.fields.find((f) => f.name === name);

  const loadEvidenceCounts = useCallback(async (ids: string[]) => {
    if (!evidenceEnabled || ids.length === 0) {
      setEvidenceCounts({});
      return;
    }
    try {
      const q = new URLSearchParams({ targetType: 'CADRE_SECTION', ids: ids.join(',') });
      const res = await fetch(`/api/profile/evidence/counts?${q.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) setEvidenceCounts(json.data ?? {});
    } catch {
      /* badge minh chứng không quan trọng tới mức chặn UI */
    }
  }, [evidenceEnabled]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải dữ liệu');
      const data: Row[] = json.data ?? [];
      setRows(data);
      loadEvidenceCounts(data.map((r) => r.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [base, loadEvidenceCounts]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({});
    setOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  }
  function setField(name: string, value: unknown) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of section.fields) payload[f.name] = form[f.name] ?? null;
      const url = editing ? `${base}/${editing.id}` : base;
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi lưu');
      toast.success(editing ? 'Đã cập nhật' : 'Đã thêm');
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm('Xóa bản ghi này?')) return;
    try {
      const res = await fetch(`${base}/${row.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi xóa');
      toast.success('Đã xóa');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi xóa');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{section.title}</CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Thêm
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-4 text-sm text-gray-400">Chưa có dữ liệu</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {section.listColumns.map((c) => (
                  <TableHead key={c}>{fieldByName(c)?.label ?? c}</TableHead>
                ))}
                {evidenceEnabled && <TableHead className="w-24 text-center">Minh chứng</TableHead>}
                {canEdit && <TableHead className="w-20 text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {section.listColumns.map((c) => (
                    <TableCell key={c}>{formatCell(fieldByName(c), row[c])}</TableCell>
                  ))}
                  {evidenceEnabled && (
                    <TableCell className="text-center">
                      <EvidenceButton
                        targetType="CADRE_SECTION"
                        targetId={row.id}
                        sectionSlug={section.slug}
                        canEdit={evidenceCanEdit}
                        count={evidenceCounts[row.id]}
                        title={section.title}
                        className="mx-auto"
                      />
                    </TableCell>
                  )}
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => remove(row)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Sửa' : 'Thêm'} — {section.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {section.fields.map((f) => (
              <CadreFieldInput key={f.name} field={f} value={form[f.name]} onChange={setField} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
