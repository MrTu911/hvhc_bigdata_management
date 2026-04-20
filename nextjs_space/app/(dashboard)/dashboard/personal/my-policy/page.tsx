'use client';

/**
 * /dashboard/personal/my-policy
 * Xem chính sách/chế độ của bản thân — Tầng 0, mọi người dùng.
 */

import { useEffect, useState } from 'react';
import { FileText, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PolicyRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface PolicyRequest {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PolicyData {
  policyRecords: PolicyRecord[];
  policyRequests: PolicyRequest[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  APPROVED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

export default function MyPolicyPage() {
  const [data, setData] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-policy')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Chính sách của tôi
          </h1>
          <p className="text-muted-foreground mt-1">Chế độ phúc lợi và yêu cầu chính sách đã gửi</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" /> Gửi yêu cầu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hồ sơ chính sách ({data?.policyRecords.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.policyRecords.length === 0
            ? <p className="text-sm text-muted-foreground">Chưa có hồ sơ chính sách nào.</p>
            : data?.policyRecords.map((r) => (
                <div key={r.id} className="py-2 border-b last:border-0 text-sm">
                  <div className="text-muted-foreground">ID: {r.id}</div>
                  <div className="text-muted-foreground">Ngày tạo: {new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              ))
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yêu cầu đã gửi ({data?.policyRequests.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.policyRequests.length === 0
            ? <p className="text-sm text-muted-foreground">Chưa có yêu cầu chính sách nào.</p>
            : data?.policyRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge>
                </div>
              ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
