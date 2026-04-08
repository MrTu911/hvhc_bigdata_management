'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TYPE_LABELS: Record<string, string> = {
  KIEM_TRA_DINH_KY: 'Kiểm tra định kỳ',
  KIEM_TRA_KHI_CO_DAU_HIEU: 'Khi có dấu hiệu',
  GIAM_SAT_CHUYEN_DE: 'Giám sát chuyên đề',
  PHUC_KET_KY_LUAT: 'Phúc kết kỷ luật',
};

export function InspectionTable({
  items,
  onView,
}: {
  items: any[];
  onView: (id: string) => void;
}) {
  if (!items?.length) {
    return <div className="rounded-md border p-6 text-sm text-muted-foreground">Chưa có dữ liệu kiểm tra/giám sát.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Ngày mở</TableHead>
            <TableHead>Ngày đóng</TableHead>
            <TableHead className="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((x) => {
            const type = String(x.inspectionType || '').toUpperCase();
            return (
              <TableRow key={x.id}>
                <TableCell className="font-medium">{x.title || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{TYPE_LABELS[type] || type || '-'}</Badge>
                </TableCell>
                <TableCell>
                  {x.partyMember?.user?.name || x.partyOrg?.name || '-'}
                </TableCell>
                <TableCell>{x.openedAt ? new Date(x.openedAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                <TableCell>{x.closedAt ? new Date(x.closedAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onView(x.id)}>
                    Xem
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
