'use client';

/**
 * Grant Detail
 * /dashboard/science/finance/grants/[id]
 *
 * Chi tiết tài trợ: thông tin cơ bản + lịch sử giải ngân.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ChevronLeft, DollarSign } from 'lucide-react';

interface Disbursement {
  id: string;
  amount: string;
  disbursedAt: string;
  note?: string;
  disbursedById?: string;
}

interface Grant {
  id: string;
  projectId: string;
  grantorName: string;
  grantNumber?: string;
  totalAmount: string;
  currency: string;
  status: string;
  startDate?: string;
  endDate?: string;
  project?: { title: string };
  disbursements: Disbursement[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  ACTIVE:    { label: 'Đang hoạt động', variant: 'default'    },
  COMPLETED: { label: 'Hoàn thành',      variant: 'secondary'  },
  CANCELLED: { label: 'Đã hủy',          variant: 'destructive' },
};

export default function GrantDetailPage() {
  const params = useParams<{ id: string }>();
  const [grant, setGrant]     = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/science/finance/grants/${params.id}`).then(r => r.json()),
      fetch(`/api/science/finance/grants/${params.id}/disbursements`).then(r => r.json()),
    ]).then(([grantData, disbData]) => {
      if (grantData.success) {
        setGrant({
          ...grantData.data,
          disbursements: disbData.success ? (disbData.data ?? []) : [],
        });
      }
    }).catch(() => toast.error('Không thể tải thông tin tài trợ'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
  if (!grant) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy tài trợ</p>
      <Link href="/dashboard/science/finance/grants">
        <Button variant="outline" className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</Button>
      </Link>
    </div>
  );

  const statusCfg = STATUS_CONFIG[grant.status] ?? { label: grant.status, variant: 'secondary' };
  const totalDisbursed = grant.disbursements.reduce((sum, d) => sum + Number(d.amount), 0);
  const remaining = Number(grant.totalAmount) - totalDisbursed;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/science/finance/grants">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">{grant.grantorName}</h1>
          </div>
        </div>
        <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Tổng tài trợ</p>
          <p className="text-xl font-bold">{Number(grant.totalAmount).toLocaleString('vi-VN')} {grant.currency}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Đã giải ngân</p>
          <p className="text-xl font-bold text-green-600">{totalDisbursed.toLocaleString('vi-VN')} {grant.currency}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Còn lại</p>
          <p className="text-xl font-bold text-blue-600">{remaining.toLocaleString('vi-VN')} {grant.currency}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin tài trợ</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Đề tài</dt><dd className="font-medium">{grant.project?.title ?? grant.projectId}</dd></div>
            <div><dt className="text-muted-foreground">Mã tài trợ</dt><dd className="font-medium">{grant.grantNumber ?? '—'}</dd></div>
            {grant.startDate && <div><dt className="text-muted-foreground">Từ</dt><dd>{new Date(grant.startDate).toLocaleDateString('vi-VN')}</dd></div>}
            {grant.endDate && <div><dt className="text-muted-foreground">Đến</dt><dd>{new Date(grant.endDate).toLocaleDateString('vi-VN')}</dd></div>}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lịch sử giải ngân ({grant.disbursements.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {grant.disbursements.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có giải ngân</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Ngày</TableHead><TableHead className="text-right">Số tiền</TableHead><TableHead>Ghi chú</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {grant.disbursements.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.disbursedAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right font-medium">{Number(d.amount).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.note ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
