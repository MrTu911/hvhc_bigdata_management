'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  BookMarked, CalendarDays, CheckCircle, ChevronRight,
  ClipboardList, Layers, Loader2, Plus,
} from 'lucide-react';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  ACTIVE: 'Đang áp dụng',
  ARCHIVED: 'Lưu trữ',
  EXPIRED: 'Hết hạn',
};

const PLAN_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  PENDING_APPROVAL: 'secondary',
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
  EXPIRED: 'destructive',
};

// ─── Create Plan Dialog ───────────────────────────────────────────────────────

function CreatePlanDialog({
  programs,
  academicYears,
  open,
  onClose,
  onCreated,
}: {
  programs: any[];
  academicYears: any[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [programVersions, setProgramVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    programId: '',
    programVersionId: '',
    academicYearId: '',
    cohort: '',
    totalCredits: '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const reset = () => {
    setForm({ code: '', name: '', programId: '', programVersionId: '', academicYearId: '', cohort: '', totalCredits: '', notes: '' });
    setSelectedProgramId('');
    setProgramVersions([]);
  };

  const handleProgramChange = async (programId: string) => {
    setSelectedProgramId(programId);
    set('programId', programId);
    set('programVersionId', '');
    if (!programId || programId === '__none__') {
      setProgramVersions([]);
      return;
    }
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/education/programs/${programId}/versions?status=PUBLISHED`);
      const json = await res.json();
      if (res.ok && json.success) {
        setProgramVersions(json.data?.versions || []);
      }
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.programId || form.programId === '__none__') {
      toast.error('Mã, tên và chương trình đào tạo là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/education/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          programId: form.programId,
          programVersionId: (form.programVersionId && form.programVersionId !== '__none__') ? form.programVersionId : undefined,
          academicYearId: (form.academicYearId && form.academicYearId !== '__none__') ? form.academicYearId : undefined,
          cohort: form.cohort.trim() || undefined,
          totalCredits: form.totalCredits ? parseInt(form.totalCredits) : undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo kế hoạch');
      toast.success(`Đã tạo kế hoạch "${form.name}"`);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Tạo kế hoạch đào tạo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mã kế hoạch <span className="text-destructive">*</span></Label>
              <Input
                placeholder="VD: KH-2025-HK1"
                value={form.code}
                onChange={e => set('code', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Khóa học</Label>
              <Input
                placeholder="VD: K45, K46"
                value={form.cohort}
                onChange={e => set('cohort', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tên kế hoạch <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VD: Kế hoạch đào tạo HK1 2025-2026 – Hậu cần"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Chương trình đào tạo <span className="text-destructive">*</span></Label>
            <Select
              value={selectedProgramId || '__none__'}
              onValueChange={v => handleProgramChange(v === '__none__' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Chọn CTĐT" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Chọn chương trình —</SelectItem>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Phiên bản CTĐT</Label>
            <Select
              value={form.programVersionId || '__none__'}
              onValueChange={v => set('programVersionId', v === '__none__' ? '' : v)}
              disabled={!selectedProgramId || loadingVersions}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVersions ? 'Đang tải...' : 'Chọn phiên bản'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Không gắn phiên bản —</SelectItem>
                {programVersions.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.versionCode} (từ {v.effectiveFromCohort})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProgramId && programVersions.length === 0 && !loadingVersions && (
              <p className="text-xs text-amber-600">
                Chương trình này chưa có phiên bản PUBLISHED. Hãy phát hành phiên bản trước.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Năm học</Label>
              <Select
                value={form.academicYearId || '__none__'}
                onValueChange={v => set('academicYearId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Chọn năm học" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không chọn —</SelectItem>
                  {academicYears.map((y: any) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Textarea
              rows={2}
              placeholder="Mô tả kế hoạch, phạm vi áp dụng..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo kế hoạch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SemesterPlanBoard ────────────────────────────────────────────────────────

export function SemesterPlanBoard({
  plans,
  programs,
  academicYears,
  loading,
  onRefresh,
}: {
  plans: any[];
  programs: any[];
  academicYears: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (planId: string, planName: string) => {
    if (!confirm(`Duyệt kế hoạch "${planName}"?`)) return;
    setApprovingId(planId);
    try {
      const res = await fetch('/api/education/curriculum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, action: 'approve' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi phê duyệt');
      toast.success(`Đã phê duyệt kế hoạch "${planName}"`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Kế hoạch đào tạo
            <span className="text-sm font-normal text-muted-foreground">({plans.length} kế hoạch)</span>
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tạo kế hoạch mới
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Đang tải...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có kế hoạch đào tạo</p>
              <p className="text-sm mt-1">Tạo kế hoạch đào tạo đầu tiên cho học kỳ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã kế hoạch</TableHead>
                  <TableHead>Tên kế hoạch</TableHead>
                  <TableHead>Chương trình</TableHead>
                  <TableHead>Phiên bản CTĐT</TableHead>
                  <TableHead>Năm học</TableHead>
                  <TableHead>Khóa</TableHead>
                  <TableHead className="text-center">Số học phần</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold">{plan.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium max-w-[220px] truncate">{plan.name}</div>
                      {plan.cohort && (
                        <div className="text-xs text-muted-foreground">Khóa {plan.cohort}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mr-1">
                          {plan.program?.code}
                        </span>
                        <span className="text-muted-foreground">{plan.program?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.programVersion ? (
                        <div className="text-sm">
                          <span className="font-mono">{plan.programVersion.versionCode}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            (từ {plan.programVersion.effectiveFromCohort})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 italic">Chưa gắn version</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan.academicYear?.name || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan.cohort || '—'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{plan._count?.courses ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={PLAN_STATUS_VARIANTS[plan.status] || 'outline'}>
                        {PLAN_STATUS_LABELS[plan.status] || plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {plan.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => handleApprove(plan.id, plan.name)}
                            disabled={approvingId === plan.id}
                          >
                            {approvingId === plan.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <CheckCircle className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Link href={`/dashboard/education/curriculum?curriculumPlanId=${plan.id}`}>
                          <Button variant="ghost" size="sm" title="Xem học phần">
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Học phần
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreatePlanDialog
        programs={programs}
        academicYears={academicYears}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onRefresh}
      />
    </>
  );
}
