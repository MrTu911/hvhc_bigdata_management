'use client';

/**
 * Trang cá nhân: "Đề nghị cập nhật hồ sơ của tôi".
 * Route: /dashboard/personal/my-profile-changes
 * Tạo đề nghị (kèm minh chứng) + theo dõi trạng thái duyệt 2 cấp.
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ModuleHero, EmptyState } from '@/components/ui/enhanced-data-card';
import { toast } from '@/components/ui/use-toast';
import { Plus, RefreshCw, FileClock, Paperclip, Inbox } from 'lucide-react';
import {
  PROFILE_CHANGE_STATUS_LABELS, type ProfileChangeStatusValue,
} from '@/lib/constants/profile-change';
import { CreateChangeRequestDialog } from './_components/create-change-request-dialog';

interface ChangeRequest {
  id: string;
  title: string | null;
  reason: string | null;
  status: ProfileChangeStatusValue;
  createdAt: string;
  tier1Note: string | null;
  tier2Note: string | null;
  items: { id: string }[];
  attachments: { id: string }[];
}

const STATUS_VARIANT: Record<ProfileChangeStatusValue, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-amber-100 text-amber-800',
  UNIT_APPROVED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function MyProfileChangesPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/change-requests?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được danh sách');
      setRequests(data.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancelRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/change-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hủy thất bại');
      toast({ title: 'Đã hủy đề nghị' });
      load();
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="personnel"
        icon={FileClock}
        title="Đề nghị cập nhật hồ sơ của tôi"
        subtitle="Gửi đề nghị bổ sung/thay đổi thông tin (kèm minh chứng) để Chỉ huy đơn vị và Ban cán bộ/Quân lực duyệt."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" /> Tải lại</Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tạo đề nghị</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <EmptyState icon={Inbox} title="Không tải được dữ liệu" description={error}
              action={<Button onClick={load} variant="outline">Thử lại</Button>} />
          ) : requests.length === 0 ? (
            <EmptyState icon={Inbox} title="Chưa có đề nghị nào"
              description="Bấm 'Tạo đề nghị' để gửi yêu cầu cập nhật hồ sơ kèm minh chứng." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Số mục</TableHead>
                  <TableHead>Minh chứng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{r.title || 'Đề nghị cập nhật hồ sơ'}</div>
                      {r.reason && <div className="truncate text-xs text-muted-foreground">{r.reason}</div>}
                      {(r.tier1Note || r.tier2Note) && (
                        <div className="mt-1 text-xs text-muted-foreground">Ghi chú duyệt: {r.tier2Note || r.tier1Note}</div>
                      )}
                    </TableCell>
                    <TableCell>{r.items.length}</TableCell>
                    <TableCell>
                      {r.attachments.length > 0
                        ? <span className="inline-flex items-center gap-1 text-xs"><Paperclip className="h-3 w-3" />{r.attachments.length}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_VARIANT[r.status]} variant="secondary">
                        {PROFILE_CHANGE_STATUS_LABELS[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      {['DRAFT', 'SUBMITTED', 'RETURNED'].includes(r.status) && (
                        <Button variant="ghost" size="sm" onClick={() => cancelRequest(r.id)}>Hủy</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateChangeRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmitted={load} />
    </div>
  );
}
