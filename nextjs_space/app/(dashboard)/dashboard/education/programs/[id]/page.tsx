/**
 * M10 – UC-52: Chi tiết chương trình đào tạo + quản lý phiên bản
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, CheckCircle, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProgramVersionList } from '@/components/education/program/program-version-list';
import {
  PROGRAM_TYPE_LABELS,
  CURRICULUM_STATUS_LABELS,
} from '@/components/education/program/program-table';

// ─── Edit Program Dialog ──────────────────────────────────────────────────────

function EditProgramDialog({
  program,
  open,
  onClose,
  onSaved,
}: {
  program: any;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    programType: 'UNDERGRADUATE',
    degreeLevel: '',
    totalCredits: '',
    durationYears: '',
    description: '',
    objectives: '',
    learningOutcomes: '',
  });

  useEffect(() => {
    if (program) {
      setForm({
        name: program.name || '',
        nameEn: program.nameEn || '',
        programType: program.programType || 'UNDERGRADUATE',
        degreeLevel: program.degreeLevel || '',
        totalCredits: String(program.totalCredits || ''),
        durationYears: String(program.durationYears || ''),
        description: program.description || '',
        objectives: program.objectives || '',
        learningOutcomes: program.learningOutcomes || '',
      });
    }
  }, [program]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Tên chương trình là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/education/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: program.id,
          name: form.name.trim(),
          nameEn: form.nameEn.trim() || undefined,
          programType: form.programType,
          degreeLevel: form.degreeLevel.trim() || undefined,
          totalCredits: form.totalCredits ? parseInt(form.totalCredits) : undefined,
          durationYears: form.durationYears ? parseInt(form.durationYears) : undefined,
          description: form.description.trim() || undefined,
          objectives: form.objectives.trim() || undefined,
          learningOutcomes: form.learningOutcomes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi cập nhật');
      toast.success('Đã cập nhật chương trình đào tạo');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Chỉnh sửa chương trình đào tạo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Tên chương trình <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Tên tiếng Anh</Label>
              <Input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Loại hình</Label>
              <Select value={form.programType} onValueChange={v => set('programType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Trình độ</Label>
              <Input value={form.degreeLevel} onChange={e => set('degreeLevel', e.target.value)} placeholder="VD: Đại học" />
            </div>
            <div className="space-y-1">
              <Label>Tổng tín chỉ</Label>
              <Input type="number" min={0} value={form.totalCredits} onChange={e => set('totalCredits', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Số năm đào tạo</Label>
              <Input type="number" min={1} max={10} value={form.durationYears} onChange={e => set('durationYears', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Mục tiêu đào tạo</Label>
            <Textarea rows={3} value={form.objectives} onChange={e => set('objectives', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Chuẩn đầu ra</Label>
            <Textarea rows={3} value={form.learningOutcomes} onChange={e => set('learningOutcomes', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── InfoRow helper ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground min-w-[160px]">{label}:</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Program detail: versions API returns {success, data: {program, versions}}
      const [progRes, verRes] = await Promise.all([
        fetch(`/api/education/programs?search=`),
        fetch(`/api/education/programs/${id}/versions`),
      ]);

      if (verRes.ok) {
        const verJson = await verRes.json();
        if (verJson.success && verJson.data) {
          setProgram(verJson.data.program);
          setVersions(verJson.data.versions || []);
        }
      }
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!confirm('Phê duyệt chương trình đào tạo này?')) return;
    setApproving(true);
    try {
      const res = await fetch('/api/education/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi phê duyệt');
      toast.success('Đã phê duyệt chương trình đào tạo');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p>Không tìm thấy chương trình đào tạo.</p>
        <Link href="/dashboard/education/programs">
          <Button variant="outline" className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/education/programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {program.name}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{program.code}</p>
        </div>
        <div className="flex items-center gap-2">
          {program.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 border-green-200 hover:bg-green-50"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <CheckCircle className="h-4 w-4 mr-1" />}
              Phê duyệt
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* Program Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Thông tin chương trình</span>
            <Badge variant={
              program.status === 'ACTIVE' ? 'default' :
              program.status === 'DRAFT' ? 'outline' :
              program.status === 'ARCHIVED' ? 'secondary' : 'secondary'
            }>
              {CURRICULUM_STATUS_LABELS[program.status] || program.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            <InfoRow label="Mã CTĐT" value={<span className="font-mono">{program.code}</span>} />
            <InfoRow label="Loại hình" value={PROGRAM_TYPE_LABELS[program.programType] || program.programType} />
            <InfoRow label="Tên tiếng Anh" value={program.nameEn} />
            <InfoRow label="Trình độ đào tạo" value={program.degreeLevel} />
            <InfoRow label="Tổng tín chỉ" value={program.totalCredits ? `${program.totalCredits} TC` : null} />
            <InfoRow label="Thời gian đào tạo" value={program.durationYears ? `${program.durationYears} năm` : null} />
            <InfoRow label="Khoa / Đơn vị" value={program.unit?.name} />
            <InfoRow label="Ngày hiệu lực" value={program.effectiveDate ? new Date(program.effectiveDate).toLocaleDateString('vi-VN') : null} />
          </div>

          {(program.description || program.objectives || program.learningOutcomes) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3 text-sm">
                {program.description && (
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Mô tả</p>
                    <p className="text-foreground leading-relaxed">{program.description}</p>
                  </div>
                )}
                {program.objectives && (
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Mục tiêu đào tạo</p>
                    <p className="text-foreground leading-relaxed">{program.objectives}</p>
                  </div>
                )}
                {program.learningOutcomes && (
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Chuẩn đầu ra</p>
                    <p className="text-foreground leading-relaxed">{program.learningOutcomes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Version List */}
      <ProgramVersionList
        programId={id}
        versions={versions}
        onRefresh={fetchData}
      />

      <EditProgramDialog
        program={program}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
