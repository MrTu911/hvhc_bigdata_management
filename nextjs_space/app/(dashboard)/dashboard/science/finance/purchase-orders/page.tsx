'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', APPROVED: 'Đã duyệt', RECEIVED: 'Đã nhận', CANCELLED: 'Hủy',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  RECEIVED: 'bg-teal-100 text-teal-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatVND(val: string): string {
  const n = Number(val);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
  return n.toLocaleString('vi-VN');
}

interface PO {
  id: string; poNumber: string; vendor: string;
  totalAmount: string; currency: string; status: string;
  orderDate: string; notes?: string;
  project?: { id: string; projectCode: string; title: string };
  createdBy?: { id: string; fullName: string };
}

export default function PurchaseOrdersPage() {
  const [items, setItems] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/science/finance/purchase-orders?${params}`);
      const json = await res.json();
      if (json.success) {
        const filtered = keyword
          ? json.data.items.filter((p: PO) =>
              p.poNumber.toLowerCase().includes(keyword.toLowerCase()) ||
              p.vendor.toLowerCase().includes(keyword.toLowerCase())
            )
          : json.data.items;
        setItems(filtered);
        setTotal(json.data.total);
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (poId: string, action: string) => {
    setSubmitting(poId);
    try {
      const res = await fetch(`/api/science/finance/purchase-orders/${poId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Đã ${action === 'APPROVE' ? 'duyệt' : action === 'RECEIVE' ? 'nhận hàng' : 'hủy'} PO`);
        fetchData();
      } else {
        toast.error(json.error ?? 'Thao tác thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setSubmitting(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Đề nghị Mua sắm (PO)</h1>
          <p className="text-sm text-muted-foreground">Quản lý đề nghị mua sắm theo đề tài NCKH</p>
        </div>
        <Link href="/dashboard/science/finance/purchase-orders/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Tạo PO</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm số PO, nhà cung cấp..." value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số PO</TableHead>
                <TableHead>Đề tài</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              ) : items.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-sm font-medium">{po.poNumber}</TableCell>
                  <TableCell className="text-sm">
                    {po.project ? (
                      <Link href={`/dashboard/science/projects/${po.project.id}`}
                        className="text-blue-600 hover:underline">
                        {po.project.projectCode}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{po.vendor}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{formatVND(po.totalAmount)} ₫</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(po.orderDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[po.status] ?? po.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!submitting}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {po.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handleAction(po.id, 'APPROVE')}>
                            Phê duyệt
                          </DropdownMenuItem>
                        )}
                        {po.status === 'APPROVED' && (
                          <DropdownMenuItem onClick={() => handleAction(po.id, 'RECEIVE')}>
                            Xác nhận đã nhận hàng
                          </DropdownMenuItem>
                        )}
                        {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(po.status) && (
                          <DropdownMenuItem className="text-red-600" onClick={() => handleAction(po.id, 'CANCEL')}>
                            Hủy PO
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
