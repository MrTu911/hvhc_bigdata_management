/**
 * M10 – UC-52: Quản lý phiên bản chương trình đào tạo
 * /dashboard/education/programs/[id]/versions
 */

'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus, MoreHorizontal, CheckCircle, Archive, ArrowLeft,
  BookOpen, Users, FileText,
} from 'lucide-react';
import Link from 'next/link';

// ============= CONSTANTS =============

const VERSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công bố',
  ARCHIVED: 'Lưu trữ',
};

const VERSION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-blue-100 text-blue-800',
};

// ============= INTERFACES =============

interface ProgramVersion {
  id: string;
  versionCode: string;
  effectiveFromCohort: string;
  totalCredits: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  _count: { hocViens: number; curriculumPlans: number };
}

interface Program {
  id: string;
  code: string;
  name: string;
}

// ============= COMPONENT =============

export default function ProgramVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: programId } = use(params);

  const [program, setProgram] = useState<Program | null>(null);
  const [versions, setVersions] = useState<ProgramVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    versionCode: '',
    effectiveFromCohort: '',
    totalCredits: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/education/programs/${programId}/versions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProgram(data.data.program);
          setVersions(data.data.versions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [programId]);

  const handleCreate = async () => {
    if (!form.versionCode || !form.effectiveFromCohort) {
      toast.error('Mã phiên bản và khóa áp dụng là bắt buộc');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/education/programs/${programId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionCode: form.versionCode,
          effectiveFromCohort: form.effectiveFromCohort,
          totalCredits: form.totalCredits ? parseInt(form.totalCredits) : undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Tạo phiên bản thành công');
        setCreateOpen(false);
        setForm({ versionCode: '', effectiveFromCohort: '', totalCredits: '', notes: '' });
        fetchVersions();
      } else {
        toast.error(data.error || 'Lỗi tạo phiên bản');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (versionId: string, action: 'publish' | 'archive') => {
    const labels = { publish: 'công bố', archive: 'lưu trữ' };
    if (!confirm(`Xác nhận ${labels[action]} phiên bản này?`)) return;
    try {
      const res = await fetch(`/api/education/programs/${programId}/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Đã ${labels[action]} thành công`);
        fetchVersions();
      } else {
        toast.error(data.error || 'Lỗi thao tác');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/education/programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Phiên bản CTĐT</h1>
          {program && (
            <p className="text-muted-foreground">
              {program.code} – {program.name}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tạo phiên bản mới
        </Button>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="pt-4 text-sm text-blue-700">
          <strong>Quy tắc:</strong> Mỗi thay đổi nội dung CTĐT phải tạo phiên bản mới.
          Version đã <strong>Công bố</strong> không được sửa danh sách môn học —
          hãy tạo version mới cho khóa tiếp theo.
        </CardContent>
      </Card>

      {/* Versions table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Danh sách phiên bản
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Đang tải...
            </div>
          ) : versions.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <span>Chưa có phiên bản nào</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã version</TableHead>
                  <TableHead>Áp dụng từ khóa</TableHead>
                  <TableHead>Tổng tín chỉ</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Khung CTĐT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.versionCode}</TableCell>
                    <TableCell>{v.effectiveFromCohort}</TableCell>
                    <TableCell>{v.totalCredits ?? '—'}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {v._count.hocViens}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {v._count.curriculumPlans}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={VERSION_STATUS_COLORS[v.status] ?? ''}>
                        {VERSION_STATUS_LABELS[v.status] ?? v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(v.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {v.status === 'DRAFT' && (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleAction(v.id, 'publish')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Công bố
                            </DropdownMenuItem>
                          )}
                          {v.status !== 'ARCHIVED' && (
                            <>
                              {v.status === 'DRAFT' && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                className="text-muted-foreground"
                                onClick={() => handleAction(v.id, 'archive')}
                              >
                                <Archive className="h-4 w-4 mr-2" /> Lưu trữ
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create version dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo phiên bản CTĐT mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã phiên bản *</Label>
                <Input
                  value={form.versionCode}
                  onChange={(e) => setForm({ ...form, versionCode: e.target.value })}
                  placeholder="v2.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Áp dụng từ khóa *</Label>
                <Input
                  value={form.effectiveFromCohort}
                  onChange={(e) => setForm({ ...form, effectiveFromCohort: e.target.value })}
                  placeholder="K25"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tổng tín chỉ</Label>
              <Input
                type="number"
                value={form.totalCredits}
                onChange={(e) => setForm({ ...form, totalCredits: e.target.value })}
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Mô tả thay đổi so với phiên bản trước..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo phiên bản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
