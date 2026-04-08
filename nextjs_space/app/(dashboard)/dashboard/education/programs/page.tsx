/**
 * M10 – UC-52: Danh sách chương trình đào tạo
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, Search } from 'lucide-react';
import {
  ProgramTable,
  PROGRAM_TYPE_LABELS,
  CURRICULUM_STATUS_LABELS,
} from '@/components/education/program/program-table';

// ─── Create Program Dialog ────────────────────────────────────────────────────

function CreateProgramDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', name: '', nameEn: '',
    programType: 'UNDERGRADUATE', degreeLevel: '',
    totalCredits: '120', durationYears: '4', description: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const reset = () => setForm({
    code: '', name: '', nameEn: '', programType: 'UNDERGRADUATE',
    degreeLevel: '', totalCredits: '120', durationYears: '4', description: '',
  });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Mã CTĐT và tên là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/education/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          nameEn: form.nameEn.trim() || undefined,
          programType: form.programType,
          degreeLevel: form.degreeLevel.trim() || undefined,
          totalCredits: form.totalCredits ? parseInt(form.totalCredits) : 120,
          durationYears: form.durationYears ? parseInt(form.durationYears) : 4,
          description: form.description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo chương trình');
      toast.success(`Đã tạo chương trình "${form.name}"`);
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
            <BookOpen className="h-5 w-5" />
            Tạo chương trình đào tạo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mã CTĐT <span className="text-destructive">*</span></Label>
              <Input
                placeholder="VD: CTDT-HQ-01"
                value={form.code}
                onChange={e => set('code', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Loại hình <span className="text-destructive">*</span></Label>
              <Select value={form.programType} onValueChange={v => set('programType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tên chương trình <span className="text-destructive">*</span></Label>
            <Input
              placeholder="VD: Đại học chính quy ngành Hậu cần chiến đấu"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Tên tiếng Anh</Label>
            <Input
              placeholder="VD: Bachelor of Logistics"
              value={form.nameEn}
              onChange={e => set('nameEn', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Trình độ</Label>
              <Input placeholder="VD: Đại học" value={form.degreeLevel} onChange={e => set('degreeLevel', e.target.value)} />
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
            <Textarea
              rows={3}
              placeholder="Mục tiêu, đặc điểm chương trình..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo chương trình
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType && filterType !== 'ALL') params.set('programType', filterType);
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);

      const res = await fetch(`/api/education/programs?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setPrograms(Array.isArray(json) ? json : json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrograms();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Chương trình Đào tạo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            UC-52 – Quản lý CTĐT & phiên bản khung học phần
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{programs.length} chương trình</span>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tạo CTĐT mới
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <Input
                placeholder="Tìm mã hoặc tên chương trình..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterType} onValueChange={v => setFilterType(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại hình</SelectItem>
                {Object.entries(PROGRAM_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={v => setFilterStatus(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(CURRICULUM_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      <ProgramTable programs={programs} loading={loading} />

      <CreateProgramDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchPrograms}
      />
    </div>
  );
}
