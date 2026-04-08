'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Star } from 'lucide-react';

// ─── ConductDialog ────────────────────────────────────────────────────────────

function ConductDialog({
  studentId,
  open,
  onClose,
  onSaved,
}: {
  studentId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    academicYear: '',
    semesterCode: '',
    conductScore: '',
    conductGrade: '',
    rewardSummary: '',
    disciplineSummary: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.academicYear || !form.semesterCode || !form.conductScore) {
      toast.error('Năm học, học kỳ và điểm rèn luyện là bắt buộc');
      return;
    }
    const score = parseFloat(form.conductScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Điểm rèn luyện phải từ 0 đến 100');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/education/students/${studentId}/conduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: form.academicYear,
          semesterCode: form.semesterCode,
          conductScore: score,
          conductGrade: form.conductGrade || null,
          rewardSummary: form.rewardSummary || null,
          disciplineSummary: form.disciplineSummary || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi lưu dữ liệu');
      toast.success('Đã lưu điểm rèn luyện');
      setForm({ academicYear: '', semesterCode: '', conductScore: '', conductGrade: '', rewardSummary: '', disciplineSummary: '' });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm điểm rèn luyện</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Năm học <span className="text-destructive">*</span></Label>
              <Input placeholder="2024-2025" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Học kỳ <span className="text-destructive">*</span></Label>
              <Select value={form.semesterCode || '__none__'} onValueChange={v => set('semesterCode', v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Chọn HK" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chọn —</SelectItem>
                  <SelectItem value="HK1">Học kỳ 1</SelectItem>
                  <SelectItem value="HK2">Học kỳ 2</SelectItem>
                  <SelectItem value="HK3">Học kỳ hè</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Điểm rèn luyện (0–100) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0} max={100} value={form.conductScore} onChange={e => set('conductScore', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Xếp loại</Label>
              <Select value={form.conductGrade || '__none__'} onValueChange={v => set('conductGrade', v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tự động" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tự động —</SelectItem>
                  <SelectItem value="Xuất sắc">Xuất sắc</SelectItem>
                  <SelectItem value="Tốt">Tốt</SelectItem>
                  <SelectItem value="Khá">Khá</SelectItem>
                  <SelectItem value="Trung bình">Trung bình</SelectItem>
                  <SelectItem value="Yếu">Yếu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tóm tắt khen thưởng</Label>
            <Textarea rows={2} value={form.rewardSummary} onChange={e => set('rewardSummary', e.target.value)} placeholder="Ghi tóm tắt khen thưởng trong kỳ..." />
          </div>
          <div className="space-y-1">
            <Label>Tóm tắt kỷ luật</Label>
            <Textarea rows={2} value={form.disciplineSummary} onChange={e => set('disciplineSummary', e.target.value)} placeholder="Ghi tóm tắt vi phạm / kỷ luật..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ConductRecordTable ───────────────────────────────────────────────────────

export function ConductRecordTable({
  studentId,
  records,
  loading,
  onRefresh,
}: {
  studentId: string;
  records: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />Điểm rèn luyện
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Thêm bản ghi
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Chưa có bản ghi rèn luyện.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Năm học</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Xếp loại</TableHead>
                <TableHead>Khen thưởng</TableHead>
                <TableHead>Kỷ luật</TableHead>
                <TableHead>Người duyệt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.academicYear}</TableCell>
                  <TableCell>{r.semesterCode}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${r.conductScore >= 80 ? 'text-green-600' : r.conductScore >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {r.conductScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.conductGrade || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.rewardSummary || '—'}</TableCell>
                  <TableCell className="text-sm">{r.disciplineSummary || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.approvedBy || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ConductDialog
        studentId={studentId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={onRefresh}
      />
    </Card>
  );
}
