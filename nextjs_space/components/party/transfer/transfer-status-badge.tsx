'use client';

import { Badge } from '@/components/ui/badge';

interface Props {
  status?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  REJECTED: 'Từ chối',
};

export function TransferStatusBadge({ status }: Props) {
  const key = String(status || 'PENDING').toUpperCase();
  return (
    <Badge className={STATUS_STYLES[key] || STATUS_STYLES.PENDING}>
      {STATUS_LABELS[key] || key}
    </Badge>
  );
}
