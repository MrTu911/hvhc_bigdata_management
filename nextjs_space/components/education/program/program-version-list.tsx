'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { GitBranch, Loader2, Plus } from 'lucide-react';

const VERSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã phát hành',
  ARCHIVED: 'Lưu trữ',
};

const VERSION_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  PUBLISHED: 'default',
  ARCHIVED: 'secondary',
};

// ─── Create Version Dialog ─────────────────────────────────────────────────────

function CreateVersionDialog({
  programId,
  open,
  onClose,
  onCreated,
}: {
  programId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    versionCode: '',
    effectiveFromCohort: '',
    totalCredits: '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const reset = () => setForm({ versionCode: '', effectiveFromCohort: '', totalCredits: '', notes: '' });

  const handleSave = async () => {
    if (!form.versionCode.trim() || !form.effectiveFromCohort.trim()) {
      toast.error('Mã phiên bản và khóa áp dụng là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/education/programs/${programId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionCode: form.versionCode.trim(),
          effectiveFromCohort: form.effectiveFromCohort.trim(),
          totalCredits: form.totalCredits ? parseInt(form.totalCredits) : undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo phiên bản');
      toast.success(`Đã tạo phiên bản ${form.versionCode}`);
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Tạo phiên bản CTĐT mới
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Mã phiên bản <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VD: 2023, v2.0, K45-2023"
              value={form.versionCode}
              onChange={e => set('versionCode', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Unique trong cùng chương trình đào tạo</p>
          </div>
          <div className="space-y-1">
            <Label>Áp dụng từ khóa <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VD: K45, K46, 2024"
              value={form.effectiveFromCohort}
              onChange={e => set('effectiveFromCohort', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Tổng tín chỉ</Label>
            <Input
              type="number"
              min={0}
              placeholder="VD: 130"
              value={form.totalCredits}
              onChange={e => set('totalCredits', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Textarea
              rows={3}
              placeholder="Mô tả thay đổi so với phiên bản trước..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Lưu ý:</strong> Phiên bản mới được tạo ở trạng thái <strong>Nháp</strong>.
            Chỉ phiên bản <strong>Đã phát hành</strong> mới có thể gán cho học viên.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo phiên bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProgramVersionList ────────────────────────────────────────────────────────

export function ProgramVersionList({
  programId,
  versions,
  onRefresh,
}: {
  programId: string;
  versions: any[];
  onRefresh: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: 'publish' | 'archive'; code: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  const handleAction = async () => {
    if (!actionTarget) return;
    setActioning(true);
    try {
      const res = await fetch(`/api/education/programs/${programId}/versions/${actionTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionTarget.action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi thao tác');
      toast.success(
        actionTarget.action === 'publish'
          ? `Đã phát hành phiên bản ${actionTarget.code}`
          : `Đã lưu trữ phiên bản ${actionTarget.code}`
      );
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioning(false);
      setActionTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Phiên bản CTĐT
            <span className="text-sm font-normal text-muted-foreground">({versions.length} phiên bản)</span>
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tạo phiên bản mới
          </Button>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có phiên bản nào. Tạo phiên bản đầu tiên để bắt đầu.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiên bản</TableHead>
                  <TableHead>Áp dụng từ khóa</TableHead>
                  <TableHead className="text-center">Tổng TC</TableHead>
                  <TableHead className="text-center">Học viên</TableHead>
                  <TableHead className="text-center">Kế hoạch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <span className="font-mono font-semibold">{v.versionCode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{v.effectiveFromCohort}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {v.totalCredits ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-medium ${v._count?.hocViens > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {v._count?.hocViens ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-muted-foreground">
                        {v._count?.curriculumPlans ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={VERSION_STATUS_VARIANTS[v.status] || 'outline'}>
                        {VERSION_STATUS_LABELS[v.status] || v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {v.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => setActionTarget({ id: v.id, action: 'publish', code: v.versionCode })}
                          >
                            Phát hành
                          </Button>
                        )}
                        {v.status === 'PUBLISHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() => setActionTarget({ id: v.id, action: 'archive', code: v.versionCode })}
                            disabled={v._count?.hocViens > 0}
                          >
                            Lưu trữ
                          </Button>
                        )}
                        {v.status === 'ARCHIVED' && (
                          <span className="text-xs text-muted-foreground pr-2">Đã lưu trữ</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateVersionDialog
        programId={programId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onRefresh}
      />

      <AlertDialog open={!!actionTarget} onOpenChange={open => !open && setActionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.action === 'publish' ? 'Phát hành phiên bản?' : 'Lưu trữ phiên bản?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.action === 'publish'
                ? `Phiên bản "${actionTarget?.code}" sẽ được phát hành và có thể gán cho học viên. Sau khi phát hành, nội dung khung CTĐT không thể sửa.`
                : `Phiên bản "${actionTarget?.code}" sẽ bị lưu trữ. Học viên hiện tại vẫn giữ nguyên, nhưng không thể gán mới.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actioning}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actioning}
              className={actionTarget?.action === 'publish' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionTarget?.action === 'publish' ? 'Xác nhận phát hành' : 'Xác nhận lưu trữ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
