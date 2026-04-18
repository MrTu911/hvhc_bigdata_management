'use client';

/**
 * Danh sách yêu cầu gia hạn — quản lý viên phê duyệt/từ chối
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Search, MoreHorizontal } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

interface Extension {
  id: string; projectId: string; reason: string; extensionMonths: number;
  originalEndDate: string; requestedEndDate: string; status: string;
  rejectReason?: string; createdAt: string;
  project?: { id: string; projectCode: string; title: string };
  requestedBy?: { id: string; fullName: string };
}

export default function ExtensionsPage() {
  const [items, setItems] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all active projects, then their extensions
      const res = await fetch('/api/science/projects?status=ACTIVE&pageSize=100');
      const json = await res.json();
      if (!json.success) { toast.error('Lỗi tải dữ liệu'); return; }
      const projects: Array<{ id: string; projectCode: string; title: string }> =
        json.data?.items ?? json.data ?? [];

      const allExtensions: Extension[] = [];
      await Promise.all(
        projects.map(async (p) => {
          const r = await fetch(`/api/science/projects/${p.id}/extensions`);
          const j = await r.json();
          if (j.success && j.data.length > 0) {
            j.data.forEach((ext: Extension) => {
              allExtensions.push({ ...ext, project: p });
            });
          }
        })
      );
      setItems(allExtensions);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (ext: Extension, action: 'APPROVE' | 'REJECT') => {
    const rejectReason = action === 'REJECT' ? window.prompt('Lý do từ chối:') : undefined;
    if (action === 'REJECT' && !rejectReason) return;

    setActing(ext.id);
    try {
      const res = await fetch(`/api/science/projects/${ext.projectId}/extensions/${ext.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'APPROVE'
          ? `Đã duyệt gia hạn — ngày kết thúc cập nhật đến ${new Date(ext.requestedEndDate).toLocaleDateString('vi-VN')}`
          : 'Đã từ chối yêu cầu gia hạn');
        fetchData();
      } else {
        toast.error(json.error ?? 'Thao tác thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setActing(null); }
  };

  const filtered = items.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (keyword) {
      return (e.project?.projectCode ?? '').toLowerCase().includes(keyword.toLowerCase()) ||
             e.reason.toLowerCase().includes(keyword.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Yêu cầu Gia hạn</h1>
          <p className="text-sm text-muted-foreground">Phê duyệt gia hạn thời gian thực hiện đề tài</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex border rounded-lg overflow-hidden">
          {(['PENDING', 'ALL'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:bg-gray-50'
              }`}>
              {s === 'PENDING' ? `Chờ duyệt (${items.filter(i => i.status === 'PENDING').length})` : 'Tất cả'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm mã đề tài, lý do..." value={keyword}
            onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Đề tài</TableHead>
                <TableHead>Người yêu cầu</TableHead>
                <TableHead>Gia hạn</TableHead>
                <TableHead>Ngày kết thúc mới</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ngày nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có yêu cầu gia hạn</TableCell></TableRow>
              ) : filtered.map((ext) => (
                <TableRow key={ext.id}>
                  <TableCell className="text-sm">
                    {ext.project ? (
                      <Link href={`/dashboard/science/projects/${ext.project.id}`}
                        className="text-blue-600 hover:underline font-medium">{ext.project.projectCode}</Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{ext.requestedBy?.fullName ?? '—'}</TableCell>
                  <TableCell className="text-sm font-medium">+{ext.extensionMonths} tháng</TableCell>
                  <TableCell className="text-sm">
                    {new Date(ext.requestedEndDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{ext.reason}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ext.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ext.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[ext.status] ?? ext.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ext.status === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={!!acting}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction(ext, 'APPROVE')}>
                            Duyệt gia hạn
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleAction(ext, 'REJECT')}>
                            Từ chối
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
