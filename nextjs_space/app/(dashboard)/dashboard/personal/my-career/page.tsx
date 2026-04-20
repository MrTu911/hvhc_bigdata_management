'use client';

/**
 * /dashboard/personal/my-career
 * Xem quá trình công tác của bản thân — Tầng 0, mọi người dùng.
 */

import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CareerHistoryItem {
  id: string;
  eventType: string;
  eventDate: string;
  effectiveDate: string | null;
  endDate: string | null;
  title: string | null;
  newPosition: string | null;
  oldPosition: string | null;
  newUnit: string | null;
  oldUnit: string | null;
  newRank: string | null;
  oldRank: string | null;
  decisionNumber: string | null;
  notes: string | null;
}

interface PositionItem {
  id: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
  position: { code: string; name: string };
  unit: { id: string; name: string; code: string } | null;
}

interface CareerData {
  careerHistories: CareerHistoryItem[];
  positions: PositionItem[];
}

function formatDate(d: string | null) {
  if (!d) return 'nay';
  return new Date(d).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
}

export default function MyCareerPage() {
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-career')
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
          <Briefcase className="h-6 w-6" /> Quá trình công tác
        </h1>
        <p className="text-muted-foreground mt-1">Lịch sử vị trí và đơn vị công tác của bạn</p>
      </div>

      {/* Chức vụ hiện tại và lịch sử */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chức vụ đã đảm nhiệm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.positions.length === 0 && (
            <p className="text-muted-foreground text-sm">Chưa có dữ liệu chức vụ.</p>
          )}
          {data?.positions.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 py-2">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  {p.position.name}
                  {p.isActive && <Badge variant="default" className="text-xs">Hiện tại</Badge>}
                  {p.isPrimary && <Badge variant="outline" className="text-xs">Chính</Badge>}
                </div>
                {p.unit && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.unit.name}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(p.startDate)} — {formatDate(p.endDate)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lịch sử sự kiện quá trình công tác */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử sự kiện công tác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.careerHistories.length === 0 && (
            <p className="text-muted-foreground text-sm">Chưa có dữ liệu lịch sử công tác.</p>
          )}
          {data?.careerHistories.map((c, i) => (
            <div key={c.id}>
              {i > 0 && <Separator className="my-3" />}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">
                    {c.title ?? c.eventType}
                  </div>
                  {(c.newPosition || c.oldPosition) && (
                    <div className="text-sm text-muted-foreground">
                      {c.oldPosition && <span>Từ: {c.oldPosition} → </span>}
                      {c.newPosition && <span className="font-medium">{c.newPosition}</span>}
                    </div>
                  )}
                  {(c.newUnit || c.oldUnit) && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {c.newUnit ?? c.oldUnit}
                    </div>
                  )}
                  {c.decisionNumber && (
                    <div className="text-xs text-muted-foreground">QĐ: {c.decisionNumber}</div>
                  )}
                  {c.notes && <p className="text-sm mt-1 text-muted-foreground">{c.notes}</p>}
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(c.eventDate)} — {formatDate(c.endDate)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
