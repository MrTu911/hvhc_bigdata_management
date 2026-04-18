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
import { RefreshCw, ChevronLeft, ChevronRight, Search, Globe, Building2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận', ACTIVE: 'Đang hiệu lực',
  COMPLETED: 'Hoàn thành', TERMINATED: 'Chấm dứt',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  TERMINATED: 'bg-red-100 text-red-700',
};
const GRANTOR_TYPE_ICONS: Record<string, React.ElementType> = {
  INTERNATIONAL: Globe,
  DOMESTIC: Building2,
  INDUSTRY: Building2,
};

function fmtVND(val: string): string {
  const n = Number(val);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr ₫`;
  return `${n.toLocaleString('vi-VN')} ₫`;
}

interface Grant {
  id: string; grantNumber: string; grantor: string; grantorType: string;
  amount: string; currency: string; startDate: string; endDate: string;
  status: string; _count?: { disbursements: number };
  project?: { id: string; projectCode: string };
}

export default function GrantsPage() {
  const [items, setItems] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch(`/api/science/finance/grants?${params}`);
      const json = await res.json();
      if (json.success) {
        const filtered = keyword
          ? json.data.items.filter((g: Grant) =>
              g.grantor.toLowerCase().includes(keyword.toLowerCase()) ||
              g.grantNumber.toLowerCase().includes(keyword.toLowerCase())
            )
          : json.data.items;
        setItems(filtered);
        setTotal(json.data.total);
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tài trợ / Grant</h1>
          <p className="text-sm text-muted-foreground">Nguồn kinh phí từ tổ chức trong và ngoài nước</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm tổ chức tài trợ, số grant..." value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
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
                <TableHead>Số Grant</TableHead>
                <TableHead>Tổ chức tài trợ</TableHead>
                <TableHead>Đề tài</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Giải ngân</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có tài trợ</TableCell></TableRow>
              ) : items.map((grant) => {
                const TypeIcon = GRANTOR_TYPE_ICONS[grant.grantorType] ?? Building2;
                return (
                  <TableRow key={grant.id}>
                    <TableCell className="font-mono text-sm font-medium">{grant.grantNumber}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {grant.grantor}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {grant.project ? (
                        <Link href={`/dashboard/science/projects/${grant.project.id}`}
                          className="text-blue-600 hover:underline">{grant.project.projectCode}</Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">{fmtVND(grant.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(grant.startDate).toLocaleDateString('vi-VN')} –{' '}
                      {new Date(grant.endDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {grant._count?.disbursements ?? 0} lần
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[grant.status] ?? 'bg-gray-100'}`}>
                        {STATUS_LABELS[grant.status] ?? grant.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
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
