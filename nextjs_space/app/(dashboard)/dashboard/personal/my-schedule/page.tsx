'use client';

/**
 * /dashboard/personal/my-schedule
 * Xem thời khóa biểu của bản thân — Tầng 2, Học viên/Sinh viên.
 */

import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClassSectionItem {
  id: string;
  code: string;
  name: string;
  schedule: string | null;
  dayOfWeek: string | null;
  startPeriod: number | null;
  endPeriod: number | null;
  startDate: string | null;
  endDate: string | null;
  room: { id: string; name: string } | null;
  term: { id: string; name: string; startDate: string; endDate: string } | null;
}

interface EnrollmentItem {
  id: string;
  status: string;
  enrolledAt: string;
  classSection: ClassSectionItem;
}

const STATUS_LABEL: Record<string, string> = {
  ENROLLED: 'Đã ghi danh',
  PENDING: 'Chờ duyệt',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ENROLLED: 'default',
  PENDING: 'secondary',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function MySchedulePage() {
  const [data, setData] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-schedule')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data ?? []);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;

  // Nhóm theo học kỳ
  const byTerm = data.reduce<Record<string, EnrollmentItem[]>>((acc, e) => {
    const key = e.classSection.term?.name ?? 'Chưa xác định';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" /> Thời khóa biểu
        </h1>
        <p className="text-muted-foreground mt-1">Các lớp học phần đang ghi danh</p>
      </div>

      {data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Chưa có lớp học phần nào được ghi danh.
          </CardContent>
        </Card>
      )}

      {Object.entries(byTerm).map(([termName, enrollments]) => (
        <Card key={termName}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {termName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {enrollments.map((e) => {
              const cs = e.classSection;
              return (
                <div key={e.id} className="py-4 border-b last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="font-medium">
                        {cs.name}
                        <span className="text-muted-foreground font-normal text-sm ml-2">({cs.code})</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {cs.schedule && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {cs.schedule}
                          </span>
                        )}
                        {(cs.startPeriod || cs.endPeriod) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Tiết {cs.startPeriod}–{cs.endPeriod}
                            {cs.dayOfWeek && ` (${cs.dayOfWeek})`}
                          </span>
                        )}
                        {cs.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {cs.room.name}
                          </span>
                        )}
                      </div>
                      {(cs.startDate || cs.endDate) && (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(cs.startDate)} — {formatDate(cs.endDate)}
                        </div>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANT[e.status] ?? 'outline'}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
