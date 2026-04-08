'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type MeetingItem = {
  id: string;
  title: string;
  meetingDate: string;
  location?: string | null;
  meetingType?: string | null;
  status?: string | null;
  attendanceRate?: number | null;
};

export function MeetingCalendar({
  items,
  selectedId,
  onSelect,
}: {
  items: MeetingItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (!items.length) {
    return <div className="rounded-md border p-6 text-sm text-muted-foreground">Chưa có lịch họp</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((m) => (
        <div key={m.id} className={`rounded-md border p-3 ${selectedId === m.id ? 'border-red-500 bg-red-50' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(m.meetingDate).toLocaleString('vi-VN')} • {m.location || 'Chưa có địa điểm'}
              </div>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">{m.meetingType || '-'}</Badge>
                <Badge>{m.status || '-'}</Badge>
                <Badge variant="outline">Tỷ lệ dự: {Number(m.attendanceRate || 0).toFixed(0)}%</Badge>
              </div>
            </div>
            <Button size="sm" variant={selectedId === m.id ? 'default' : 'outline'} onClick={() => onSelect(m.id)}>
              Chi tiết
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
