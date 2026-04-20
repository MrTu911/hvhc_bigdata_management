'use client';

/**
 * /dashboard/personal/my-conduct
 * Xem điểm rèn luyện của bản thân — Tầng 2, Học viên/Sinh viên.
 */

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConductRecord {
  id: string;
  academicYear: string;
  semesterCode: string;
  conductScore: number;
  conductGrade: string | null;
  rewardSummary: string | null;
  disciplineSummary: string | null;
  approvedAt: string | null;
}

const GRADE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'Xuất sắc': 'default',
  'Tốt': 'default',
  'Khá': 'secondary',
  'Trung bình': 'outline',
  'Yếu': 'destructive',
  'Kém': 'destructive',
};

export default function MyConductPage() {
  const [data, setData] = useState<ConductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-conduct')
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
          <Award className="h-6 w-6" /> Điểm rèn luyện
        </h1>
        <p className="text-muted-foreground mt-1">Kết quả đánh giá tác phong theo từng học kỳ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử rèn luyện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {data.length === 0 && <p className="text-sm text-muted-foreground py-4">Chưa có dữ liệu điểm rèn luyện.</p>}
          {data.map((r) => (
            <div key={r.id} className="py-4 border-b last:border-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Năm học {r.academicYear} — {r.semesterCode}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Điểm: <span className="font-semibold text-foreground">{r.conductScore}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.conductGrade && (
                    <Badge variant={GRADE_VARIANT[r.conductGrade] ?? 'outline'}>{r.conductGrade}</Badge>
                  )}
                  {r.approvedAt && <span className="text-xs text-muted-foreground">Đã duyệt</span>}
                </div>
              </div>
              {(r.rewardSummary || r.disciplineSummary) && (
                <div className="mt-2 text-sm space-y-1">
                  {r.rewardSummary && <div className="text-green-700">+ {r.rewardSummary}</div>}
                  {r.disciplineSummary && <div className="text-red-600">- {r.disciplineSummary}</div>}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
