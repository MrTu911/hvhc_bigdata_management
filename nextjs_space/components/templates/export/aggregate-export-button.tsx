'use client';

/**
 * AggregateExportButton — xuất BẢNG DANH SÁCH tổng hợp (1 file) cho cả CSDL/đơn vị.
 *
 * Gọi POST /api/exports/aggregate (scope-aware, gate EXPORT_BATCH). Backend lọc
 * theo phạm vi quyền của người dùng và trả 1 file Excel/PDF.
 */

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { TEMPLATES } from '@/lib/rbac/function-codes';

type AggEntityType = 'personnel' | 'student' | 'party_member' | 'scientist_profile';

interface AggregateExportButtonProps {
  entityType: AggEntityType;
  /** Từ khoá lọc hiện tại của trang danh sách (nếu có). */
  keyword?: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

export function AggregateExportButton({
  entityType,
  keyword,
  label = 'Xuất danh sách',
  size = 'sm',
  variant = 'outline',
}: AggregateExportButtonProps) {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(false);

  if (!permLoading && !hasPermission(TEMPLATES.EXPORT_BATCH)) return null;

  async function doExport(format: 'XLSX' | 'PDF') {
    setLoading(true);
    try {
      const res = await fetch('/api/exports/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, format, keyword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi xuất danh sách');
      toast.success(`Đã xuất ${json.data.count} dòng (${format})`);
      if (json.data?.downloadUrl) window.open(json.data.downloadUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất danh sách');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Danh sách theo phạm vi quyền</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => doExport('XLSX')}>Xuất Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => doExport('PDF')}>Xuất PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
