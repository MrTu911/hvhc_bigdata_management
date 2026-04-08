'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Mail,
  Power,
  PowerOff,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Schedule {
  id: string;
  templateId: string;
  template?: { name: string; code: string };
  cronExpression: string;
  outputFormat: string;
  recipientEmails: string[];
  zipName?: string;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  nextRunAt?: string;
  createdAt: string;
}

interface Template {
  id: string;
  code: string;
  name: string;
}

const CRON_PRESETS = [
  { label: 'Hàng ngày lúc 8:00', value: '0 8 * * *' },
  { label: 'Thứ 2 hàng tuần 8:00', value: '0 8 * * 1' },
  { label: 'Đầu tháng (ngày 1) lúc 8:00', value: '0 8 1 * *' },
  { label: 'Đầu quý (tháng 1,4,7,10)', value: '0 8 1 1,4,7,10 *' },
  { label: 'Tùy chỉnh', value: 'custom' },
];

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
};

export default function SchedulesPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    templateId: '',
    cronPreset: '0 8 * * *',
    cronExpression: '0 8 * * *',
    outputFormat: 'PDF',
    recipientEmails: '',
    zipName: '',
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      const res = await fetch(`/api/templates/schedules?${params}`);
      if (!res.ok) throw new Error('Lỗi tải lịch xuất');
      const json = await res.json();
      setSchedules(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates?status=active&limit=100');
      if (!res.ok) return;
      const json = await res.json();
      setTemplates(json.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchTemplates();
  }, [fetchSchedules, fetchTemplates]);

  const handleCreate = async () => {
    if (!form.templateId || !form.cronExpression) {
      toast.error('Vui lòng chọn template và cron expression');
      return;
    }
    setSubmitting(true);
    try {
      const emails = form.recipientEmails
        .split(/[,;\s]+/)
        .map(e => e.trim())
        .filter(e => e.includes('@'));

      const res = await fetch('/api/templates/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: form.templateId,
          cronExpression: form.cronExpression,
          outputFormat: form.outputFormat,
          recipientEmails: emails,
          zipName: form.zipName || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo lịch xuất');
      toast.success('Đã tạo lịch xuất định kỳ');
      setCreateOpen(false);
      resetForm();
      fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo lịch xuất');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    try {
      const res = await fetch(`/api/templates/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      toast.success(schedule.isActive ? 'Đã tắt lịch xuất' : 'Đã bật lịch xuất');
      fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật');
    }
  };

  const handleRunNow = async (schedule: Schedule) => {
    try {
      const res = await fetch('/api/templates/schedules/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: schedule.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi thực thi');
      toast.success(`Đã chạy lịch xuất – Job: ${json.data?.jobId?.slice(0, 8) || 'ok'}`);
      fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực thi lịch xuất');
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/templates/schedules/${selectedSchedule.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi xóa lịch xuất');
      toast.success('Đã xóa lịch xuất');
      setDeleteOpen(false);
      fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      templateId: '',
      cronPreset: '0 8 * * *',
      cronExpression: '0 8 * * *',
      outputFormat: 'PDF',
      recipientEmails: '',
      zipName: '',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Xuất định kỳ (Scheduled Export)</h1>
            <p className="text-sm text-gray-500">Cấu hình tự động xuất và gửi email theo lịch</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSchedules}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Tạo lịch xuất
          </Button>
        </div>
      </div>

      {/* Cron reference */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Cú pháp Cron: <code className="bg-blue-100 px-1 rounded">phút giờ ngày-trong-tháng tháng ngày-trong-tuần</code></p>
              <p className="text-xs text-blue-600">
                Ví dụ: <code className="bg-blue-100 px-1 rounded">0 8 * * *</code> = hàng ngày lúc 8:00 |
                <code className="bg-blue-100 px-1 rounded ml-1">0 8 1 * *</code> = ngày 1 hàng tháng lúc 8:00 |
                <code className="bg-blue-100 px-1 rounded ml-1">0 8 * * 1</code> = thứ 2 hàng tuần lúc 8:00
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mẫu biểu</TableHead>
                  <TableHead>Lịch Cron</TableHead>
                  <TableHead>Định dạng</TableHead>
                  <TableHead>Email nhận</TableHead>
                  <TableHead>Lần chạy gần nhất</TableHead>
                  <TableHead>Lần chạy tiếp theo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Chưa có lịch xuất định kỳ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{s.template?.name || s.templateId}</p>
                          <p className="text-xs text-gray-400 font-mono">{s.template?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{s.cronExpression}</code>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[s.outputFormat] || 'bg-gray-100 text-gray-700'}`}>
                          {s.outputFormat}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[160px]">
                          {s.recipientEmails.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate">
                                {s.recipientEmails[0]}
                                {s.recipientEmails.length > 1 && ` +${s.recipientEmails.length - 1}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">–</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {s.lastRunAt ? (
                            <>
                              <p className="text-gray-600">{new Date(s.lastRunAt).toLocaleString('vi-VN')}</p>
                              {s.lastRunStatus && (
                                <Badge
                                  className={`text-xs mt-0.5 border-0 ${s.lastRunStatus === 'OK' || s.lastRunStatus === 'NO_ENTITIES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                >
                                  {s.lastRunStatus}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">Chưa chạy</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-600">
                          {s.nextRunAt
                            ? new Date(s.nextRunAt).toLocaleString('vi-VN')
                            : <span className="text-gray-400">–</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            Đang hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0">
                            Tắt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Chạy ngay"
                            onClick={() => handleRunNow(s)}
                          >
                            <Play className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={s.isActive ? 'Tắt lịch' : 'Bật lịch'}
                            onClick={() => handleToggleActive(s)}
                          >
                            {s.isActive ? (
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500"
                            onClick={() => { setSelectedSchedule(s); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} lịch xuất</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 py-1 border rounded">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo lịch xuất định kỳ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Mẫu biểu <span className="text-red-500">*</span></Label>
              <Select value={form.templateId} onValueChange={v => setForm(prev => ({ ...prev, templateId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mẫu biểu..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-gray-400 ml-1">({t.code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Lịch chạy <span className="text-red-500">*</span></Label>
              <Select
                value={form.cronPreset}
                onValueChange={v => {
                  if (v === 'custom') {
                    setForm(prev => ({ ...prev, cronPreset: 'custom' }));
                  } else {
                    setForm(prev => ({ ...prev, cronPreset: v, cronExpression: v }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lịch..." />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.cronPreset === 'custom' && (
                <Input
                  placeholder="VD: 0 8 1 * *"
                  value={form.cronExpression}
                  onChange={e => setForm(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="font-mono mt-2"
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                Cron: <code className="bg-gray-100 px-1 rounded">{form.cronExpression}</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Định dạng xuất</Label>
                <Select value={form.outputFormat} onValueChange={v => setForm(prev => ({ ...prev, outputFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOCX">DOCX</SelectItem>
                    <SelectItem value="XLSX">XLSX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tên file ZIP</Label>
                <Input
                  placeholder="VD: bao-cao-thang.zip"
                  value={form.zipName}
                  onChange={e => setForm(prev => ({ ...prev, zipName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Email nhận file</Label>
              <Input
                placeholder="email1@hvhc.vn, email2@hvhc.vn"
                value={form.recipientEmails}
                onChange={e => setForm(prev => ({ ...prev, recipientEmails: e.target.value }))}
              />
              <p className="text-xs text-gray-400">Phân cách bởi dấu phẩy. Để trống nếu không gửi email.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo lịch xuất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa lịch xuất</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa lịch xuất cho mẫu biểu{' '}
            <strong>&ldquo;{selectedSchedule?.template?.name}&rdquo;</strong>?
            Lịch này sẽ không còn tự động chạy nữa.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Đang xóa...' : 'Xóa lịch xuất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
