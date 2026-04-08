'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SEVERITY_LABELS: Record<string, string> = {
  KHIEN_TRACH: 'Khiển trách',
  CANH_CAO: 'Cảnh cáo',
  CACH_CHUC: 'Cách chức',
  KHAI_TRU_KHOI_DANG: 'Khai trừ khỏi Đảng',
};

const SEVERITY_BADGE: Record<string, string> = {
  KHIEN_TRACH: 'bg-amber-100 text-amber-800 border-amber-300',
  CANH_CAO: 'bg-orange-100 text-orange-800 border-orange-300',
  CACH_CHUC: 'bg-red-100 text-red-800 border-red-300',
  KHAI_TRU_KHOI_DANG: 'bg-rose-100 text-rose-800 border-rose-300',
};

export function DisciplineTable({ items }: { items: any[] }) {
  if (!items?.length) return <div className="rounded-md border p-6 text-sm text-muted-foreground">Chưa có dữ liệu kỷ luật.</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Đảng viên</TableHead>
            <TableHead>Mức độ</TableHead>
            <TableHead>Số quyết định</TableHead>
            <TableHead>Ngày quyết định</TableHead>
            <TableHead>Hiệu lực đến</TableHead>
            <TableHead>Lý do</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((x) => {
            const severity = String(x.severity || '').toUpperCase();
            return (
              <TableRow key={x.id}>
                <TableCell>{x.partyMemberName || x.partyMember?.user?.name || '-'}</TableCell>
                <TableCell>
                  <Badge className={SEVERITY_BADGE[severity] || 'bg-slate-100 text-slate-700'}>
                    {SEVERITY_LABELS[severity] || severity || '-'}
                  </Badge>
                </TableCell>
                <TableCell>{x.decisionNo || '-'}</TableCell>
                <TableCell>{x.decisionDate ? new Date(x.decisionDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                <TableCell>{x.expiryDate ? new Date(x.expiryDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                <TableCell className="max-w-md truncate">{x.reason || '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
