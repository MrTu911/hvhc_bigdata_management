'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Search } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán', APPROVED: 'Đã duyệt', PAID: 'Đã thanh toán',
  DISPUTED: 'Tranh chấp', CANCELLED: 'Hủy',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function fmtVND(val: string): string {
  const n = Number(val);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr ₫`;
  return `${n.toLocaleString('vi-VN')} ₫`;
}

interface Invoice {
  id: string; invoiceNumber: string; vendor: string; totalAmount: string;
  invoiceDate: string; dueDate?: string; status: string;
  project?: { id: string; projectCode: string };
  po?: { id: string; poNumber: string };
}

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
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
      const res = await fetch(`/api/science/finance/invoices?${params}`);
      const json = await res.json();
      if (json.success) {
        const filtered = keyword
          ? json.data.items.filter((i: Invoice) =>
              i.invoiceNumber.toLowerCase().includes(keyword.toLowerCase()) ||
              i.vendor.toLowerCase().includes(keyword.toLowerCase())
            )
          : json.data.items;
        setItems(filtered);
        setTotal(json.data.total);
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      const res = await fetch(`/api/science/finance/invoices/${id}/pay`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã thanh toán hóa đơn — ngân sách được cập nhật tự động');
        fetchData();
      } else {
        toast.error(json.error ?? 'Thanh toán thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setPaying(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hóa đơn</h1>
          <p className="text-sm text-muted-foreground">Quản lý và thanh toán hóa đơn NCKH</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm số hóa đơn, nhà cung cấp..." value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
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
                <TableHead>Số hóa đơn</TableHead>
                <TableHead>Đề tài</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead>Ngày HĐ</TableHead>
                <TableHead>Hạn TT</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có hóa đơn</TableCell></TableRow>
              ) : items.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-sm">
                    {inv.project ? (
                      <Link href={`/dashboard/science/projects/${inv.project.id}`}
                        className="text-blue-600 hover:underline">{inv.project.projectCode}</Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{inv.vendor}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{fmtVND(inv.totalAmount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.invoiceDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {['PENDING', 'APPROVED'].includes(inv.status) && (
                      <Button size="sm" variant="outline" disabled={paying === inv.id}
                        onClick={() => handlePay(inv.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {paying === inv.id ? '...' : 'Thanh toán'}
                      </Button>
                    )}
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
