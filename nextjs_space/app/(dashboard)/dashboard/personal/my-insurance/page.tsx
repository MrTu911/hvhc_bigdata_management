'use client';

/**
 * /dashboard/personal/my-insurance
 * Xem thông tin bảo hiểm của bản thân — Tầng 0, mọi người dùng.
 * Số sổ BHXH/BHYT nhạy cảm không hiển thị (cần VIEW_INSURANCE_SENSITIVE riêng).
 */

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InsuranceData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyInsurancePage() {
  const [data, setData] = useState<InsuranceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-insurance')
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" /> Thông tin bảo hiểm
        </h1>
        <p className="text-muted-foreground mt-1">BHXH, BHYT của bản thân</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hồ sơ bảo hiểm</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <p className="text-sm text-muted-foreground">Chưa có hồ sơ bảo hiểm.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                Ngày cập nhật: {new Date(data.updatedAt).toLocaleDateString('vi-VN')}
              </div>
              <div className="mt-4 p-4 bg-muted/40 rounded-lg text-muted-foreground text-xs">
                Số sổ BHXH/BHYT được bảo mật. Liên hệ phòng Tổ chức — Nhân sự nếu cần tra cứu hoặc cập nhật.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
