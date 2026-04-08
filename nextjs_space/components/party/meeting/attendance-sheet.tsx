'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AttendanceRow = {
  partyMemberId: string;
  partyMemberName?: string;
  attendanceStatus: 'present' | 'absent';
  absenceReason?: string;
  note?: string;
};

export function AttendanceSheet({
  items,
  onChange,
  onSubmit,
}: {
  items: AttendanceRow[];
  onChange: (items: AttendanceRow[]) => void;
  onSubmit: () => void;
}) {
  const update = (idx: number, patch: Partial<AttendanceRow>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  if (!items.length) return <div className="rounded-md border p-4 text-sm text-muted-foreground">Chưa có dữ liệu điểm danh</div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((a, i) => (
          <div key={a.partyMemberId} className="grid grid-cols-12 gap-2 rounded-md border p-2">
            <div className="col-span-4 text-sm font-medium self-center">{a.partyMemberName || a.partyMemberId}</div>
            <div className="col-span-2">
              <select
                className="h-9 w-full rounded-md border px-2 text-sm"
                value={a.attendanceStatus}
                onChange={(e) => update(i, { attendanceStatus: e.target.value as 'present' | 'absent' })}
              >
                <option value="present">present</option>
                <option value="absent">absent</option>
              </select>
            </div>
            <div className="col-span-3">
              <Input placeholder="Lý do vắng" value={a.absenceReason || ''} onChange={(e) => update(i, { absenceReason: e.target.value })} />
            </div>
            <div className="col-span-3">
              <Input placeholder="Ghi chú" value={a.note || ''} onChange={(e) => update(i, { note: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onSubmit}>Lưu điểm danh</Button>
      </div>
    </div>
  );
}
