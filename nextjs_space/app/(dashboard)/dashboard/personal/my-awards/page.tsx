'use client';

/**
 * /dashboard/personal/my-awards
 * Xem khen thưởng và kỷ luật của bản thân — Tầng 0, mọi người dùng.
 */

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AwardRecord {
  id: string;
  type: string;
  description: string | null;
  year: number | null;
  awardedBy: string | null;
}

export default function MyAwardsPage() {
  const [data, setData] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-awards')
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

  const awards = data.filter((r) => !r.type?.toLowerCase().includes('kỷ luật'));
  const disciplines = data.filter((r) => r.type?.toLowerCase().includes('kỷ luật'));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6" /> Khen thưởng & Kỷ luật
        </h1>
        <p className="text-muted-foreground mt-1">Lịch sử thi đua khen thưởng của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Khen thưởng ({awards.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {awards.length === 0 && <p className="text-sm text-muted-foreground">Chưa có khen thưởng nào.</p>}
          {awards.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
              <div className="space-y-1">
                <div className="font-medium">{a.description ?? a.type}</div>
                {a.awardedBy && <div className="text-sm text-muted-foreground">Cấp: {a.awardedBy}</div>}
              </div>
              {a.year && <Badge variant="outline">{a.year}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      {disciplines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Kỷ luật ({disciplines.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {disciplines.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
                <div className="space-y-1">
                  <div className="font-medium">{d.description ?? d.type}</div>
                  {d.awardedBy && <div className="text-sm text-muted-foreground">Quyết định: {d.awardedBy}</div>}
                </div>
                {d.year && <Badge variant="destructive">{d.year}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
