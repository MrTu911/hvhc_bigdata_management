'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransferStatusBadge } from './transfer-status-badge';

const TYPE_LABELS: Record<string, string> = {
  CHUYEN_SINH_HOAT_TAM_THOI: 'Chuyển sinh hoạt tạm thời',
  CHUYEN_DANG_CHINH_THUC: 'Chuyển Đảng chính thức',
};

export function TransferTable({ items }: { items: any[] }) {
  if (!items?.length) return <div className="rounded-md border p-6 text-sm text-muted-foreground">Chưa có dữ liệu chuyển sinh hoạt.</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Đảng viên</TableHead>
            <TableHead>Loại chuyển</TableHead>
            <TableHead>Từ</TableHead>
            <TableHead>Đến</TableHead>
            <TableHead>Ngày chuyển</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((x) => {
            const transferType = String(x.transferType || '').toUpperCase();
            return (
              <TableRow key={x.id}>
                <TableCell>{x.partyMemberName || x.partyMember?.user?.name || '-'}</TableCell>
                <TableCell>{TYPE_LABELS[transferType] || transferType || '-'}</TableCell>
                <TableCell>{x.fromPartyOrgName || x.fromOrganization || '-'}</TableCell>
                <TableCell>{x.toPartyOrgName || x.toOrganization || '-'}</TableCell>
                <TableCell>{x.transferDate ? new Date(x.transferDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                <TableCell><TransferStatusBadge status={x.confirmStatus} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
