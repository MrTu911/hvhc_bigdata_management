'use client';

/**
 * Inbox người duyệt: đề nghị cập nhật hồ sơ cán bộ chờ duyệt theo phân cấp.
 * Route: /dashboard/personnel/profile-changes
 * Tab "Cấp 1" (Chỉ huy đơn vị) / "Cấp 2" (Ban cán bộ/Quân lực) tùy quyền.
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ModuleHero, EmptyState, KPICard } from '@/components/ui/enhanced-data-card';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, Inbox, ClipboardCheck, Eye, Paperclip, ShieldCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { PROFILE_CHANGE_STATUS_LABELS } from '@/lib/constants/profile-change';
import { ReviewDetailDialog } from './_components/review-detail-dialog';

interface ReviewRow {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
  user: { name: string | null; militaryId: string | null; unitRelation?: { name: string | null } | null };
  items: { id: string }[];
  attachments: { id: string }[];
}

export default function ProfileChangesReviewPage() {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const canTier1 = hasPermission('VIEW_UNIT_PROFILE_CHANGES');
  const canTier2 = hasPermission('VIEW_ORGAN_PROFILE_CHANGES');
  const canApproveTier1 = hasPermission('APPROVE_UNIT_PROFILE_CHANGE');
  const canApproveTier2 = hasPermission('APPROVE_ORGAN_PROFILE_CHANGE');

  const [tier, setTier] = useState<1 | 2>(1);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Mặc định tab theo quyền: ưu tiên tier-1 nếu có, ngược lại tier-2.
  useEffect(() => {
    if (!permLoading) setTier(canTier1 ? 1 : 2);
  }, [permLoading, canTier1]);

  const load = useCallback(async (t: 1 | 2) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/personnel/profile-changes?tier=${t}&limit=50`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được danh sách');
      setRows(data.data ?? []);
      setStats(data.meta?.stats ?? {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permLoading) return;
    if ((tier === 1 && canTier1) || (tier === 2 && canTier2)) load(tier);
  }, [tier, permLoading, canTier1, canTier2, load]);

  const openDetail = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  if (!permLoading && !canTier1 && !canTier2) {
    return (
      <div className="p-6">
        <EmptyState icon={ShieldCheck} title="Không có quyền"
          description="Bạn không có quyền duyệt đề nghị cập nhật hồ sơ cán bộ." />
      </div>
    );
  }

  const renderTable = () => {
    if (loading) {
      return <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }
    if (error) {
      return <EmptyState icon={Inbox} title="Không tải được dữ liệu" description={error}
        action={<Button variant="outline" onClick={() => load(tier)}>Thử lại</Button>} />;
    }
    if (rows.length === 0) {
      return <EmptyState icon={ClipboardCheck} title="Không có đề nghị chờ duyệt"
        description={tier === 1 ? 'Chưa có đề nghị nào chờ Chỉ huy đơn vị duyệt.' : 'Chưa có đề nghị nào chờ Ban cán bộ/Quân lực duyệt.'} />;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cán bộ</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Số mục</TableHead>
            <TableHead>Minh chứng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r.id)}>
              <TableCell>
                <div className="font-medium">{r.user.name}</div>
                {r.user.militaryId && <div className="text-xs text-muted-foreground">{r.user.militaryId}</div>}
              </TableCell>
              <TableCell className="text-sm">{r.user.unitRelation?.name ?? '—'}</TableCell>
              <TableCell>{r.items.length}</TableCell>
              <TableCell>
                {r.attachments.length > 0
                  ? <span className="inline-flex items-center gap-1 text-xs"><Paperclip className="h-3 w-3" />{r.attachments.length}</span>
                  : <span className="text-xs text-muted-foreground">—</span>}
              </TableCell>
              <TableCell><Badge variant="secondary">{PROFILE_CHANGE_STATUS_LABELS[r.status as keyof typeof PROFILE_CHANGE_STATUS_LABELS]}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}>
                  <Eye className="mr-1 h-4 w-4" /> Xem
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="personnel"
        icon={ClipboardCheck}
        title="Duyệt cập nhật hồ sơ cán bộ"
        subtitle="Xét duyệt theo phân cấp: Chỉ huy đơn vị (cấp 1) → Ban cán bộ/Quân lực (cấp 2) → cập nhật CSDL Học viện."
        actions={<Button variant="outline" size="sm" onClick={() => load(tier)}><RefreshCw className="mr-1 h-4 w-4" /> Tải lại</Button>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard title="Chờ cấp 1" value={String(stats.SUBMITTED ?? 0)} icon={ClipboardCheck} />
        <KPICard title="Chờ cấp 2" value={String(stats.UNIT_APPROVED ?? 0)} icon={ClipboardCheck} />
        <KPICard title="Đã duyệt" value={String(stats.APPROVED ?? 0)} icon={ShieldCheck} />
        <KPICard title="Trả lại/Từ chối" value={String((stats.RETURNED ?? 0) + (stats.REJECTED ?? 0))} icon={Inbox} />
      </div>

      <Tabs value={String(tier)} onValueChange={(v) => setTier(Number(v) as 1 | 2)}>
        <TabsList>
          {canTier1 && <TabsTrigger value="1">Cấp 1 — Chỉ huy đơn vị</TabsTrigger>}
          {canTier2 && <TabsTrigger value="2">Cấp 2 — Ban cán bộ/Quân lực</TabsTrigger>}
        </TabsList>
        <TabsContent value="1"><Card><CardContent className="p-0">{renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="2"><Card><CardContent className="p-0">{renderTable()}</CardContent></Card></TabsContent>
      </Tabs>

      <ReviewDetailDialog
        requestId={selectedId}
        tier={tier}
        canApprove={tier === 1 ? canApproveTier1 : canApproveTier2}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onActed={() => load(tier)}
      />
    </div>
  );
}
